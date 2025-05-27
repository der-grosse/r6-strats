import {
  Attacker,
  ATTACKERS,
  Defender,
  DEFENDERS,
} from "@/src/static/operator";
import { cn } from "@/src/utils";

export interface OperatorIconProps {
  op: Attacker | Defender | string;
  variant?: "default" | "bw";
  className?: string;
}

const OPERATORS = [...DEFENDERS, ...ATTACKERS];

export default function OperatorIcon(props: OperatorIconProps) {
  const op =
    typeof props.op === "string"
      ? OPERATORS.find((op) => op.name === props.op)
      : props.op;
  const img =
    props.variant === "bw" && op && "iconBW" in op ? op.iconBW : op?.icon;
  return (
    <img
      src={img}
      alt={op?.name}
      className={cn("w-8 h-8", props.className)}
      draggable={false}
    />
  );
}
