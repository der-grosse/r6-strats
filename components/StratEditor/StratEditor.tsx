"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MAPS from "@/src/static/maps";
import StratEditorLayout from "./Layout";
import StratEditorCanvas, { ASSET_BASE_SIZE, CANVAS_BASE_SIZE } from "./Canvas";
import useMountAssets from "./Assets";
import {
  addStratAsset,
  deleteStratAssets,
  updateStratAssets,
} from "@/src/strats/strats";
import { useKeys } from "../hooks/useKey";
import { deepCopy } from "../deepCopy";

interface StratEditorProps {
  strat: Strat;
  team: Team;
}

type HistoryEvent = AssetAdded | AssetUpdated | AssetDeleted;
export interface AssetAdded {
  type: "asset-added";
  asset: PlacedAsset;
}
export interface AssetUpdated {
  type: "asset-updated";
  old_assets: PlacedAsset[];
  new_assets: PlacedAsset[];
}
export interface AssetDeleted {
  type: "asset-deleted";
  assets: PlacedAsset[];
}

const HISTORY_SIZE = 100;

export function StratEditor({ strat, team }: Readonly<StratEditorProps>) {
  const [assets, setAssets] = useState<PlacedAsset[]>(strat.assets);
  const getHightestID = useCallback(
    (assets: PlacedAsset[]) =>
      assets.reduce((acc, asset) => {
        const id = Number(asset.id.split("-").at(-1));
        if (isNaN(id)) return acc;
        return Math.max(acc, id);
      }, 0),
    []
  );

  const history = useRef<HistoryEvent[]>([]);
  const historyIndex = useRef(-1);
  const pushHistory = useCallback((event: HistoryEvent) => {
    if (
      JSON.stringify(history.current[historyIndex.current]) ===
      JSON.stringify(event)
    )
      return;
    if (
      event.type === "asset-updated" &&
      JSON.stringify(event.old_assets) === JSON.stringify(event.new_assets)
    )
      return;

    history.current = history.current.slice(0, historyIndex.current + 1);
    historyIndex.current += 1;
    history.current.push(deepCopy(event));
    if (history.current.length > HISTORY_SIZE) {
      history.current.shift();
      historyIndex.current -= 1;
    }
    console.log(`Pushing to history:`, historyIndex.current, history.current);
  }, []);

  const redo = useCallback(() => {
    console.log(`Redoing:`, historyIndex.current, history.current);
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current += 1;
      const event = history.current[historyIndex.current];
      setAssets((assets) => redoEvent(strat.id, assets, event));
    }
  }, [
    setAssets,
    strat.id,
    addStratAsset,
    updateStratAssets,
    deleteStratAssets,
  ]);
  const undo = useCallback(() => {
    console.log(`Undoing:`, historyIndex.current, history.current);
    if (historyIndex.current >= 0) {
      const event = history.current[historyIndex.current];
      historyIndex.current -= 1;
      setAssets((assets) => {
        const newAssets = undoEvent(strat.id, assets, event);
        console.log(`Undo result:`, newAssets);
        return newAssets;
      });
    }
  }, [
    setAssets,
    strat.id,
    addStratAsset,
    updateStratAssets,
    deleteStratAssets,
  ]);
  useKeys([
    {
      shortcut: {
        key: "z",
        ctrlKey: true,
        shiftKey: false,
      },
      action: undo,
    },
    {
      shortcut: {
        key: "y",
        ctrlKey: true,
      },
      action: redo,
    },
  ]);

  const { renderAsset, UI } = useMountAssets(
    { team, operators: strat.operators },
    {
      deleteAsset(asset) {
        setAssets((assets) => assets.filter((a) => a.id !== asset.id));
        deleteStratAssets(strat.id, [asset.id]);
        pushHistory({
          type: "asset-deleted",
          assets: [asset],
        });
      },
      updateAsset(asset) {
        setAssets((assets) => {
          pushHistory({
            type: "asset-updated",
            old_assets: assets.filter((a) => a.id === asset.id),
            new_assets: [asset],
          });
          return assets.map((a) => (a.id === asset.id ? asset : a));
        });
        updateStratAssets(strat.id, [asset]);
      },
    }
  );

  const map = useMemo(
    () => MAPS.find((map) => map.name === strat.map) ?? null,
    [strat.map]
  );

  return (
    <StratEditorLayout
      onAssetAdd={(asset) => {
        const placedAsset = {
          size: { width: ASSET_BASE_SIZE, height: ASSET_BASE_SIZE },
          position: { x: CANVAS_BASE_SIZE / 20, y: CANVAS_BASE_SIZE / 20 },
          ...asset,
          id: `${asset.id}-${getHightestID(assets) + 1}` as any,
        };
        setAssets((assets) => [...assets, placedAsset]);
        addStratAsset(strat.id, placedAsset);
        pushHistory({
          type: "asset-added",
          asset: placedAsset,
        });
      }}
      strat={strat}
      team={team}
    >
      <StratEditorCanvas
        map={map}
        assets={assets}
        onAssetChange={(assets) => {
          setAssets((existing) => {
            pushHistory({
              type: "asset-updated",
              old_assets: existing.filter((a) =>
                assets.some((asset) => asset.id === a.id)
              ),
              new_assets: assets,
            });
            return existing.map((a) => {
              const newAsset = assets.find((asset) => asset.id === a.id);
              if (!newAsset) return a;
              return deepCopy(newAsset);
            });
          });
          updateStratAssets(strat.id, assets);
        }}
        onAssetRemove={(ids) => {
          setAssets((assets) => {
            pushHistory({
              type: "asset-deleted",
              assets: assets.filter((a) => ids.includes(a.id)),
            });
            return assets.filter((a) => !ids.includes(a.id));
          });
          deleteStratAssets(strat.id, ids);
        }}
        renderAsset={renderAsset}
      />
      {UI}
    </StratEditorLayout>
  );
}

