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
  rotationIndex: number[] | null;
  drawingID: string;

  assets: PlacedAsset[];
  operators: PickedOperator[];
}

interface PickedOperator {
  id: number;
  operator?: string;
  positionID?: number;
  isPowerOP?: boolean;
}
