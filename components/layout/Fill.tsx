"use client";

import { useEffect, useRef } from "react";
import { useSlots } from "./SlotProvider";

interface FillProps {
  slot: string;
  children: React.ReactNode;
}

export function Fill({ slot, children }: FillProps) {
  const { setSlot, clearSlot } = useSlots();
  const previousSlotRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Clear previous slot if it changed
    if (previousSlotRef.current && previousSlotRef.current !== slot) {
      clearSlot(previousSlotRef.current);
    }

    setSlot(slot, children);
    previousSlotRef.current = slot;

    return () => {
      if (previousSlotRef.current) {
        clearSlot(previousSlotRef.current);
      }
    };
  }, [slot, children, setSlot, clearSlot]);

  return null; // This component doesn't render anything itself
}
