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
import { useSocket } from "../context/SocketContext";
import useSocketEvent from "../hooks/useSocketEvent";
import { toast } from "sonner";

interface StratEditorProps {
  strat: Strat;
  team: Team;
}

export type AssetEvent =
  | AssetAdded
  | AssetUpdated
  | AssetDeleted
  | AssetSelection;
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
export interface AssetSelection {
  type: "asset-selected";
  old_selection: PlacedAsset["id"][];
  new_selection: PlacedAsset["id"][];
}

const HISTORY_SIZE = 100;

export function StratEditor({ strat, team }: Readonly<StratEditorProps>) {
  const socket = useSocket();
  useEffect(() => {
    socket.emit("strat-editor:subscribe", strat.id);
    return () => {
      socket.emit("strat-editor:unsubscribe", strat.id);
    };
  }, [strat.id]);

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

  const history = useRef<AssetEvent[]>([]);
  const historyIndex = useRef(-1);
  const pushEvent = useCallback((event: AssetEvent, fromRemote = false) => {
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

    if (!fromRemote) {
      socket.emit("strat-editor:event", strat.id, event);
    }
  }, []);

  useSocketEvent("strat-editor:event", (event, fromSocket) => {
    if (fromSocket === socket.id) return;
    setAssets((assets) => redoEvent(strat.id, assets, event, true));
  });

  const redo = useCallback(() => {
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current += 1;
      const event = history.current[historyIndex.current];
      setAssets((assets) => redoEvent(strat.id, assets, event));
      socket.emit("strat-editor:event", strat.id, event);
    }
  }, [
    setAssets,
    strat.id,
    addStratAsset,
    updateStratAssets,
    deleteStratAssets,
  ]);
  const undo = useCallback(() => {
    if (historyIndex.current >= 0) {
      const event = history.current[historyIndex.current];
      historyIndex.current -= 1;
      setAssets((assets) => undoEvent(strat.id, assets, event));
      for (const invertedEvent of invertEvent(event)) {
        socket.emit("strat-editor:event", strat.id, invertedEvent);
      }
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
        deleteStratAssets(strat.id, [asset.id]).catch((err) =>
          toast.error(
            `Your changes could not be saved! Failed to delete asset: ${err.message}`
          )
        );
        pushEvent({
          type: "asset-deleted",
          assets: [asset],
        });
      },
      updateAsset(asset) {
        setAssets((assets) => {
          pushEvent({
            type: "asset-updated",
            old_assets: assets.filter((a) => a.id === asset.id),
            new_assets: [asset],
          });
          return assets.map((a) => (a.id === asset.id ? asset : a));
        });
        updateStratAssets(strat.id, [asset]).catch((err) =>
          toast.error(
            `Your changes could not be saved! Failed to update assets: ${err.message}`
          )
        );
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
          rotation: 0,
          ...asset,
          id: `${asset.id}-${getHightestID(assets) + 1}` as any,
        };
        setAssets((assets) => [...assets, placedAsset]);
        addStratAsset(strat.id, placedAsset).catch((err) =>
          toast.error(
            `Your changes could not be saved! Failed to add asset: ${err.message}`
          )
        );
        pushEvent({
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
        onAssetAdd={(asset) => {
          const placedAsset = {
            size: { width: ASSET_BASE_SIZE, height: ASSET_BASE_SIZE },
            position: { x: CANVAS_BASE_SIZE / 20, y: CANVAS_BASE_SIZE / 20 },
            rotation: 0,
            ...asset,
            id: `${asset.id}-${getHightestID(assets) + 1}` as any,
          };
          setAssets((assets) => [...assets, placedAsset]);
          addStratAsset(strat.id, placedAsset).catch((err) =>
            toast.error(
              `Your changes could not be saved! Failed to add asset: ${err.message}`
            )
          );
          pushEvent({
            type: "asset-added",
            asset: placedAsset,
          });
        }}
        onAssetChange={(assets) => {
          setAssets((existing) => {
            pushEvent({
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
          updateStratAssets(strat.id, assets).catch((err) =>
            toast.error(
              `Your changes could not be saved! Failed to update asset: ${err.message}`
            )
          );
        }}
        onAssetRemove={(ids) => {
          setAssets((assets) => {
            pushEvent({
              type: "asset-deleted",
              assets: assets.filter((a) => ids.includes(a.id)),
            });
            return assets.filter((a) => !ids.includes(a.id));
          });
          deleteStratAssets(strat.id, ids).catch((err) =>
            toast.error(
              `Your changes could not be saved! Failed to delete asset: ${err.message}`
            )
          );
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
  event: AssetEvent
) {
  switch (event.type) {
    case "asset-added":
      requestAnimationFrame(() => {
        deleteStratAssets(stratID, [event.asset.id]).catch((err) =>
          toast.error(
            `Your changes could not be saved! Failed to delete asset: ${err.message}`
          )
        );
      });
      return state.filter((a) => a.id !== event.asset.id);
    case "asset-updated":
      requestAnimationFrame(() => {
        updateStratAssets(stratID, event.old_assets).catch((err) =>
          toast.error(
            `Your changes could not be saved! Failed to update assets: ${err.message}`
          )
        );
      });
      return state.map((a) => {
        const oldAsset = event.old_assets.find((asset) => asset.id === a.id);
        if (!oldAsset) return a;
        return deepCopy(oldAsset);
      });
    case "asset-deleted":
      requestAnimationFrame(() => {
        for (const asset of event.assets) {
          addStratAsset(stratID, asset).catch((err) =>
            toast.error(
              `Your changes could not be saved! Failed to add asset: ${err.message}`
            )
          );
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
  event: AssetEvent,
  fromRemote = false
) {
  switch (event.type) {
    case "asset-added":
      if (!fromRemote)
        requestAnimationFrame(() => {
          addStratAsset(stratID, event.asset);
        });
      return [...state, deepCopy(event.asset)];
    case "asset-updated":
      if (!fromRemote)
        requestAnimationFrame(() => {
          updateStratAssets(stratID, event.new_assets);
        });
      return state.map((a) => {
        const newAsset = event.new_assets.find((asset) => asset.id === a.id);
        if (!newAsset) return a;
        return deepCopy(newAsset);
      });
    case "asset-deleted":
      if (!fromRemote)
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

function invertEvent(event: AssetEvent): AssetEvent[] {
  switch (event.type) {
    case "asset-added":
      return [
        {
          type: "asset-deleted",
          assets: [event.asset],
        },
      ];
    case "asset-deleted":
      return event.assets.map((asset) => ({
        type: "asset-added",
        asset,
      }));
    case "asset-updated":
      return [
        {
          type: "asset-updated",
          old_assets: event.new_assets,
          new_assets: event.old_assets,
        },
      ];
    case "asset-selected":
      return [
        {
          type: "asset-selected",
          old_selection: event.new_selection,
          new_selection: event.old_selection,
        },
      ];
  }
}
