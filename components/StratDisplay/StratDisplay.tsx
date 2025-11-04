"use client";

import {
  getGoogleDrawingsEditURL,
  getGoogleDrawingsPreviewURL,
} from "@/src/googleDrawings";
import { Ban, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { useUser } from "../context/UserContext";
import StratViewer from "../StratEditor/StratViewer";
import OperatorIcon from "../general/OperatorIcon";
import { Fragment } from "react";
import Shotgun from "../StratEditor/assets/Shotgun";
import GadgetIcon from "../general/GadgetIcon";
import { useFilter } from "../context/FilterContext";
import { getAssetColor } from "../StratEditor/Assets";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "@/src/utils";

export interface StratDisplayProps {
  strat: Strat | null;
  team: Team;
  editView?: boolean;
  hideDetails?: boolean;
}

export default function StratDisplay(props: StratDisplayProps) {
  const { bannedOps } = useFilter();
  const user = useUser();
  const teamMember = props.team.members.find(
    (member) => member.id === user?.user?.id
  );
  const stratPosition = props.strat?.positions.find(
    (op) => op.positionID === teamMember?.positionID
  );

  const availableOperators = (() => {
    const ops = stratPosition?.operators.filter(
      (op) => !bannedOps.includes(op.operator)
    );
    if (!ops?.length) return stratPosition?.operators ?? [];
    return ops;
  })();

  const teamLineUp = (
    props.strat?.positions.filter(
      (position) => position.positionID !== teamMember?.positionID
    ) ?? []
  )
    .map((pos) => {
      const teamPosition = props.team.playerPositions.find(
        (teamPos) => teamPos.id === pos.positionID
      );
      const player = props.team.members.find(
        (member) => member.positionID === pos.positionID
      );
      const color = player?.defaultColor ?? undefined;

      return {
        op: pos.operators.find((op) => !bannedOps.includes(op.operator)),
        color,
        playerName: player?.name,
        positionName: teamPosition?.positionName,
        index: teamPosition?.index ?? 10,
      };
    })
    .filter((pos) => pos.op !== undefined)
    .sort((a, b) => a.index - b.index);

  const Details = !props.hideDetails && props.strat && (
    <div className="grid grid-cols-[1fr_auto_1fr] w-full gap-4">
      <div />
      <div className="flex flex-col gap-1 px-2 rounded bg-background">
        {availableOperators.length > 0 && (
          <div className="flex gap-2 justify-center items-center">
            {availableOperators.slice(0, 3).map((op, i) => (
              <Fragment key={i}>
                <div className={cn("relative", i !== 0 && "opacity-50")}>
                  <OperatorIcon op={op.operator} />
                  {op.secondaryGadget && (
                    <GadgetIcon
                      id={op.secondaryGadget}
                      className="absolute size-6 -right-2 -bottom-2"
                    />
                  )}
                  {op.tertiaryGadget && (
                    <GadgetIcon
                      id={op.tertiaryGadget}
                      className="absolute size-6 -left-2 -bottom-2"
                    />
                  )}
                </div>
                {i === 0 ? (
                  <p className="text-lg font-bold text-center">{op.operator}</p>
                ) : i !== Math.min(availableOperators.length, 2) ? (
                  <div className="w-1" />
                ) : null}
              </Fragment>
            ))}
            {stratPosition?.shouldBringShotgun && (
              <Shotgun className="size-8" />
            )}
          </div>
        )}
        <div className="flex justify-center gap-1 text-sm">
          <span className="ml-2">
            {props.strat.map}
            {" | "}
            {props.strat.site}
            {" | "}
            {props.strat.name}
          </span>
          <Link
            href={`/editor/${props.strat.id}`}
            className="text-muted-foreground hover:text-primary"
          >
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer -my-2 -mx-1"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex justify-end items-end gap-2.5">
        {teamLineUp.map(({ op, color, playerName, positionName }, index) => (
          <Tooltip key={index}>
            <TooltipTrigger>
              <div
                className="relative rounded-sm scale-90"
                style={{ backgroundColor: color }}
              >
                <OperatorIcon op={op?.operator!} className="scale-125" />
                {op?.secondaryGadget && (
                  <GadgetIcon
                    id={op?.secondaryGadget}
                    className="absolute size-6 -right-2 -bottom-2"
                  />
                )}
                {op?.tertiaryGadget && (
                  <GadgetIcon
                    id={op?.tertiaryGadget}
                    className="absolute size-6 -left-2 -bottom-2"
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-center">
                {playerName ? playerName : "Unassigned"} | {positionName}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative h-full w-full flex justify-center items-center flex-col z-0">
      {props.strat?.drawingID ? (
        <>
          <iframe
            className="w-full flex-1"
            src={
              props.editView
                ? getGoogleDrawingsEditURL(props.strat.drawingID)
                : getGoogleDrawingsPreviewURL(props.strat.drawingID)
            }
          />
          {Details}
        </>
      ) : props.strat ? (
        <>
          <div className="flex-1 relative h-screen overflow-hidden py-0 block">
            <div className="relative h-full w-full flex items-center justify-center">
              <StratViewer strat={props.strat} team={props.team} />
            </div>
          </div>
          {Details}
        </>
      ) : (
        <>
          <Ban className="text-muted-foreground" height={64} width={64} />
          <p className="text-muted-foreground">No strat selected</p>
        </>
      )}
    </div>
  );
}
