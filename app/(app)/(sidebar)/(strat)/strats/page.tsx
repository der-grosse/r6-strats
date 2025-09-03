"use client";
import { useFilter } from "@/components/context/FilterContext";
import OperatorIcon from "@/components/general/OperatorIcon";
import { Button } from "@/components/ui/button";
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
import { DeleteStratDialog } from "./DeleteStratDialog";

const TABLE_SIZES = {
  handle: "5%",
  map: "10%",
  site: "15%",
  name: "35%",
  ops: "20%",
  actions: "15%",
};

export default function StratsPage() {
  const { availableStrats } = useFilter();
  const [mapDragging, setMapDragging] = useState<string | null>(null);

  const stratsByMap = useMemo(
    () =>
      Object.entries(
        availableStrats.reduce((acc, strat) => {
          if (!acc[strat.strat.map]) {
            acc[strat.strat.map] = [];
          }
          acc[strat.strat.map].push(strat);
          return acc;
        }, {} as Record<string, typeof availableStrats>)
      ),
    [availableStrats]
  );

  return (
    <div className="w-full h-full p-4 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-1 items-center">
        <div />
        <p className="text-center text-muted-foreground leading-none">
          All Strats
          <br />
          <span className="text-xs leading-none">
            (total {availableStrats.length})
          </span>
        </p>
        <div className="flex justify-end">
          <CreateStratDialog />
        </div>
      </div>
      <div
        className="mb-2 flex flex-col"
        style={{ gridTemplateColumns: "auto auto auto auto auto auto" }}
      >
        {/* mb-2 needed to prevent overflow of table component due to -my-2 used in table cells */}
        <div className="w-full flex py-2 border-b border-border border-collapse">
          <div style={{ width: TABLE_SIZES.handle }}></div>
          <div className="font-bold" style={{ width: TABLE_SIZES.map }}>
            Map
          </div>
          <div className="font-bold" style={{ width: TABLE_SIZES.site }}>
            Site
          </div>
          <div className="font-bold" style={{ width: TABLE_SIZES.name }}>
            Name
          </div>
          <div className="font-bold pl-1" style={{ width: TABLE_SIZES.ops }}>
            Operators
          </div>
          <div
            className="font-bold pl-2"
            style={{ width: TABLE_SIZES.actions }}
          >
            Actions
          </div>
        </div>
        {stratsByMap.flatMap(([map, strats]) => (
          <MapStrat
            key={map}
            strats={strats}
            map={map}
            onDragChange={(dragging) => setMapDragging(dragging ? map : null)}
            disabled={mapDragging !== null && mapDragging !== map}
          />
        ))}
      </div>
    </div>
  );
}

function MapStrat({
  strats,
  map,
  onDragChange,
  disabled,
}: {
  strats: { strat: Strat; playable: boolean }[];
  map: string;
  onDragChange: (dragging: boolean) => void;
  disabled: boolean;
}) {
  const { filter } = useFilter();
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
        (item) => item.strat.id === active.id
      );
      const newIndex = optimisticStrats.findIndex(
        (item) => item.strat.id === over?.id
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={() => onDragChange(true)}
      onDragCancel={() => onDragChange(false)}
    >
      <SortableContext
        items={optimisticStrats.map((item) => item.strat.id)}
        strategy={verticalListSortingStrategy}
      >
        {optimisticStrats.map((strat, i) => (
          <StratItem
            key={strat.strat.id}
            strat={strat.strat}
            disabled={disabled || !strat.playable}
            highlightMap={i === 0 && !filter.map}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function StratItem({
  strat,
  disabled,
  highlightMap,
}: {
  strat: Strat;
  disabled: boolean;
  highlightMap: boolean;
}) {
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
    <div
      key={strat.id}
      ref={setNodeRef}
      style={style}
      className={cn(
        { "opacity-25": disabled },
        "flex items-center hover:bg-muted/50 py-2 border-y border-border border-collapse font-medium"
      )}
    >
      <div style={{ width: TABLE_SIZES.handle }} className="pl-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      <div
        style={{ width: TABLE_SIZES.map }}
        className={cn(!highlightMap && "text-muted-foreground/50")}
      >
        {strat.map}
      </div>
      <div style={{ width: TABLE_SIZES.site }}>{strat.site}</div>
      <div style={{ width: TABLE_SIZES.name }}>{strat.name}</div>
      <div
        style={{ width: TABLE_SIZES.ops }}
        className="flex gap-1 -my-2 overflow-hidden"
      >
        {strat.positions
          .map((position) => ({
            ops: position.operators
              .map((op) => DEFENDERS.find((def) => def.name === op.operator)!)
              .filter(Boolean),
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
              op={ops.find((o) => !bannedOps.includes(o.name))?.name ?? ops[0]}
              className={isPowerPosition ? undefined : "grayscale scale-75"}
            />
          ))}
      </div>
      <div className="flex gap-1 -my-2" style={{ width: TABLE_SIZES.actions }}>
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
      </div>
    </div>
  );
}
