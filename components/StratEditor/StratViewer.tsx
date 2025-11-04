"use client";

import { useMemo } from "react";
import useMountAssets from "./Assets";
import StratEditorCanvas from "./Canvas";
import MAPS from "@/src/static/maps";

export interface StratViewerProps {
  strat: Strat;
  team: Team;
  assetModifier?: (assets: PlacedAsset[]) => PlacedAsset[];
}

export default function StratViewer({
  team,
  strat,
  assetModifier,
}: StratViewerProps) {
  const { renderAsset, UI } = useMountAssets(
    { team, stratPositions: strat.positions },
    {
      deleteAsset(asset) {},
      updateAsset(asset) {},
    }
  );

  const map = useMemo(
    () => MAPS.find((map) => map.name === strat.map) ?? null,
    [strat.map]
  );

  const assets = useMemo(() => {
    if (assetModifier) {
      return assetModifier(strat.assets);
    }
    return strat.assets;
  }, [strat.assets, assetModifier]);

  return (
    <StratEditorCanvas
      map={map}
      assets={assets}
      renderAsset={renderAsset}
      selectedAssets={[]}
      onDeselect={() => {}}
      onSelect={() => {}}
      onAssetAdd={() => {}}
      onAssetChange={() => {}}
      onAssetRemove={() => {}}
      readonly
    />
  );
}
