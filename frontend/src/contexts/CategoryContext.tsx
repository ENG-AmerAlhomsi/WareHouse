import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { categoryApi } from '@/services/api';

interface Category {
  id: number;
  name: string;
}

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: number, name: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  initialized: boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Base Provider without auto-fetching
export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const refreshCategories = useCallback(async () => {
    // Don't start another request if we're already loading
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await categoryApi.getAll();
      setCategories(response.data);
      setInitialized(true);
    } catch (err) {
      setError('Failed to load categories');
      // Set initialized to true even on error to prevent repeated failed calls
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const addCategory = useCallback(async (name: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryApi.create({ name });
      setCategories(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError('Failed to add category');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: number, name: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryApi.update(id, { name });
      setCategories(prev => 
        prev.map(category => category.id === id ? response.data : category)
      );
      return response.data;
    } catch (err) {
      setError('Failed to update category');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await categoryApi.delete(id);
      setCategories(prev => prev.filter(category => category.id !== id));
    } catch (err) {
      setError('Failed to delete category');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <CategoryContext.Provider 
      value={{ 
        categories, 
        loading, 
        error, 
        refreshCategories, 
        addCategory, 
        updateCategory, 
        deleteCategory, 
        initialized 
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

// Eager loading provider that fetches on mount
export function EagerCategoryProvider({ children }: { children: React.ReactNode }) {
  const context = useContext(CategoryContext);
  
  const [hasTriedFetching, setHasTriedFetching] = useState(false);
  
  useEffect(() => {
    if (context && !context.initialized && !context.loading && !hasTriedFetching) {
      context.refreshCategories();
      setHasTriedFetching(true);
    }
  }, [context, hasTriedFetching]);
  
  return <>{children}</>;
}

export function useCategories() {
  const context = useContext(CategoryContext);
  const [hasTriedFetching, setHasTriedFetching] = useState(false);
  
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  
  // Auto-fetch if not initialized and not already loading
  useEffect(() => {
    if (!context.initialized && !context.loading && !hasTriedFetching) {
      context.refreshCategories();
      setHasTriedFetching(true);
    }
  }, [context.initialized, context.loading, context.refreshCategories, hasTriedFetching]);
  
  return context;
} 