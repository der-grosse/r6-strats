import { cn } from "@/lib/utils";

export interface WoodenBarricadeProps {
  className?: string;
}

export default function WoodenBarricade(props: WoodenBarricadeProps) {
  return (
    <img
      src="/gadgets/barricade.png"
      alt="Wooden Barricade"
      className={cn("object-contain size-full", props.className)}
    />
  );
}
