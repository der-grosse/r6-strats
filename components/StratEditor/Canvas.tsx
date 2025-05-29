"use client";
import { useRef, useState, useEffect, useMemo, useCallback, act } from "react";
import SVGAsset from "./SVGAsset";
import { useKeys } from "../hooks/useKey";
import isKeyDown from "../hooks/isKeyDown";
import { deepCopy } from "../deepCopy";

interface Asset {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
}

interface CanvasProps<A extends Asset> {
  map: R6Map | null;
  assets: A[];
  onAssetChange: (assets: A[]) => void;
  onAssetRemove: (assets: A["id"][]) => void;
  renderAsset: (
    asset: A,
    selected: boolean
  ) => { asset: React.ReactNode; menu: React.ReactNode | null };
}

// should be a multiple of 4 and 3 to have nicer numbers for aspect ratio
export const CANVAS_BASE_SIZE = 2400;
const MIN_ZOOM_FACTOR = 0.15;
const MIN_ASSET_SIZE = 8;
const DRAG_DEADZONE = 1;
const ZOOM_MODIFIER = 0.004;
const SCROLL_MODIFIER = 0.5;
export const ASSET_BASE_SIZE = 40;

export default function StratEditorCanvas<A extends Asset>({
  map,
  assets: propAssets,
  onAssetChange,
  onAssetRemove,
  renderAsset,
}: Readonly<CanvasProps<A>>) {
  const [assets, setAssets] = useState<A[]>(propAssets);
  useEffect(() => {
    setAssets(propAssets);
  }, [propAssets]);
  const assetsRef = useRef<A[]>(propAssets);
  assetsRef.current = assets;

  const svgRef = useRef<SVGSVGElement>(null);

  const [viewBox, setViewBox] = useState({
    width: CANVAS_BASE_SIZE,
    height: (CANVAS_BASE_SIZE / 4) * 3,
  });
  // Calculate viewBox based on map dimensions
  useEffect(() => {
    if (!map) return;
    const aspectRatio =
      map.floors.length === 1 || map.floors.length > 2 ? 4 / 3 : 8 / 3;
    const width = CANVAS_BASE_SIZE;
    const height = width / aspectRatio;
    setViewBox({ width, height });
  }, [map]);

  const [zoomFactor, setZoomFactor] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({
    // absolut cursor pos in svg coords
    x: 600,
    y: 450,
    // relative cursor pos in svg -> needed to keep zooming on same point when mouse is not centered
    relX: 0.5,
    relY: 0.5,
  });
  const zoomedViewBox = useMemo(() => {
    const size = {
      width: viewBox.width * zoomFactor,
      height: viewBox.height * zoomFactor,
    };
    const absolutZoomPos = {
      x: zoomOrigin.x - size.width * zoomOrigin.relX,
      y: zoomOrigin.y - size.height * zoomOrigin.relY,
    };
    const zoomedViewBox = {
      ...absolutZoomPos,
      ...size,
    };
    // clamp viewbox to not go out of bounds (should not be neccessary, still keep just in case)
    zoomedViewBox.x = Math.max(0, zoomedViewBox.x);
    zoomedViewBox.y = Math.max(0, zoomedViewBox.y);
    if (zoomedViewBox.x + zoomedViewBox.width > viewBox.width) {
      zoomedViewBox.x = viewBox.width - zoomedViewBox.width;
      if (zoomedViewBox.x < 0) {
        zoomedViewBox.x = 0;
        zoomedViewBox.width = viewBox.width;
      }
    }
    if (zoomedViewBox.y + zoomedViewBox.height > viewBox.height) {
      zoomedViewBox.y = viewBox.height - zoomedViewBox.height;
      if (zoomedViewBox.y < 0) {
        zoomedViewBox.y = 0;
        zoomedViewBox.height = viewBox.height;
      }
    }
    return zoomedViewBox;
  }, [viewBox, zoomFactor, zoomOrigin]);
  const lastZoomedViewBox = useRef(zoomedViewBox);
  lastZoomedViewBox.current = zoomedViewBox;

  const [isDragging, setIsDragging] = useState(false);
  const [isResizingOrRotating, setIsResizingOrRotating] = useState(false);
  const [actionStart, setActionStart] = useState({
    x: 0,
    y: 0,
    asset: null as A | null,
    startPositions: [] as {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }[],
  });

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, assetId: string, isResizeHandle: boolean) => {
      const svg = svgRef.current;
      if (!svg) return;

      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(
        svg.getScreenCTM()?.inverse() || new DOMMatrix()
      );

      if (e.shiftKey) {
        setSelectedAssets((prev) => [...prev, assetId]);
      } else {
        setSelectedAssets([assetId]);
      }

      if (isResizeHandle) {
        // resizing asset
        setIsResizingOrRotating(true);
      } else {
        // dragging asset
        setIsDragging(true);
      }
      setActionStart({
        x: svgP.x,
        y: svgP.y,
        asset: deepCopy(
          assetsRef.current.find((a) => a.id === assetId) || null
        ),
        startPositions: assetsRef.current
          .filter((a) => selectedAssets.includes(a.id) || a.id === assetId)
          .map((a) => ({
            ...a.position,
            ...a.size,
            rotation: a.rotation || 0,
            id: a.id,
          })),
      });
    },
    [selectedAssets]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (selectedAssets.length === 0 || (!isDragging && !isResizingOrRotating))
        return;

      const svg = svgRef.current;
      if (!svg) return;
      // deliberately use assets from first render when dragging started
      const assets = assetsRef.current;

      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(
        svg.getScreenCTM()?.inverse() || new DOMMatrix()
      );

      if (isDragging) {
        const dx = svgP.x - actionStart.x;
        const dy = svgP.y - actionStart.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);
        if (distance < DRAG_DEADZONE) return;

        setAssets((assets) =>
          assets.map((asset) => {
            if (!selectedAssets.includes(asset.id)) return asset;
            const startPos = actionStart.startPositions.find(
              (pos) => pos.id === asset.id
            );
            if (!startPos) return asset;

            return {
              ...asset,
              position: {
                x: startPos.x + dx,
                y: startPos.y + dy,
              },
            };
          })
        );
      } else if (isResizingOrRotating) {
        const selected = assets.filter((a) => selectedAssets.includes(a.id));
        if (selected.length === 0) return;

        if (e.ctrlKey) {
          // rotating asset
          const startX = actionStart.asset
            ? actionStart.asset.position.x + actionStart.asset.size.width / 2
            : actionStart.x;
          const startY = actionStart.asset
            ? actionStart.asset.position.y + actionStart.asset.size.height / 2
            : actionStart.y;

          const deltaX = svgP.x - startX;
          const deltaY = svgP.y - startY;

          // 45° is to eliminate the offset from starting the drag at the bottom right corner
          const baseAngle = 45 + (actionStart.asset?.rotation || 0);

          setAssets((assets) =>
            assets.map((a) => {
              if (!selectedAssets.includes(a.id)) return a;
              const startPos = actionStart.startPositions.find(
                (pos) => pos.id === a.id
              );
              if (!startPos) return a;
              const angle = Math.atan2(deltaY, deltaX);
              let rotation =
                (startPos.rotation +
                  angle * (180 / Math.PI) +
                  720 -
                  baseAngle) %
                360;
              // snap to 45° increments if shift is held
              if (e.shiftKey) {
                rotation = Math.round(rotation / 45) * 45;
              }
              return {
                ...a,
                rotation,
              };
            })
          );
        } else {
          const deltaX = svgP.x - actionStart.x;
          const deltaY = svgP.y - actionStart.y;

          // resizing asset
          const makeSquare = e.shiftKey;

          setAssets((assets) =>
            assets.map((a) => {
              if (!selectedAssets.includes(a.id)) return a;
              return {
                ...a,
                size: (() => {
                  const startPos = actionStart.startPositions.find(
                    (pos) => pos.id === a.id
                  );
                  if (!startPos) return a.size;
                  const newSize = {
                    width: Math.max(MIN_ASSET_SIZE, startPos.width + deltaX),
                    height: Math.max(MIN_ASSET_SIZE, startPos.height + deltaY),
                  };
                  if (!makeSquare) return newSize;
                  const maxSide = Math.max(newSize.width, newSize.height);
                  return {
                    width: maxSide,
                    height: maxSide,
                  };
                })(),
              };
            })
          );
        }
      }
    },
    [isDragging, isResizingOrRotating, selectedAssets, actionStart]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizingOrRotating) {
      onAssetChange(
        selectedAssets
          .map((s) => assetsRef.current.find((a) => a.id === s)!)
          .filter(Boolean)
      );
    }
    setIsDragging(false);
    setIsResizingOrRotating(false);
  }, [isDragging, isResizingOrRotating, selectedAssets]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) {
        // zoom
        const svg = svgRef.current;
        if (!svg) return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(
          svg.getScreenCTM()?.inverse() || new DOMMatrix()
        );

        setZoomOrigin({
          x: svgP.x,
          y: svgP.y,
          relX:
            (svgP.x - lastZoomedViewBox.current.x) /
            lastZoomedViewBox.current.width,
          relY:
            (svgP.y - lastZoomedViewBox.current.y) /
            lastZoomedViewBox.current.height,
        });
        setZoomFactor((factor) =>
          clamp(factor + e.deltaY * ZOOM_MODIFIER, MIN_ZOOM_FACTOR, 1)
        );
      } else {
        // scroll
        let deltaX = e.deltaX;
        let deltaY = e.deltaY;
        if (e.shiftKey && e.deltaX === 0) {
          deltaX = deltaY;
          deltaY = 0;
        }
        setZoomOrigin((org) => ({
          ...org,
          x: clamp(org.x + deltaX * SCROLL_MODIFIER, 0, viewBox.width),
          y: clamp(org.y + deltaY * SCROLL_MODIFIER, 0, viewBox.height),
        }));
      }
    },
    [setZoomOrigin, setZoomFactor]
  );

  useEffect(() => {
    if (isDragging || isResizingOrRotating) {
      window.addEventListener("mousemove", handleMouseMove, { passive: false });
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizingOrRotating, handleMouseUp, handleMouseMove]);

  // add non-passive handleWheel event listener to svg
  useEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      svgRef.current?.removeEventListener("wheel", handleWheel);
    };
  }, [svgRef.current, handleWheel]);

  useKeys([
    {
      shortcut: ["Backspace", "Delete"],
      action() {
        if (document.activeElement !== svgRef.current) return;
        onAssetRemove(selectedAssets);
      },
    },
    {
      shortcut: ["Escape"],
      action() {
        if (document.activeElement !== svgRef.current) return;
        setSelectedAssets([]);
      },
    },
    {
      shortcut: {
        key: "a",
        ctrlKey: true,
      },
      action(e) {
        if (document.activeElement !== svgRef.current) return;
        setSelectedAssets(assets.map((a) => a.id));
        e.preventDefault();
      },
    },
  ]);

  const ctrlKeyDown = isKeyDown("Control");

  return (
    <div className="relative overflow-hidden w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`${zoomedViewBox.x} ${zoomedViewBox.y} ${zoomedViewBox.width} ${zoomedViewBox.height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedAssets([]);
        }}
        tabIndex={0}
        focusable
      >
        {/* Render map background */}
        {map?.floors.map((floor, i) => (
          <image
            key={floor.floor}
            href={floor.src}
            width={viewBox.width / (map.floors.length > 1 ? 2 : 1)}
            height={viewBox.height / (map.floors.length > 2 ? 2 : 1)}
            x={i % 2 === 0 ? 0 : viewBox.width / 2}
            y={(Math.floor(i / 2) * viewBox.height) / 2}
            preserveAspectRatio="xMidYMid meet"
            className="pointer-events-none"
          />
        ))}

        {/* Render assets */}
        {assets.map((asset) => {
          const render = renderAsset(
            asset,
            selectedAssets.length === 1 && selectedAssets[0] === asset.id
          );
          return (
            <SVGAsset
              key={asset.id}
              position={asset.position}
              size={asset.size}
              rotation={asset.rotation || 0}
              onMouseDown={(e, isResizeHandle) =>
                handleMouseDown(e, asset.id, isResizeHandle)
              }
              selected={selectedAssets.includes(asset.id)}
              ctrlKeyDown={ctrlKeyDown}
              menu={render.menu}
            >
              {render.asset}
            </SVGAsset>
          );
        })}
      </svg>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
