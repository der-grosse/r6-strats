import { HistoryEvent } from "@/components/StratEditor/StratEditor";

export interface ClientToServerSocketEvents {
  "active-strat:change": (strat: Strat | null) => void;
  "active-strat:subscribe": () => void;
  "active-strat:unsubscribe": () => void;
  "strat-editor:subscribe": (stratID: number) => void;
  "strat-editor:unsubscribe": (stratID: number) => void;
  "debug:message": (message: string) => void;
  "strat-editor:event": (stratID: number, event: HistoryEvent) => void;
}

export interface ServerToClientSocketEvents {
  "active-strat:changed": (strat: Strat | null) => void;
  "debug:message": (message: string) => void;
  "strat-editor:event": (event: HistoryEvent, fromSocket: string) => void;
}
