import { useUser } from "@/components/context/UserContext";
import { ColorButton } from "@/components/general/ColorPickerDialog";
import UbisoftAvatar from "@/components/general/UbisoftAvatar";
import Ubisoft from "@/components/icons/ubisoft";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  changeUbisoftID,
  demoteFromAdmin,
  promoteToAdmin,
  removeMember,
} from "@/lib/auth/team";
import { DEFAULT_COLORS } from "@/lib/static/colors";
import { MoreVertical, Shield, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface TeamMemberItemProps {
  member: TeamMember;
  onChangeColor: () => void;
  onChangeUbisoftID?: () => void;
}

export default function TeamMemberItem({
  member,
  onChangeColor,
  onChangeUbisoftID,
}: TeamMemberItemProps) {
  const { user } = useUser();
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
          className="align-middle m-auto"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center h-full align-middle">
          {member.ubisoftID && (
            <Tooltip>
              <TooltipTrigger className="mr-2 size-8">
                <UbisoftAvatar
                  ubisoftID={member.ubisoftID}
                  className="size-8"
                  showUbisoftIndex
                />
              </TooltipTrigger>
              <TooltipContent>
                <span>Ubisoft ID provided: {member.ubisoftID}</span>
              </TooltipContent>
            </Tooltip>
          )}
          {member.name}
          {user?.id === member.id && (
            <span className="ml-2 text-muted-foreground text-sm">(You)</span>
          )}
        </div>
      </TableCell>
      <TableCell>{member.isAdmin ? "Admin" : "Member"}</TableCell>
      <TableCell>
        {new Date(member.createdAt).toLocaleDateString("de-DE", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}
      </TableCell>
      {user?.isAdmin && (
        <TableCell>
          {member.id !== user?.id ? (
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
                <DropdownMenuItem onClick={onChangeUbisoftID}>
                  <Ubisoft className="mr-2 h-4 w-4" />
                  {member.ubisoftID ? "Update Ubisoft ID" : "Add Ubisoft ID"}
                </DropdownMenuItem>
                {member.ubisoftID && (
                  <DropdownMenuItem
                    onClick={() => changeUbisoftID("", member.id)}
                    className="text-destructive"
                  >
                    <div className="relative mr-2">
                      <Trash2 className="h-4 w-4" />
                      <Ubisoft className="absolute -right-1 -bottom-1 h-3 w-3" />
                    </div>
                    Remove Ubisoft ID
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
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
                {!member.isAdmin && (
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
          ) : (
            // Placeholder to keep the cell height
            <Button
              variant="ghost"
              size="icon"
              className="invisible pointer-events-none"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </TableCell>
      )}
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
