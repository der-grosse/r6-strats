export interface RotationPathProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  outerColor?: string;
  variant: RotateAsset["variant"];
}

export default function RotationPath(props: RotationPathProps) {
  const {
    x,
    y,
    width,
    height,
    color = "#cfe2f3",
    outerColor = "#cfe2f3",
  } = props;
  const barBorderWidth = height * 0.04;
  const barSpacing = height * 0.1;
  const barHeight = (height - barBorderWidth * 4 - barSpacing * 2) / 3;
  const borderRadius = height * 0.075;

  const bars = (() => {
    switch (props.variant) {
      case "ceilingholes":
        return [true, false, false];
      case "crouch":
        return [false, true, true];
      case "floorholes":
        return [false, false, true];
      case "headholes":
        return [false, true, false];
      case "full":
        return [true, true, true];
      case "jump":
        return [true, true, false];
    }
  })();

  return (
    <g name="rotation" stroke="#000">
      {/* white outline */}
      <rect
        x={x + barBorderWidth / 2}
        y={y + barBorderWidth / 2}
        width={width - barBorderWidth}
        height={height - barBorderWidth}
        fill="none"
        strokeWidth={barBorderWidth}
        rx={borderRadius}
        ry={borderRadius}
        stroke={outerColor}
      />
      {/* white fill between top and middle bar */}
      <rect
        x={x + barBorderWidth / 2}
        y={y + barBorderWidth / 2 + barHeight}
        width={width - barBorderWidth}
        height={barSpacing + barBorderWidth * 1.5}
        stroke="none"
        fill={outerColor}
      />
      {/* white fill between middle and bottom bar */}
      <rect
        x={x + barBorderWidth / 2}
        y={y + barBorderWidth * 1 + barHeight * 2 + barSpacing}
        width={width - barBorderWidth}
        height={barSpacing + barBorderWidth * 2}
        stroke="none"
        fill={outerColor}
      />
      {/* top bar */}
      <rect
        x={x + barBorderWidth}
        y={y + barBorderWidth}
        width={width - barBorderWidth * 2}
        height={barHeight}
        strokeWidth={barBorderWidth}
        rx={borderRadius}
        ry={borderRadius}
        fill={bars[0] ? color : "none"}
      />
      {/* middle bar */}
      <rect
        x={x + barBorderWidth}
        y={y + (barBorderWidth * 3) / 2 + barHeight + barSpacing}
        width={width - barBorderWidth * 2}
        height={barHeight}
        strokeWidth={barBorderWidth}
        rx={borderRadius}
        ry={borderRadius}
        fill={bars[1] ? color : "none"}
      />
      {/* bottom bar */}
      <rect
        x={x + barBorderWidth}
        y={y + (barBorderWidth * 5) / 2 + barHeight * 2 + barSpacing * 2}
        width={width - barBorderWidth * 2}
        height={barHeight}
        strokeWidth={barBorderWidth}
        rx={borderRadius}
        ry={borderRadius}
        fill={bars[2] ? color : "none"}
      />
    </g>
  );
}
