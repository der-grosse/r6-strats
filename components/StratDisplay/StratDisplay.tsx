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

export interface StratDisplayProps {
  strat: Strat | null;
  team: Team;
  editView?: boolean;
  hideDetails?: boolean;
}

export default function StratDisplay(props: StratDisplayProps) {
  const user = useUser();
  const teamMember = props.team.members.find(
    (member) => member.id === user?.user?.id
  );
  const stratPosition = props.strat?.positions.find(
    (op) => op.positionID === teamMember?.positionID
  );

  const Details = !props.hideDetails && props.strat && (
    <div className="flex flex-col gap-1 p-2 rounded bg-background">
      {stratPosition?.operators && (
        <div className="flex gap-2 justify-center items-center">
          {stratPosition.operators.map((op, i) => (
            <Fragment key={i}>
              <OperatorIcon op={op} />
              <p className="text-lg font-bold text-center">{op}</p>
            </Fragment>
          ))}
          {stratPosition.shouldBringShotgun && <Shotgun className="size-8" />}
          {stratPosition.secondaryGadget && (
            <GadgetIcon id={stratPosition.secondaryGadget} />
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
