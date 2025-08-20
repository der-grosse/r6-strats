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
import WoodenBarricade from "../icons/woodenBarricade";
import { useUser } from "../context/UserContext";

export default function useMountAssets(
  { team, stratPositions }: { team: Team; stratPositions: StratPositions[] },
  {
    deleteAsset,
    updateAsset,
  }: {
    deleteAsset: (asset: PlacedAsset) => void;
    updateAsset: (asset: PlacedAsset) => void;
  }
) {
  const { user } = useUser();
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerAsset, setColorPickerAsset] = useState<PlacedAsset | null>(
    null
  );

  const menu = useCallback(
    (asset: PlacedAsset) => {
      const position = stratPositions.find(
        (op) => op.id === asset.stratPositionID
      );
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
              const stratPositionOfMember = stratPositions?.find(
                (op) => op.positionID === member.positionID
              );
              if (!stratPositionOfMember) return null;
              return (
                <Tooltip delayDuration={200} key={member.id}>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={!stratPositionOfMember}
                      size="icon"
                      variant="ghost"
                      className={cn(
                        member.positionID === position?.positionID &&
                          "bg-card dark:hover:bg-card"
                      )}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => {
                        updateAsset({
                          ...asset,
                          stratPositionID: stratPositionOfMember?.id,
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
    [team, stratPositions, deleteAsset, updateAsset]
  );

  const dialog = useMemo(
    () => (
      <ColorPickerDialog
        open={colorPickerOpen}
        onClose={() => setColorPickerOpen(false)}
        onChange={(color) => {
          updateAsset({
            ...colorPickerAsset!,
            stratPositionID: undefined,
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
    function renderAsset(
      asset: PlacedAsset,
      selectedBy: TeamMember["id"][],
      lastestSelected: boolean
    ) {
      const assetElement = (() => {
        switch (asset.type) {
          case "operator":
            return (
              <Operator
                asset={asset}
                team={team}
                stratPositions={stratPositions}
              />
            );
          case "gadget":
            return (
              <AssetOutline
                asset={asset}
                team={team}
                stratPositions={stratPositions}
              >
                <GadgetIcon id={asset.gadget} className="h-full w-full" />
              </AssetOutline>
            );
          case "reinforcement":
            if (asset.variant === "barricade") {
              return (
                <AssetOutline
                  asset={asset}
                  team={team}
                  stratPositions={stratPositions}
                >
                  <WoodenBarricade />
                </AssetOutline>
              );
            }
            return (
              <Reinforcement
                height={asset.size.height}
                width={asset.size.width}
                color={getAssetColor(asset, stratPositions, team)}
              />
            );
          case "rotate":
            if (asset.variant === "explosion") {
              return (
                <Explosion color={getAssetColor(asset, stratPositions, team)} />
              );
            } else {
              return (
                <Rotation
                  variant={asset.variant}
                  height={asset.size.height}
                  width={asset.size.width}
                  color={getAssetColor(asset, stratPositions, team)}
                />
              );
            }
          default:
            return <>Missing Asset</>;
        }
      })();
      const fullAsset = (() => {
        if (
          selectedBy.length === 0 ||
          selectedBy.every((id) => id === user?.id)
        ) {
          return assetElement;
        } else {
          const shadowColors = selectedBy
            .map((id) => team.members.find((m) => m.id === id)?.defaultColor!)
            .filter(Boolean);
          return (
            <div
              style={{
                boxShadow: shadowColors.length
                  ? shadowColors.map((c) => `0 0 .4rem .3rem ${c}`).join(", ")
                  : undefined,
              }}
              className="size-full"
              title={`Selected by ${selectedBy
                .map((id) => team.members.find((m) => m.id === id)?.name)
                .join(", ")}`}
            >
              {assetElement}
            </div>
          );
        }
      })();
      return {
        menu:
          lastestSelected && selectedBy.includes(user?.id ?? -1)
            ? menu(asset)
            : undefined,
        asset: fullAsset,
      };
    },
    [menu, team, stratPositions]
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
  asset: Pick<PlacedAsset, "customColor" | "stratPositionID">,
  stratPositions: StratPositions[],
  team: Team
): string | undefined {
  if (asset.customColor) return asset.customColor;
  if (!asset.stratPositionID) return undefined;
  const pickedOP = stratPositions.find((op) => op.id === asset.stratPositionID);
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
