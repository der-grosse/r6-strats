import { Fragment } from "react";
import { clampAssetSize } from "./Canvas";
import { R6Map } from "@/lib/types/strat.types";
import { Asset, PlacedAsset, LayoutAsset } from "@/lib/types/asset.types";

export interface MapBackgroundProps {
  map: R6Map | null;
  viewBox: {
    width: number;
    height: number;
  };
  addAsset: (asset: Omit<Asset & Partial<PlacedAsset>, "_id">) => void;
  readonly?: boolean;
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
            {!props.readonly && floor.clickables && (
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
                      const { width: abs_width, height: abs_height } =
                        clampAssetSize({
                          width:
                            rel_width * width +
                            (type === "barricade" ? 10 : -5), // add a little bit of spacing that the edge is over the window edge
                          height:
                            rel_height * height +
                            (type === "barricade" ? 10 : -5), // add a little bit of spacing that the edge is over the window edge
                        });
                      const abs_x = rel_x * width + x - abs_width / 2;
                      const abs_y = rel_y * width + y - abs_height / 2;
                      const baseAsset = ((): Pick<
                        LayoutAsset,
                        "type" | "variant"
                      > => {
                        switch (type) {
                          case "barricade":
                            return {
                              type: "layout",
                              variant: "barricade",
                            };
                          case "reinforcement":
                            return {
                              type: "layout",
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
