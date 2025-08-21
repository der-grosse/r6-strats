"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
