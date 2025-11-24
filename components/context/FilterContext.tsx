"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Cookie from "js-cookie";
import {
  EMPTY_FILTER,
  Filter,
  FILTER_COOKIE_KEY,
  LEADING_COOKIE_KEY,
} from "./FilterContext.functions";
import { deepEqual } from "../Objects";
import { setBannedOps } from "@/src/bannedOps/bannedOps";

interface FilterContextType {
  filter: Filter;
  setFilter: React.Dispatch<React.SetStateAction<Filter>>;
  playableStrats: Strat[];
  availableStrats: { playable: boolean; strat: Strat }[];
  bannedOps: string[];
  setBannedOps: React.Dispatch<React.SetStateAction<string[]>>;
  isLeading: boolean;
  setIsLeading: React.Dispatch<React.SetStateAction<boolean>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{
  children: React.ReactNode;
  defaultFilter?: Filter;
  defaultLeading?: boolean;
  allStrats?: Strat[];
  bannedOps?: string[];
}> = ({
  allStrats,
  children,
  defaultFilter,
  defaultLeading,
  bannedOps: propBannedOps,
}) => {
  const [bannedOps, setBannedOpsState] = useState<string[]>(
    propBannedOps ?? []
  );
  const [filter, setFilter] = useState<Filter>(defaultFilter ?? EMPTY_FILTER);

  // set initial filter from cookies
  useEffect(() => {
    const cookieFilter = Cookie.get(FILTER_COOKIE_KEY);
    if (cookieFilter) {
      try {
        const parsedFilter = JSON.parse(cookieFilter);
        setFilter((prev) => ({ ...prev, ...parsedFilter }));
      } catch (e) {
        console.error("Failed to parse filter from cookies", e);
      }
    }
  }, []);

  // leading state

  const [isLeading, setIsLeading] = useState(
    defaultLeading ?? Cookie.get(LEADING_COOKIE_KEY) === "true"
  );

  // useSocketEvent("operator-bans:changed", (bans) => {
  //   setBannedOpsState((prev) => {
  //     if (deepEqual(prev, bans)) return prev;
  //     return bans;
  //   });
  // });
  // push banned ops filter change to socket
  useEffect(() => {
    if (!isLeading) return;
    // socket.emit("operator-bans:change", bannedOps);

    setBannedOps(bannedOps);
  }, [bannedOps.join("|"), isLeading]);
  // subscribe to operator bans socket
  useEffect(() => {
    // socket.emit("operator-bans:subscribe");
    return () => {
      // socket.emit("operator-bans:unsubscribe");
    };
  }, []);

  const availableStrats = useMemo(
    () =>
      allStrats
        ?.filter((strat) => {
          if (filter.map && filter.map !== strat.map) return false;
          if (filter.site && filter.site !== strat.site) return false;
          return true;
        })
        .map((strat) => {
          const playable = (() => {
            if (bannedOps.length > 0) {
              const positionUnplayable = strat.positions.some(
                (position) =>
                  position.isPowerPosition &&
                  position.operators.length &&
                  position.operators.every((op) =>
                    bannedOps.includes(op.operator)
                  )
              );
              if (positionUnplayable) return false;
            }
            return true;
          })();
          return {
            strat,
            playable,
          };
        }) ?? [],
    [allStrats, filter, bannedOps]
  );

  const playableStrats = useMemo(
    () => availableStrats.filter((strat) => strat.playable).map((s) => s.strat),
    [availableStrats]
  );

  // store filter in cookies
  useEffect(() => {
    Cookie.set(FILTER_COOKIE_KEY, JSON.stringify(filter));
  }, [filter]);
  useEffect(() => {
    Cookie.set(LEADING_COOKIE_KEY, isLeading.toString());
  }, [isLeading]);

  return (
    <FilterContext.Provider
      value={{
        filter,
        setFilter,
        playableStrats,
        availableStrats,
        isLeading,
        setIsLeading,
        bannedOps,
        setBannedOps: setBannedOpsState,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
};
