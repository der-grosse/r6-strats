import { DEFAULT_COLORS } from "@/lib/static/colors";
import { useMemo } from "react";

export default function AssetOutline(props: {
  children?: React.ReactNode;
  stratPositions: StratPositions[];
  asset: PlacedAsset;
  team: Team;
}) {
  const color = useMemo(
    () =>
      props.asset.customColor ??
      (() => {
        const pickedOperator = props.stratPositions.find(
          (op) => op.id === props.asset.stratPositionID
        );
        if (!pickedOperator?.positionID) return null;
        const position = props.team.playerPositions.find(
          (p) => p.id === pickedOperator.positionID
        );
        if (!position) return null;
        const member = props.team.members.find(
          (m) => m.id === position.playerID
        );
        if (!member) return null;
        return member.defaultColor;
      })() ??
      DEFAULT_COLORS.at(-1)!,
    [props.asset, props.stratPositions, props.team]
  );

  return (
    <div
      className="border-4 h-full w-full rounded-xs"
      style={{ borderColor: color }}
    >
      {props.children}
    </div>
  );
}
