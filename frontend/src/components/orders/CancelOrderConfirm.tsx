import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CancelOrderConfirmProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  orderToCancel: string | null;
  setOrderToCancel: (orderId: string | null) => void;
  isCanceling: string | null;
  handleCancelOrder: () => Promise<void>;
}

const CancelOrderConfirm = ({
  isOpen,
  setIsOpen, 
  orderToCancel,
  setOrderToCancel,
  isCanceling,
  handleCancelOrder
}: CancelOrderConfirmProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this order? This action cannot be undone, and the stock will be returned to inventory.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsOpen(false);
              setOrderToCancel(null);
            }}
          >
            No, Keep Order
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCancelOrder}
            disabled={isCanceling !== null}
          >
            {isCanceling !== null ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Yes, Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelOrderConfirm; 