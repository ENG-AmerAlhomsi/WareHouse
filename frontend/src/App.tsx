/* eslint-disable @typescript-eslint/no-explicit-any */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import InventoryPage from "./pages/Inventory";
import OrdersPage from "./pages/Orders";
import ShipmentManagement from "./pages/ShipmentManagement";
import ShipmentWorkflow from "./pages/ShipmentWorkflow";
import SettingsPage from "./pages/Settings";
import WarehouseStructure from "./pages/WarehouseStructure";
import NotFound from "./pages/NotFound";
import UserProfile from "./pages/UserProfile";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./hooks/useCart";
import { ProductProvider, EagerProductProvider } from "./contexts/ProductContext";
import { CategoryProvider, EagerCategoryProvider } from "./contexts/CategoryContext";
import { ShipmentProvider, EagerShipmentProvider } from "./contexts/ShipmentContext";
import { OrderProvider, EagerOrderProvider } from "./contexts/OrderContext";
import ShopPage from "./pages/Shop";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import EmployeeWorkflow from "./pages/EmployeeWorkflow";
import { SidebarProvider } from "./components/ui/sidebar";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import React, { lazy, Suspense, useEffect, useState } from 'react';

// Import our new pages
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const SupplierPalletManagement = lazy(() => import('./pages/SupplierPalletManagement'));
const PalletReceivingDashboard = lazy(() => import('./pages/PalletReceivingDashboard'));
const Recommendations = lazy(() => import('./pages/Recommendations'));

// Helper function for role checking
const hasRole = (user: any, role: string): boolean => {
  if (!user?.roles) return false;
  
  // Case-insensitive check
  return user.roles.some((r: string) => 
    r.toLowerCase() === role.toLowerCase() || 
    r.toLowerCase().includes(role.toLowerCase())
  );
};

// Helper function to determine where to redirect users based on their role
const RoleBasedRedirect = () => {
  const { user, isLoading, isAuthenticated, login } = useAuth();
  
  // Add more detailed loading check to ensure user data is fully loaded
  if (isLoading || (isAuthenticated && !user)) {
    return <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wms-yellow mb-4"></div>
        <p>Loading user data...</p>
      </div>
    </div>;
  }
  
  // If not authenticated, redirect to Keycloak login
  if (!isAuthenticated) {
    // Trigger Keycloak login directly
    login();
    return <div className="flex items-center justify-center h-screen">Redirecting to login...</div>;
  }
  
  // Additional safety check - if user object doesn't have roles property yet, wait
  if (!user?.roles) {
    return <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wms-yellow mb-4"></div>
        <p>Loading user roles...</p>
      </div>
    </div>;
  }
  
  // Check for admin role FIRST - this should take precedence
  if (user.roles.some(r => 
    r.toLowerCase() === 'admin' 
  )) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Check for management roles
  if (user.roles.some(r => 
    r.toLowerCase() === 'warehouse manager' ||
    r.toLowerCase() === 'shipping manager'  ||
    r.toLowerCase() === 'general manager'  ||
    r.toLowerCase() === 'supply manager' 
  )) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Check if user is a supplier
  if (user.roles.some(r => 
    r.toLowerCase() === 'supplier' || 
    r.toLowerCase().includes('supplier')
  )) {
    return <Navigate to="/purchase-orders" replace />;
  }
  
  // Check if user is a customer
  if (user.roles.some(r => 
    r.toLowerCase() === 'customer' || 
    r.toLowerCase().includes('customer')
  )) {
    return <Navigate to="/shop" replace />;
  }
  
  // Check if user is a pallet receiving employee
  if (user.roles.some(r => 
    r.toLowerCase() === 'pallet receiving employee' || 
    r.toLowerCase().includes('pallet receiving')
  )) {
    return <Navigate to="/pallet-receiving" replace />;
  }
  
  // Check if user has any employee role
  if (user.roles.some(r => 
    r.toLowerCase()===('order processing employee')||
    r.toLowerCase() === 'packaging employee'  
  )) {
    return <Navigate to="/employee-workflow" replace />;
  }

  if (user.roles.some(r => 
    r.toLowerCase()===('shipping employee')
  )) {
    return <Navigate to="/shipment-workflow" replace />;
  }
  
  // For any other role or if role checking fails, default to shop
  return <Navigate to="/shop" replace />;
};

