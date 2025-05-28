export interface ClientToServerSocketEvents {
  "active-strat:change": (stratID: Strat["id"]) => void;
  "active-strat:subscribe": () => void;
  "active-strat:unsubscribe": () => void;
  "debug:message": (message: string) => void;
}

export interface ServerToClientSocketEvents {
  "active-strat:changed": (strat: Strat) => void;
  "debug:message": (message: string) => void;
}
