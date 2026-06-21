import { placeOrder } from "@/features/marketplace/actions";
import { meetupPoints } from "@/shared/lib/constants";
import { PendingSubmitButton } from "@/shared/components/feedback/pending-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

export function ListingOrderBox({ listingId, stock, showStockError }: { listingId: string; stock: number; showStockError: boolean }) {
  const isOutOfStock = stock < 1;

  return (
    <Card className="shadow-campus">
      <CardHeader>
        <CardTitle>{isOutOfStock ? "Out of stock" : "Place order"}</CardTitle>
      </CardHeader>
      <CardContent>
        {isOutOfStock ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            This listing has no available stock right now. The seller may restock it later, or existing requests may be cancelled.
          </div>
        ) : (
          <form action={placeOrder} className="space-y-4">
            <input type="hidden" name="listingId" value={listingId} />
            {showStockError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                Requested quantity exceeds available stock.
              </p>
            )}
            <Input name="quantity" type="number" min="1" max={stock} defaultValue="1" required />
            <Select name="pickupPoint" required defaultValue="">
              <option value="" disabled>Safe meetup point</option>
              {meetupPoints.map((point) => (
                <option key={point} value={point}>{point}</option>
              ))}
            </Select>
            <Textarea name="note" placeholder="Preferred time, class break, or payment note" />
            <PendingSubmitButton className="w-full" pendingChildren="Sending request">
              Send order request
            </PendingSubmitButton>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
