import { cn } from "@/src/utils";

export default function Bank1F(props: MapFloorClickableProps) {
  const onClickHandler = (e: React.MouseEvent<SVGPathElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const d = e.currentTarget.getAttribute("d");
    const coords = d?.match(
      /M(\d+\.?\d*),(\d+\.?\d*) L(\d+\.?\d*),(\d+\.?\d*)/
    );
    if (coords && coords.length === 5) {
      const x = parseFloat(coords[1]) / 3332;
      const y = parseFloat(coords[2]) / 2499;
      const x2 = parseFloat(coords[3]) / 3332;
      const y2 = parseFloat(coords[4]) / 2499;

      const type = e.currentTarget.dataset.type as
        | "barricade"
        | "reinforcement";
      if (type !== "barricade" && type !== "reinforcement") {
        console.error("Invalid type:", type);
        return;
      }

      const rel_width = Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2));
      const rel_height = type === "barricade" ? 0.01 : (rel_width / 3) * 2;
      const rotation = Math.atan2(y2 - y, x2 - x) * (180 / Math.PI);
      const centerX = (x + x2) / 2;
      const centerY = (y + y2) / 2;

      props.onClick?.(type, centerX, centerY, rel_width, rel_height, rotation);
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
        fill="none"
        stroke="transparent"
        strokeWidth="20.00"
        strokeLinejoin="round"
      >
        {/* windows start */}
        <path
          d="M474.34,1959.06 L515.01,1959.06"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M730.34,1959.06 L771.01,1959.06"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M2329.44,1270.84 L2329.44,1311.51"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M2627.44,2139.84 L2627.44,2180.51"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        {/* windows end */}
        {/* doors start */}
        <path
          d="M672.69,561.22 L771.68,561.41"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M1078.25,561.69 L1120.46,561.69"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M573.69,1646.22 L672.68,1646.41"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M1519.31,874.25 L1519.31,916.46"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M1323.31,1557.25 L1323.31,1599.46"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M1806.31,1332.25 L1806.31,1374.46"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M2329.31,967.25 L2329.31,1009.46"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M2010.25,1704.69 L2052.46,1704.69"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M2805.25,960.69 L2847.46,960.69"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M2920.31,1294.25 L2920.31,1336.46"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M2758.69,1615.22 L2857.68,1615.41"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M2983.25,1618.69 L3025.46,1618.69"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M2264.28,2183.19 L2264.09,2282.18"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M2264.28,1896.19 L2264.09,1995.18"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M1676.69,1858.22 L1775.68,1858.41"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M896.25,288.69 L938.46,288.69"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M826.25,288.69 L868.46,288.69"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M965.25,288.69 L1007.46,288.69"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        <path
          d="M975.69,1527.22 L1074.68,1527.41"
          className="cursor-pointer"
          data-type="barricade"
          onClick={onClickHandler}
        />
        {/* doors end */}
      </g>
    </svg>
  );
}
