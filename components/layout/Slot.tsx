"use client";

import { useSlots } from "./SlotProvider";

interface SlotProps {
  name: string;
  fallback?: React.ReactNode;
}

export function Slot({ name, fallback }: SlotProps) {
  const { getSlot } = useSlots();
  return getSlot(name) || fallback || null;
}
