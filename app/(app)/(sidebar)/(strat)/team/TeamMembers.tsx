"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Fragment, useState } from "react";
import { changeUbisoftID, setMemberColor } from "@/src/auth/team";
import ColorPickerDialog from "@/components/general/ColorPickerDialog";
import TeamMemberList from "./TeamMemberList";
import { DEFAULT_COLORS } from "@/src/static/colors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import UbisoftAvatar from "@/components/general/UbisoftAvatar";
import useSaveDebounced from "@/components/hooks/useSaveDebounced";
import { checkUbisoftID } from "@/src/ubisoft/ubi";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TeamMembersProps {
  team: Team;
}

export default function TeamMembers(props: TeamMembersProps) {
  const [userColorChangeOpen, setUserColorChangeOpen] = useState(false);
  const [userColorID, setUserColorID] = useState<number | null>(null);

  const [changeUbisoftIDOpen, setChangeUbisoftIDOpen] = useState(false);
  const [changeUbisoftIDUser, setChangeUbisoftIDUser] =
    useState<TeamMember | null>(null);
  const [newUbisoftID, setNewUbisoftID] = useState("");
  const [newUbisoftIDValid, setNewUbisoftIDValid] = useState<boolean | null>(
    null
  );
  useSaveDebounced(newUbisoftID, async (ubisoftID) => {
    setNewUbisoftIDValid(null);
    const valid = await checkUbisoftID(ubisoftID);
    setNewUbisoftIDValid(valid);
  });

  return (
    <Fragment>
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
              setChangeUbisoftIDUser(member);
              setChangeUbisoftIDOpen(true);
              setNewUbisoftID(member.ubisoftID ?? "");
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

      <Dialog open={changeUbisoftIDOpen} onOpenChange={setChangeUbisoftIDOpen}>
        <DialogContent>
          <DialogTitle>
            {changeUbisoftIDUser?.ubisoftID ? "Change" : "Add"} Ubisoft ID
          </DialogTitle>
          <DialogDescription>
            {changeUbisoftIDUser?.ubisoftID
              ? "Change the Ubisoft ID associated with this account."
              : "Add a Ubisoft ID to associate with this account."}
          </DialogDescription>
          <div className="space-y-1">
            <Label htmlFor="member-ubisoft-id-input">Username</Label>
            <Input
              id="member-ubisoft-id-input"
              value={newUbisoftID}
              onChange={(e) => {
                setNewUbisoftID(e.target.value);
                setNewUbisoftIDValid(null);
              }}
              placeholder="Ubisoft ID"
            />
          </div>
          <div className="flex justify-center items-center gap-4">
            <div className="border border-dashed border-border rounded-md mt-2">
              <UbisoftAvatar ubisoftID={newUbisoftID} className="size-16" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  {newUbisoftID && newUbisoftIDValid === null && (
                    <Skeleton className="size-5 mt-2" />
                  )}
                  {newUbisoftID && newUbisoftIDValid === true && (
                    <Check className="text-green-400 size-5 mt-2" />
                  )}
                  {newUbisoftID && newUbisoftIDValid === false && (
                    <X className="text-destructive size-5 mt-2" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>
                  {newUbisoftID &&
                    newUbisoftIDValid === null &&
                    "Checking Ubisoft profile..."}
                  {newUbisoftID &&
                    newUbisoftIDValid === true &&
                    "Ubisoft profile found"}
                  {newUbisoftID &&
                    newUbisoftIDValid === false &&
                    "Ubisoft profile not found (User could have no profile picture)"}
                </span>
              </TooltipContent>
            </Tooltip>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangeUbisoftIDOpen(false)}
            >
              <X /> Cancel
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (changeUbisoftIDUser) {
                  await changeUbisoftID(newUbisoftID, changeUbisoftIDUser.id);
                  setChangeUbisoftIDOpen(false);
                }
              }}
              disabled={
                !changeUbisoftIDUser ||
                changeUbisoftIDUser.ubisoftID === newUbisoftID ||
                !newUbisoftID.trim()
              }
            >
              <Check /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
