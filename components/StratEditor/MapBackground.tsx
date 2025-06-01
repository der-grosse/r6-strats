import { Fragment } from "react";
import { MIN_ASSET_SIZE } from "./Canvas";

export interface MapBackgroundProps {
  map: R6Map | null;
  viewBox: {
    width: number;
    height: number;
  };
  addAsset: (asset: Asset & Partial<PlacedAsset>) => void;
}

export default function MapBackground(props: MapBackgroundProps) {
  const { map, viewBox } = props;
  return (
    <>
      {/* Render map background */}
      {map?.floors.map((floor, i) => {
        const x = i % 2 === 0 ? 0 : viewBox.width / 2;
        const y = (Math.floor(i / 2) * viewBox.height) / 2;
        const width = viewBox.width / (map.floors.length > 1 ? 2 : 1);
        const height = viewBox.height / (map.floors.length > 2 ? 2 : 1);
        return (
          <Fragment key={floor.floor}>
            <image
              key={floor.floor}
              href={floor.src}
              width={width}
              height={height}
              x={x}
              y={y}
              preserveAspectRatio="xMidYMid meet"
              className="pointer-events-none"
            />
            {floor.layers?.windows &&
              (() => {
                const WindowsComponent = floor.layers.windows;
                return (
                  <g transform={`translate(${x}, ${y})`}>
                    <foreignObject width={width} height={height}>
                      <WindowsComponent
                        key={`${floor.floor}-windows`}
                        onClick={(rel_x, rel_y, rel_size, rotation) => {
                          const size = Math.max(
                            rel_size * width + 10, // add a little bit of spacint that the edge is over the window edge
                            MIN_ASSET_SIZE
                          );
                          const assetHeight = Math.max(
                            (size / 4) * 3,
                            MIN_ASSET_SIZE
                          );
                          const assetWidth = size;
                          const abs_x = rel_x * width + x - assetWidth / 2;
                          const abs_y = rel_y * height + y - assetHeight / 2;
                          props.addAsset({
                            type: "reinforcement",
                            variant: "barricade",
                            id: "reinforcement-barricade",
                            position: {
                              x: abs_x,
                              y: abs_y,
                            },
                            size: {
                              width: assetWidth,
                              height: assetHeight,
                            },
                            rotation,
                          });
                        }}
                      />
                    </foreignObject>
                  </g>
                );
              })()}
          </Fragment>
        );
      })}
    </>
  );
}
