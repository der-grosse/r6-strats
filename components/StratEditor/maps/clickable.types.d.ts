interface MapFloorClickableProps {
  className?: string;
  onClick?: (
    type: "barricade" | "reinforcement",
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number
  ) => void;
}
