import RotationPath from "./rotationPath";

export interface RotationProps {
  className?: string;
  color?: string;
  variant: RotateAsset["variant"];
}

export default function Rotation(props: RotationProps) {
  const { className, color = "#cfe2f3", variant } = props;

  return (
    <svg viewBox="0 0 300 200" className={className}>
      <RotationPath
        x={0}
        y={0}
        width={300}
        height={200}
        outerColor={color}
        variant={variant}
      />
    </svg>
  );
}
