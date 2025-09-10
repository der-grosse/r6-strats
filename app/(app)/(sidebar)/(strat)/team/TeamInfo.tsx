"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRef, useState } from "react";
import { updateTeamName } from "@/src/auth/team";
import { Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useSaveDebounced from "@/components/hooks/useSaveDebounced";

export interface TeamInfoProps {
  team: Team;
}

export default function TeamInfo(props: TeamInfoProps) {
  const teamNameInputRef = useRef<HTMLInputElement | null>(null);
  const [newTeamName, setNewTeamName] = useState(props.team.name);

  const { saveNow: saveTeamName } = useSaveDebounced(
    newTeamName,
    async (newTeamName) => {
      try {
        await updateTeamName(newTeamName);
        toast.success("Team name updated successfully");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update team name"
        );
      }
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Settings</CardTitle>
        <CardDescription>Manage your team settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="teamname-input">Team Name</Label>
          <Input
            id="teamname-input"
            ref={teamNameInputRef}
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                saveTeamName();
              }
            }}
            onBlur={() => saveTeamName()}
            placeholder="Team Name"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="created-at-info">Created at</Label>
          <span id="created-at-info" className="text-sm text-muted-foreground">
            {new Date(props.team.createdAt).toLocaleDateString("de-DE", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </span>
        </div>
        <div className="space-y-1">
          <Label htmlFor="team-member-count">Team member count</Label>
          <span
            id="team-member-count"
            className="text-sm text-muted-foreground"
          >
            {props.team.members.length} member
            {props.team.members.length !== 1 ? "s" : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
