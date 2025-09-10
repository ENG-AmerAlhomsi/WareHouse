import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { orderApi } from '@/services/api';
import { Order } from '@/types/order';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface OrderContextProps {
  orders: Order[];
  customerOrders: Order[];
  loading: boolean;
  error: string | null;
  refreshOrders: () => Promise<void>;
  createOrder: (orderData: any) => Promise<any>;
  updateOrder: (id: number, orderData: any) => Promise<any>;
  cancelOrder: (id: number) => Promise<any>;
  deleteOrder: (id: number) => Promise<any>;
  initialized: boolean;
}

const OrderContext = createContext<OrderContextProps | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const { user } = useAuth();

  const refreshOrders = useCallback(async () => {
    // Don't start another request if we're already loading
    if (loading) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.getAll();
      setOrders(response.data);
      
      // If user is logged in, get their orders
      if (user) {
        const customerResponse = await orderApi.getCustomerOrders(user.id);
        setCustomerOrders(customerResponse.data);
      }
      setInitialized(true);
    } catch (error) {
      setError('Failed to fetch orders');
      // Set initialized to true even on error to prevent repeated failed calls
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  // No auto-fetch on initial load - we'll do this from the hook or EagerOrderProvider

  const createOrder = async (orderData: any) => {
    try {
      const response = await orderApi.create(orderData);
      await refreshOrders();
      return response.data;
    } catch (error) {
      toast.error('Failed to create order');
      throw error;
    }
  };

  const updateOrder = async (id: number, orderData: any) => {
    try {
      const response = await orderApi.updateOrder(id, orderData);
      await refreshOrders();
      return response.data;
    } catch (error) {
      toast.error('Failed to update order');
      throw error;
    }
  };

  const cancelOrder = async (id: number) => {
    try {
      const response = await orderApi.cancelOrder(id);
      await refreshOrders();
      return response.data;
    } catch (error) {
      toast.error('Failed to cancel order');
      throw error;
    }
  };

  const deleteOrder = async (id: number) => {
    try {
      const response = await orderApi.delete(id);
      await refreshOrders();
      return response.data;
    } catch (error) {
      toast.error('Failed to delete order');
      throw error;
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        customerOrders,
        loading,
        error,
        refreshOrders,
        createOrder,
        updateOrder,
        cancelOrder,
        deleteOrder,
        initialized
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

// Eager loading provider that fetches on mount
export const EagerOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const context = useContext(OrderContext);
  const { user } = useAuth();
  
  const [hasTriedFetching, setHasTriedFetching] = useState(false);
  
  useEffect(() => {
    if (context && !context.initialized && !context.loading && user && !hasTriedFetching) {
      context.refreshOrders();
      setHasTriedFetching(true);
    }
  }, [context, user, hasTriedFetching]);
  
  return <>{children}</>;
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  const { user } = useAuth();
  const [hasTriedFetching, setHasTriedFetching] = useState(false);
  
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  
  // Auto-fetch if not initialized, not loading, and user exists
  useEffect(() => {
    if (!context.initialized && !context.loading && user && !hasTriedFetching) {
      context.refreshOrders();
      setHasTriedFetching(true);
    }
  }, [context.initialized, context.loading, context.refreshOrders, user, hasTriedFetching]);
  
  return context;
}; 