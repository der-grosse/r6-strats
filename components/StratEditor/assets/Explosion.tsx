import OperatorIcon from "@/components/OperatorIcon";
import { getAssetColor } from "../Assets";

export interface ExplosionProps {
  color?: string;
}

export default function Explosion(props: ExplosionProps) {
  return (
    <div
      className="size-full shadow-lg rounded-[5%]"
      style={{
        background: props.color ?? undefined,
      }}
    >
      <img
        src="/layout/explosion.png"
        alt="Explosion Rotate"
        className="object-contain w-full h-full"
        draggable={false}
      />
    </div>
  );
}
