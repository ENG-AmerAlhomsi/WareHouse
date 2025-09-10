
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, Loader2 } from "lucide-react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {};
  const { isAuthenticated, isLoading } = useAuth();
  
  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error("You must be signed in to view order confirmation");
      navigate("/signin", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  // Redirect if no order data is present
  if (!order) {
    return <Navigate to="/shop" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Order Confirmation</h1>
        <p className="text-muted-foreground">
          Thank you for your purchase
        </p>
      </div>
      
      <Card className="text-center py-10">
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold">Order Placed Successfully!</h2>
            
            <p className="text-muted-foreground max-w-md mx-auto">
              Your order has been received and is being processed. You will receive an email confirmation shortly.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mt-6 w-full max-w-md">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Order Number:</span>
                <span>{order.id}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Date:</span>
                <span>{order.date}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Total Amount:</span>
                <span>{order.value}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span>{order.status}</span>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mt-6">
              <Button 
                variant="outline"
                onClick={() => navigate('/shop')}
                className="flex gap-2"
              >
                Continue Shopping
              </Button>
              
              <Button 
                onClick={() => navigate(`/orders`)}
                className="bg-wms-yellow text-black hover:bg-wms-yellow-dark flex gap-2"
              >
                <Package className="h-4 w-4" />
                View Order Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderConfirmation;
