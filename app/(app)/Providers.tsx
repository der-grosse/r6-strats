"use client";
import { FilterProvider } from "@/components/context/FilterContext";
import { Filter } from "@/components/context/FilterContext.functions";
import { SocketProvider } from "@/components/context/SocketContext";
import { UserProvider } from "@/components/context/UserContext";
import { DragProvider } from "@/components/ui/draggable-context";
import { ResizeProvider } from "@/components/ui/resize-context";
import { Toaster } from "@/components/ui/sonner";

export interface ProvidersProps {
  children: React.ReactNode;
  cookieFilter?: Filter;
  jwt?: string;
  defaultLeading?: boolean;
  allStrats: Strat[];
}

export default function Providers(props: Readonly<ProvidersProps>) {
  return (
    <UserProvider jwt={props.jwt}>
      <SocketProvider>
        <FilterProvider
          defaultFilter={props.cookieFilter}
          defaultLeading={props.defaultLeading}
          allStrats={props.allStrats}
        >
          <DragProvider>
            <ResizeProvider>{props.children}</ResizeProvider>
          </DragProvider>
          <Toaster />
        </FilterProvider>
      </SocketProvider>
    </UserProvider>
  );
}
