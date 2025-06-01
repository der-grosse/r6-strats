import { cn } from "@/src/utils";

export interface Bank1FWindowsProps {
  className?: string;
  onClick?: (x: number, y: number, width: number, rotation: number) => void;
}

export default function Bank1FWindows(props: Bank1FWindowsProps) {
  const onClickHandler = (e: React.MouseEvent<SVGPathElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const d = e.currentTarget.getAttribute("d");
    const coords = d?.match(
      /M(\d+\.?\d*),(\d+\.?\d*) L(\d+\.?\d*),(\d+\.?\d*)/
    );
    if (coords && coords.length === 5) {
      const x = (parseFloat(coords[1]) + 36) / 3332;
      const y = (parseFloat(coords[2]) - 18) / 2499;
      const x2 = (parseFloat(coords[3]) + 36) / 3332;
      const y2 = (parseFloat(coords[4]) - 18) / 2499;
      const size = Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2));
      const rotation = Math.atan2(y2 - y, x2 - x) * (180 / Math.PI);
      const centerX = (x + x2) / 2;
      const centerY = (y + y2) / 2;
      console.log("Clicked at relative coordinates:", {
        centerX,
        centerY,
        size,
        rotation,
      });
      props.onClick?.(centerX, centerY, size, rotation);
    }
  };
  return (
    <svg
      width="799.68"
      height="599.76"
      viewBox="0.00 0.00 3332.00 2499.00"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      className={cn("size-full", props.className)}
    >
      <g
        strokeLinecap="round"
        transform="translate(36.00, -18.00)"
        fill="none"
        stroke="transparent"
        strokeWidth="20.00"
        strokeOpacity="1.00"
        strokeLinejoin="round"
      >
        <path
          d="M438.34,1977.06 L479.01,1977.06"
          className="cursor-pointer"
          onClick={onClickHandler}
        />
        <path
          d="M694.34,1977.06 L735.01,1977.06"
          className="cursor-pointer"
          onClick={onClickHandler}
        />
        <path
          d="M2293.44,1288.84 L2293.44,1329.51"
          className="cursor-pointer"
          onClick={onClickHandler}
        />
        <path
          d="M2591.44,2157.84 L2591.44,2198.51"
          className="cursor-pointer"
          onClick={onClickHandler}
        />
      </g>
    </svg>
  );
}