// Auth guard component that forces authentication for all routes
const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading, user, login } = useAuth();
  
  // More complete loading check to ensure user data is fully loaded
  if (isLoading || (isAuthenticated && !user)) {
    return <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wms-yellow mb-4"></div>
        <p>Loading user data...</p>
      </div>
    </div>;
  }
  
  if (!isAuthenticated) {
    // Redirect to Keycloak login immediately
    login();
    return <div className="flex items-center justify-center h-screen">Redirecting to login...</div>;
  }
  
  // Additional safety check - if user object doesn't have roles property yet, wait
  if (!user?.roles) {
    return <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wms-yellow mb-4"></div>
        <p>Loading user roles...</p>
      </div>
    </div>;
  }
  
  return children;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SidebarProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <ProductProvider>
            <CategoryProvider>
              <OrderProvider>
                <ShipmentProvider>
                  <CartProvider>
                    <BrowserRouter>
                      <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
                        <Routes>
                          {/* Root redirect based on role */}
                          <Route path="/" element={<RoleBasedRedirect />} />
                          
                          {/* All routes now require authentication - all routes will trigger Keycloak login directly */}
                          
                          {/* Shop route - for customers - needs product data */}
                          <Route path="/shop" element={
                            <AuthGuard>
                              <EagerProductProvider>
                                <EagerCategoryProvider>
                                  <MainLayout><ShopPage /></MainLayout>
                                </EagerCategoryProvider>
                              </EagerProductProvider>
                            </AuthGuard>
                          } />
                          
                          {/* Dashboard - admin and managers route - needs all data */}
                          <Route 
                            path="/dashboard" 
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['admin', 'warehouse manager', 'Supply Manager', 'General Manager', 'Shipping Manager']}>
                                  <EagerProductProvider>
                                    <EagerOrderProvider>
                                      <EagerShipmentProvider>
                                        <MainLayout><Dashboard /></MainLayout>
                                      </EagerShipmentProvider>
                                    </EagerOrderProvider>
                                  </EagerProductProvider>
                                </ProtectedRoute>
                              </AuthGuard>
                            } 
                          />
                          
                          {/* Inventory Page - needs product data */}
                          <Route 
                            path="/inventory" 
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['admin', 'warehouse manager', 'Supply Manager']}>
                                  <EagerProductProvider>
                                    <EagerCategoryProvider>
                                      <MainLayout><InventoryPage /></MainLayout>
                                    </EagerCategoryProvider>
                                  </EagerProductProvider>
                                </ProtectedRoute>
                              </AuthGuard>
                            } 
                          />
                          
                          {/* Warehouse Structure page - doesn't need any API data */}
                          <Route 
                            path="/warehouse-structure" 
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['admin', 'warehouse manager']}>
                                  <MainLayout><WarehouseStructure /></MainLayout>
                                </ProtectedRoute>
                              </AuthGuard>
                            } 
                          />

                          {/* Recommendations page - doesn't need specific API providers */}
                          <Route 
                            path="/recommendations" 
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['admin', 'warehouse manager']}>
                                  <MainLayout><Recommendations /></MainLayout>
                                </ProtectedRoute>
                              </AuthGuard>
                            } 
                          />
                          
                          {/* Orders page - needs order data */}
                          <Route 
                            path="/orders" 
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['admin', 'customer']}>
                                  <EagerOrderProvider>
                                    <MainLayout><OrdersPage /></MainLayout>
                                  </EagerOrderProvider>
                                </ProtectedRoute>
                              </AuthGuard>
                            } 
                          />
                          
                          {/* Employee workflow route - needs order data */}
                          <Route 
                            path="/employee-workflow" 
                            element={
                              <AuthGuard>
                                <ProtectedRoute 
                                  requiredRoles={['Order processing employee', 'Packaging employee', 'Shipping employee']}
                                  excludedRoles={['admin']}
                                >
                                  <EagerOrderProvider>
                                    <EagerProductProvider>
                                      <MainLayout><EmployeeWorkflow /></MainLayout>
                                    </EagerProductProvider>
                                  </EagerOrderProvider>
                                </ProtectedRoute>
                              </AuthGuard>
                            } 
                          />
                          
                          {/* Shipment management route - needs shipment and order data */}
                          <Route 
                            path="/shipment-management" 
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['admin', 'Shipping Manager']}>
                                  <EagerShipmentProvider>
                                    <EagerOrderProvider>
                                      <MainLayout><ShipmentManagement /></MainLayout>
                                    </EagerOrderProvider>
                                  </EagerShipmentProvider>
                                </ProtectedRoute>
                              </AuthGuard>
                            } 
                          />

                          {/* Shipment workflow route - needs shipment data */}
                          <Route 
                            path="/shipment-workflow" 
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['Shipping employee']}>
                                  <EagerShipmentProvider>
                                    <MainLayout><ShipmentWorkflow /></MainLayout>
                                  </EagerShipmentProvider>
                                </ProtectedRoute>
                              </AuthGuard>
                            } 
                          />
                          
                          {/* Settings page - doesn't need API data */}
                          <Route 
                            path="/settings" 
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['admin']}>
                                  <MainLayout><SettingsPage /></MainLayout>
                                </ProtectedRoute>
                              </AuthGuard>
                            } 
                          />
                          
                          {/* User profile - doesn't need API data */}
                          <Route 
                            path="/profile" 
                            element={
                              <AuthGuard>
                                <MainLayout><UserProfile /></MainLayout>
                              </AuthGuard>
                            } 
                          />
                          
                          {/* Cart - needs product data */}
                          <Route 
                            path="/cart" 
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['admin', 'customer']}>
                                  <EagerProductProvider>
                                    <EagerCategoryProvider>
                                      <MainLayout><CartPage /></MainLayout>
                                    </EagerCategoryProvider>
                                  </EagerProductProvider>
                                </ProtectedRoute>
                              </AuthGuard>
                            } 
                          />
                          
                          {/* Checkout - needs product data */}
                          <Route 
                            path="/checkout" 
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['admin', 'customer']}>
                                  <EagerProductProvider>
                                    <EagerCategoryProvider>
                                      <MainLayout><Checkout /></MainLayout>
                                    </EagerCategoryProvider>
                                  </EagerProductProvider>
                                </ProtectedRoute>
                              </AuthGuard>
                            } 
                          />
                          
                          {/* Order confirmation - needs order data */}
                          <Route 
                            path="/order-confirmation" 
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['admin', 'customer']}>
                                  <EagerOrderProvider>
                                    <MainLayout><OrderConfirmation /></MainLayout>
                                  </EagerOrderProvider>
                                </ProtectedRoute>
                              </AuthGuard>
                            } 
                          />
                          
                          {/* Purchase Order routes */}
                          <Route
                            path="/purchase-orders"
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['supply manager', 'supplier', 'admin']}>
                                  <MainLayout><PurchaseOrders /></MainLayout>
                                </ProtectedRoute>
                              </AuthGuard>
                            }
                          />
                          <Route
                            path="/purchase-orders/:id"
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['supply manager', 'supplier', 'admin']}>
                                  <MainLayout><SupplierPalletManagement /></MainLayout>
                                </ProtectedRoute>
                              </AuthGuard>
                            }
                          />
                          
                          {/* Pallet Receiving Employee Dashboard */}
                          <Route
                            path="/pallet-receiving"
                            element={
                              <AuthGuard>
                                <ProtectedRoute requiredRoles={['pallet receiving employee', 'admin']}>
                                  <MainLayout><PalletReceivingDashboard /></MainLayout>
                                </ProtectedRoute>
                              </AuthGuard>
                            }
                          />
                          
                          {/* Default route */}
                          <Route path="*" element={<AuthGuard><NotFound /></AuthGuard>} />
                        </Routes>
                      </Suspense>
                    </BrowserRouter>
                  </CartProvider>
                </ShipmentProvider>
              </OrderProvider>
            </CategoryProvider>
          </ProductProvider>
        </AuthProvider>
      </TooltipProvider>
    </SidebarProvider>
  </QueryClientProvider>
);

export default App;
