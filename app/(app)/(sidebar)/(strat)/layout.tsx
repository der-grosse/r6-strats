"use client";
import MapSelector from "@/components/general/MapSelector";
import OperatorPicker from "@/components/general/OperatorPicker";
import SiteSelector from "@/components/general/SiteSelector";
import { Fill } from "@/components/layout/Fill";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  CircleSlash,
  Crown,
  Eye,
  MapPinned,
  X,
} from "lucide-react";
import SidebarStrats from "./SidebarStrats";
import { useRouter } from "next/navigation";
import { useFilter } from "@/components/context/FilterContext";
import { setActive } from "@/src/strats/strats";
import { useSocket } from "@/components/context/SocketContext";
import { cn } from "@/src/utils";

export default function StratsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const socket = useSocket();
  const {
    filter,
    setFilter,
    bannedOps,
    setBannedOps,
    playableStrats: filteredStrats,
    isLeading,
    setIsLeading,
  } = useFilter();

  return (
    <>
      {children}
      <Fill slot="sidebar-content">
        <Collapsible defaultOpen className="group/strats">
          <SidebarGroup className="pl-0">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="cursor-pointer">
                <MapPinned className="mr-2" />
                Strats
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/strats:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                {/* filter */}
                <SidebarMenu>
                  {/* map selection */}
                  <SidebarMenuItem>
                    <MapSelector
                      map={filter.map}
                      onChange={(map) => {
                        if (!map) {
                          setFilter({
                            ...filter,
                            map: null,
                            site: null,
                          });
                        } else {
                          setFilter((filter) => ({
                            ...filter,
                            map: map.name,
                            site: filter.map === map.name ? filter.site : null,
                          }));
                        }
                      }}
                      trigger={SidebarMenuButton}
                    />
                  </SidebarMenuItem>
                  {/* site selection */}
                  <SidebarMenuItem>
                    <SiteSelector
                      map={filter.map}
                      site={filter.site}
                      onChange={(site) =>
                        setFilter({
                          ...filter,
                          site,
                        })
                      }
                      trigger={SidebarMenuButton}
                    />
                  </SidebarMenuItem>
                  {/* banned OPs selector */}
                  <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <OperatorPicker
                            disabled={!isLeading}
                            multiple
                            selected={bannedOps}
                            onChange={(bannedOps) => setBannedOps(bannedOps)}
                            trigger={SidebarMenuButton}
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="text-sm">Select operators to ban</p>
                        <p className="text-xs text-muted-foreground">
                          Can only be selected while leading active strat
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                </SidebarMenu>
                <div className="pr-2">
                  <SidebarSeparator />
                </div>
                {/* filtered strats result */}
                <SidebarMenu>
                  {filter.map ? (
                    <SidebarStrats
                      strats={filteredStrats}
                      onSelect={async (strat) => {
                        if (isLeading) {
                          await setActive(strat.id);
                          socket.emit("active-strat:change", strat);
                          if (window.location.pathname !== "/") {
                            router.push("/");
                          }
                        } else {
                          router.push(`/strat/${strat.id}`);
                        }
                      }}
                      showSite={!filter.site}
                    />
                  ) : null}
                  {filter.map && filteredStrats.length === 0 && (
                    <SidebarMenuItem className="text-muted-foreground">
                      <SidebarMenuButton disabled>
                        No strats found
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {!filter.map && (
                    <SidebarMenuItem className="text-muted-foreground">
                      <SidebarMenuButton disabled>
                        <CircleSlash />
                        No map selected
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </Fill>
      <Fill slot="sidebar-footer">
        <SidebarMenu>
          <SidebarMenuItem>
            <Tooltip delayDuration={750}>
              <TooltipTrigger asChild>
                <SidebarMenuButton onClick={() => setIsLeading(!isLeading)}>
                  {isLeading ? <Crown /> : <Eye />}
                  {isLeading
                    ? "Leading active strat"
                    : "Not leading active strat"}
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-sm">Lead active strat</p>
                <p className="text-xs text-muted-foreground">
                  When this option is selected, your open strat will be shown to
                  all users of your team, that have the <em>Active strat</em>{" "}
                  tab open.
                </p>
              </TooltipContent>
            </Tooltip>
            {isLeading && (
              <Tooltip delayDuration={750}>
                <TooltipTrigger asChild>
                  <SidebarMenuAction
                    className={cn(
                      "cursor-pointer p-2 -my-1.5 w-7",
                      !isLeading && "pointer-events-none"
                    )}
                    onClick={() => {
                      if (!isLeading) return;
                      setActive(null);
                      socket.emit("active-strat:change", null);
                    }}
                  >
                    <X className={cn(!isLeading && "text-muted-foreground")} />
                  </SidebarMenuAction>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-sm">Clear currently open strat</p>
                  <p className="text-xs text-muted-foreground">
                    You can only clear the current strat when you are leading
                    the currently open strat.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </Fill>
    </>
  );
}
