import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView } from 'react-native';

import { Image, Text, View } from '@/components/ui';
import { useCart } from '@/lib/store/cart-store';
import { useWishlist } from '@/lib/store/wishlist-store';
import type { ComponentConfig } from '@/types/config';

import { Heart } from '@/components/ui/icons';

type ProductRailProps = {
  config: ComponentConfig;
};

export function ProductRail({ config }: ProductRailProps) {
  const { props, style } = config;
  const title = (props?.title as string) || '';
  const products = (props?.products as Array<Record<string, unknown>>) || [];
  const showWishlist = (props?.showWishlist as boolean) ?? true;
  const className = (props?.className as string) || '';

  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  function handleProductPress(product: Record<string, unknown>) {
    const productId = product.id as string;
    if (productId) {
      router.push(`/storefront/${productId}` as never);
    }
  }

  function handleWishlistPress(product: Record<string, unknown>, e: { stopPropagation: () => void }) {
    e.stopPropagation();
    const productId = product.id as string;
    if (productId) {
      if (isInWishlist(productId)) {
        removeFromWishlist(productId);
      } else {
        addToWishlist({
          id: productId,
          title: product.title as string,
          price: product.price as number,
          image: product.image as string,
          brand: product.brand as string,
        });
      }
    }
  }

  function handleAddToCart(product: Record<string, unknown>, e?: { stopPropagation?: () => void }) {
    if (e?.stopPropagation) {
      e.stopPropagation();
    }
    const productId = product.id as string;
    if (productId) {
      addToCart({
        id: productId,
        title: product.title as string,
        price: product.price as number,
        image: product.image as string,
        quantity: 1,
      });
    }
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <View className={className} style={style}>
      {title && (
        <View className="flex-row justify-between items-center px-4 mb-4">
          <Text className="text-2xl font-bold">{title}</Text>
          <Pressable onPress={() => router.push('/storefront/categories' as never)}>
            <Text className="text-sm text-gray-600">See All</Text>
          </Pressable>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
        {products.map((product, index) => {
          const productId = product.id as string;
          const inWishlist = showWishlist && isInWishlist(productId);
          const originalPrice = product.originalPrice as number;
          const price = product.price as number;
          const hasDiscount = originalPrice && originalPrice > price;

          return (
            <Pressable
              key={productId || index}
              onPress={() => handleProductPress(product)}
              className="mr-4"
              style={{ width: 180 }}
            >
              <View className="bg-white rounded-lg overflow-hidden shadow-sm">
                <View className="relative">
                  <Image
                    source={{ uri: product.image as string }}
                    style={{ width: 180, height: 240 }}
                    contentFit="cover"
                  />
                  {showWishlist && (
                    <Pressable
                      className="absolute top-2 right-2 bg-white/90 rounded-full p-2"
                      onPress={(e) => handleWishlistPress(product, e)}
                    >
                      <Heart color="#EF4444" filled={inWishlist} size={18} />
                    </Pressable>
                  )}
                  {hasDiscount && (
                    <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded">
                      <Text className="text-white text-xs font-bold">
                        {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
                      </Text>
                    </View>
                  )}
                </View>
                <View className="p-3">
                  {product.brand && (
                    <Text className="text-xs text-gray-500 mb-1">{product.brand as string}</Text>
                  )}
                  <Text className="text-sm font-semibold mb-2" numberOfLines={2}>
                    {product.title as string}
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Text className="text-base font-bold text-primary">
                        ${price.toFixed(2)}
                      </Text>
                      {hasDiscount && (
                        <Text className="text-xs text-gray-400 line-through ml-2">
                          ${originalPrice.toFixed(2)}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      className="bg-primary px-3 py-1 rounded"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <Text className="text-white text-xs font-semibold">Add</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

