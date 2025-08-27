import DndList from "@/components/general/DndList";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { updateMapIndexes } from "@/src/strats/strats";
import { Pencil } from "lucide-react";
import Link from "next/link";

export interface SidebarStratsProps {
  strats: Strat[];
  onSelect: (strat: Strat) => void;
  showSite: boolean;
}

export default function SidebarStrats(props: SidebarStratsProps) {
  return (
    <div className="overflow-hidden">
      <DndList
        items={props.strats}
        onChange={(strats, oldIndex, newIndex) =>
          updateMapIndexes(
            props.strats[0].map,
            props.strats[oldIndex].id,
            oldIndex,
            newIndex
          )
        }
      >
        {(strat, rootProps, handle) => (
          <SidebarMenuItem {...rootProps} className="-ml-1">
            <SidebarMenuButton
              className="inline h-auto"
              onClick={() => props.onSelect(strat)}
            >
              <span className="inline-block align-text-bottom">{handle}</span>
              {!props.showSite ? (
                strat.name
              ) : (
                <>
                  <span>{strat.site}</span>
                  {strat.name && (
                    <>
                      <span className="mx-1">|</span>
                      <span className="text-muted-foreground">
                        {strat.name}
                      </span>
                    </>
                  )}
                </>
              )}
            </SidebarMenuButton>
            <Link href={`/editor/${strat.id}`}>
              <SidebarMenuAction className="cursor-pointer my-0.5">
                <Pencil />
              </SidebarMenuAction>
            </Link>
          </SidebarMenuItem>
        )}
      </DndList>
    </div>
  );
}
