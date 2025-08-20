"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/components/context/UserContext";
import { useRef, useState } from "react";
import {
  removeMember,
  promoteToAdmin,
  demoteFromAdmin,
  changeUsername,
  changePassword,
  setMemberColor,
} from "@/src/auth/team";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Trash2,
  Shield,
  ShieldOff,
  Edit2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ColorPickerDialog, {
  DEFAULT_COLORS,
} from "@/components/ColorPickerDialog";
import TeamMemberList from "./TeamMemberList";

export interface TeamMembersProps {
  team: Team;
}

export default function TeamMembers(props: TeamMembersProps) {
  const { user } = useUser();
  const [isChangeUsernameOpen, setIsChangeUsernameOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const newUsernameRef = useRef<HTMLInputElement | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const newPasswordRef = useRef<HTMLInputElement | null>(null);

  const [userColorChangeOpen, setUserColorChangeOpen] = useState(false);
  const [userColorID, setUserColorID] = useState<number | null>(null);

  const handleChangeUsername = async () => {
    try {
      await changeUsername(newUsername);
      setIsChangeUsernameOpen(false);
      setNewUsername("");
      toast.success("Username changed successfully");
      window.location.reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change username"
      );
    }
  };

  const handleChangePassword = async () => {
    try {
      await changePassword(newPassword);
      setIsChangePasswordOpen(false);
      setNewPassword("");
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change password"
      );
    }
  };

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
            onChangePassword={() => {
              setIsChangePasswordOpen(true);
              setNewPassword("");
              requestAnimationFrame(() => {
                newPasswordRef.current?.focus();
              });
            }}
            onChangeUsername={(member) => {
              setIsChangeUsernameOpen(true);
              setNewUsername(member.name);
              requestAnimationFrame(() => {
                newUsernameRef.current?.focus();
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

      <Dialog
        open={isChangeUsernameOpen}
        onOpenChange={(open) => {
          setIsChangeUsernameOpen(open);
          if (!open)
            setTimeout(() => (document.body.style.pointerEvents = ""), 500);
        }}
      >
        <DialogContent className="w-auto">
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
            <DialogDescription>
              Enter your new username below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              ref={newUsernameRef}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleChangeUsername();
              }}
              placeholder="New username"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeUsernameOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeUsername}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isChangePasswordOpen}
        onOpenChange={(open) => {
          setIsChangePasswordOpen(open);
          if (!open)
            setTimeout(() => (document.body.style.pointerEvents = ""), 500);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              ref={newPasswordRef}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleChangePassword();
              }}
              placeholder="New password"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangePasswordOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
