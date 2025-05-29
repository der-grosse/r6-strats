import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface StratEditorLayoutSidebarProps {
  onAssetAdd: (asset: Asset & Partial<PlacedAsset>) => void;
}

export default function StratEditorLayoutSidebar(
  props: Readonly<StratEditorLayoutSidebarProps>
) {
  return (
    <div className="h-full absolute inset-0">
      <ScrollArea className="h-full p-2">
        <div
          className="grid gap-2 items-center pb-4"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(42px, 1fr))",
          }}
        >
          {/* {[].map((asset) => (
            <Button
              variant="outline"
              key={gadget.id}
              className="p-1 h-auto"
              onClick={() => {
                props.onAssetAdd({
                  id: `gadget-${gadget.id}`,
                  type: "gadget",
                  gadget: gadget.id,
                  pickedOPID: gadget.pickedOPID,
                  size: {
                    width: ASSET_BASE_SIZE,
                    height: ASSET_BASE_SIZE * (gadget.gadget?.aspectRatio ?? 1),
                  },
                });
              }}
            >
              <SecondaryGadgetIcon id={gadget.id} />
            </Button>
          ))} */}
        </div>
      </ScrollArea>
    </div>
  );
}
