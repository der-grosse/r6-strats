"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MAPS from "@/src/static/maps";
import StratEditorLayout from "./Layout";
import StratEditorCanvas, { ASSET_BASE_SIZE, CANVAS_BASE_SIZE } from "./Canvas";
import useMountAssets from "./Assets";
import {
  addAsset,
  deleteStratAssets,
  updateStratAssets,
} from "@/src/strats/strats";
import { useKeys } from "../hooks/useKey";
import { deepCopy } from "../deepCopy";

interface StratEditorProps {
  strat: Strat;
  team: Team;
}

const HISTORY_SIZE = 100;

export function StratEditor({ strat, team }: Readonly<StratEditorProps>) {
  const [assets, _setAssets] = useState<PlacedAsset[]>(strat.assets);
  const getHightestID = useCallback(
    (assets: PlacedAsset[]) =>
      assets.reduce((acc, asset) => {
        const id = Number(asset.id.split("-").at(-1));
        if (isNaN(id)) return acc;
        return Math.max(acc, id);
      }, 0),
    []
  );

  const history = useRef([strat.assets]);
  const historyIndex = useRef(0);
  const pushHistory = useCallback((assets: PlacedAsset[]) => {
    if (
      JSON.stringify(history.current[historyIndex.current]) ===
      JSON.stringify(assets)
    )
      return;
    console.log(`Pushing to history:`, historyIndex.current, history.current);
    history.current = history.current.slice(0, historyIndex.current + 1);
    historyIndex.current += 1;
    history.current.push(deepCopy(assets));
    if (history.current.length > HISTORY_SIZE) {
      history.current.shift();
      historyIndex.current -= 1;
    }
    console.log(
      `History updated: ${history.current.length} entries, current index: ${historyIndex.current}`
    );
  }, []);

  const setAssets = useCallback(
    (assets: PlacedAsset[] | ((oldAssets: PlacedAsset[]) => PlacedAsset[])) => {
      if (typeof assets === "function") {
        _setAssets((oldAssets) => {
          const newAssets = assets(oldAssets);
          pushHistory(newAssets);
          return newAssets;
        });
      } else {
        _setAssets(assets);
        pushHistory(assets);
      }
    },
    [pushHistory]
  );

  const redo = useCallback(() => {
    console.log(`Redoing:`, historyIndex.current, history.current);
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current += 1;
      _setAssets(history.current[historyIndex.current]);
      // TODO: update assets in the server
    }
  }, [_setAssets]);
  const undo = useCallback(() => {
    console.log(`Undoing:`, historyIndex.current, history.current);
    if (historyIndex.current > 0) {
      historyIndex.current -= 1;
      _setAssets(history.current[historyIndex.current]);
      // TODO: update assets in the server
    }
  }, [_setAssets]);
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
      },
      updateAsset(asset) {
        setAssets((assets) =>
          assets.map((a) => (a.id === asset.id ? asset : a))
        );
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
        addAsset(strat.id, placedAsset);
      }}
      strat={strat}
      team={team}
    >
      <StratEditorCanvas
        map={map}
        assets={assets}
        onAssetInput={(assets) => {
          _setAssets((existing) =>
            existing.map((a) => {
              const newAsset = assets.find((asset) => asset.id === a.id);
              if (!newAsset) return a;
              return newAsset;
            })
          );
        }}
        onAssetChange={(assets) => {
          setAssets((existing) =>
            existing.map((a) => {
              const newAsset = assets.find((asset) => asset.id === a.id);
              if (!newAsset) return a;
              return newAsset;
            })
          );
          updateStratAssets(strat.id, assets);
        }}
        onAssetRemove={(ids) => {
          setAssets((assets) => assets.filter((a) => !ids.includes(a.id)));
          deleteStratAssets(strat.id, ids);
        }}
        renderAsset={renderAsset}
      />
      {UI}
    </StratEditorLayout>
  );
}
