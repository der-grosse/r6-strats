import OperatorIcon from "@/components/general/OperatorIcon";
import OperatorPicker from "@/components/general/OperatorPicker";
import TeamPositionPicker from "@/components/general/PlayerPositionPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
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
import { forwardRef, useState } from "react";
import { useEffect } from "react";
import Shotgun from "../assets/Shotgun";
import SecondaryGadgetPicker from "@/components/general/SecondaryGadgetPicker";
import { DEFENDERS, DefenderSecondaryGadget } from "@/lib/static/operator";
import { PickedOperator, Strat, StratPositions } from "@/lib/types/strat.types";
import { FullTeam } from "@/lib/types/team.types";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface StratPositionItemProps {
  stratID: Strat["_id"];
  team: FullTeam;
  stratPosition: StratPositions;
  hasError?: boolean;
}

export default function StratPositionItem({
  stratID,
  team,
  stratPosition,
  hasError,
}: StratPositionItemProps) {
  const updateStratPosition = useMutation(api.strats.updateStratPosition);
  const updatePickedOperator = useMutation(api.strats.updatePickedOperator);

  const [optimisticOps, setOptimisticOps] = useState(
    stratPosition.pickedOperators.map((op, i) => ({ op, i }))
  );
  useEffect(() => {
    setOptimisticOps(stratPosition.pickedOperators.map((op, i) => ({ op, i })));
  }, [stratPosition.pickedOperators]);

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
        await updatePickedOperatorIndex(stratID, {
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
      <CardHeader className="p-0 w-full">
        <div
          className={cn(
            "flex items-center w-full overflow-hidden",
            hasError && "outline-2 outline-destructive rounded-md"
          )}
        >
          <TeamPositionPicker
            className="flex-1 px-2 overflow-hidden truncate w-[calc(100%_-_var(--spacing)_*_12)]"
            popoverOffset={88}
            teamPositionID={stratPosition.teamPositionID}
            team={team}
            onChange={(teamPositionID) => {
              updateStratPosition({
                _id: stratPosition._id,
                teamPositionID,
              });
            }}
          />
          {/* rotation duties */}
          <Tooltip delayDuration={1000}>
            <TooltipTrigger className="size-9">
              <ShotgunToggle
                shouldBringShotgun={stratPosition.shouldBringShotgun}
                stratPositionID={stratPosition._id}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-sm">Shotgun for rotates</p>
              <p className="text-xs text-muted-foreground">
                Indicate wether this role needs to bring a shotgun to make
                rotates, headholes or similar.
              </p>
            </TooltipContent>
          </Tooltip>
          {/* power position */}
          <Tooltip delayDuration={1000}>
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
                  updateStratPosition({
                    _id: stratPosition._id,
                    isPowerPosition: !stratPosition.isPowerPosition,
                  })
                }
              >
                {stratPosition.isPowerPosition ? <Zap /> : <ZapOff />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
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
                  .map(({ op }) => op.operator)}
                onDelete={() => {
                  const newOps = [...stratPosition.pickedOperators];
                  newOps.splice(i, 1);
                  updatePickedOperator(stratID, {
                    id: stratPosition._id,
                    operators: newOps,
                  });
                  setOptimisticOps(newOps.map((op, i) => ({ op, i })));
                }}
                onChange={(op) => {
                  const newOps = [...stratPosition.pickedOperators];
                  newOps[i] = op;
                  updatePickedOperator(stratID, {
                    id: stratPosition._id,
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
                id: stratPosition._id,
                operators: [
                  ...stratPosition.pickedOperators,
                  {
                    operator: op,
                    secondaryGadget: null,
                    tertiaryGadget: null,
                  },
                ],
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
  op: PickedOperator;
  onDelete: () => void;
  onChange: (pickedOperator: PickedOperator) => void;
  otherOps: string[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasTertiaryGadget =
    "tertiaryGadgets" in
    (DEFENDERS.find((def) => def.name === op.operator) || {});

  return (
    <div ref={setNodeRef} style={style} className="flex pl-3">
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400 py-2 box-content" />
      </div>
      <OperatorPicker
        popoverOffset={80}
        closeOnSelect
        selected={op.operator}
        hideOps={otherOps}
        onChange={(newOp) => {
          if (!newOp) onDelete();
          else {
            const hasNewOpTertiary =
              "tertiaryGadgets" in
              (DEFENDERS.find((def) => def.name === newOp) || {});
            onChange({
              operator: newOp,
              secondaryGadget: op.secondaryGadget,
              tertiaryGadget: hasNewOpTertiary ? op.tertiaryGadget : undefined,
              _id: op._id,
              index: op.index,
              stratPositionID: op.stratPositionID,
            });
          }
        }}
        trigger={({ children, ...props }) => (
          <Button
            {...props}
            variant="ghost"
            className="px-1 flex-1 text-left justify-start"
          >
            <OperatorIcon op={op.operator} />
            {op.operator}
            <div className="flex-1" />
          </Button>
        )}
      />
      <SecondaryGadgetPicker
        onChange={(gadget) =>
          onChange({
            operator: op.operator,
            secondaryGadget: gadget,
            tertiaryGadget: op.tertiaryGadget,
            _id: op._id,
            index: op.index,
            stratPositionID: op.stratPositionID,
          })
        }
        selected={op.secondaryGadget as DefenderSecondaryGadget | undefined}
        popoverOffset={52}
        closeOnSelect
        onlyShowIcon
        showGadgetOfOperators={[op.operator]}
        slotProps={{
          icon: {
            className: "size-6",
          },
        }}
        trigger={(props) => (
          <Button
            {...props}
            variant="ghost"
            size="icon"
            className="text-muted-foreground -ml-2 gap-1"
          />
        )}
      />
      {hasTertiaryGadget && (
        <SecondaryGadgetPicker
          onChange={(gadget) =>
            onChange({
              operator: op.operator,
              secondaryGadget: op.secondaryGadget,
              tertiaryGadget: gadget,
              _id: op._id,
              index: op.index,
              stratPositionID: op.stratPositionID,
            })
          }
          selected={op.tertiaryGadget as DefenderSecondaryGadget | undefined}
          popoverOffset={52}
          closeOnSelect
          onlyShowIcon
          showGadgetOfOperators={[op.operator]}
          slotProps={{
            icon: {
              className: "size-6",
            },
          }}
          trigger={(props) => (
            <Button
              {...props}
              variant="ghost"
              size="icon"
              className="text-muted-foreground -ml-2 gap-1"
            />
          )}
        />
      )}
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        onClick={() => onDelete()}
      >
        <span role="button">
          <X />
        </span>
      </Button>
    </div>
  );
}

const ShotgunToggle = forwardRef<
  HTMLButtonElement,
  {
    shouldBringShotgun: boolean;
    stratPositionID: Id<"stratPositions">;
  }
>(({ shouldBringShotgun, stratPositionID }, ref) => {
  const updateStratPosition = useMutation(api.strats.updateStratPosition);
  return (
    <Button
      ref={ref}
      size="icon"
      variant="ghost"
      onClick={() => {
        updateStratPosition({
          _id: stratPositionID,
          shouldBringShotgun: !shouldBringShotgun,
        });
      }}
      asChild
    >
      <span>
        <Shotgun
          className={cn(
            "size-8 -mx-1 -my-2",
            !shouldBringShotgun && "text-muted-foreground/50"
          )}
        />
      </span>
    </Button>
  );
});
