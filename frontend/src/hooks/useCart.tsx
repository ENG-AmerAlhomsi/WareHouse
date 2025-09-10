import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user, isAuthenticated } = useAuth();
  
  // Get user-specific cart key
  const getCartKey = () => {
    if (isAuthenticated && user?.id) {
      return `cart_${user.id}`;
    }
    return 'cart_guest';
  };
  
  // Load cart from localStorage on mount or when user changes
  useEffect(() => {
    const cartKey = getCartKey();
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        // Silently handle error and reset cart
        setItems([]);
      }
    } else {
      // If no cart exists for this user, start with empty cart
      setItems([]);
    }
  }, [user?.id, isAuthenticated]); // Re-run when user ID or auth state changes
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    const cartKey = getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(items));
  }, [items, user?.id, isAuthenticated]);
  
  const addToCart = (newItem: CartItem) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(item => item.id === newItem.id);
      
      if (existingItemIndex > -1) {
        // Item already exists, update quantity
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity
        };
        return updatedItems;
      } else {
        // Item doesn't exist, add it
        return [...currentItems, newItem];
      }
    });
  };
  
  const removeFromCart = (itemId: number) => {
    setItems(currentItems => currentItems.filter(item => item.id !== itemId));
  };
  
  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };
  
  const clearCart = () => {
    setItems([]);
  };
  
  // Calculate cart total
  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Calculate total items count
  const cartItemsCount = items.reduce((count, item) => count + item.quantity, 0);
  
  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartItemsCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
