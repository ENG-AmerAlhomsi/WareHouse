import { Order } from "@/types/order";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileText,
  Loader2,
  X,
  Edit,
  Package,
  Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, hasRole } from "@/utils/authHelpers";

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  activeTab: string;
  isCanceling: string | null;
  confirmCancelOrder: (orderId: string) => void;
  handleViewOrderDetails: (order: Order) => void;
  handleEditOrder: (order: Order) => void;
  handleEmployeeAction?: (order: Order) => void;
  isProcessing?: boolean;
  noOrdersMessage?: string;
  formatDate: (dateString: string | undefined) => string;
}

const OrdersTable = ({
  orders,
  isLoading,
  activeTab,
  isCanceling,
  confirmCancelOrder,
  handleViewOrderDetails,
  handleEditOrder,
  handleEmployeeAction,
  isProcessing = false,
  noOrdersMessage = "No orders found matching your criteria.",
  formatDate
}: OrdersTableProps) => {
  const { user } = useAuth();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Items</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Shipment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10">
                <div className="flex justify-center items-center">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <p>Loading orders...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <TableRow key={order.id} className="hover-row">
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{formatDate(order.date)}</TableCell>
                <TableCell className="text-right">{order.items}</TableCell>
                <TableCell className="text-right">{order.value}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === "Delivered" ? "bg-green-100 text-green-800" :
                    order.status === "Shipped" ? "bg-blue-100 text-blue-800" :
                    order.status === "Ready for Shipping" ? "bg-purple-50 text-purple-800" :
                    order.status === "Ready for Pickup" ? "bg-purple-100 text-purple-800" :
                    order.status === "Processing" ? "bg-yellow-100 text-yellow-800" :
                    order.status === "Pending" ? "bg-gray-100 text-gray-800" :
                    order.status === "Canceled" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {order.status}
                  </span>
                </TableCell>
                <TableCell>{order.shipment}</TableCell>
                <TableCell className="text-right">
                  {/* View Details Button */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewOrderDetails(order)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  
                  {/* Employee Actions - Based on the employee workflow */}
                  {activeTab === "employee" && handleEmployeeAction && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEmployeeAction(order)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : hasRole(user, 'Order processing employee') ? (
                        <Package className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  {/* Edit Button - Only for admins or in business tab */}
                  {(activeTab === "business" && isAdmin(user)) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditOrder(order)}
                      disabled={order.status?.toLowerCase() === "canceled"}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Cancel Button - Only for Pending orders and admins or customers */}
                  {(activeTab === "business" && 
                    order.status?.toLowerCase() === "pending" && 
                    (isAdmin(user) || (hasRole(user, 'customer') && order.userId === user.id))) ? (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => confirmCancelOrder(order.id)}
                      disabled={isCanceling === order.id}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      {isCanceling === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </>
                      )}
                    </Button>
                  ) : ((activeTab === "business" || activeTab === "retail") && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled={true}
                      className="opacity-50 cursor-not-allowed"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  ))}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10">
                <p className="text-muted-foreground">
                  {noOrdersMessage}
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable; 