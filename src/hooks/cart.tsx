import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarketplace#products',
      );
      if (storageProducts) {
        setProducts(JSON.parse(storageProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const incrementedProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(incrementedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace#products',
        JSON.stringify(incrementedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const decrementedProducts = products
        .map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity - 1 }
            : product,
        )
        .filter(product => product.quantity > 0);

      setProducts(decrementedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace#products',
        JSON.stringify(decrementedProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const foundProduct = products.find(p => p.id === product.id);
      if (foundProduct) {
        increment(product.id);
      } else {
        const productsWithNewProduct = [
          ...products,
          { ...product, quantity: 1 },
        ];

        setProducts(productsWithNewProduct);

        await AsyncStorage.setItem(
          '@GoMarketplace#products',
          JSON.stringify(productsWithNewProduct),
        );
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
