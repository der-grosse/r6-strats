import { DEFENDER_PRIMARY_GADGETS, PrimaryGadget } from "@/src/static/operator";
import { cn } from "@/src/utils";

export interface PrimaryGadgetIconProps {
  id: PrimaryGadget["id"];
  variant?: number;
  className?: string;
  showName?: boolean;
}

export default function PrimaryGadgetIcon(props: PrimaryGadgetIconProps) {
  const gadget = DEFENDER_PRIMARY_GADGETS.find((g) => g.id === props.id);
  const icon = gadget?.icon[props.variant ?? 0];

  return (
    <>
      <img
        src={icon}
        alt={gadget?.name ?? props.id}
        className={cn("w-8 h-8 object-contain", props.className)}
        draggable={false}
      />
      {props.showName && (
        <span className="text-sm">{gadget?.name ?? props.id}</span>
      )}
    </>
  );
}
