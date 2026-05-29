"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/ToastContext";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  categoryName?: string;
  selected?: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleSelect: (id: string) => void;
  toggleSelectAll: (isSelected: boolean) => void;
  removeSelectedFromCart: () => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const { isAuthenticated, user, loading } = useAuth();
  const toast = useToast();

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load cart from API when user changes
  useEffect(() => {
    if (loading) return; // Wait for auth to initialize
    
    if (isAuthenticated && user?.id) {
      fetchWithAuth(`${API_BASE_URL}/api/cart`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setCartItems(data.data);
          }
        })
        .catch(err => console.error("Lỗi tải giỏ hàng:", err))
        .finally(() => setIsInitialized(true));
    } else {
      setCartItems([]);
      setIsInitialized(true);
    }
  }, [isAuthenticated, user?.id, loading]);

  // Save cart to API (with debounce)
  const saveCart = (items: CartItem[]) => {
    setCartItems(items); // Optimistic UI update
    
    if (isAuthenticated) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        fetchWithAuth(`${API_BASE_URL}/api/cart`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items })
        }).catch(err => console.error("Lỗi đồng bộ giỏ hàng:", err));
      }, 500);
    }
  };

  const addToCart = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      if (typeof window !== "undefined") {
        setTimeout(() => window.location.href = "/login", 1000);
      }
      return;
    }

    const existing = cartItems.find((i) => i.id === item.id);
    let newItems;
    if (existing) {
      newItems = cartItems.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + quantity, selected: true } : i
      );
    } else {
      newItems = [...cartItems, { ...item, quantity, selected: true }];
    }
    saveCart(newItems);

    // Show toast
    setToastMessage({ message: item.name, visible: true });
    setTimeout(() => {
      setToastMessage((prev) => ({ ...prev, visible: false }));
    }, 1000);
  };

  const removeFromCart = (id: string) => {
    const newItems = cartItems.filter((i) => i.id !== id);
    saveCart(newItems);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const newItems = cartItems.map((i) =>
      i.id === id ? { ...i, quantity } : i
    );
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const toggleSelect = (id: string) => {
    saveCart(cartItems.map((i) => i.id === id ? { ...i, selected: i.selected === false ? true : false } : i));
  };

  const toggleSelectAll = (isSelected: boolean) => {
    saveCart(cartItems.map((i) => ({ ...i, selected: isSelected })));
  };

  const removeSelectedFromCart = () => {
    saveCart(cartItems.filter((i) => i.selected === false));
  };

  const cartCount = isInitialized ? cartItems.reduce((acc, item) => acc + item.quantity, 0) : 0;
  const cartTotal = cartItems
    .filter((item) => item.selected !== false)
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleSelect,
        toggleSelectAll,
        removeSelectedFromCart,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
      {/* Global Add To Cart Toast */}
      <div
        className={`fixed bottom-8 right-8 z-[100] bg-white text-[#333] px-5 py-3.5 rounded-2xl shadow-[0_20px_40px_-15px_rgba(46,76,126,0.3)] border border-[#e2e8f0] flex items-center gap-3 transition-all duration-400 ease-out ${toastMessage.visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
          }`}
      >
        <div className="bg-[#2e4c7e]/10 p-1.5 rounded-full">
          <CheckCircle2 className="w-5 h-5 text-[#2e4c7e]" />
        </div>
        <div>
          <p className="text-xs text-[#777] font-medium mb-0.5 tracking-wider uppercase">Đã thêm vào giỏ</p>
          <p className="text-sm font-serif text-[#333] line-clamp-1 max-w-[200px] leading-tight">{toastMessage.message}</p>
        </div>
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
