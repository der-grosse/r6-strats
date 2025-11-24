"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { setMemberColor } from "@/lib/auth/team";
import ColorPickerDialog from "@/components/general/ColorPickerDialog";
import TeamMemberList from "./TeamMemberList";
import { DEFAULT_COLORS } from "@/lib/static/colors";
import ChangeUbisoftIDDialog from "./ChangeUbisoftIDDialog";

export interface TeamMembersProps {
  team: Team;
}

export default function TeamMembers(props: TeamMembersProps) {
  const [userColorChangeOpen, setUserColorChangeOpen] = useState(false);
  const [userColorID, setUserColorID] = useState<number | null>(null);

  const [changeUbisoftIDOpen, setChangeUbisoftIDOpen] = useState(false);
  const [changeUbisoftIDUser, setChangeUbisoftIDUser] =
    useState<TeamMember | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMemberList
            members={props.team.members}
            onChangeColor={(member) => {
              setUserColorID(member.id);
              setUserColorChangeOpen(true);
            }}
            onChangeUbisoftID={(member) => {
              // Otherwise there is an issue with dropdown menu closing and dialog opening at the same time
              // which leaves the body non interactable with pointer-events: none;
              setTimeout(() => {
                setChangeUbisoftIDUser(member);
                setChangeUbisoftIDOpen(true);
              });
            }}
          />
        </CardContent>
      </Card>

      <ColorPickerDialog
        open={userColorChangeOpen}
        onClose={() => setUserColorChangeOpen(false)}
        color={
          props.team.members.find((u) => u.id === userColorID)?.defaultColor ??
          DEFAULT_COLORS.at(-1)
        }
        onChange={async (color) => {
          if (userColorID) await setMemberColor(color, userColorID);
          setUserColorID(null);
          setUserColorChangeOpen(false);
        }}
      />

      <ChangeUbisoftIDDialog
        open={changeUbisoftIDOpen}
        onClose={() => setChangeUbisoftIDOpen(false)}
        member={changeUbisoftIDUser}
      />
    </>
  );
}
