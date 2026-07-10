import * as React from 'react';

import { View } from '@/components/ui';
import type { ComponentConfig } from '@/types/config';

import { ProductCard } from './product-card';

type ProductGridProps = {
  config: ComponentConfig;
};

export function ProductGrid({ config }: ProductGridProps) {
  const { props, style } = config;
  const products = (props?.products as Array<Record<string, unknown>>) || [];
  const columns = (props?.columns as number) || 2;
  const className = (props?.className as string) || '';

  return (
    <View
      className={`flex-row flex-wrap ${className}`}
      style={[
        {
          gap: 12,
        },
        style,
      ]}
    >
      {products.map((product, index) => {
        // Calculate width for React Native (percentage doesn't work the same way)
        const itemWidth = columns === 2 ? '48%' : columns === 3 ? '31%' : '100%';
        
        return (
          <View
            key={(product.id as string) || index}
            style={{
              width: itemWidth,
            }}
          >
          <ProductCard
            config={{
              id: `product-${index}`,
              type: 'product-card',
              props: {
                productId: product.id as string,
                title: product.title as string,
                price: product.price as number,
                originalPrice: product.originalPrice as number,
                image: product.image as string,
                brand: product.brand as string,
                showWishlist: props?.showWishlist ?? true,
              },
            }}
          />
          </View>
        );
      })}
    </View>
  );
}

