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
            {floor.clickables && (
              <g transform={`translate(${x}, ${y})`}>
                <foreignObject width={width} height={height}>
                  <floor.clickables
                    onClick={(
                      type,
                      rel_x,
                      rel_y,
                      rel_width,
                      rel_height,
                      rotation
                    ) => {
                      const abs_width = Math.max(
                        rel_width * width + 10, // add a little bit of spacint that the edge is over the window edge
                        MIN_ASSET_SIZE
                      );
                      const abs_height = Math.max(
                        rel_height * height + 10, // add a little bit of spacint that the edge is over the window edge
                        MIN_ASSET_SIZE
                      );
                      const abs_x = rel_x * width + x - abs_width / 2;
                      const abs_y = rel_y * height + y - abs_height / 2;
                      const baseAsset = ((): Pick<
                        ReinforcementAsset,
                        "id" | "type" | "variant"
                      > => {
                        switch (type) {
                          case "barricade":
                            return {
                              id: "reinforcement-barricade",
                              type: "reinforcement",
                              variant: "barricade",
                            };
                          case "reinforcement":
                            return {
                              id: "reinforcement-reinforcement",
                              type: "reinforcement",
                              variant: "reinforcement",
                            };
                          default:
                            return null!;
                        }
                      })();
                      props.addAsset({
                        ...baseAsset,
                        position: {
                          x: abs_x,
                          y: abs_y,
                        },
                        size: {
                          width: abs_width,
                          height: abs_height,
                        },
                        rotation,
                      });
                    }}
                  />
                </foreignObject>
              </g>
            )}
          </Fragment>
        );
      })}
    </>
  );
}
