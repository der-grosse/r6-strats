import { DEFAULT_COLORS } from "@/components/ColorPickerDialog";
import { useMemo } from "react";

export default function AssetOutline(props: {
  children?: React.ReactNode;
  operators: PickedOperator[];
  asset: PlacedAsset;
  team: Team;
}) {
  const color = useMemo(
    () =>
      props.asset.customColor ??
      (() => {
        const pickedOperator = props.operators.find(
          (op) => op.id === props.asset.pickedOPID
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
    [props.asset, props.operators, props.team]
  );

  return (
    <div
      className="border-2 h-full w-full rounded-xs"
      style={{ borderColor: color }}
    >
      {props.children}
    </div>
  );
}
