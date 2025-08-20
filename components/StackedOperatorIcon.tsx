import { Attacker, Defender } from "@/src/static/operator";
import { cn } from "@/src/utils";
import OperatorIcon from "./OperatorIcon";

export interface StackedOperatorIconProps {
  ops: (Attacker | Defender | string)[];
  variant?: "default" | "bw";
  className?: string;
}

export default function StackedOperatorIcon(props: StackedOperatorIconProps) {
  return (
    <div className={cn("w-8 h-8 relative", props.className)}>
      {props.ops
        .slice(0, 3)
        .reverse()
        .map((op, index, ops) => (
          <OperatorIcon
            op={op}
            key={index}
            variant={props.variant}
            className="absolute shadow-lg"
            style={{
              top: `${(ops.length - index - 1) * 6}px`,
              left: `${(ops.length - index - 1) * 6}px`,
            }}
          />
        ))}
    </div>
  );
}
