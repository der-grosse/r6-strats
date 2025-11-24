interface R6Map {
  name: string;
  sites: string[];
  floors: R6Floor[];
}

type R6FloorLayer = "doors" | "windows" | "reinforcements" | "hatches";
interface R6Floor {
  floor: "B" | "1F" | "2F" | "3F";
  src: string;
  clickables?: React.FC<MapFloorClickableProps>;
}

interface Strat {
  id: number;
  map: string;
  site: string;
  name: string;
  description: string;
  mapIndex: number;
  drawingID: string | null;

  assets: PlacedAsset[];
  positions: StratPositions[];
}

interface StratPositions {
  id: number;
  isPowerPosition: boolean;
  shouldBringShotgun: boolean;
  positionID?: number | null;
  operators: PickedOperator[];
}

interface PickedOperator {
  operator: string;
  secondaryGadget: string | null;
  tertiaryGadget: string | null; // only used for operator sentry
}
