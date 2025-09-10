import { Order } from "@/types/order";
import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface OrderDetailsProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedOrder: Order | null;
  isCanceling: string | null;
  confirmCancelOrder: (orderId: string) => void;
}

const OrderDetails = ({
  isOpen,
  setIsOpen,
  selectedOrder,
  isCanceling,
  confirmCancelOrder
}: OrderDetailsProps) => {
  if (!selectedOrder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Order #{selectedOrder.id}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              selectedOrder.status === "Delivered" ? "bg-green-100 text-green-800" :
              selectedOrder.status === "Shipped" ? "bg-blue-100 text-blue-800" :
              selectedOrder.status === "Ready for Shipping" ? "bg-purple-50 text-purple-800" :
              selectedOrder.status === "Ready for Pickup" ? "bg-purple-100 text-purple-800" :
              selectedOrder.status === "Processing" ? "bg-yellow-100 text-yellow-800" :
              selectedOrder.status === "Pending" ? "bg-gray-100 text-gray-800" :
              selectedOrder.status === "Canceled" ? "bg-red-100 text-red-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {selectedOrder.status}
            </span>
          </DialogTitle>
          <DialogDescription>
            Placed on {selectedOrder.date}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Customer Information */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Customer Information</h3>
            <p>{selectedOrder.customer}</p>
          </div>

          {/* Order Information */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Order Information</h3>
            <p>Total Value: {selectedOrder.value}</p>
            <p>Items: {selectedOrder.items}</p>
            <p>Shipment Method: {selectedOrder.shipment}</p>
          </div>

          {/* Shipping Address */}
          {selectedOrder.shippingAddress && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Shipping Address</h3>
              <p>{selectedOrder.shippingAddress.address}</p>
              <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
            </div>
          )}

          {/* Payment Information */}
          {selectedOrder.payment && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Payment Information</h3>
              <p>Card ending in: {selectedOrder.payment.last4}</p>
            </div>
          )}
        </div>

        {/* Products */}
        {selectedOrder.products && selectedOrder.products.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-sm mb-2">Products</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.products.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.product?.name || 'Unknown Product'}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        ${item.product?.unitPrice?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(item.quantity * (item.product?.unitPrice || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          {selectedOrder.status?.toLowerCase() === "pending" && (
            <Button 
              onClick={() => confirmCancelOrder(selectedOrder.id)}
              variant="destructive"
              disabled={isCanceling === selectedOrder.id}
            >
              {isCanceling === selectedOrder.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Cancel Order
            </Button>
          )}
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetails; 