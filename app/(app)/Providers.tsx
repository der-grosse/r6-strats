"use client";
import { ConvexClientProvider } from "@/components/context/ConvexClientProvider";
import { FilterProvider } from "@/components/context/FilterContext";
import { Filter } from "@/components/context/FilterContext.functions";
import { UserProvider } from "@/components/context/UserContext";
import { SlotProvider } from "@/components/layout/SlotProvider";
import { DragProvider } from "@/components/ui/draggable-context";
import { ResizeProvider } from "@/components/ui/resize-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Strat } from "@/lib/types/strat.types";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

export interface ProvidersProps {
  children: React.ReactNode;
  cookieFilter?: Filter;
  jwt?: string;
  defaultLeading?: boolean;
  allStrats: Strat[];
}

export default function Providers(props: Readonly<ProvidersProps>) {
  return (
    <ConvexClientProvider>
      <Authenticated>
        <UserProvider jwt={props.jwt}>
          {/* <SocketProvider> */}
          <FilterProvider
            defaultFilter={props.cookieFilter}
            defaultLeading={props.defaultLeading}
            allStrats={props.allStrats}
          >
            <SlotProvider>
              <DragProvider>
                <ResizeProvider>{props.children}</ResizeProvider>
              </DragProvider>
              <Toaster />
            </SlotProvider>
          </FilterProvider>
          {/* </SocketProvider> */}
        </UserProvider>
      </Authenticated>
      <Unauthenticated>
        <div className="m-4">
          <h2 className="mb-2 text-2xl font-bold">You are not logged in</h2>
          <p className="text-md">
            Please log in to access the application features.
          </p>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="m-4">
          <Skeleton className="w-full h-full" />
        </div>
      </AuthLoading>
    </ConvexClientProvider>
  );
}
