import UbisoftAvatar from "@/components/general/UbisoftAvatar";
import useSaveDebounced from "@/components/hooks/useSaveDebounced";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { changeUbisoftID } from "@/src/auth/team";
import { checkUbisoftID } from "@/src/ubisoft/ubi";
import { Check, X } from "lucide-react";
import { useState } from "react";

export interface ChangeUbisoftIDDialogProps {
  open: boolean;
  onClose: () => void;
  member: TeamMember | null;
}

export default function ChangeUbisoftIDDialog(
  props: ChangeUbisoftIDDialogProps
) {
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
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent>
        <DialogTitle>
          {props.member?.ubisoftID ? "Change" : "Add"} Ubisoft ID
        </DialogTitle>
        <DialogDescription>
          {props.member?.ubisoftID
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
            <UbisoftAvatar ubisoftID={newUbisoftID} className="size-16 block" />
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
          <Button variant="outline" onClick={() => props.onClose()}>
            <X /> Cancel
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (props.member) {
                await changeUbisoftID(newUbisoftID, props.member.id);
                props.onClose();
              }
            }}
            disabled={
              !props.member ||
              props.member.ubisoftID === newUbisoftID ||
              !newUbisoftID.trim()
            }
          >
            <Check /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
