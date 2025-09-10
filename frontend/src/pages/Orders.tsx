/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  Filter, 
  Download,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { orderApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { productApi } from "@/services/api";
import { hasRole, isAdmin } from "@/utils/authHelpers";
import { Order } from "@/types/order";
import OrdersTable from "@/components/orders/OrdersTable";
import OrderDetails from "@/components/orders/OrderDetails";
import EditOrder from "@/components/orders/EditOrder";
import CancelOrderConfirm from "@/components/orders/CancelOrderConfirm";
import { Pagination } from "@/components/ui/pagination";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface PaginatedOrders {
  content: Order[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Add this helper function before the OrdersPage component
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("business");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("desc");
  const [businessOrders, setBusinessOrders] = useState<Order[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [businessPagination, setBusinessPagination] = useState<PaginatedOrders | null>(null);
  const [customerPagination, setCustomerPagination] = useState<PaginatedOrders | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isCanceling, setIsCanceling] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [editedOrder, setEditedOrder] = useState<Order | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Determine which tabs to show based on roles
  const showBusinessTab = isAdmin(user);
  const showRetailTab = isAdmin(user);
  const showCustomerTab = hasRole(user, 'customer');

  // Set appropriate default tab based on roles
  useEffect(() => {
    if (user) {
      if (showBusinessTab) {
        setActiveTab("business");
      } else if (showRetailTab) {
        setActiveTab("retail");
      } else if (showCustomerTab) {
        setActiveTab("customer");
      }
    }
  }, [user, showBusinessTab, showRetailTab, showCustomerTab]);

  // Fetch orders from API with pagination
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Fetch all orders for business tab (admin only) with pagination
      if (isAdmin(user)) {
        const businessResponse = await orderApi.getAllPaginated(currentPage, pageSize, sortBy, sortDir);
        setBusinessOrders(businessResponse.data.content);
        setBusinessPagination(businessResponse.data);
      }
      
      // Fetch user-specific orders if authenticated and is a customer with pagination
      if (isAuthenticated && user?.id && hasRole(user, 'customer')) {
          const customerResponse = await orderApi.getCustomerOrdersPaginated(user.id, currentPage, pageSize, sortBy, sortDir);
          setCustomerOrders(customerResponse.data.content);
          setCustomerPagination(customerResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated, user, currentPage, pageSize, sortBy, sortDir]);
  
  // Filter business orders based on search and status filter
  const filteredBusinessOrders = businessOrders
    .filter(order => {
      const matchesSearch = 
        (order.id?.toString() || '').includes(searchQuery.toLowerCase()) ||
        (order.customer?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      if (statusFilter === "all") return matchesSearch;
      return matchesSearch && (order.status?.toLowerCase() || '') === statusFilter.toLowerCase();
    });

  // Filter customer orders based on search and status filter
  const filteredCustomerOrders = customerOrders
    .filter(order => {
      const matchesSearch = 
        (order.id?.toString() || '').includes(searchQuery.toLowerCase()) ||
        (order.customer?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      if (statusFilter === "all") return matchesSearch;
      return matchesSearch && (order.status?.toLowerCase() || '') === statusFilter.toLowerCase();
    });

  // Get the active orders based on the current tab
  const activeOrders = 
    activeTab === "business" ? filteredBusinessOrders : 
    activeTab === "retail" ? filteredCustomerOrders : 
    filteredCustomerOrders;
  
  // Get the active pagination based on the current tab
  const activePagination = 
    activeTab === "business" ? businessPagination : 
    activeTab === "retail" ? customerPagination : 
    customerPagination;
  
  const totalOrders = activePagination?.totalElements || 0;
  
  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setCurrentPage(0);
  };

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, statusFilter, activeTab]);
  
  // Handle order export
  const handleExportOrders = async () => {
    setIsExporting(true);
    try {
      const response = await orderApi.exportOrders('csv');
      
      // Create a download link for the file
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // Clean up the URL object
      
      toast.success("Orders exported successfully");
    } catch (error) {
      console.error("Failed to export orders:", error);
      toast.error("Failed to export orders. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };
  
  // Initiate order cancellation confirmation
  const confirmCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    setShowCancelConfirm(true);
  };

  // Handle actual order cancellation after confirmation
  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    
    setIsCanceling(orderToCancel);
    try {
      await orderApi.cancelOrder(Number(orderToCancel));
      toast.success("Order has been canceled successfully");
      
      // Refresh the orders list
      fetchOrders();
    } catch (error: any) {
      console.error("Failed to cancel order:", error);
      
      // Extract error message from response if available
      const errorMsg = error.response?.data || "Failed to cancel order. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsCanceling(null);
      setShowCancelConfirm(false);
      setOrderToCancel(null);
      
      // Close the details dialog if it was open
      if (isOrderDetailsOpen) {
        setIsOrderDetailsOpen(false);
      }
    }
  };
  
  // Open order details dialog
  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };
  
  // Handle opening the edit dialog
  const handleEditOrder = (order: Order) => {
    // Create a deep copy of the order to avoid modifying the original
    setEditedOrder(JSON.parse(JSON.stringify(order)));
    setIsEditOrderOpen(true);
  };
  
  // Update the order
  const handleUpdateOrder = async () => {
    if (!editedOrder) return;
    
    setIsUpdating(true);
    try {
      await orderApi.updateOrder(Number(editedOrder.id), editedOrder);
      toast.success("Order updated successfully");
      
      // Refresh the orders list and close the dialog
      fetchOrders();
      setIsEditOrderOpen(false);
    } catch (error: any) {
      console.error("Failed to update order:", error);
      const errorMsg = error.response?.data || "Failed to update order. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Order Management</h1>
          <p className="text-muted-foreground">
            Track and manage customer orders
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {showBusinessTab && (
              <TabsTrigger value="business">Business Orders</TabsTrigger>
            )}
            {showRetailTab && (
              <TabsTrigger value="retail">Retail Customer Orders</TabsTrigger>
            )}
            {showCustomerTab && (
              <TabsTrigger value="customer">My Orders</TabsTrigger>
            )}
          </TabsList>
          
          {/* Business Tab Content - Only for Admins */}
          {showBusinessTab && (
            <TabsContent value="business">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search by order ID or customer..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="ready for pickup">Ready for Pickup</SelectItem>
                        <SelectItem value="ready for shipping">Ready for Shipping</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="id">Order ID</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  
                </div>
              </div>
            </TabsContent>
          )}
          
          {/* Retail Tab Content */}
          {showRetailTab && (
            <TabsContent value="retail">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search by order ID or customer..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="id">Order ID</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
          
          {/* Customer Tab Content - Only for Customers */}
          {showCustomerTab && (
            <TabsContent value="customer">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search by order ID or date..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="id">Order ID</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          )}

          <Card>
            <CardContent className="p-0">
              <OrdersTable
                orders={activeOrders}
                isLoading={isLoading}
                activeTab={activeTab}
                isCanceling={isCanceling}
                confirmCancelOrder={confirmCancelOrder}
                handleViewOrderDetails={handleViewOrderDetails}
                handleEditOrder={handleEditOrder}
                formatDate={formatDate}
                noOrdersMessage={
                  activeTab === "retail" ? 
                              "No customer orders found. Orders placed through the shop will appear here." :
                              "No orders found matching your criteria."
                            }
              />
            </CardContent>
          </Card>
          
          {/* Pagination */}
          {activePagination && activePagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={activePagination.pageNumber}
                totalPages={activePagination.totalPages}
                totalElements={activePagination.totalElements}
                pageSize={activePagination.pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                showPageSizeSelector={true}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          )}
          
          <div className="flex justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {activeOrders.length} of {totalOrders} orders
              </div>
              {/* Only show export button for admins */}
            {isAdmin(user) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportOrders}
                  disabled={isExporting || activeOrders.length === 0}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              )}
            </div>
        </Tabs>
      </div>

      {/* Order Details Dialog */}
      <OrderDetails
        isOpen={isOrderDetailsOpen}
        setIsOpen={setIsOrderDetailsOpen}
        selectedOrder={selectedOrder}
        isCanceling={isCanceling}
        confirmCancelOrder={confirmCancelOrder}
      />

      {/* Edit Order Dialog */}
      <EditOrder
        isOpen={isEditOrderOpen}
        setIsOpen={setIsEditOrderOpen}
        editedOrder={editedOrder}
        setEditedOrder={setEditedOrder}
        isUpdating={isUpdating}
        handleUpdateOrder={handleUpdateOrder}
      />

      {/* Cancel Order Confirmation Dialog */}
      <CancelOrderConfirm
        isOpen={showCancelConfirm}
        setIsOpen={setShowCancelConfirm}
        orderToCancel={orderToCancel}
        setOrderToCancel={setOrderToCancel}
        isCanceling={isCanceling}
        handleCancelOrder={handleCancelOrder}
      />
    </>
  );
};

export default OrdersPage;
