"use client";
import { useFilter } from "@/components/context/FilterContext";
import { DeleteStratDialog } from "@/app/(app)/(sidebar)/strats/DeleteStratDialog";
import OperatorIcon from "@/components/general/OperatorIcon";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFENDERS } from "@/src/static/operator";
import { Eye, GripVertical, Pencil } from "lucide-react";
import Link from "next/link";
import { useSocket } from "@/components/context/SocketContext";
import { setActive, updateMapIndexes } from "@/src/strats/strats";
import { useRouter } from "next/navigation";
import { CreateStratDialog } from "./CreateStratDialog";
import { Fragment, useEffect, useMemo, useState } from "react";
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
import { cn } from "@/src/utils";

export default function StratsPage() {
  const { filteredStrats } = useFilter();
  const [mapDragging, setMapDragging] = useState<string | null>(null);

  const stratsByMap = useMemo(
    () =>
      Object.entries(
        filteredStrats.reduce((acc, strat) => {
          if (!acc[strat.map]) {
            acc[strat.map] = [];
          }
          acc[strat.map].push(strat);
          return acc;
        }, {} as Record<string, typeof filteredStrats>)
      ),
    [filteredStrats]
  );

  return (
    <div className="w-full h-full p-4 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-1 items-center">
        <div />
        <p className="text-center text-muted-foreground leading-none">
          All Strats
          <br />
          <span className="text-xs leading-none">
            (total {filteredStrats.length})
          </span>
        </p>
        <div className="flex justify-end">
          <CreateStratDialog />
        </div>
      </div>
      <Table className="mb-2">
        {/* mb-2 needed to prevent overflow of table component due to -my-2 used in table cells */}
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Map</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Operators</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stratsByMap.flatMap(([map, strats]) => (
            <MapStrat
              key={map}
              strats={strats}
              map={map}
              onDragChange={(dragging) => setMapDragging(dragging ? map : null)}
              disabled={mapDragging !== null && mapDragging !== map}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MapStrat({
  strats,
  map,
  onDragChange,
  disabled,
}: {
  strats: Strat[];
  map: string;
  onDragChange: (dragging: boolean) => void;
  disabled: boolean;
}) {
  const [optimisticStrats, setOptimisticStrats] = useState(strats);
  useEffect(() => {
    setOptimisticStrats(strats);
  }, [strats]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    onDragChange(false);

    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = optimisticStrats.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = optimisticStrats.findIndex(
        (item) => item.id === over?.id
      );

      // Optimistically update the UI
      const newStrats = arrayMove(optimisticStrats, oldIndex, newIndex);
      setOptimisticStrats(
        newStrats.map((strat, i) => ({
          ...strat,
          mapIndex: i,
        }))
      );

      try {
        await updateMapIndexes(map, active.id as number, oldIndex, newIndex);
      } catch (error) {
        console.error("Error updating member positions:", error);
        // Revert optimistic update on error
        setOptimisticStrats(optimisticStrats);
      }
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={() => onDragChange(true)}
        onDragCancel={() => onDragChange(false)}
      >
        <SortableContext
          items={optimisticStrats.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {optimisticStrats.map((strat) => (
            <StratItem key={strat.id} strat={strat} disabled={disabled} />
          ))}
        </SortableContext>
      </DndContext>
    </>
  );
}

function StratItem({ strat, disabled }: { strat: Strat; disabled: boolean }) {
  const { isLeading, bannedOps } = useFilter();
  const router = useRouter();
  const socket = useSocket();

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: strat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      key={strat.id}
      ref={setNodeRef}
      style={style}
      className={cn({ "opacity-25": disabled })}
    >
      <TableCell>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-gray-400 py-2 box-content" />
        </div>
      </TableCell>
      <TableCell>{strat.map}</TableCell>
      <TableCell>{strat.site}</TableCell>
      <TableCell>{strat.name}</TableCell>
      <TableCell>
        <div className="flex gap-1 -my-2">
          {strat.positions
            .map((position) => ({
              ops: DEFENDERS.filter((o) =>
                position.operators.some((op) => op.operator === o.name)
              ),
              isPowerPosition: position.isPowerPosition,
              id: position.id,
            }))
            .filter(({ ops }) => ops.length)
            .sort((a, b) => {
              if (a.isPowerPosition && !b.isPowerPosition) return -1;
              if (!a.isPowerPosition && b.isPowerPosition) return 1;
              return 0;
            })
            .map(({ ops, isPowerPosition, id }) => (
              <OperatorIcon
                key={id}
                op={
                  ops.find((o) => !bannedOps.includes(o.name))?.name ?? ops[0]
                }
                className={isPowerPosition ? undefined : "grayscale scale-75"}
              />
            ))}
        </div>
      </TableCell>
      <TableCell className="flex gap-1 -my-2">
        {(() => {
          const button = (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer"
              onClick={async () => {
                if (isLeading) {
                  await setActive(strat.id);
                  socket.emit("active-strat:change", strat);
                  router.push("/");
                }
              }}
            >
              <Eye />
            </Button>
          );
          if (isLeading) {
            return button;
          } else {
            return <Link href={`/strat/${strat.id}`}>{button}</Link>;
          }
        })()}
        <Link href={`/editor/${strat.id}`}>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <Pencil />
          </Button>
        </Link>
        <DeleteStratDialog stratId={strat.id} stratName={strat.name} />
      </TableCell>
    </TableRow>
  );
}
