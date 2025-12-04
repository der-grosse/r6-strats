"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import Cookie from "js-cookie";
import {
  EMPTY_FILTER,
  Filter,
  FILTER_COOKIE_KEY,
  LEADING_COOKIE_KEY,
} from "./FilterContext.functions";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface FilterContextType {
  filter: Filter;
  setFilter: React.Dispatch<React.SetStateAction<Filter>>;
  isLeading: boolean;
  setIsLeading: React.Dispatch<React.SetStateAction<boolean>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{
  children: React.ReactNode;
  defaultFilter?: Filter;
  defaultLeading?: boolean;
}> = ({ children, defaultFilter, defaultLeading }) => {
  const setBannedOps = useMutation(api.bannedOps.set);
  const bannedOps = useQuery(api.bannedOps.get) || [];

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

  // push banned ops filter change to socket
  useEffect(() => {
    if (!isLeading) return;
    setBannedOps({ operators: bannedOps });
  }, [bannedOps.join("|"), isLeading]);

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
        isLeading,
        setIsLeading,
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
