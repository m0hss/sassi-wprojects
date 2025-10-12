import type { Prisma } from "@prisma/client";
import {
  createContext,
  useReducer,
  FunctionComponent,
  useContext,
  ReactNode,
  useEffect,
} from "react";

export type CartItem = {
  product: Required<Prisma.ProductUncheckedCreateInput>;
  count: number;
  images?: { path: string; blurDataURL: string }[];
};

type CartAction =
  | { type: "removeItem"; item: CartItem }
  | { type: "addItem"; item: CartItem }
  | { type: "clearCart" }
  | { type: "hydrate"; items: CartState };
type Dispatch = (action: CartAction) => void;

type CartState = CartItem[] | [];

const CartContext = createContext<
  { cart: CartState; dispatch: Dispatch } | undefined
>(undefined);

const cartReducer = (cart: CartState, action: CartAction) => {
  // reducer action (no debug logs in production)

  // Helper: merge cart items with same product id into single entries
  const normalize = (items: CartState): CartState => {
    const map = new Map<number | string, CartItem>();
    for (const it of items) {
      const id = (it.product && (it.product as any).id) ?? JSON.stringify(it.product);
      const existing = map.get(id as any);
      if (existing) {
        map.set(id as any, { ...existing, count: existing.count + it.count });
      } else {
        map.set(id as any, { ...it });
      }
    }
    return Array.from(map.values());
  };
  switch (action.type) {
    case "addItem": {
      // Ensure there are no duplicate entries for the same product
      const normalizedCart = normalize(cart);
      // Find the index of the given product
      const foundProductIndex = normalizedCart.findIndex(
        (_item) => _item.product.id === action.item.product.id
      );

      // If the product was found, increse the count by 1
      if (foundProductIndex > -1) {
        // create a new array with the updated item (avoid mutating original)
        const next = normalizedCart.map((it, idx) =>
          idx === foundProductIndex ? { ...it, count: it.count + 1 } : it
        );
        
        return next;
      }
      // If the product wasn't found, add it to the cart array
      else {
        const next = [...normalizedCart, { ...action.item, count: 1 }];
        
        return next;
      }
    }
    case "removeItem": {
      // Find the index of the given product
      const foundProductIndex = cart.findIndex(
        (_item) => _item.product.id === action.item.product.id
      );

      // If the product has a count > 1, reduce the count by one
      // Ensure there are no duplicate entries for the same product
      const normalizedCart = normalize(cart);
      if (foundProductIndex > -1 && normalizedCart[foundProductIndex].count > 1) {
        const next = normalizedCart.map((it, idx) =>
          idx === foundProductIndex ? { ...it, count: it.count - 1 } : it
        );
        
        return next;
      }
      // If the product has a count === 1, remove the product from cart
      else {
        const next = normalizedCart.filter((_, idx) => idx !== foundProductIndex);
        
        return next;
      }
    }
    case "hydrate": {
      return normalize(action.items);
    }
    case "clearCart": {
      return []
    }
    default: {
      throw new Error(`Unhandled action type: ${JSON.stringify(action)}`);
    }
  }
};

const CartProvider: FunctionComponent<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  // Lazy initializer for useReducer that reads from localStorage on the client
  const [cart, dispatch] = useReducer(cartReducer, []);

  // On mount, hydrate cart from localStorage (client-only)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem("cart");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        dispatch({ type: "hydrate", items: parsed as CartState });
      }
    } catch (err) {
      console.warn("Failed to hydrate cart from localStorage:", err);
    }
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist cart to localStorage whenever it changes (client only)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (err) {
      console.warn("Failed to save cart to localStorage:", err);
    }
  }, [cart]);

  const value = { cart, dispatch };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

const useCart = () => {
  const context = useContext(CartContext);

  if (context === undefined)
    throw new Error("useCart must be used within CartProvider");

  // Get the total price for all products in cart
  // @ts-ignore
  const productsTotal: number = context.cart.reduce(
    (total: number, item: CartItem) => total + item.product.price * item.count,
    0
  );

  return { ...context, productsTotal };
};

export { CartProvider, useCart };
