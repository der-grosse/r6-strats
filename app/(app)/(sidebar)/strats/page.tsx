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
import { Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { useSocket } from "@/components/context/SocketContext";
import { setActive } from "@/src/strats/strats";
import { useRouter } from "next/navigation";
import { CreateStratDialog } from "./CreateStratDialog";

export default function StratsPage() {
  const { filteredStrats, isLeading, filter } = useFilter();
  const router = useRouter();
  const socket = useSocket();
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
          {filteredStrats.map((strat) => (
            <TableRow key={strat.id}>
              <TableCell>{strat.rotationIndex?.join(", ")}</TableCell>
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
                          ops.find((o) => !filter.bannedOPs.includes(o.name))
                            ?.name ?? ops[0]
                        }
                        className={
                          isPowerPosition ? undefined : "grayscale scale-75"
                        }
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer"
                  >
                    <Pencil />
                  </Button>
                </Link>
                <DeleteStratDialog stratId={strat.id} stratName={strat.name} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
