"use client";
import { ColorButton } from "@/components/ColorPickerDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { setMemberPosition, setMemberPositionName } from "@/src/auth/team";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import TeamPlayerPositionsList from "./TeamPlayerPositionsList";

export interface TeamPlayerPositionsProps {
  team: Team;
  canEdit: boolean;
}

export default function TeamPlayerPositions(props: TeamPlayerPositionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Positions</CardTitle>
        <CardDescription>
          Assign each player a position in your team. This is useful so you can
          easily switch players for subs without sharing login data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TeamPlayerPositionsList canEdit={props.canEdit} team={props.team} />
      </CardContent>
    </Card>
  );
}
