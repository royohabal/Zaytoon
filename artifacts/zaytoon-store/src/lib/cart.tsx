import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  removeItem: (productId: string, size: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = 'zaytoon-cart-v1';

function readCart(): CartItem[] {
  try {
    const saved = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is CartItem =>
      Boolean(
        item &&
        typeof item.productId === 'string' &&
        typeof item.name === 'string' &&
        typeof item.size === 'string' &&
        typeof item.image === 'string' &&
        Number.isFinite(item.quantity) &&
        Number.isFinite(item.unitPrice),
      ),
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readCart());

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      return;
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    return {
      items,
      count,
      subtotal,
      addItem: (item) => {
        setItems((current) => {
          const found = current.find((line) => line.productId === item.productId && line.size === item.size);
          if (found) {
            return current.map((line) =>
              line === found
                ? { ...line, quantity: Math.min(10, line.quantity + item.quantity) }
                : line,
            );
          }
          return [...current, item];
        });
      },
      updateQuantity: (productId, size, quantity) => {
        setItems((current) =>
          current.map((item) =>
            item.productId === productId && item.size === size
              ? { ...item, quantity: Math.max(1, Math.min(10, quantity)) }
              : item,
          ),
        );
      },
      removeItem: (productId, size) => {
        setItems((current) => current.filter((item) => item.productId !== productId || item.size !== size));
      },
      clearCart: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
