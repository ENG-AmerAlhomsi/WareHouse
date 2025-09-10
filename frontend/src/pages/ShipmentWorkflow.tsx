import React, { useState } from 'react';
import { useShipments } from '@/contexts/ShipmentContext';
import { useAuth } from '@/contexts/AuthContext';
import { Shipment } from '@/types/warehouse';
import { Order } from '@/types/order';
import { isAdmin } from '@/utils/authHelpers';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, MapPin, User, CheckCircle, Clock, AlertCircle, Check } from 'lucide-react';
import { shipmentApi } from '@/services/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { orderApi } from '@/services/api';

// Helper function to format dates
const formatDate = (dateInput: string | Date | Array<number> | undefined | null) => {
  if (!dateInput) return 'N/A';
  try {
    let date: Date;
    
    // Handle array format [year, month, day, hour, minute, second, nanoseconds]
    if (Array.isArray(dateInput)) {
      // Month is 0-based in JavaScript Date
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
      date = new Date(year, month - 1, day, hour, minute, second);
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Date parsing error:', error, dateInput);
    return 'N/A';
  }
};

const ShipmentWorkflow = () => {
  const { user } = useAuth();
  const { employeeShipments, refreshShipments } = useShipments();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveredOrders, setDeliveredOrders] = useState<Set<string>>(new Set());

  // Helper to find the order by id
  const findOrder = (orderId: string): Order | undefined => {
    if (!selectedShipment) return undefined;
    return selectedShipment.orders.find(order => order.id === orderId);
  };

  // View all details for a specific order
  const handleOrderView = async (shipment: Shipment, orderId: string) => {
    try {
      // Fetch detailed order information with full product details
      const response = await orderApi.getById(parseInt(orderId));
      if (response && response.data) {
        // Update the shipment object with the detailed order data
        const updatedShipment = {
          ...shipment,
          orders: shipment.orders.map(order => 
            order.id === orderId ? { ...order, products: response.data.products } : order
          )
        };
        setSelectedShipment(updatedShipment);
      } else {
        setSelectedShipment(shipment);
      }
      setViewOrderId(orderId);
    } catch (error) {
      console.error('Failed to fetch detailed order information:', error);
      setSelectedShipment(shipment);
      setViewOrderId(orderId);
    }
  };

  // Start the delivery process for a shipment
  const handleStartDelivery = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsDeliveryDialogOpen(true);
  };

  // Complete the delivery
  const handleCompleteDelivery = async () => {
    if (!selectedShipment || !selectedShipment.id) return;

    try {
      // Update shipment status to 'In Transit'
      // Convert string IDs to numbers for the API
      const formattedShipment = {
        ...selectedShipment,
        statusName: 'In Transit',
        orders: selectedShipment.orders.map(order => ({ id: parseInt(order.id) }))
      };
      
      await shipmentApi.update(selectedShipment.id, formattedShipment);
      
      // Update all orders in this shipment to 'Shipped' status (capitalized)
      for (const order of selectedShipment.orders) {
        try {
          await orderApi.updateOrder(parseInt(order.id), {
            ...order,
            status: 'Shipped'
          });
        } catch (orderError) {
          console.error(`Failed to update order ${order.id}:`, orderError);
        }
      }
      
      toast.success('Delivery started successfully');
      setIsDeliveryDialogOpen(false);
      refreshShipments();
    } catch (error) {
      console.error('Error starting delivery:', error);
      toast.error('Failed to start delivery');
    }
  };

  // Mark an individual order as delivered
  const handleMarkOrderDelivered = async (shipment: Shipment, order: Order) => {
    if (!shipment.id) return;

    try {
      // Update the order status to 'Delivered'
      await orderApi.updateOrder(parseInt(order.id), {
        ...order,
        status: 'Delivered'
      });
      
      // Add to delivered orders Set
      const newDeliveredOrders = new Set(deliveredOrders);
      newDeliveredOrders.add(order.id);
      setDeliveredOrders(newDeliveredOrders);
      
      toast.success(`Order #${order.id} marked as delivered`);
      refreshShipments();
    } catch (error) {
      console.error(`Error marking order ${order.id} as delivered:`, error);
      toast.error('Failed to update order status');
    }
  };

  // Mark a shipment as completed, without automatically marking all orders as delivered
  const handleMarkShipmentCompleted = async (shipment: Shipment) => {
    if (!shipment.id) return;

    // Check if all orders are delivered
    const allDelivered = shipment.orders.every(order => 
      deliveredOrders.has(order.id) || order.status === 'Delivered'
    );

    if (!allDelivered) {
      toast.error('All orders must be delivered before completing the shipment');
      return;
    }

    try {
      // Update shipment status to 'Completed' without changing order statuses
      const formattedShipment = {
        ...shipment,
        statusName: 'Completed',
        orders: shipment.orders.map(order => ({ id: parseInt(order.id) }))
      };
      
      await shipmentApi.update(shipment.id, formattedShipment);
      toast.success('Shipment marked as completed');
      refreshShipments();
    } catch (error) {
      console.error('Error marking shipment as completed:', error);
      toast.error('Failed to update shipment status');
    }
  };

  // Filter shipments by status if needed
  const pendingShipments = employeeShipments.filter(s => s.statusName === 'Pending');
  const inTransitShipments = employeeShipments.filter(s => s.statusName === 'In Transit');
  const completedShipments = employeeShipments.filter(s => s.statusName === 'Completed');

  const getViewedOrder = () => {
    if (!viewOrderId || !selectedShipment) return null;
    return selectedShipment.orders.find(order => order.id === viewOrderId);
  };

  const viewedOrder = getViewedOrder();

  // Check if all orders in a shipment are delivered
  const areAllOrdersDelivered = (shipment: Shipment) => {
    return shipment.orders.every(order => 
      deliveredOrders.has(order.id) || order.status === 'Delivered'
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Shipping Workflow</h1>

      {!user ? (
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p>Please log in to access your shipping tasks.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Pending Shipments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingShipments.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  In Transit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{inTransitShipments.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedShipments.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Shipments Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Pending Shipments
            </h2>
            {pendingShipments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p>No pending shipments assigned to you.</p>
                </CardContent>
              </Card>
            ) : (
              pendingShipments.map(shipment => (
                <Card key={shipment.id} className="mb-4">
                  <CardHeader>
                    <CardTitle>{shipment.shipmentName}</CardTitle>
                    <CardDescription>
                      Type: {shipment.typeName} | Created: {formatDate(shipment.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:justify-between mb-4">
                      <div className="mb-4 md:mb-0">
                        <p className="text-sm font-medium flex items-center">
                          <MapPin className="mr-1 h-4 w-4" /> From: {shipment.fromName}
                        </p>
                        <p className="text-sm font-medium flex items-center">
                          <MapPin className="mr-1 h-4 w-4" /> To: {shipment.toName}
                        </p>
                      </div>
                      <div>
                        <Badge variant="outline">{shipment.statusName}</Badge>
                      </div>
                    </div>
                    
                    <h3 className="font-medium mb-2">Orders in this Shipment ({shipment.orders.length})</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shipment.orders.map(order => (
                            <TableRow key={order.id}>
                              <TableCell>#{order.id}</TableCell>
                              <TableCell>{order.customer}</TableCell>
                              <TableCell>{order.items} items</TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOrderView(shipment, order.id)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      className="bg-wms-yellow text-black hover:bg-wms-yellow-dark"
                      onClick={() => handleStartDelivery(shipment)}
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      Start Delivery
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          {/* In Transit Shipments Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Truck className="mr-2 h-5 w-5" />
              In Transit Shipments
            </h2>
            {inTransitShipments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p>No shipments currently in transit.</p>
                </CardContent>
              </Card>
            ) : (
              inTransitShipments.map(shipment => (
                <Card key={shipment.id} className="mb-4">
                  <CardHeader>
                    <CardTitle>{shipment.shipmentName}</CardTitle>
                    <CardDescription>
                      Type: {shipment.typeName} | Started: {formatDate(shipment.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:justify-between mb-4">
                      <div className="mb-4 md:mb-0">
                        <p className="text-sm font-medium flex items-center">
                          <MapPin className="mr-1 h-4 w-4" /> From: {shipment.fromName}
                        </p>
                        <p className="text-sm font-medium flex items-center">
                          <MapPin className="mr-1 h-4 w-4" /> To: {shipment.toName}
                        </p>
                      </div>
                      <div>
                        <Badge variant="secondary">{shipment.statusName}</Badge>
                      </div>
                    </div>
                    
                    <h3 className="font-medium mb-2">Orders in this Shipment ({shipment.orders.length})</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shipment.orders.map(order => {
                            const isOrderDelivered = deliveredOrders.has(order.id) || order.status === 'Delivered';
                            return (
                              <TableRow key={order.id}>
                                <TableCell>#{order.id}</TableCell>
                                <TableCell>{order.customer}</TableCell>
                                <TableCell>{order.items} items</TableCell>
                                <TableCell>
                                  {isOrderDelivered ? (
                                    <Badge className="bg-green-500">Delivered</Badge>
                                  ) : (
                                    <Badge variant="outline">In Transit</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleOrderView(shipment, order.id)}
                                    >
                                      View
                                    </Button>
                                    {!isOrderDelivered && (
                                      <Button 
                                        size="sm" 
                                        className="bg-green-600 text-white hover:bg-green-700"
                                        onClick={() => handleMarkOrderDelivered(shipment, order)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm">
                      {areAllOrdersDelivered(shipment) ? (
                        <span className="text-green-600 font-medium">All orders delivered ✓</span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          {shipment.orders.filter(order => deliveredOrders.has(order.id) || order.status === 'Delivered').length} 
                          of {shipment.orders.length} orders delivered
                        </span>
                      )}
                    </div>
                    <Button 
                      className="bg-green-600 text-white hover:bg-green-700"
                      onClick={() => handleMarkShipmentCompleted(shipment)}
                      disabled={!areAllOrdersDelivered(shipment)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Shipment
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          {/* Completed Shipments Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Completed Shipments
            </h2>
            {completedShipments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p>No completed shipments.</p>
                </CardContent>
              </Card>
            ) : (
              completedShipments.map(shipment => (
                <Card key={shipment.id} className="mb-4">
                  <CardHeader>
                    <CardTitle>{shipment.shipmentName}</CardTitle>
                    <CardDescription>
                      Type: {shipment.typeName} | Completed: {formatDate(shipment.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:justify-between mb-4">
                      <div className="mb-4 md:mb-0">
                        <p className="text-sm font-medium flex items-center">
                          <MapPin className="mr-1 h-4 w-4" /> From: {shipment.fromName}
                        </p>
                        <p className="text-sm font-medium flex items-center">
                          <MapPin className="mr-1 h-4 w-4" /> To: {shipment.toName}
                        </p>
                      </div>
                      <div>
                        <Badge variant="default">{shipment.statusName}</Badge>
                      </div>
                    </div>
                    
                    <h3 className="font-medium mb-2">Delivered Orders ({shipment.orders.length})</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shipment.orders.map(order => (
                            <TableRow key={order.id}>
                              <TableCell>#{order.id}</TableCell>
                              <TableCell>{order.customer}</TableCell>
                              <TableCell>{order.items} items</TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOrderView(shipment, order.id)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Order Details Dialog */}
      {viewedOrder && (
        <Dialog open={!!viewOrderId} onOpenChange={() => setViewOrderId(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Order #{viewedOrder.id} Details</DialogTitle>
              <DialogDescription>
                View detailed information about this order.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-1">Customer</h3>
                  <p>{viewedOrder.customer}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Order Date</h3>
                  <p>{formatDate(viewedOrder.date)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Shipping Address</h3>
                {viewedOrder.shippingAddress ? (
                  <p>
                    {viewedOrder.shippingAddress.address}<br />
                    {viewedOrder.shippingAddress.city}, {viewedOrder.shippingAddress.state} {viewedOrder.shippingAddress.zipCode}
                  </p>
                ) : (
                  <p>No address provided</p>
                )}
              </div>
              
              {/* Only show payment info to admins */}
              {isAdmin(user) && (
                <div>
                  <h3 className="font-medium mb-1">Payment Information</h3>
                  {viewedOrder.payment ? (
                    <p>Payment Method: Card ending in {viewedOrder.payment.last4}</p>
                  ) : (
                    <p>No payment information</p>
                  )}
                </div>
              )}
              
              {viewedOrder.products && viewedOrder.products.length > 0 && (
                <div>
                  <h3 className="font-medium mb-1">Products</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewedOrder.products.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>{product.name || product.productName || product.product?.name || `Product ${index + 1}`}</TableCell>
                          <TableCell>{product.quantity || 1}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={() => setViewOrderId(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delivery Confirmation Dialog */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Start Delivery</DialogTitle>
            <DialogDescription>
              Confirm you want to start the delivery process.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">
              You are about to start delivery for shipment:
              <span className="font-bold block mt-2">{selectedShipment?.shipmentName}</span>
            </p>
            
            <p className="mb-4">
              Destination: <span className="font-medium">{selectedShipment?.toName}</span>
            </p>
            
            <p className="mb-4">
              This shipment contains {selectedShipment?.orders.length} orders to deliver.
            </p>
            
            <p>
              Once you start the delivery, the shipment status will change to "In Transit".
            </p>
          </div>
          
          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-wms-yellow text-black hover:bg-wms-yellow-dark"
              onClick={handleCompleteDelivery}
            >
              <Truck className="mr-2 h-4 w-4" />
              Begin Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShipmentWorkflow; 