type Asset = BaseAsset &
  (
    | MarkerAsset
    | OperatorAsset
    | GadgetAsset
    | RotateAsset
    | ReinforcementAsset
  );

interface BaseAsset {
  id: string;
  pickedOPID?: PickedOperator["id"];
  customColor?: string;
}

interface MarkerAsset {
  id: `marker-${string}`;
  type: "marker";
}

interface ReinforcementAsset {
  id: `reinforcement-${string}`;
  type: "reinforcement";
  variant: "reinforcement" | "barricade";
}

interface RotateAsset {
  id: `rotate-${string}`;
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

interface OperatorAsset {
  id: `operator-${string}`;
  type: "operator";
  operator: string;
  side: "att" | "def";
  iconType: "default" | "hidden" | "bw";
}

interface GadgetAsset {
  id: `gadget-${string}`;
  type: "gadget";
  gadget: string;
}

type PlacedAsset = Asset & {
  position: Position;
  size: Size;
  rotation: number;
};

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}
