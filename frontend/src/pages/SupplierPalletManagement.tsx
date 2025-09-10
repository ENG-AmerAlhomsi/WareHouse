import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pallet, PurchaseOrder } from '../types/purchaseOrder';
import { purchaseOrderApi } from '../services/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import { Printer } from 'lucide-react';

const SupplierPalletManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddPalletDialogOpen, setIsAddPalletDialogOpen] = useState<boolean>(false);

  // New pallet form state
  const [newPallet, setNewPallet] = useState<Partial<Pallet>>({
    palletName: '',
    quantity: 0,
    maximumCapacity: 0,
    status: 'Ready to Ship',
    manufacturingDate: '',
    expiryDate: '',
    productId: 0,
  });

  useEffect(() => {
    if (id) {
      fetchPurchaseOrder(parseInt(id));
    }
  }, [id]);

  const fetchPurchaseOrder = async (purchaseOrderId: number) => {
    try {
      setLoading(true);
      const data = await purchaseOrderApi.getById(purchaseOrderId);
      setPurchaseOrder(data);
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch purchase order details',
        variant: 'destructive',
      });
      navigate('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPallet = async () => {
    if (!id || !purchaseOrder) return;

    if (!newPallet.palletName || !newPallet.quantity || !newPallet.maximumCapacity || 
        !newPallet.manufacturingDate || !newPallet.expiryDate || !newPallet.productId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updatedPurchaseOrder = await purchaseOrderApi.addPallet(
        parseInt(id),
        newPallet as Pallet
      );
      
      setPurchaseOrder(updatedPurchaseOrder);
      setIsAddPalletDialogOpen(false);
      
      // Reset pallet form
      setNewPallet({
        palletName: '',
        quantity: 0,
        maximumCapacity: 0,
        status: 'Ready to Ship',
        manufacturingDate: '',
        expiryDate: '',
        productId: 0,
      });
      
      toast({
        title: 'Success',
        description: 'Pallet added successfully',
      });
    } catch (error) {
      console.error('Error adding pallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to add pallet',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id || !purchaseOrder) return;
    
    try {
      const updatedPurchaseOrder = await purchaseOrderApi.updateStatus(
        parseInt(id),
        newStatus as any
      );
      
      setPurchaseOrder(updatedPurchaseOrder);
      toast({
        title: 'Success',
        description: `Purchase order status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update purchase order status',
        variant: 'destructive',
      });
    }
  };

  // Verify if the user is a supplier and if they're the supplier for this purchase order
  const isSupplierForOrder = user?.roles.includes('supplier') && 
                             user?.username === purchaseOrder?.supplierName;

  // Verify if order is in the correct state for adding pallets
  const canAddPallets = purchaseOrder?.status === 'Processing';

  // Verify if all products have associated pallets
  const allProductsHavePallets = () => {
    if (!purchaseOrder) return false;
    
    // Get all unique product IDs from the purchase order products
    const productIds = new Set(purchaseOrder.products.map(p => p.productId));
    
    // Get all product IDs that have pallets
    const palletProductIds = new Set(purchaseOrder.pallets.map(p => p.productId));
    
    // Check if all product IDs have at least one pallet
    return Array.from(productIds).every(id => palletProductIds.has(id));
  };

  // Generate PDF for pallet information
  const generatePalletPDF = () => {
    if (!purchaseOrder) return;

    const doc = new jsPDF();
    
    if (purchaseOrder.pallets.length === 0) {
      // If no pallets, create a simple report
      doc.setFontSize(20);
      doc.text('Pallet Information Report', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Purchase Order #${purchaseOrder.id}`, 20, 40);
      doc.text(`Supplier: ${purchaseOrder.supplierName}`, 20, 50);
      doc.text('No pallets available', 20, 70);
      doc.save(`pallet-report-po-${purchaseOrder.id}.pdf`);
      return;
    }

    // Create a page for each pallet
    purchaseOrder.pallets.forEach((pallet, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // Header
      doc.setFontSize(24);
      doc.text('PALLET INFORMATION', 105, 20, { align: 'center' });
      
      // Purchase Order Info
      doc.setFontSize(14);
      doc.text(`Purchase Order #${purchaseOrder.id}`, 20, 40);
      doc.text(`Supplier: ${purchaseOrder.supplierName}`, 20, 50);
      
      // Pallet Details Section
      doc.setFontSize(16);
      doc.text('Pallet Details:', 20, 80);
      
      doc.setFontSize(12);
      doc.text(`Pallet Name: ${pallet.palletName}`, 20, 100);
      doc.text(`Product: ${pallet.productName || 'Unknown Product'}`, 20, 110);
      doc.text(`Quantity: ${pallet.quantity}`, 20, 120);
      doc.text(`Maximum Capacity: ${pallet.maximumCapacity}`, 20, 130);
      doc.text(`Manufacturing Date: ${new Date(pallet.manufacturingDate).toLocaleDateString()}`, 20, 150);
      doc.text(`Expiry Date: ${new Date(pallet.expiryDate).toLocaleDateString()}`, 20, 160);
      
      // Add a box around the pallet info
      doc.setDrawColor(255,212,0);
      doc.setLineWidth(0.5);
      doc.rect(15, 85, 180, 85);
      
      // Footer
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 270);
      doc.text(`Page ${index + 1} of ${purchaseOrder.pallets.length}`, 190, 270);
    });
    
    // Save the PDF
    doc.save(`pallet-report-po-${purchaseOrder.id}.pdf`);
  };

  return (
    <div className="container mx-auto py-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      ) : purchaseOrder ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Purchase Order #{purchaseOrder.id}</h1>
            <Badge className={`px-3 py-1 ${
              purchaseOrder.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
              purchaseOrder.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
              purchaseOrder.status === 'Ready to Ship' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {purchaseOrder.status}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-500">Supplier:</dt>
                    <dd>{purchaseOrder.supplierName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-500">Expected Arrival:</dt>
                    <dd>{new Date(purchaseOrder.expectedArrivalTime).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-500">Total Price:</dt>
                    <dd>${purchaseOrder.totalPrice.toFixed(2)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {isSupplierForOrder && canAddPallets && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>Manage this purchase order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full" 
                    onClick={() => setIsAddPalletDialogOpen(true)}
                  >
                    Add Pallet
                  </Button>
                  
                  {allProductsHavePallets() && (
                    <Button 
                      className="w-full" 
                      onClick={() => handleUpdateStatus('Ready to Ship')}
                    >
                      Mark as Ready to Ship
                    </Button>
                  )}
                  
                  {purchaseOrder.status === 'Ready to Ship' && (
                    <Button 
                      className="w-full" 
                      onClick={() => handleUpdateStatus('Shipping')}
                    >
                      Start Shipping
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Expected Pallets</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrder.products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>{product.expectedPallets}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Pallets</CardTitle>
                  {purchaseOrder.pallets.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={generatePalletPDF}
                      className="flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Print Pallet Report
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {purchaseOrder.pallets.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No pallets added yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Max Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Manufacturing Date</TableHead>
                        <TableHead>Expiry Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrder.pallets.map((pallet, index) => (
                        <TableRow key={index}>
                          <TableCell>{pallet.palletName}</TableCell>
                          <TableCell>{pallet.productName}</TableCell>
                          <TableCell>{pallet.quantity}</TableCell>
                          <TableCell>{pallet.maximumCapacity}</TableCell>
                          <TableCell>{pallet.status}</TableCell>
                          <TableCell>{new Date(pallet.manufacturingDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(pallet.expiryDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add Pallet Dialog */}
          <Dialog open={isAddPalletDialogOpen} onOpenChange={setIsAddPalletDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Pallet</DialogTitle>
                <DialogDescription>
                  Add a new pallet to this purchase order
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Pallet Name</Label>
                  <Input 
                    value={newPallet.palletName} 
                    onChange={(e) => setNewPallet({...newPallet, palletName: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Product</Label>
                  <Select 
                    value={newPallet.productId?.toString()} 
                    onValueChange={(value) => setNewPallet({...newPallet, productId: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrder.products.map((product) => (
                        <SelectItem key={product.productId} value={product.productId.toString()}>
                          {product.productName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Quantity</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={newPallet.quantity} 
                    onChange={(e) => setNewPallet({...newPallet, quantity: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Maximum Capacity</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={newPallet.maximumCapacity} 
                    onChange={(e) => setNewPallet({...newPallet, maximumCapacity: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Manufacturing Date</Label>
                  <Input 
                    type="date" 
                    value={newPallet.manufacturingDate} 
                    onChange={(e) => setNewPallet({...newPallet, manufacturingDate: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Expiry Date</Label>
                  <Input 
                    type="date" 
                    value={newPallet.expiryDate} 
                    onChange={(e) => setNewPallet({...newPallet, expiryDate: e.target.value})}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddPalletDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPallet}>
                  Add Pallet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="text-center">
          <p>Purchase order not found</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/purchase-orders')}
          >
            Back to Purchase Orders
          </Button>
        </div>
      )}
    </div>
  );
};

export default SupplierPalletManagement; 