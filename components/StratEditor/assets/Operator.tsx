import OperatorIcon from "@/components/OperatorIcon";
import { getAssetColor } from "../Assets";

export interface OperatorProps {
  asset: Extract<PlacedAsset, { type: "operator" }>;
  operators: PickedOperator[];
  team: Team;
}

export default function Operator(props: OperatorProps) {
  const color = getAssetColor(props.asset, props.operators, props.team);
  return (
    <div className="w-[130%] h-[130%] m-[-15%] relative">
      {props.asset.iconType !== "hidden" && (
        <OperatorIcon
          op={props.asset.operator}
          className="w-full h-full absolute z-10"
          variant={props.asset.iconType}
        />
      )}
      <div
        className="m-[5%] w-[90%] h-[90%] absolute top-0 left-0 z-0 shadow-lg rounded-[5%]"
        style={{
          background: color ?? undefined,
        }}
      />
    </div>
  );
}
