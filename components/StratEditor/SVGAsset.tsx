"use client";
import { useRef } from "react";
import { cn } from "@/src/utils";

interface SVGAssetProps {
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  onMouseDown: (e: React.MouseEvent, isResizeHandle: boolean) => void;
  selected: boolean;
  children: React.ReactNode;
  ctrlKeyDown?: boolean;
  menu?: React.ReactNode;
  zoom: number;
}

export default function SVGAsset({
  position,
  size,
  rotation,
  onMouseDown,
  selected,
  children,
  ctrlKeyDown = false,
  menu,
  zoom,
}: Readonly<SVGAssetProps>) {
  const assetRef = useRef<SVGGElement>(null);

  return (
    <g
      ref={assetRef}
      transform={`translate(${position.x}, ${position.y})`}
      onMouseDown={(e) => onMouseDown(e, false)}
      onClick={(e) => {
        e.stopPropagation();
      }}
      className="select-none"
    >
      {menu && (
        <foreignObject
          style={{ overflow: "visible" }}
          // matrix(sx, 0, 0, sy, cx-sx*cx, cy-sy*cy) -> to scale with a transform origin at the center bottom
          transform={`matrix(${zoom}, 0, 0, ${zoom}, ${
            size.width / 2 - (size.width / 2) * zoom
          }, 0) translate(0 ${-size.height * (1 - zoom)})`}
        >
          {menu}
        </foreignObject>
      )}
      <g
        transform={`rotate(${rotation} ${size.width / 2} ${size.height / 2})`}
        className="cursor-move"
      >
        <foreignObject
          width={size.width}
          height={size.height}
          style={{ overflow: "visible" }}
        >
          {children}
        </foreignObject>
        <rect
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className={cn("pointer-events-none", !selected && "hidden")}
        />
        <circle
          cx={size.width}
          cy={size.height}
          r=".5%"
          fill="currentColor"
          className={cn(
            "resize-handle",
            !selected && "hidden",
            ctrlKeyDown
              ? "cursor-[url(/cursor/rotate.png),_grab]"
              : "cursor-se-resize"
          )}
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDown(e, true);
          }}
        />
      </g>
    </g>
  );
}
