import OperatorIcon from "@/components/OperatorIcon";
import OperatorPicker from "@/components/OperatorPicker";
import PlayerPositionPicker from "@/components/PlayerPositionPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { updatePickedOperator } from "@/src/strats/strats";
import { cn } from "@/src/utils";
import { GripVertical, Plus, X, Zap, ZapOff } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { useEffect } from "react";

export interface StratPositionItemProps {
  stratID: Strat["id"];
  team: Team;
  stratPosition: StratPositions;
  hasError?: boolean;
}

export default function StratPositionItem({
  stratID,
  team,
  stratPosition,
  hasError,
}: StratPositionItemProps) {
  const [optimisticOps, setOptimisticOps] = useState(
    stratPosition.operators.map((op, i) => ({ op, i }))
  );
  useEffect(() => {
    setOptimisticOps(stratPosition.operators.map((op, i) => ({ op, i })));
  }, [stratPosition.operators]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = optimisticOps.findIndex((item) => item.i === active.id);
      const newIndex = optimisticOps.findIndex((item) => item.i === over?.id);

      // Optimistically update the UI
      const newPositions = arrayMove(optimisticOps, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          index,
        })
      );
      setOptimisticOps(newPositions);

      try {
        await updatePickedOperator(stratID, {
          id: stratPosition.id,
          operators: newPositions.map((item) => item.op),
        });
      } catch (error) {
        console.error("Error updating member positions:", error);
        // Revert optimistic update on error
        setOptimisticOps(optimisticOps);
      }
    }
  };

  return (
    <Card className="p-2 gap-0">
      <CardHeader className="p-0">
        <div
          className={cn(
            "flex items-center gap-2 w-full",
            hasError && "outline-2 outline-destructive rounded-md"
          )}
        >
          <PlayerPositionPicker
            className="flex-1 px-2"
            popoverOffset={56} // adjust popover to not cover operator icon and isPowerOp button
            positionID={stratPosition.positionID}
            team={team}
            onChange={(positionID) => {
              updatePickedOperator(stratID, {
                id: stratPosition.id,
                positionID,
              });
            }}
          />
          {/* <div className="flex-1" /> */}
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  stratPosition.isPowerPosition
                    ? "text-primary"
                    : "text-muted-foreground/50"
                )}
                onClick={() =>
                  updatePickedOperator(stratID, {
                    id: stratPosition.id,
                    isPowerPosition: !stratPosition.isPowerPosition,
                  })
                }
              >
                {stratPosition.isPowerPosition ? <Zap /> : <ZapOff />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-sm">
                {stratPosition.isPowerPosition
                  ? "Remove from power positions"
                  : "Set as power position"}
              </p>
              <p className="text-xs text-muted-foreground">
                Power positions are essential to a strat. If this position is
                not playable due to operator bans, the strat is not viable
                anymore.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="px-0 mt-1 -mb-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={optimisticOps.map((item) => item.i)}
            strategy={verticalListSortingStrategy}
          >
            {optimisticOps.map(({ op, i }) => (
              <OperatorItem
                key={i}
                index={i}
                op={op}
                otherOps={optimisticOps
                  .filter((_, j) => j !== i)
                  .map(({ op }) => op)}
                onDelete={() => {
                  const newOps = [...stratPosition.operators];
                  newOps.splice(i, 1);
                  updatePickedOperator(stratID, {
                    id: stratPosition.id,
                    operators: newOps,
                  });
                  setOptimisticOps(newOps.map((op, i) => ({ op, i })));
                }}
                onChange={(op) => {
                  const newOps = [...stratPosition.operators];
                  newOps[i] = op;
                  updatePickedOperator(stratID, {
                    id: stratPosition.id,
                    operators: newOps,
                  });
                  setOptimisticOps(newOps.map((op, i) => ({ op, i })));
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div className="flex">
          <OperatorPicker
            closeOnSelect
            selected={null}
            onChange={(op) => {
              if (!op) return;
              updatePickedOperator(stratID, {
                id: stratPosition.id,
                operators: stratPosition.operators.concat(op),
              });
              setOptimisticOps((prev) => [
                ...prev,
                {
                  op,
                  i: prev.length, // new index is the end of the list
                },
              ]);
            }}
            trigger={({ children, ...props }) => (
              <Button
                {...props}
                variant="ghost"
                className="px-3 w-full text-left justify-start text-muted-foreground"
              >
                <Plus className="size-4 mr-1" />
                Add Operator
              </Button>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function OperatorItem({
  index,
  op,
  onDelete,
  onChange,
  otherOps,
}: {
  index: number;
  op: string;
  onDelete: () => void;
  onChange: (op: string) => void;
  otherOps: string[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex px-3">
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400 py-2 box-content" />
      </div>
      <OperatorPicker
        closeOnSelect
        selected={op}
        hideOps={otherOps}
        onChange={(op) => {
          if (!op) onDelete();
          else onChange(op);
        }}
        trigger={({ children, ...props }) => (
          <Button
            {...props}
            variant="ghost"
            className="px-1 w-full text-left justify-start"
          >
            <OperatorIcon op={op} />
            {op}
            <div className="flex-1" />
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <span role="button">
                <X />
              </span>
            </Button>
          </Button>
        )}
      />
    </div>
  );
}
