"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  meta?: {
    service?: string;
    pricing?: any; // transfer
    [key: string]: any;
  };
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(newItem: CartItem) {
    setItems((prev) => {
      // Se for TRANSFER → remove qualquer transfer anterior
      if (newItem.meta?.pricing || newItem.meta?.service === "transfer") {
        const extras = prev.filter((i) => !i.meta?.pricing && i.meta?.service !== "transfer");
        return [newItem, ...extras];
      }

      // Se for EXTRA → adiciona depois do transfer
      return [...prev, newItem];
    });
  }

  function clearCart() {
    setItems([]);
  }

  return (
    <CartContext.Provider value={{ items, addItem, clearCart }}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
