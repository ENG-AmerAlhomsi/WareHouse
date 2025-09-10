
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { Trash2, Plus, Minus, ArrowRight, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to proceed with checkout");
      navigate('/signin');
      return;
    }
    navigate('/checkout');
  };
  
  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Your Cart</h1>
          <p className="text-muted-foreground">
            Your cart is empty
          </p>
        </div>
        
        <Card className="text-center p-10">
          <p className="mb-6">You haven't added any products to your cart yet.</p>
          <Link to="/shop">
            <Button className="bg-wms-yellow text-black hover:bg-wms-yellow-dark">
              Browse Products
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Your Cart</h1>
        <p className="text-muted-foreground">
          Review your items before checkout
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Cart Items</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  Clear Cart
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col md:flex-row gap-4 py-4 border-b">
                    <div className="w-24 h-24 flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                      <div className="font-bold mt-2">${item.price.toFixed(2)}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-10 text-center">{item.quantity}</span>
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-right w-20">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                
                <Button 
                  className="w-full mt-4 bg-wms-yellow text-black hover:bg-wms-yellow-dark"
                  onClick={handleCheckout}
                >
                  {isAuthenticated ? (
                    <>
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Sign in to Checkout
                      <LogIn className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <div className="text-center mt-4">
                  <Link to="/shop" className="text-sm text-muted-foreground hover:underline">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
