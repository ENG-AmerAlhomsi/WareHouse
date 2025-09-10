import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { shipmentApi } from '@/services/api';
import { Shipment } from '@/types/warehouse';
import { useAuth } from './AuthContext';

interface ShipmentContextProps {
  shipments: Shipment[];
  loading: boolean;
  error: string | null;
  refreshShipments: () => Promise<void>;
  employeeShipments: Shipment[];
  createShipment: (shipment: Omit<Shipment, 'id'>) => Promise<Shipment>;
  updateShipment: (id: number, shipment: Omit<Shipment, 'id'>) => Promise<Shipment>;
  deleteShipment: (id: number) => Promise<void>;
  initialized: boolean;
}

const ShipmentContext = createContext<ShipmentContextProps | undefined>(undefined);

export const ShipmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [employeeShipments, setEmployeeShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const { user } = useAuth();

  const refreshShipments = useCallback(async () => {
    // Don't start another request if we're already loading
    if (loading) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await shipmentApi.getAll();
      setShipments(response.data);
      
      // If user is a shipping employee, also get their assigned shipments
      if (user && user.roles.some(role => 
        role.toLowerCase() === 'shipping employee' || 
        role.toLowerCase().includes('shipping_employee')
      )) {
        const employeeResponse = await shipmentApi.getByEmployeeId(user.id);
        setEmployeeShipments(employeeResponse.data);
      }
      setInitialized(true);
    } catch (error) {
      setError('Failed to fetch shipments');
      // Set initialized to true even on error to prevent repeated failed calls
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  // No automatic data fetching on mount - we'll do this from hooks or EagerShipmentProvider

  const createShipment = async (shipmentData: Omit<Shipment, 'id'>) => {
    try {
      // Convert orders from Order[] to { id: number }[]
      const formattedData = {
        ...shipmentData,
        orders: shipmentData.orders.map(order => ({ id: parseInt(order.id) }))
      };
      
      const response = await shipmentApi.create(formattedData);
      await refreshShipments();
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateShipment = async (id: number, shipmentData: Omit<Shipment, 'id'>) => {
    try {
      // Convert orders from Order[] to { id: number }[]
      const formattedData = {
        ...shipmentData,
        orders: shipmentData.orders.map(order => ({ id: parseInt(order.id) }))
      };
      
      const response = await shipmentApi.update(id, formattedData);
      await refreshShipments();
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const deleteShipment = async (id: number) => {
    try {
      await shipmentApi.delete(id);
      await refreshShipments();
    } catch (error) {
      throw error;
    }
  };

  return (
    <ShipmentContext.Provider
      value={{
        shipments,
        loading,
        error,
        refreshShipments,
        employeeShipments,
        createShipment,
        updateShipment,
        deleteShipment,
        initialized
      }}
    >
      {children}
    </ShipmentContext.Provider>
  );
};

// Eager loading provider that fetches on mount
export const EagerShipmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const context = useContext(ShipmentContext);
  const { user } = useAuth();
  
  const [hasTriedFetching, setHasTriedFetching] = useState(false);
  
  useEffect(() => {
    if (context && !context.initialized && !context.loading && user && !hasTriedFetching) {
      context.refreshShipments();
      setHasTriedFetching(true);
    }
  }, [context, user, hasTriedFetching]);
  
  return <>{children}</>;
};

export const useShipments = () => {
  const context = useContext(ShipmentContext);
  const { user } = useAuth();
  const [hasTriedFetching, setHasTriedFetching] = useState(false);
  
  if (context === undefined) {
    throw new Error('useShipments must be used within a ShipmentProvider');
  }
  
  // Auto-fetch if not initialized, not loading, and user exists
  useEffect(() => {
    if (!context.initialized && !context.loading && user && !hasTriedFetching) {
      context.refreshShipments();
      setHasTriedFetching(true);
    }
  }, [context.initialized, context.loading, context.refreshShipments, user, hasTriedFetching]);
  
  return context;
}; 