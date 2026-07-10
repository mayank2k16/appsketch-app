import * as React from 'react';

import { Text, View } from '@/components/ui';
import { useWishlist } from '@/lib/store/wishlist-store';
import type { ComponentConfig } from '@/types/config';

import { ProductGrid } from './product-grid';

type WishlistGridProps = {
  config: ComponentConfig;
};

export function WishlistGrid({ config }: WishlistGridProps) {
  const { props, style } = config;
  const className = (props?.className as string) || '';
  const { items } = useWishlist();

  if (items.length === 0) {
    return (
      <View className={`flex-1 items-center justify-center p-8 ${className}`} style={style}>
        <Text className="text-center text-gray-500 mb-2">Your wishlist is empty</Text>
        <Text className="text-center text-gray-400 text-sm">
          Start adding items you love!
        </Text>
      </View>
    );
  }

  // Convert wishlist items to product format
  const products = items.map((item) => ({
    id: item.id,
    title: item.title,
    price: item.price,
    originalPrice: item.originalPrice,
    image: item.image,
    brand: item.brand,
  }));

  return (
    <View className={className} style={style}>
      <ProductGrid
        config={{
          id: 'wishlist-products',
          type: 'product-grid',
          props: {
            products,
            columns: (props?.columns as number) || 2,
            showWishlist: true,
            className: props?.className as string,
          },
        }}
      />
    </View>
  );
}

