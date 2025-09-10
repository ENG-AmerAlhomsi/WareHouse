import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PurchaseOrder, Pallet } from '../types/purchaseOrder';
import { purchaseOrderApi, palletApi } from '../services/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Truck, Package, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, ClipboardCheck } from 'lucide-react';

const PalletReceivingDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [shippingOrders, setShippingOrders] = useState<PurchaseOrder[]>([]);
  const [qqCheckOrders, setQqCheckOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
  const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState<boolean>(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [selectedPalletForInspection, setSelectedPalletForInspection] = useState<Pallet | null>(null);
  const [showProducts, setShowProducts] = useState<boolean>(false);
  const [inspectionData, setInspectionData] = useState({
    qualityApproved: false,
    quantityApproved: false,
    adjustedQuantity: 0,
    notes: ''
  });

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch orders with "Shipping" status - these are the ones arriving
      const shippingResponse = await purchaseOrderApi.getByStatus('Shipping');
      setShippingOrders(Array.isArray(shippingResponse) ? shippingResponse : []);
      
      // Fetch orders with "QQ CHECK" status - these are already received and in inspection
      const qqCheckResponse = await purchaseOrderApi.getByStatus('QQ CHECK');
      setQqCheckOrders(Array.isArray(qqCheckResponse) ? qqCheckResponse : []);
      
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setShippingOrders([]);
      setQqCheckOrders([]);
      toast({
        title: 'Error',
        description: 'Failed to fetch purchase orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmArrival = async (purchaseOrder: PurchaseOrder) => {
    if (!purchaseOrder.id) return;
    
    try {
      await purchaseOrderApi.updateStatus(purchaseOrder.id, 'QQ CHECK');
      toast({
        title: 'Success',
        description: `Shipment confirmed for PO #${purchaseOrder.id}. Moved to Quality & Quantity Inspection.`,
      });
      
      // Refresh the data
      fetchPurchaseOrders();
      setIsConfirmDialogOpen(false);
      setSelectedPurchaseOrder(null);
    } catch (error) {
      console.error('Error confirming shipment arrival:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm shipment arrival',
        variant: 'destructive',
      });
    }
  };

  const handleViewPurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setIsViewDialogOpen(true);
  };

  const openConfirmDialog = (purchaseOrder: PurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setIsConfirmDialogOpen(true);
  };

  const openInspectionDialog = (purchaseOrder: PurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setIsInspectionDialogOpen(true);
  };

  const startPalletInspection = (pallet: Pallet) => {
    setSelectedPalletForInspection(pallet);
    setInspectionData({
      qualityApproved: false,
      quantityApproved: false,
      adjustedQuantity: pallet.quantity,
      notes: ''
    });
  };

  const handleInspectPallet = async () => {
    if (!selectedPalletForInspection?.id) return;

    try {
      const updatedPallet = await palletApi.inspect(selectedPalletForInspection.id, inspectionData);
      
      toast({
        title: 'Success',
        description: `Pallet ${selectedPalletForInspection.palletName} inspection completed`,
      });

      // Update the pallet status in the current purchase order state
      if (selectedPurchaseOrder?.pallets) {
        const updatedPallets = selectedPurchaseOrder.pallets.map(pallet => 
          pallet.id === selectedPalletForInspection.id 
            ? { ...pallet, status: updatedPallet.status, quantity: updatedPallet.quantity }
            : pallet
        );
        
        const updatedPurchaseOrder = {
          ...selectedPurchaseOrder,
          pallets: updatedPallets
        };
        
        setSelectedPurchaseOrder(updatedPurchaseOrder);
        
        // Also update the qqCheckOrders state to reflect the change
        setQqCheckOrders(prev => prev.map(order => 
          order.id === selectedPurchaseOrder.id 
            ? updatedPurchaseOrder
            : order
        ));
      }

      // Reset inspection form
      setSelectedPalletForInspection(null);
      setInspectionData({
        qualityApproved: false,
        quantityApproved: false,
        adjustedQuantity: 0,
        notes: ''
      });

    } catch (error) {
      console.error('Error inspecting pallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete pallet inspection',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteOrder = async (purchaseOrder: PurchaseOrder) => {
    if (!purchaseOrder.id) return;

    try {
      await purchaseOrderApi.updateStatus(purchaseOrder.id, 'Complete');
      toast({
        title: 'Success',
        description: `Purchase Order #${purchaseOrder.id} has been completed!`,
      });
      
      // Remove the completed order from QQ CHECK orders immediately
      setQqCheckOrders(prev => prev.filter(order => order.id !== purchaseOrder.id));
      
      // Close any open dialogs
      setIsInspectionDialogOpen(false);
      setIsViewDialogOpen(false);
      setSelectedPurchaseOrder(null);
      
    } catch (error) {
      console.error('Error completing purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete purchase order',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Shipping':
        return 'bg-purple-100 text-purple-800';
      case 'QQ CHECK':
        return 'bg-orange-100 text-orange-800';
      case 'Ready to Store':
        return 'bg-green-100 text-green-800';
      case 'Complete':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p>Loading shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Pallet Receiving Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incoming Shipments</CardTitle>
            <Truck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{shippingOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              Orders in transit requiring confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In QQ Inspection</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{qqCheckOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              Orders awaiting quality inspection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pallets</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {[...shippingOrders, ...qqCheckOrders].reduce((total, order) => total + (order.pallets?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pallets to process
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Incoming Shipments Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-purple-600" />
            Incoming Shipments
            <Badge variant="secondary">{shippingOrders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shippingOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No incoming shipments at the moment</p>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="space-y-3 sm:hidden">
                {shippingOrders.map((order) => (
                  <Card key={order.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-500">PO #{order.id}</div>
                        <div className="font-medium">{order.supplierName}</div>
                      </div>
                      <Badge className={getStatusBadgeColor(order.status)}>{order.status}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <div className="text-gray-500">Expected</div>
                        <div>{format(new Date(order.expectedArrivalTime), 'MMM dd, yyyy')}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Pallets</div>
                        <div>{order.pallets?.length || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Total</div>
                        <div>${order.totalPrice.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewPurchaseOrder(order)} className="flex-1">View</Button>
                      <Button size="sm" onClick={() => openConfirmDialog(order)} className="bg-green-600 hover:bg-green-700 flex-1">Confirm</Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">PO ID</TableHead>
                      <TableHead className="min-w-[160px]">Supplier</TableHead>
                      <TableHead className="min-w-[140px]">Expected Arrival</TableHead>
                      <TableHead className="min-w-[120px]">Total Price</TableHead>
                      <TableHead className="min-w-[80px]">Pallets</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shippingOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{order.supplierName}</TableCell>
                        <TableCell>{format(new Date(order.expectedArrivalTime), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>${order.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{order.pallets?.length || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(order.status)}>{order.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewPurchaseOrder(order)}>View</Button>
                            <Button size="sm" onClick={() => openConfirmDialog(order)} className="bg-green-600 hover:bg-green-700">Confirm Arrival</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* QQ Inspection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            In Quality & Quantity Inspection
            <Badge variant="secondary">{qqCheckOrders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {qqCheckOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No orders in inspection queue</p>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="space-y-3 sm:hidden">
                {qqCheckOrders.map((order) => (
                  <Card key={order.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-500">PO #{order.id}</div>
                        <div className="font-medium">{order.supplierName}</div>
                      </div>
                      <Badge className={getStatusBadgeColor(order.status)}>{order.status}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <div className="text-gray-500">Received</div>
                        <div>{format(new Date(), 'MMM dd, yyyy')}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Pallets</div>
                        <div>{order.pallets?.length || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Total</div>
                        <div>${order.totalPrice.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewPurchaseOrder(order)} className="flex-1">View</Button>
                      <Button size="sm" onClick={() => openInspectionDialog(order)} className="bg-orange-600 hover:bg-orange-700 flex-1">
                        <Package className="h-3 w-3 mr-1" /> Inspect
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">PO ID</TableHead>
                      <TableHead className="min-w-[160px]">Supplier</TableHead>
                      <TableHead className="min-w-[140px]">Received Date</TableHead>
                      <TableHead className="min-w-[120px]">Total Price</TableHead>
                      <TableHead className="min-w-[80px]">Pallets</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qqCheckOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{order.supplierName}</TableCell>
                        <TableCell>{format(new Date(), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>${order.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{order.pallets?.length || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(order.status)}>{order.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewPurchaseOrder(order)}>View</Button>
                            <Button size="sm" onClick={() => openInspectionDialog(order)} className="bg-orange-600 hover:bg-orange-700">Inspect Pallets</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Shipment Arrival</DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm the arrival of Purchase Order #{selectedPurchaseOrder?.id}?
            </DialogDescription>
          </DialogHeader>
          
          {selectedPurchaseOrder && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="font-medium text-blue-900 mb-2">Order Details:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-medium ml-2">{selectedPurchaseOrder.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Expected:</span>
                    <span className="font-medium ml-2">
                      {format(new Date(selectedPurchaseOrder.expectedArrivalTime), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pallets:</span>
                    <span className="font-medium ml-2">{selectedPurchaseOrder.pallets?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-medium ml-2">${selectedPurchaseOrder.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h4 className="font-medium text-green-900 mb-2">Next Steps:</h4>
                <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                  <li>Order will be moved to Quality & Quantity Inspection</li>
                  <li>Pallets will be unloaded to inspection area</li>
                  <li>Quality control process will begin</li>
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedPurchaseOrder && handleConfirmArrival(selectedPurchaseOrder)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirm Arrival
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

             {/* View Purchase Order Dialog */}
       <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
         <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col">
           <DialogHeader className="flex-shrink-0">
             <DialogTitle className="text-base sm:text-lg">Purchase Order Details - #{selectedPurchaseOrder?.id}</DialogTitle>
             <DialogDescription className="text-sm">
               Detailed information about the purchase order and its pallets
             </DialogDescription>
           </DialogHeader>
          
                     {selectedPurchaseOrder && (
             <ScrollArea className="flex-1 overflow-auto">
               <div className="space-y-4 sm:space-y-6 p-4">
                 {/* Order Summary */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
                    <p className="font-medium">{selectedPurchaseOrder.supplierName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <Badge className={getStatusBadgeColor(selectedPurchaseOrder.status)}>
                      {selectedPurchaseOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Expected Arrival</h3>
                    <p>{format(new Date(selectedPurchaseOrder.expectedArrivalTime), 'MMMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
                    <p className="font-medium">${selectedPurchaseOrder.totalPrice.toFixed(2)}</p>
                  </div>
                </div>

                                 {/* Products - Collapsible */}
                 <div>
                   <Button
                     variant="ghost"
                     onClick={() => setShowProducts(!showProducts)}
                     className="flex items-center gap-2 p-0 h-auto font-medium text-base sm:text-lg mb-2 hover:bg-gray-50"
                   >
                     <span>Products ({selectedPurchaseOrder.products.length})</span>
                     {showProducts ? (
                       <ChevronUp className="h-4 w-4" />
                     ) : (
                       <ChevronDown className="h-4 w-4" />
                     )}
                   </Button>
                   
                   {showProducts && (
                     <>
                       {/* Mobile card view */}
                       <div className="space-y-3 sm:hidden">
                         {selectedPurchaseOrder.products.map((product, index) => (
                           <Card key={index} className="p-3">
                             <div className="space-y-2">
                               <div className="font-medium text-sm">
                                 {product.productName || product.product?.name || `Product ${index + 1}`}
                               </div>
                               <div className="grid grid-cols-2 gap-2 text-sm">
                                 <div>
                                   <span className="text-gray-500">Quantity:</span>
                                   <span className="ml-1 font-medium">{product.quantity}</span>
                                 </div>
                                 <div>
                                   <span className="text-gray-500">Price:</span>
                                   <span className="ml-1 font-medium">${product.price?.toFixed(2)}</span>
                                 </div>
                                 <div>
                                   <span className="text-gray-500">Expected Pallets:</span>
                                   <span className="ml-1 font-medium">{product.expectedPallets}</span>
                                 </div>
                                 <div>
                                   <span className="text-gray-500">Subtotal:</span>
                                   <span className="ml-1 font-medium">${(product.price * product.quantity).toFixed(2)}</span>
                                 </div>
                               </div>
                             </div>
                           </Card>
                         ))}
                       </div>
                       
                       {/* Desktop table view */}
                       <div className="hidden sm:block overflow-x-auto">
                         <Table>
                           <TableHeader>
                             <TableRow>
                               <TableHead className="min-w-[120px]">Product</TableHead>
                               <TableHead className="min-w-[80px]">Quantity</TableHead>
                               <TableHead className="min-w-[100px]">Expected Pallets</TableHead>
                               <TableHead className="min-w-[90px]">Price per Unit</TableHead>
                               <TableHead className="min-w-[80px]">Subtotal</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {selectedPurchaseOrder.products.map((product, index) => (
                               <TableRow key={index}>
                                 <TableCell>
                                   <div className="max-w-[120px] truncate" title={product.productName || product.product?.name || `Product ${index + 1}`}>
                                     {product.productName || product.product?.name || `Product ${index + 1}`}
                                   </div>
                                 </TableCell>
                                 <TableCell>{product.quantity}</TableCell>
                                 <TableCell>{product.expectedPallets}</TableCell>
                                 <TableCell>${product.price?.toFixed(2)}</TableCell>
                                 <TableCell>${(product.price * product.quantity).toFixed(2)}</TableCell>
                               </TableRow>
                             ))}
                           </TableBody>
                         </Table>
                       </div>
                     </>
                   )}
                 </div>

                                 {/* Pallets - Always visible and prominent */}
                 {selectedPurchaseOrder.pallets && selectedPurchaseOrder.pallets.length > 0 && (
                   <div>
                     <h3 className="text-base sm:text-lg font-medium mb-2 text-blue-600">📦 Pallets ({selectedPurchaseOrder.pallets.length}) - Focus Area</h3>
                     
                     {/* Mobile card view */}
                     <div className="space-y-3 sm:hidden">
                       {selectedPurchaseOrder.pallets.map((pallet, index) => (
                         <Card key={index} className="p-3">
                           <div className="space-y-2">
                             <div className="flex justify-between items-start">
                               <div className="font-medium text-sm">{pallet.palletName}</div>
                               <Badge variant="outline" className="text-xs">{pallet.status}</Badge>
                             </div>
                             <div className="text-sm text-gray-600">
                               {pallet.productName || pallet.product?.name || 'Unknown Product'}
                             </div>
                             <div className="grid grid-cols-2 gap-2 text-sm">
                               <div>
                                 <span className="text-gray-500">Quantity:</span>
                                 <span className="ml-1 font-medium">{pallet.quantity}</span>
                               </div>
                               <div>
                                 <span className="text-gray-500">Max Capacity:</span>
                                 <span className="ml-1 font-medium">{pallet.maximumCapacity}</span>
                               </div>
                               <div>
                                 <span className="text-gray-500">Manufacturing:</span>
                                 <span className="ml-1 font-medium">{format(new Date(pallet.manufacturingDate), 'MMM dd, yyyy')}</span>
                               </div>
                               <div>
                                 <span className="text-gray-500">Expiry:</span>
                                 <span className="ml-1 font-medium">{format(new Date(pallet.expiryDate), 'MMM dd, yyyy')}</span>
                               </div>
                             </div>
                           </div>
                         </Card>
                       ))}
                     </div>
                     
                     {/* Desktop table view */}
                     <div className="hidden sm:block overflow-x-auto">
                       <Table>
                         <TableHeader>
                           <TableRow>
                             <TableHead className="min-w-[100px]">Pallet Name</TableHead>
                             <TableHead className="min-w-[100px]">Product</TableHead>
                             <TableHead className="min-w-[80px]">Quantity</TableHead>
                             <TableHead className="min-w-[90px]">Max Capacity</TableHead>
                             <TableHead className="min-w-[110px]">Manufacturing Date</TableHead>
                             <TableHead className="min-w-[100px]">Expiry Date</TableHead>
                             <TableHead className="min-w-[80px]">Status</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {selectedPurchaseOrder.pallets.map((pallet, index) => (
                             <TableRow key={index}>
                               <TableCell className="font-medium">
                                 <div className="max-w-[100px] truncate" title={pallet.palletName}>
                                   {pallet.palletName}
                                 </div>
                               </TableCell>
                               <TableCell>
                                 <div className="max-w-[100px] truncate" title={pallet.productName || pallet.product?.name || 'Unknown Product'}>
                                   {pallet.productName || pallet.product?.name || 'Unknown Product'}
                                 </div>
                               </TableCell>
                               <TableCell>{pallet.quantity}</TableCell>
                               <TableCell>{pallet.maximumCapacity}</TableCell>
                               <TableCell>{format(new Date(pallet.manufacturingDate), 'MMM dd, yyyy')}</TableCell>
                               <TableCell>{format(new Date(pallet.expiryDate), 'MMM dd, yyyy')}</TableCell>
                               <TableCell>
                                 <Badge variant="outline" className="text-xs">{pallet.status}</Badge>
                               </TableCell>
                             </TableRow>
                           ))}
                         </TableBody>
                       </Table>
                     </div>
                   </div>
                 )}
              </div>
            </ScrollArea>
          )}
          
                     <DialogFooter className="flex-shrink-0 mt-4 border-t pt-4">
             <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
               Close
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspection Dialog */}
      <Dialog open={isInspectionDialogOpen} onOpenChange={setIsInspectionDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg">Quality & Quantity Inspection - PO #{selectedPurchaseOrder?.id}</DialogTitle>
            <DialogDescription className="text-sm">
              Inspect each pallet for quality and quantity. Adjust quantities if there are damaged or missing items.
            </DialogDescription>
          </DialogHeader>

          {selectedPurchaseOrder && (
            <ScrollArea className="flex-1 overflow-auto">
              <div className="space-y-4 p-4">
                {/* Order Info */}
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Order Information:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Supplier:</span>
                      <span className="font-medium ml-2">{selectedPurchaseOrder.supplierName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Pallets:</span>
                      <span className="font-medium ml-2">{selectedPurchaseOrder.pallets?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Pallets Inspection */}
                {selectedPurchaseOrder.pallets && selectedPurchaseOrder.pallets.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-lg">Pallets to Inspect:</h4>
                    {selectedPurchaseOrder.pallets.map((pallet, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium">{pallet.palletName}</h5>
                              <p className="text-sm text-gray-600">
                                {pallet.productName || pallet.product?.name || 'Unknown Product'}
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={pallet.status === 'Ready to Store' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                            >
                              {pallet.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Original Quantity:</span>
                              <span className="ml-1 font-medium">{pallet.quantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Max Capacity:</span>
                              <span className="ml-1 font-medium">{pallet.maximumCapacity}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Manufacturing:</span>
                              <span className="ml-1 font-medium">{format(new Date(pallet.manufacturingDate), 'MMM dd, yyyy')}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Expiry:</span>
                              <span className="ml-1 font-medium">{format(new Date(pallet.expiryDate), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>

                          {pallet.status !== 'Ready to Store' && (
                            <div className="border-t pt-3">
                              <Button 
                                onClick={() => startPalletInspection(pallet)}
                                className="bg-orange-600 hover:bg-orange-700"
                                size="sm"
                              >
                                <ClipboardCheck className="h-4 w-4 mr-1" />
                                Start Inspection
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}

                    {/* Complete Order Button */}
                    {selectedPurchaseOrder.pallets.every(pallet => pallet.status === 'Ready to Store') && (
                      <div className="bg-green-50 border border-green-200 rounded p-4">
                        <h4 className="font-medium text-green-900 mb-2">All Pallets Inspected!</h4>
                        <p className="text-sm text-green-800 mb-3">
                          All pallets have been inspected and are ready for storage. You can now complete this purchase order.
                        </p>
                        <Button 
                          onClick={() => handleCompleteOrder(selectedPurchaseOrder)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete Purchase Order
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No pallets found for this purchase order</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="flex-shrink-0 mt-4 border-t pt-4">
            <Button variant="outline" onClick={() => setIsInspectionDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual Pallet Inspection Dialog */}
      <Dialog open={!!selectedPalletForInspection} onOpenChange={(open) => !open && setSelectedPalletForInspection(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Inspect Pallet: {selectedPalletForInspection?.palletName}</DialogTitle>
            <DialogDescription>
              Check the quality and quantity of this pallet. Adjust quantity if items are damaged or missing.
            </DialogDescription>
          </DialogHeader>

          {selectedPalletForInspection && (
            <div className="space-y-4">
              {/* Pallet Info */}
              <div className="bg-gray-50 border rounded p-3">
                <h4 className="font-medium mb-2">Pallet Information:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Product:</span>
                    <span className="ml-1 font-medium">
                      {selectedPalletForInspection.productName || selectedPalletForInspection.product?.name || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Original Quantity:</span>
                    <span className="ml-1 font-medium">{selectedPalletForInspection.quantity}</span>
                  </div>
                </div>
              </div>

              {/* Quality Check */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="qualityCheck"
                    checked={inspectionData.qualityApproved}
                    onCheckedChange={(checked) => setInspectionData(prev => ({ ...prev, qualityApproved: checked as boolean }))}
                  />
                  <Label htmlFor="qualityCheck" className="font-medium">Quality Approved</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="quantityCheck"
                    checked={inspectionData.quantityApproved}
                    onCheckedChange={(checked) => setInspectionData(prev => ({ ...prev, quantityApproved: checked as boolean }))}
                  />
                  <Label htmlFor="quantityCheck" className="font-medium">Quantity Approved</Label>
                </div>
              </div>

              {/* Quantity Adjustment */}
              <div className="space-y-2">
                <Label htmlFor="adjustedQuantity">Actual Quantity (adjust if damaged/missing)</Label>
                <Input
                  id="adjustedQuantity"
                  type="number"
                  value={inspectionData.adjustedQuantity}
                  onChange={(e) => setInspectionData(prev => ({ ...prev, adjustedQuantity: parseInt(e.target.value) || 0 }))}
                  min="0"
                  max={selectedPalletForInspection.maximumCapacity}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Inspection Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any notes about the inspection..."
                  value={inspectionData.notes}
                  onChange={(e) => setInspectionData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Warning if quantity changed */}
              {inspectionData.adjustedQuantity !== selectedPalletForInspection.quantity && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Quantity Adjustment:</strong> Original quantity was {selectedPalletForInspection.quantity}, 
                    adjusted to {inspectionData.adjustedQuantity}. 
                    Difference: {selectedPalletForInspection.quantity - inspectionData.adjustedQuantity} items.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPalletForInspection(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInspectPallet}
              disabled={!inspectionData.qualityApproved || !inspectionData.quantityApproved}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete Inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PalletReceivingDashboard;
