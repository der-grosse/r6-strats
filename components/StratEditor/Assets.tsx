import {
  Brush,
  EyeOff,
  GripVertical,
  Trash,
  UserRound,
  UserRoundPen,
} from "lucide-react";
import { Button } from "../ui/button";
import Operator from "./assets/Operator";
import { cn } from "@/src/utils";
import { useCallback, useMemo, useState } from "react";
import ColorPickerDialog from "../ColorPickerDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import GadgetIcon from "../GadgetIcon";
import AssetOutline from "./assets/AssetOutline";
import Reinforcement from "../icons/reinforcement";
import Rotation from "../icons/rotation";
import Explosion from "./assets/Explosion";

export default function useMountAssets(
  { team, operators }: { team: Team; operators: PickedOperator[] },
  {
    deleteAsset,
    updateAsset,
  }: {
    deleteAsset: (asset: PlacedAsset) => void;
    updateAsset: (asset: PlacedAsset) => void;
  }
) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerAsset, setColorPickerAsset] = useState<PlacedAsset | null>(
    null
  );

  const menu = useCallback(
    (asset: PlacedAsset) => {
      const pickedOperator = operators.find((op) => op.id === asset.pickedOPID);
      return (
        <div
          className={cn(
            "absolute bottom-[110%] left-[50%] -translate-x-1/2 bg-muted text-muted-foreground rounded flex items-center justify-center scale-200 origin-bottom z-100"
          )}
        >
          <GripVertical className="cursor-grab" />
          <div className="bg-border w-[1px] h-6" />
          {team.members
            .filter((m) => m.positionID)
            .map((member) => {
              const pickedOperatorOfMember = operators?.find(
                (op) => op.positionID === member.positionID
              );
              if (!pickedOperatorOfMember) return null;
              return (
                <Tooltip delayDuration={200} key={member.id}>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={!pickedOperatorOfMember}
                      size="icon"
                      variant="ghost"
                      className={cn(
                        member.positionID === pickedOperator?.positionID &&
                          "bg-card dark:hover:bg-card"
                      )}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => {
                        updateAsset({
                          ...asset,
                          pickedOPID: pickedOperatorOfMember?.id,
                          customColor: undefined,
                        });
                      }}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full",
                          !member.defaultColor &&
                            "outline-2 outline-offset-1 outline-muted"
                        )}
                        style={{
                          background: member.defaultColor ?? undefined,
                        }}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-sm">
                      {member.name} |{" "}
                      {
                        team.playerPositions.find(
                          (p) => p.id === member.positionID
                        )?.positionName
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          <Button
            size="icon"
            variant="ghost"
            className={cn(asset.customColor && "bg-card dark:hover:bg-card")}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              setColorPickerAsset(asset);
              setColorPickerOpen(true);
            }}
          >
            <Brush />
          </Button>
          <div className="bg-border w-[1px] h-6" />
          {asset.type === "operator" && (
            <Button
              size="icon"
              variant="ghost"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                updateAsset({
                  ...asset,
                  iconType: getNextOperatorIconType(asset.iconType),
                });
              }}
            >
              {asset.iconType === "default" ? (
                <UserRoundPen />
              ) : asset.iconType === "bw" ? (
                <UserRound />
              ) : (
                <EyeOff />
              )}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => deleteAsset(asset)}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Trash />
          </Button>
        </div>
      );
    },
    [team, operators, deleteAsset, updateAsset]
  );

  const dialog = useMemo(
    () => (
      <ColorPickerDialog
        open={colorPickerOpen}
        onClose={() => setColorPickerOpen(false)}
        onChange={(color) => {
          updateAsset({
            ...colorPickerAsset!,
            pickedOPID: undefined,
            customColor: color,
          });
          setColorPickerOpen(false);
        }}
        color={colorPickerAsset?.customColor ?? ""}
      />
    ),
    [colorPickerOpen, colorPickerAsset, updateAsset]
  );

  const renderAsset = useCallback(
    function renderAsset(asset: PlacedAsset, selected: boolean) {
      const assetElement = (() => {
        switch (asset.type) {
          case "operator":
            return <Operator asset={asset} team={team} operators={operators} />;
          case "gadget":
            return (
              <AssetOutline asset={asset} team={team} operators={operators}>
                <GadgetIcon id={asset.gadget} className="h-full w-full" />
              </AssetOutline>
            );
          case "reinforcement":
            return (
              <Reinforcement
                height={asset.size.height}
                width={asset.size.width}
                color={getAssetColor(asset, operators, team)}
              />
            );
          case "rotate":
            if (asset.variant === "explosion") {
              return (
                <Explosion color={getAssetColor(asset, operators, team)} />
              );
            } else {
              return (
                <Rotation
                  variant={asset.variant}
                  height={asset.size.height}
                  width={asset.size.width}
                  color={getAssetColor(asset, operators, team)}
                />
              );
            }
          default:
            return <>Missing Asset</>;
        }
      })();
      return {
        menu: selected ? menu(asset) : undefined,
        asset: assetElement,
      };
    },
    [menu, team, operators]
  );

  return { renderAsset, UI: dialog };
}

function getNextOperatorIconType(
  current: "default" | "hidden" | "bw" | undefined | null
): "default" | "hidden" | "bw" {
  switch (current) {
    case "default":
      return "hidden";
    case "hidden":
      return "bw";
    case "bw":
      return "default";
    default:
      return "default";
  }
}

export function getAssetColor(
  asset: PlacedAsset,
  pickedOPs: PickedOperator[],
  team: Team
): string | undefined {
  if (asset.customColor) return asset.customColor;
  if (!asset.pickedOPID) return undefined;
  const pickedOP = pickedOPs.find((op) => op.id === asset.pickedOPID);
  if (!pickedOP) return undefined;
  const postion = team.playerPositions.find(
    (pos) => pos.id === pickedOP.positionID
  );
  if (!postion) return undefined;
  const teamMember = team.members.find(
    (member) => member.id === postion.playerID
  );
  return teamMember?.defaultColor ?? undefined;
}
