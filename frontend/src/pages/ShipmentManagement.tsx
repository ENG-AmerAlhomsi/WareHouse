import React, { useState, useEffect, useMemo } from 'react';
import { useShipments } from '@/contexts/ShipmentContext';
import { useOrders } from '@/contexts/OrderContext';
import { Order } from '@/types/order';
import { Shipment } from '@/types/warehouse';
import { User } from '@/types/user';
import { Check, Download, Edit, Plus, Truck, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { userApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
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

const ShipmentManagement = () => {
  const { shipments, loading, createShipment } = useShipments();
  const { orders } = useOrders();
  const { user: currentUser } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [shippingEmployees, setShippingEmployees] = useState<User[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  // Get all orders that are already in shipments
  const assignedOrderIds = useMemo(() => {
    const ids = new Set<string>();
    shipments.forEach(shipment => {
      shipment.orders.forEach(order => {
        ids.add(order.id);
      });
    });
    return ids;
  }, [shipments]);
  
  // Filter orders that are:
  // 1. Ready for shipping
  // 2. Not already assigned to any shipment
  const availableOrders = useMemo(() => {
    return orders.filter(order => 
      order.status.toLowerCase() === "ready for shipping" && 
      !assignedOrderIds.has(order.id)
    );
  }, [orders, assignedOrderIds]);

  // Fetch shipping employees
  useEffect(() => {
    const fetchShippingEmployees = async () => {
      setLoadingEmployees(true);
      try {
        // Try to get users with shipping employee role from API
        const response = await userApi.getUsersByRole('Shipping employee');
        
        if (response.data && response.data.length > 0) {
          setShippingEmployees(response.data);
        } else {
          console.warn("Could not get shipping employees from API, using fallback data");
        }
      } catch (error) {
        console.error("Error fetching shipping employees:", error);
        toast.error("Failed to load shipping employees");
        
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchShippingEmployees();
  }, []);

  // Shipment types
  const shipmentTypes = [
    'Standard',
    'Express',
    'International',
    'Bulk'
  ];

  const initialShipmentState: Omit<Shipment, 'id'> = {
    shipmentName: '',
    fromName: 'Yellow Brick Warehouse', // Default from name
    toName: '',
    shippingEmployee: '',
    typeName: 'Standard',
    statusName: 'Pending',
    orders: [],
  };

  const [newShipment, setNewShipment] = useState<Omit<Shipment, 'id'>>(initialShipmentState);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    // Reset form when dialog opens
    if (isCreateOpen) {
      setNewShipment(initialShipmentState);
      setSelectedOrderIds([]);
    }
  }, [isCreateOpen]);

  const handleCreateShipment = async () => {
    // Validation
    if (!newShipment.shipmentName) {
      toast.error('Shipment name is required');
      return;
    }
    if (!newShipment.toName) {
      toast.error('Destination is required');
      return;
    }
    if (!newShipment.shippingEmployee) {
      toast.error('Shipping employee must be assigned');
      return;
    }
    if (selectedOrderIds.length === 0) {
      toast.error('At least one order must be included');
      return;
    }

    try {
      // Map selected order IDs to actual order objects from available orders
      const selectedOrders = availableOrders.filter(order => selectedOrderIds.includes(order.id));
      
      // Create the shipment
      const createdShipment = await createShipment({
        ...newShipment,
        orders: selectedOrders
      });
      
      // Update each order's shipment field from "Not Assigned" to the shipment name
      for (const order of selectedOrders) {
        try {
          await orderApi.updateOrder(parseInt(order.id), {
            ...order,
            shipment: newShipment.shipmentName
          });
        } catch (orderError) {
          console.error(`Failed to update order ${order.id} shipment field:`, orderError);
        }
      }
      
      toast.success('Shipment created successfully');
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast.error('Failed to create shipment');
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleViewShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsViewOpen(true);
  };

  // Helper to find employee name from ID
  const getEmployeeName = (employeeId: string) => {
    const employee = shippingEmployees.find(emp => emp.id === employeeId);
    if (employee) {
      return `${employee.firstName} ${employee.lastName}`;
    }
    return employeeId; // Fallback to ID if employee not found
  };

  const getOrdersValue = () => {
    if (selectedOrderIds.length === 0) return 'No orders selected';
    return `${selectedOrderIds.length} order${selectedOrderIds.length > 1 ? 's' : ''} selected`;
  };

  // Calculate various statistics
  const inTransitShipments = shipments.filter(shipment => shipment.statusName === 'In Transit').length;
  const shippedOrders = shipments.reduce((sum, shipment) => 
    sum + shipment.orders.filter(order => order.status === 'Shipped').length, 0
  );
  const deliveredOrders = shipments.reduce((sum, shipment) => 
    sum + shipment.orders.filter(order => order.status === 'Delivered').length, 0
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shipment Management</h1>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-wms-yellow text-black hover:bg-wms-yellow-dark"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Shipment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Shipments In Transit</CardTitle>
            <CardDescription>Shipments currently in transit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inTransitShipments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Orders Shipped</CardTitle>
            <CardDescription>Orders with Shipped status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{shippedOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Orders Delivered</CardTitle>
            <CardDescription>Orders with Delivered status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{deliveredOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Orders Ready</CardTitle>
            <CardDescription>Orders ready for shipping</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{availableOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">Loading shipments...</TableCell>
              </TableRow>
            ) : shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">No shipments found</TableCell>
              </TableRow>
            ) : (
              shipments
                .sort((a, b) => {
                  // Sort by createdAt (newest first), fallback to ID if dates are equal
                  const aDate = a.createdAt || (a as any).created_at;
                  const bDate = b.createdAt || (b as any).created_at;
                  
                  if (aDate && bDate) {
                    let dateA: number, dateB: number;
                    
                    // Handle array format [year, month, day, hour, minute, second, nanoseconds]
                    if (Array.isArray(aDate) && Array.isArray(bDate)) {
                      const [yearA, monthA, dayA] = aDate;
                      const [yearB, monthB, dayB] = bDate;
                      dateA = new Date(yearA, monthA - 1, dayA).getTime();
                      dateB = new Date(yearB, monthB - 1, dayB).getTime();
                    } else {
                      dateA = new Date(aDate).getTime();
                      dateB = new Date(bDate).getTime();
                    }
                    
                    if (dateB !== dateA) return dateB - dateA;
                  }
                  
                  return (b.id || 0) - (a.id || 0);
                })
                .map((shipment) => (
                <TableRow key={shipment.id} className="hover:bg-gray-50">
                  <TableCell>{shipment.id}</TableCell>
                  <TableCell>{shipment.shipmentName}</TableCell>
                  <TableCell>{shipment.typeName}</TableCell>
                  <TableCell>{shipment.toName}</TableCell>
                  <TableCell>{getEmployeeName(shipment.shippingEmployee)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        shipment.statusName === 'Completed' ? 'default' :
                        shipment.statusName === 'In Transit' ? 'secondary' :
                        'outline'
                      }
                    >
                      {shipment.statusName}
                    </Badge>
                  </TableCell>
                  <TableCell>{shipment.orders.length}</TableCell>
                  <TableCell>{formatDate(shipment.createdAt || (shipment as any).created_at)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewShipment(shipment)}>
                        <Truck className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Shipment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="shipmentName">Shipment Name</Label>
                <Input
                  id="shipmentName"
                  value={newShipment.shipmentName}
                  onChange={(e) => setNewShipment({ ...newShipment, shipmentName: e.target.value })}
                  placeholder="Enter shipment name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="typeName">Shipment Type</Label>
                <Select
                  value={newShipment.typeName}
                  onValueChange={(value) => setNewShipment({ ...newShipment, typeName: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {shipmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fromName">From</Label>
                <Input
                  id="fromName"
                  value={newShipment.fromName}
                  onChange={(e) => setNewShipment({ ...newShipment, fromName: e.target.value })}
                  placeholder="Shipper name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="toName">To (Destination)</Label>
                <Input
                  id="toName"
                  value={newShipment.toName}
                  onChange={(e) => setNewShipment({ ...newShipment, toName: e.target.value })}
                  placeholder="Destination"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shippingEmployee">Assign Shipping Employee</Label>
              <Select
                value={newShipment.shippingEmployee}
                onValueChange={(value) => setNewShipment({ ...newShipment, shippingEmployee: value })}
                disabled={loadingEmployees}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingEmployees ? "Loading employees..." : "Select employee"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingEmployees ? (
                    <SelectItem value="loading" disabled>Loading employees...</SelectItem>
                  ) : shippingEmployees.length === 0 ? (
                    <SelectItem value="none" disabled>No shipping employees found</SelectItem>
                  ) : (
                    shippingEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.username})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Select Orders to Ship</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    {getOrdersValue()}
                    <Users className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <div className="px-4 py-2 font-medium border-b">
                    Orders Ready for Shipping ({availableOrders.length})
                  </div>
                  <ScrollArea className="h-[300px]">
                    {availableOrders.length === 0 ? (
                      <div className="px-4 py-3 text-center text-sm">
                        No orders are ready for shipping
                      </div>
                    ) : (
                      <div className="grid gap-1 p-2">
                        {availableOrders.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center space-x-2 rounded-md p-2 hover:bg-gray-100"
                          >
                            <Checkbox
                              checked={selectedOrderIds.includes(order.id)}
                              onCheckedChange={() => handleOrderSelect(order.id)}
                              id={`order-${order.id}`}
                            />
                            <Label
                              htmlFor={`order-${order.id}`}
                              className="flex-1 text-sm cursor-pointer"
                            >
                              <div className="font-medium">Order #{order.id}</div>
                              <div className="text-xs text-muted-foreground">
                                {order.customer} - {order.items} items - ${order.value}
                              </div>
                              {order.shippingAddress && (
                                <div className="text-xs text-muted-foreground">
                                  {order.shippingAddress.address}, {order.shippingAddress.city}
                                </div>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateShipment} className="bg-wms-yellow text-black hover:bg-wms-yellow-dark">
              Create Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Shipment Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Shipment Details</DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm">Shipment Name</h3>
                  <p>{selectedShipment.shipmentName}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Type</h3>
                  <p>{selectedShipment.typeName}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">From</h3>
                  <p>{selectedShipment.fromName}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">To (Destination)</h3>
                  <p>{selectedShipment.toName}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Assigned To</h3>
                  <p>{getEmployeeName(selectedShipment.shippingEmployee)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Status</h3>
                  <Badge
                    variant={
                      selectedShipment.statusName === 'Completed' ? 'default' :
                      selectedShipment.statusName === 'In Transit' ? 'secondary' :
                      'outline'
                    }
                  >
                    {selectedShipment.statusName}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-sm mb-2">Orders in Shipment</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedShipment.orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-2">
                            No orders in shipment
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedShipment.orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.id}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell>{order.value}</TableCell>
                            <TableCell>{order.items} items</TableCell>
                            <TableCell>
                              {order.shippingAddress ? (
                                <div className="text-xs">
                                  {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                                </div>
                              ) : (
                                'No address'
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShipmentManagement; 