import { ColorButton, DEFAULT_COLORS } from "@/components/ColorPickerDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { demoteFromAdmin, promoteToAdmin, removeMember } from "@/src/auth/team";
import {
  Edit2,
  Lock,
  MoreVertical,
  Shield,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export interface TeamMemberItemProps {
  user: JWTPayload | null;
  member: TeamMember;
  onChangeColor: () => void;
  onChangeUsername: () => void;
  onChangePassword: () => void;
}

export default function TeamMemberItem({
  member,
  onChangeColor,
  user,
  onChangeUsername,
  onChangePassword,
}: TeamMemberItemProps) {
  return (
    <TableRow key={member.id}>
      <TableCell className="w-[50px]">
        <ColorButton
          size="small"
          color={member.defaultColor ?? DEFAULT_COLORS.at(-1)}
          onClick={() => {
            onChangeColor();
          }}
          disabled={member.id !== user?.id && !user?.isAdmin}
        />
      </TableCell>
      <TableCell>
        {member.name}
        {user?.id === member.id && (
          <span className="ml-2 text-muted-foreground text-sm">(You)</span>
        )}
      </TableCell>
      <TableCell>{member.isAdmin ? "Admin" : "Member"}</TableCell>
      <TableCell>
        {new Date(member.createdAt).toLocaleDateString("de-DE", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}
      </TableCell>
      <TableCell>
        <DropdownMenu modal>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={user?.id !== member.id && !user?.isAdmin}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right">
            {member.id === user?.id && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    onChangeUsername();
                  }}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Change Username
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onChangePassword();
                  }}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </DropdownMenuItem>
              </>
            )}
            {user?.isAdmin && member.id !== user?.id && (
              <>
                {!member.isAdmin ? (
                  <DropdownMenuItem
                    onClick={() => handlePromoteToAdmin(member.id)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Promote to Admin
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => handleDemoteFromAdmin(member.id)}
                  >
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Demote from Admin
                  </DropdownMenuItem>
                )}
              </>
            )}
            {user?.isAdmin && !member.isAdmin && (
              <DropdownMenuItem
                onClick={() => handleRemoveUser(member.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

const handleRemoveUser = async (userID: number) => {
  try {
    await removeMember(userID);
    toast.success("User removed successfully");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to remove user");
  }
};

const handlePromoteToAdmin = async (userID: number) => {
  try {
    await promoteToAdmin(userID);
    toast.success("User promoted to admin successfully");
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : "Failed to promote user to admin"
    );
  }
};

const handleDemoteFromAdmin = async (userID: number) => {
  try {
    await demoteFromAdmin(userID);
    toast.success("User demoted from admin successfully");
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : "Failed to demote user from admin"
    );
  }
};
