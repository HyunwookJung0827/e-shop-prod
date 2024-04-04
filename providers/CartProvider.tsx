"use client";

import { CartContextProvider } from "@/hooks/useCart";

// Because of the interactivity: user updates the cart product quantity

interface CartProviderProps {
  // These children will be the different components in our application
  children: React.ReactNode;
}

const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Now wrap the children with the CartContextProvider from useCart.tsx
  return <CartContextProvider>{children}</CartContextProvider>;
};

export default CartProvider;
