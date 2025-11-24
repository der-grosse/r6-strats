import { cn } from "@/lib/utils";

export interface ExplosionProps {
  color?: string;
  className?: string;
}

export default function Explosion(props: ExplosionProps) {
  return (
    <div
      className={cn("size-full shadow-lg rounded-[5%]", props.className)}
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
