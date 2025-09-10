import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/Inventory';
import { productApi } from '@/services/api';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  initialized: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Base Provider without auto-fetching
export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const refreshProducts = useCallback(async () => {
    // Don't start another request if we're already loading
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.getAll();
      setProducts(response.data);
      setInitialized(true);
    } catch (err) {
      setError('Failed to load products');
      // Set initialized to true even on error to prevent repeated failed calls
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return (
    <ProductContext.Provider value={{ products, loading, error, refreshProducts, initialized }}>
      {children}
    </ProductContext.Provider>
  );
}

// Eager loading provider that fetches on mount
export function EagerProductProvider({ children }: { children: React.ReactNode }) {
  const context = useContext(ProductContext);
  
  const [hasTriedFetching, setHasTriedFetching] = useState(false);
  
  useEffect(() => {
    if (context && !context.initialized && !context.loading && !hasTriedFetching) {
      context.refreshProducts();
      setHasTriedFetching(true);
    }
  }, [context, hasTriedFetching]);
  
  return <>{children}</>;
}

export function useProducts() {
  const context = useContext(ProductContext);
  const [hasTriedFetching, setHasTriedFetching] = useState(false);
  
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  
  // Auto-fetch if not initialized and not already loading
  useEffect(() => {
    if (!context.initialized && !context.loading && !hasTriedFetching) {
      context.refreshProducts();
      setHasTriedFetching(true);
    }
  }, [context.initialized, context.loading, context.refreshProducts, hasTriedFetching]);
  
  return context;
}