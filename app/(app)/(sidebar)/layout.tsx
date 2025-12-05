"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout(props: SidebarLayoutProps) {
  const team = useQuery(api.team.get);
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar teamName={team?.name ?? ""} />
      <SidebarInset>
        <SidebarTrigger className="absolute top-0 left-0 z-10 cursor-pointer" />
        {props.children}
      </SidebarInset>
    </SidebarProvider>
  );
}
