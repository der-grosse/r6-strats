"use client";
import { Separator } from "@/components/ui/separator";
import { Fragment, useEffect, useMemo, useState } from "react";
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
import TeamPlayerPositionsItem from "./TeamPlayerPositionsItem";
import { changePlayerPositionsIndex } from "@/src/auth/team";

export interface TeamPlayerPositionsListProps {
  team: Team;
  canEdit: boolean;
}

export default function TeamPlayerPositionsList(
  props: TeamPlayerPositionsListProps
) {
  const [optimisticPositions, setOptimisticPositions] = useState(
    props.team.playerPositions
  );
  useEffect(() => {
    setOptimisticPositions(props.team.playerPositions);
  }, [props.team.playerPositions]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = optimisticPositions.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = optimisticPositions.findIndex(
        (item) => item.id === over?.id
      );

      // Optimistically update the UI
      const newPositions = arrayMove(
        optimisticPositions,
        oldIndex,
        newIndex
      ).map((item, index) => ({
        ...item,
        index,
      }));
      setOptimisticPositions(newPositions);

      const changedPositions = newPositions.filter((p) => {
        const oldPosition = props.team.playerPositions.find(
          (old) => old.id === p.id
        );
        if (!oldPosition) return false;
        return oldPosition.index !== p.index;
      });

      try {
        await changePlayerPositionsIndex(
          changedPositions.map((p) => ({
            id: p.id,
            index: p.index,
          }))
        );
      } catch (error) {
        console.error("Error updating member positions:", error);
        // Revert optimistic update on error
        setOptimisticPositions(optimisticPositions);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={optimisticPositions.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {optimisticPositions.map((position, i) => (
            <Fragment key={position.id}>
              <TeamPlayerPositionsItem
                canEdit={props.canEdit}
                position={position}
                team={props.team}
              />
              {i < props.team.playerPositions.length - 1 && <Separator />}
            </Fragment>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
