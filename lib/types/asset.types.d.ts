import { Id } from "@/convex/_generated/dataModel";

export type Asset = BaseAsset &
  (
    | MarkerAsset
    | OperatorAsset
    | GadgetAsset
    | RotateAsset
    | ReinforcementAsset
  );

export interface BaseAsset {
  stratPositionID?: Id<"stratPositions">;
  customColor?: string;
}

export interface MarkerAsset {
  type: "marker";
}

export interface ReinforcementAsset {
  type: "reinforcement";
  variant: "reinforcement" | "barricade";
}

export interface RotateAsset {
  type: "rotate";
  variant:
    | "full"
    | "crouch"
    | "jump"
    | "headholes"
    | "floorholes"
    | "ceilingholes"
    | "explosion";
}

export interface OperatorAsset {
  type: "operator";
  operator: string;
  side: "att" | "def";
  iconType: "default" | "hidden" | "bw";
}

export interface GadgetAsset {
  type: "gadget";
  gadget: string;
}

export type PlacedAsset = Asset & {
  position: Position;
  size: Size;
  rotation: number;
};

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}
