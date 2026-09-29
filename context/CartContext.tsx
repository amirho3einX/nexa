
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartProduct = {
  id: number;
  name: string;
  slug: string;
  price: string;
  imageUrl: string | null;
  stock: number;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (product: CartProduct, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: number) => number;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

const CART_STORAGE_KEY = "ecommerce-ai-cart";

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedCart: string | null =
        localStorage.getItem(CART_STORAGE_KEY);

      if (storedCart) {
        const parsedCart: CartItem[] = JSON.parse(storedCart);

        if (Array.isArray(parsedCart)) {
          setItems(parsedCart);
        }
      }
    } catch (error: unknown) {
      console.error("Failed to load cart:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error: unknown) {
      console.error("Failed to save cart:", error);
    }
  }, [items, isLoaded]);

  function addToCart(
    product: CartProduct,
    quantity: number = 1
  ): void {
    if (product.stock <= 0) {
      return;
    }

    setItems((currentItems: CartItem[]) => {
      const existingItem: CartItem | undefined = currentItems.find(
        (item: CartItem) => item.product.id === product.id
      );

      if (existingItem) {
        return currentItems.map((item: CartItem) => {
          if (item.product.id !== product.id) {
            return item;
          }

          return {
            ...item,
            quantity: Math.min(
              item.quantity + quantity,
              product.stock
            ),
          };
        });
      }

      return [
        ...currentItems,
        {
          product,
          quantity: Math.min(quantity, product.stock),
        },
      ];
    });
  }

  function removeFromCart(productId: number): void {
    setItems((currentItems: CartItem[]) =>
      currentItems.filter(
        (item: CartItem) => item.product.id !== productId
      )
    );
  }

  function updateQuantity(
    productId: number,
    quantity: number
  ): void {
    setItems((currentItems: CartItem[]) => {
      return currentItems
        .map((item: CartItem) => {
          if (item.product.id !== productId) {
            return item;
          }

          const safeQuantity: number = Math.min(
            Math.max(quantity, 1),
            item.product.stock
          );

          return {
            ...item,
            quantity: safeQuantity,
          };
        })
        .filter(
          (item: CartItem) => item.product.stock > 0
        );
    });
  }

  function clearCart(): void {
    setItems([]);
  }

  function getItemQuantity(productId: number): number {
    return (
      items.find(
        (item: CartItem) => item.product.id === productId
      )?.quantity ?? 0
    );
  }

  const itemCount: number = useMemo(() => {
    return items.reduce(
      (total: number, item: CartItem) =>
        total + item.quantity,
      0
    );
  }, [items]);

  const subtotal: number = useMemo(() => {
    return items.reduce(
      (total: number, item: CartItem) =>
        total +
        Number(item.product.price) * item.quantity,
      0
    );
  }, [items]);

  const value: CartContextType = {
    items,
    itemCount,
    subtotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context: CartContextType | undefined =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
