import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PLAYER_COUNT } from "@/src/static/general";
import { useMemo } from "react";
import StratPositionItem from "./StratPositionItem";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface StratEditorPlayerPositionsSidebarProps {
  strat: Pick<Strat, "positions" | "id">;
  team: Team;
}

export default function StratEditorPlayerPositionsSidebar({
  strat: { positions, id: stratID },
  team,
}: StratEditorPlayerPositionsSidebarProps) {
  const sortedPositions = useMemo(
    () =>
      positions
        .map((data) => ({
          data,
          position: team.playerPositions.find(
            (pos) => pos.id === data.positionID
          ),
        }))
        .sort((a, b) => {
          if (a.position && b.position) {
            return a.position.index - b.position.index;
          }
          return 0;
        })
        .map(({ data }) => data),
    [positions]
  );

  return (
    <ScrollArea className="h-screen">
      <div className="p-2 flex flex-col gap-4">
        <Label className="text-muted-foreground p-2 -mb-2">
          Player positions
        </Label>

        {sortedPositions.map((position) => (
          <StratPositionItem
            key={position.id}
            stratID={stratID}
            team={team}
            stratPosition={position}
            hasError={positions.some(
              (o) =>
                o.id !== position.id &&
                ((position.positionID &&
                  o.positionID === position.positionID) ||
                  (o.operators.length === 1 &&
                    position.operators.length === 1 &&
                    o.operators[0] === position.operators[0]))
            )}
          />
        ))}
        {team.members.length < PLAYER_COUNT && (
          <>
            <Separator />
            <div className="text-sm text-muted-foreground">
              {`It is strongly recommended to have ${PLAYER_COUNT} players in your team to be able to use all features properly.`}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
