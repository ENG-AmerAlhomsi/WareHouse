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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useState } from "react";
import {
  Dialog as ConfirmDialog,
  DialogContent as ConfirmDialogContent,
  DialogDescription as ConfirmDialogDescription,
  DialogFooter as ConfirmDialogFooter,
  DialogHeader as ConfirmDialogHeader,
  DialogTitle as ConfirmDialogTitle,
} from "@/components/ui/dialog";

interface EditOrderProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editedOrder: Order | null;
  setEditedOrder: (order: Order | null) => void;
  isUpdating: boolean;
  handleUpdateOrder: () => Promise<void>;
}

const EditOrder = ({
  isOpen,
  setIsOpen,
  editedOrder,
  setEditedOrder,
  isUpdating,
  handleUpdateOrder
}: EditOrderProps) => {
  const [showRemoveProductConfirm, setShowRemoveProductConfirm] = useState(false);
  const [productIndexToRemove, setProductIndexToRemove] = useState<number | null>(null);

  if (!editedOrder) return null;

  // Initiate product removal confirmation
  const confirmRemoveProduct = (index: number) => {
    setProductIndexToRemove(index);
    setShowRemoveProductConfirm(true);
  };

  // Remove a product from the order after confirmation
  const handleRemoveProduct = () => {
    if (productIndexToRemove === null || !editedOrder || !editedOrder.products) return;
    
    const index = productIndexToRemove;
    const quantity = editedOrder.products[index].quantity || 0;
    const product = editedOrder.products[index].product;
    const productPrice = product?.unitPrice || 0;
    const itemTotal = quantity * productPrice;
    const updatedProducts = [...editedOrder.products];
    updatedProducts.splice(index, 1);
    
    // Calculate new value by subtracting the item's price from the current total
    const currentTotal = parseFloat(editedOrder.value.replace(/[^0-9.]/g, '')) || 0;
    const newTotal = Math.max(0, currentTotal - itemTotal).toFixed(2);
    
    setEditedOrder({
      ...editedOrder,
      products: updatedProducts,
      items: Math.max(0, (editedOrder.items || 0) - quantity),
      value: `$${newTotal}`
    });
    
    // Clear the confirmation state
    setShowRemoveProductConfirm(false);
    setProductIndexToRemove(null);
  };
  
  // Update product quantity
  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (!editedOrder || !editedOrder.products) return;
    
    const prevQuantity = editedOrder.products[index].quantity || 0;
    const quantityDiff = quantity - prevQuantity;
    const product = editedOrder.products[index].product;
    const productPrice = product?.unitPrice || 0;
    const priceDifference = quantityDiff * productPrice;
    
    const updatedProducts = [...editedOrder.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity
    };
    
    // Calculate new total value by adding the price difference
    const currentTotal = parseFloat(editedOrder.value.replace(/[^0-9.]/g, '')) || 0;
    const newTotal = (currentTotal + priceDifference).toFixed(2);
    
    setEditedOrder({
      ...editedOrder,
      products: updatedProducts,
      items: (editedOrder.items || 0) - prevQuantity + quantity,
      value: `$${newTotal}`
    });
  };
  
  // Update address fields
  const handleUpdateAddress = (field: string, value: string) => {
    if (!editedOrder) return;
    
    const currentAddress = editedOrder.shippingAddress || {
      address: '',
      city: '',
      state: '',
      zipCode: ''
    };
    
    setEditedOrder({
      ...editedOrder,
      shippingAddress: {
        ...currentAddress,
        [field]: value
      }
    });
  };
  
  // Update order status
  const handleUpdateStatus = (status: string) => {
    if (!editedOrder) return;
    
    setEditedOrder({
      ...editedOrder,
      status
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order #{editedOrder.id}</DialogTitle>
            <DialogDescription>
              Update order information
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {/* Status Selection */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Order Status</h3>
              <Select 
                value={editedOrder.status} 
                onValueChange={handleUpdateStatus}
                disabled={editedOrder.status?.toLowerCase() === "canceled"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Ready for Shipping">Ready for Shipping</SelectItem>
                  <SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Shipping Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address" className="text-sm">Address</label>
                  <Input 
                    id="address"
                    value={editedOrder.shippingAddress?.address || ''}
                    onChange={(e) => handleUpdateAddress('address', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="city" className="text-sm">City</label>
                  <Input 
                    id="city"
                    value={editedOrder.shippingAddress?.city || ''}
                    onChange={(e) => handleUpdateAddress('city', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="state" className="text-sm">State</label>
                  <Input 
                    id="state"
                    value={editedOrder.shippingAddress?.state || ''}
                    onChange={(e) => handleUpdateAddress('state', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="zipCode" className="text-sm">Zip Code</label>
                  <Input 
                    id="zipCode"
                    value={editedOrder.shippingAddress?.zipCode || ''}
                    onChange={(e) => handleUpdateAddress('zipCode', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Products Section (only editable if status is pending) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sm">Products</h3>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      {editedOrder.status?.toLowerCase() === "pending" && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editedOrder.products && editedOrder.products.length > 0 ? (
                      editedOrder.products.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product?.name || 'Unknown Product'}</TableCell>
                          <TableCell className="text-center">
                            <Input 
                              type="number" 
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                              className="w-20 mx-auto text-center"
                              disabled={editedOrder.status?.toLowerCase() !== "pending"}
                            />
                          </TableCell>
                          {editedOrder.status?.toLowerCase() === "pending" && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmRemoveProduct(index)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={editedOrder.status?.toLowerCase() === "pending" ? 3 : 2} className="text-center py-4">
                          No products in this order
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateOrder}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Product Confirmation Dialog */}
      <ConfirmDialog open={showRemoveProductConfirm} onOpenChange={setShowRemoveProductConfirm}>
        <ConfirmDialogContent className="max-w-md">
          <ConfirmDialogHeader>
            <ConfirmDialogTitle>Remove Product</ConfirmDialogTitle>
            <ConfirmDialogDescription>
              Are you sure you want to remove this product from the order? This will update the order total.
            </ConfirmDialogDescription>
          </ConfirmDialogHeader>
          <ConfirmDialogFooter className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRemoveProductConfirm(false);
                setProductIndexToRemove(null);
              }}
            >
              No, Keep Product
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveProduct}
            >
              Yes, Remove Product
            </Button>
          </ConfirmDialogFooter>
        </ConfirmDialogContent>
      </ConfirmDialog>
    </>
  );
};

export default EditOrder; 