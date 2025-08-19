import { useMemo } from "react";
import useMountAssets from "./Assets";
import StratEditorCanvas from "./Canvas";
import MAPS from "@/src/static/maps";

export interface StratViewerProps {
  strat: Strat;
  team: Team;
}

export default function StratViewer({ team, strat }: StratViewerProps) {
  const { renderAsset, UI } = useMountAssets(
    { team, operators: strat.operators },
    {
      deleteAsset(asset) {},
      updateAsset(asset) {},
    }
  );

  const map = useMemo(
    () => MAPS.find((map) => map.name === strat.map) ?? null,
    [strat.map]
  );

  return (
    <StratEditorCanvas
      map={map}
      assets={strat.assets}
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
