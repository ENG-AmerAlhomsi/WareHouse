/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  User, 
  LayoutGrid, 
  Package, 
  Truck, 
  ClipboardList, 
  Settings,
  Menu,
  Warehouse,
  LogOut,
  ShoppingCart,
  PackageCheck,
  Lightbulb,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  isActive: boolean;
}

const NavItem = ({ icon: Icon, label, to, isActive }: NavItemProps) => {
  return (
    <Link to={to} className="w-full">
      <Button
        variant={isActive ? "default" : "ghost"}
        className={`w-full justify-start mb-1 ${
          isActive ? "bg-wms-yellow text-black" : ""
        }`}
      >
        <Icon className="mr-2 h-5 w-5" />
        {label}
      </Button>
    </Link>
  );
};

// Helper functions for role checking
const hasRole = (user: any, role: string): boolean => {
  if (!user?.roles) return false;
  
  // Case-insensitive check
  return user.roles.some((r: string) => 
    r.toLowerCase() === role.toLowerCase() || 
    r.toLowerCase().includes(role.toLowerCase())
  );
};

const hasAnyRole = (user: any, roles: string[]): boolean => {
  return roles.some(role => hasRole(user, role));
};

const isAdmin = (user: any): boolean => {
  return hasRole(user, 'admin');
};

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { cartItemsCount } = useCart();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Define all possible navigation items
  const allNavItems = [
    { 
      icon: LayoutGrid, 
      label: "Dashboard", 
      to: "/",
      roles: ['admin', 'warehouse manager', 'Supply Manager', 'General Manager', 'Shipping Manager']
    },
    { 
      icon: Package, 
      label: "Inventory", 
      to: "/inventory",
      roles: ['admin', 'warehouse manager', 'Supply Manager']
    },
    { 
      icon: Warehouse, 
      label: "Warehouse Structure", 
      to: "/warehouse-structure",
      roles: ['admin', 'warehouse manager']
    },
    { 
      icon: Lightbulb, 
      label: "Recommendations", 
      to: "/recommendations",
      roles: ['admin', 'warehouse manager']
    },
    { 
      icon: ClipboardList, 
      label: "Orders", 
      to: "/orders",
      roles: ['admin', 'customer']
    },
    { 
      icon: ClipboardList, 
      label: "Purchase Orders", 
      to: "/purchase-orders",
      roles: ['admin', 'supply manager', 'supplier']
    },
    { 
      icon: PackageCheck, 
      label: "Pallet Receiving", 
      to: "/pallet-receiving",
      roles: ['admin', 'pallet receiving employee']
    },
    { 
      icon: ClipboardList, 
      label: "Employee Workflow", 
      to: "/employee-workflow",
      // Employee Workflow is visible to employees who handle orders
      roles: ['Order processing employee', 'Packaging employee']
    },
    { 
      icon: Truck, 
      label: "Shipment Management", 
      to: "/shipment-management",
      // Shipment Management is visible to shipping managers
      roles: ['admin', 'Shipping Manager']
    },
    { 
      icon: PackageCheck, 
      label: "Shipping Workflow", 
      to: "/shipment-workflow",
      // Shipping Workflow is visible to shipping employees
      roles: ['Shipping employee']
    },
    { 
      icon: ShoppingCart, 
      label: "Shop", 
      to: "/shop",
      roles: ['admin', 'customer', 'Shipping Manager' ,'warehouse manager' , 'General Manager']
    },
    { 
      icon: Settings, 
      label: "Settings", 
      to: "/settings",
      // Settings is visible to admins
      roles: ['admin']
    },
  ];

  // Filter navigation items based on user roles
  const navItems = useMemo(() => {
    return allNavItems.filter(item => {
      // Items with empty roles array are visible to everyone
      if (item.roles.length === 0) return true;
      
      // If user is not authenticated, only show items with empty roles
      if (!isAuthenticated) return item.roles.length === 0;
      
      // Special case for Employee Workflow - hide from admin
      if (item.to === "/employee-workflow" && isAdmin(user)) {
        return false;
      }

      if (item.to === "/shipment-workflow" && isAdmin(user)) {
        return false;
      }
      
      // Check if user has any of the required roles
      return isAdmin(user) || hasAnyRole(user, item.roles);
    });
  }, [user, isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="border-b border-gray-200 h-16 flex items-center px-4">
            <div className="flex items-center">
              <img
                src="/warehouse.png"
                alt="WMS Logo"
                className="w-8 h-8 mr-2"
              />
              {!isCollapsed && (
                <span className="font text-lg"> Welcome Back! </span>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="p-2">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                isActive={location.pathname === item.to}
              />
            ))}
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-200 p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center">
              <SidebarTrigger>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-6 hover:bg-yellow-200 hover:scale-105 transition-all duration-200 rounded-lg shadow-sm border border-yellow-300"
                >
                  <Menu className="h-6 w-6 text-gray-700" />
                </Button>
              </SidebarTrigger>
              <h2 className="text-lg font-semibold text-gray-800">Warehouse Management System</h2>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-yellow-200">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemsCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-yellow-200">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthenticated ? (
                    <>
                      <DropdownMenuLabel>
                        {user?.firstName} {user?.lastName}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/profile")}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => navigate("/")}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Login
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
