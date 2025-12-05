import Reinforcement from "@/components/icons/reinforcement";
import Rotation from "@/components/icons/rotation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Explosion from "../assets/Explosion";
import WoodenBarricade from "@/components/icons/woodenBarricade";
import {
  Asset,
  PlacedAsset,
  ReinforcementAsset,
  RotateAsset,
} from "@/lib/types/asset.types";

export interface StratEditorLayoutSidebarProps {
  onAssetAdd: (asset: Omit<Asset & Partial<PlacedAsset>, "_id">) => void;
}

export default function StratEditorLayoutSidebar(
  props: Readonly<StratEditorLayoutSidebarProps>
) {
  return (
    <div className="h-full absolute inset-0">
      <ScrollArea className="h-full p-2">
        <div
          className="grid gap-2 items-center pb-4"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(32px, 1fr))",
          }}
        >
          <Badge className="sticky top-0 w-full col-span-full">
            Reinforcements
          </Badge>
          <Button
            variant="outline"
            size="unset"
            key="reinforcement"
            className="p-1 h-auto aspect-square"
            onClick={() => {
              props.onAssetAdd({
                type: "reinforcement",
                variant: "reinforcement",
              } as Omit<ReinforcementAsset, "_id">);
            }}
          >
            <Reinforcement className="size-full" />
          </Button>
          <Button
            variant="outline"
            size="unset"
            key="barricade"
            className="p-1 h-auto aspect-square"
            onClick={() => {
              props.onAssetAdd({
                type: "reinforcement",
                variant: "barricade",
              } as Omit<ReinforcementAsset, "_id">);
            }}
          >
            <WoodenBarricade />
          </Button>
          <Badge className="sticky top-0 w-full col-span-full">
            Rotate and Headholes
          </Badge>
          {(
            [
              "full",
              "crouch",
              "jump",
              "headholes",
              "floorholes",
              "ceilingholes",
            ] as const
          ).map((variant) => (
            <Button
              variant="outline"
              size="unset"
              key={`rotate-${variant}`}
              className="p-1 h-auto aspect-square"
              onClick={() => {
                props.onAssetAdd({
                  type: "rotate",
                  variant,
                } as Omit<RotateAsset, "_id">);
              }}
            >
              <Rotation variant={variant} className="size-full" />
            </Button>
          ))}
          <Button
            variant="outline"
            size="unset"
            key="rotate-explosion"
            className="p-1 h-auto aspect-square"
            onClick={() => {
              props.onAssetAdd({
                type: "rotate",
                variant: "explosion",
              } as Omit<RotateAsset, "_id">);
            }}
          >
            <Explosion />
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