function undoEvent(
  stratID: Strat["id"],
  state: PlacedAsset[],
  event: HistoryEvent
) {
  switch (event.type) {
    case "asset-added":
      requestAnimationFrame(() => {
        deleteStratAssets(stratID, [event.asset.id]);
      });
      return state.filter((a) => a.id !== event.asset.id);
    case "asset-updated":
      requestAnimationFrame(() => {
        updateStratAssets(stratID, event.old_assets);
      });
      return state.map((a) => {
        const oldAsset = event.old_assets.find((asset) => asset.id === a.id);
        if (!oldAsset) return a;
        return deepCopy(oldAsset);
      });
    case "asset-deleted":
      requestAnimationFrame(() => {
        for (const asset of event.assets) {
          addStratAsset(stratID, asset);
        }
      });
      return [...state, ...deepCopy(event.assets)];
    default:
      throw new Error(`Unknown event type: ${(event as any)?.type}`);
  }
}

function redoEvent(
  stratID: Strat["id"],
  state: PlacedAsset[],
  event: HistoryEvent
) {
  switch (event.type) {
    case "asset-added":
      requestAnimationFrame(() => {
        addStratAsset(stratID, event.asset);
      });
      return [...state, deepCopy(event.asset)];
    case "asset-updated":
      requestAnimationFrame(() => {
        updateStratAssets(stratID, event.new_assets);
      });
      return state.map((a) => {
        const newAsset = event.new_assets.find((asset) => asset.id === a.id);
        if (!newAsset) return a;
        return deepCopy(newAsset);
      });
    case "asset-deleted":
      requestAnimationFrame(() => {
        deleteStratAssets(
          stratID,
          event.assets.map((a) => a.id)
        );
      });
      return state.filter(
        (a) => !event.assets.some((asset) => asset.id === a.id)
      );
    default:
      throw new Error(`Unknown event type: ${(event as any)?.type}`);
  }
}
