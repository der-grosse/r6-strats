"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MAPS from "@/src/static/maps";
import StratEditorLayout from "./Layout";
import StratEditorCanvas, { ASSET_BASE_SIZE, CANVAS_BASE_SIZE } from "./Canvas";
import useMountAssets from "./Assets";
import {
  addStratAsset,
  deleteStratAssets,
  getStrat,
  updateStratAssets,
} from "@/src/strats/strats";
import { useKeys } from "../hooks/useKey";
import { deepCopy } from "../deepCopy";
import { useSocket } from "../context/SocketContext";
import useSocketEvent from "../hooks/useSocketEvent";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";
import StratDisplay from "../StratDisplay";

interface StratEditorProps {
  strat: Strat;
  team: Team;
}

export interface Selection {
  id: string;
  socketID: string;
  userID: TeamMember["id"];
}

export type HistoryEvent = AssetEvent | SelectionEvent;

export type AssetEvent = AssetAdded | AssetUpdated | AssetDeleted;

export type SelectionEvent = AssetSelection | AssetDeselection;
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
  type: "selection-selected";
  selection: string[];
  socketID: string;
  userID: TeamMember["id"];
}
export interface AssetDeselection {
  type: "selection-deselected";
  selection: string[];
  socketID: string;
  userID: TeamMember["id"];
}

const HISTORY_SIZE = 100;

export function StratEditor({
  strat: propStrat,
  team,
}: Readonly<StratEditorProps>) {
  const [strat, setStrat] = useState<Strat>(propStrat);
  // Update local state when prop changes
  useEffect(() => {
    setStrat(propStrat);
  }, [propStrat]);
  // Refresh local state periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const new_strat = await getStrat(strat.id);
      if (!new_strat) return;
      setStrat(new_strat);
      setAssets(new_strat.assets);
      console.debug(`refreshed strat ${strat.id} from server`);
    }, 30_000);

    return () => clearInterval(interval);
  }, [strat.id]);

  const { user } = useUser();
  const socket = useSocket();

  // Subscribe to socket events
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

  const [selected, setSelected] = useState<Selection[]>([]);

  const history = useRef<HistoryEvent[]>([]);
  const historyIndex = useRef(-1);
  const pushEvent = useCallback((event: HistoryEvent, fromRemote = false) => {
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
    redoEvent(strat.id, event, setAssets, setSelected, true);
  });

  const redo = useCallback(() => {
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current += 1;
      const event = history.current[historyIndex.current];
      redoEvent(strat.id, event, setAssets, setSelected);
      socket.emit("strat-editor:event", strat.id, event);
    }
  }, [
    setAssets,
    setSelected,
    strat.id,
    addStratAsset,
    updateStratAssets,
    deleteStratAssets,
  ]);
  const undo = useCallback(() => {
    if (historyIndex.current >= 0) {
      const event = history.current[historyIndex.current];
      historyIndex.current -= 1;
      undoEvent(strat.id, event, setAssets, setSelected);
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
    { team, stratPositions: strat.positions },
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
      hideAssets={!!strat.drawingID}
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
      {strat.drawingID ? (
        <StratDisplay editView hideDetails strat={strat} team={team} />
      ) : (
        <StratEditorCanvas
          selectedAssets={selected}
          onDeselect={(deselected) => {
            setSelected((selected) =>
              selected.filter(
                (s) => s.socketID !== socket.id || !deselected.includes(s.id)
              )
            );
            if (user?.id) {
              pushEvent({
                type: "selection-deselected",
                selection: deselected,
                socketID: socket.id!,
                userID: user.id,
              });
            }
          }}
          onSelect={(newSelected) => {
            setSelected((selected) =>
              selected.concat(
                newSelected.map((id) => ({
                  id,
                  socketID: socket.id!,
                  userID: user?.id ?? -1,
                }))
              )
            );
            if (user?.id)
              pushEvent({
                type: "selection-selected",
                selection: newSelected,
                socketID: socket.id!,
                userID: user.id,
              });
          }}
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
              const newAssets = assets.filter((a) => !ids.includes(a.id));
              pushEvent({
                type: "asset-deleted",
                assets: newAssets,
              });
              return [...newAssets];
            });
            deleteStratAssets(strat.id, ids).catch((err) =>
              toast.error(
                `Your changes could not be saved! Failed to delete asset: ${err.message}`
              )
            );
          }}
          renderAsset={renderAsset}
        />
      )}
      {UI}
    </StratEditorLayout>
  );
}

function undoEvent(
  stratID: Strat["id"],
  event: HistoryEvent,
  updateAssets: (updater: (assets: PlacedAsset[]) => PlacedAsset[]) => void,
  updateSelection: (updater: (selection: Selection[]) => Selection[]) => void
) {
  if ("type" in event && event.type.startsWith("asset-")) {
    updateAssets((assets) => {
      return undoAssetEvent(stratID, assets, event as AssetEvent);
    });
  } else if ("type" in event && event.type.startsWith("selection-")) {
    updateSelection((selection) => {
      return undoSelectionEvent(selection, event as SelectionEvent);
    });
  } else {
    throw new Error(`Unknown event type: ${(event as any)?.type}`);
  }
}

function redoEvent(
  stratID: Strat["id"],
  event: HistoryEvent,
  updateAssets: (updater: (assets: PlacedAsset[]) => PlacedAsset[]) => void,
  updateSelection: (updater: (selection: Selection[]) => Selection[]) => void,
  fromRemote = false
) {
  if ("type" in event && event.type.startsWith("asset-")) {
    updateAssets((assets) => {
      return redoAssetEvent(stratID, assets, event as AssetEvent, fromRemote);
    });
  } else if ("type" in event && event.type.startsWith("selection-")) {
    updateSelection((selection) => {
      return redoSelectionEvent(selection, event as SelectionEvent);
    });
  } else {
    throw new Error(`Unknown event type: ${(event as any)?.type}`);
  }
}

function undoAssetEvent(
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

function redoAssetEvent(
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

function undoSelectionEvent(
  state: Selection[],
  event: SelectionEvent
): Selection[] {
  switch (event.type) {
    case "selection-selected":
      return state.filter(
        (s) => s.socketID !== event.socketID || !event.selection.includes(s.id)
      );
    case "selection-deselected":
      return state.concat(
        event.selection.map((id) => ({
          id,
          socketID: event.socketID,
          userID: event.userID,
        }))
      );
  }
}

function redoSelectionEvent(
  state: Selection[],
  event: SelectionEvent
): Selection[] {
  switch (event.type) {
    case "selection-selected":
      return state.concat(
        event.selection.map((id) => ({
          id,
          socketID: event.socketID,
          userID: event.userID,
        }))
      );
    case "selection-deselected":
      return state.filter(
        (s) => s.socketID !== event.socketID || !event.selection.includes(s.id)
      );
  }
}

function invertEvent(event: HistoryEvent): HistoryEvent[] {
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
    case "selection-selected":
      return [
        {
          type: "selection-deselected",
          selection: event.selection,
          socketID: event.socketID,
          userID: event.userID,
        },
      ];
    case "selection-deselected":
      return [
        {
          type: "selection-selected",
          selection: event.selection,
          socketID: event.socketID,
          userID: event.userID,
        },
      ];
  }
}
