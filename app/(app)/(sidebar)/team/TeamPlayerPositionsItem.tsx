import { ColorButton } from "@/components/ColorPickerDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { setMemberPosition, setMemberPositionName } from "@/src/auth/team";
import { ChevronRight, GripVertical } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

export interface TeamPlayerPositionsItemProps {
  position: PlayerPosition;
  canEdit: boolean;
  team: Team;
}

export default function TeamPlayerPositionsItem({
  canEdit,
  position,
  team,
}: TeamPlayerPositionsItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: position.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className="grid grid-cols-[auto_auto_1fr] gap-2"
      ref={setNodeRef}
      style={style}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400 py-2 box-content" />
      </div>

      {canEdit ? (
        <>
          <Input
            defaultValue={position.positionName ?? ""}
            onBlur={(e) => {
              if (e.target.value !== position.positionName)
                setMemberPositionName(position.id, e.target.value);
            }}
          />
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  {(() => {
                    const member = team.members.find(
                      (m) => m.id === position.playerID
                    );
                    if (!member) return <em>Select player</em>;
                    return (
                      <>
                        <ColorButton
                          component="span"
                          color={member.defaultColor}
                          size="small"
                        />
                        {member.name}
                      </>
                    );
                  })()}
                  <ChevronRight className="ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" className="w-56">
                <DropdownMenuItem
                  key="clear"
                  onClick={() => setMemberPosition(position.id, null)}
                >
                  <em>Clear</em>
                </DropdownMenuItem>
                {team.members.map((member) => (
                  <DropdownMenuItem
                    key={member.name}
                    onClick={() => setMemberPosition(position.id, member.id)}
                  >
                    <ColorButton
                      component="span"
                      color={member.defaultColor}
                      size="small"
                    />
                    {member.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      ) : (
        <>
          <span className="min-w-48">{position.positionName}</span>
          <span>
            {(() => {
              const member = team.members.find(
                (m) => m.id === position.playerID
              );
              if (!member) return <em>Unassigned</em>;
              return (
                <>
                  <ColorButton
                    component="span"
                    color={member.defaultColor}
                    size="small"
                    className="inline-block align-sub mr-1"
                  />
                  {member.name}
                </>
              );
            })()}
          </span>
        </>
      )}
    </div>
  );
}
