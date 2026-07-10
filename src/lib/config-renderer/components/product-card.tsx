import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable } from 'react-native';

import { Image, Text, View } from '@/components/ui';
import { Heart } from '@/components/ui/icons';
import { useCart } from '@/lib/store/cart-store';
import { useWishlist } from '@/lib/store/wishlist-store';
import type { ComponentConfig } from '@/types/config';

type ProductCardProps = {
  config: ComponentConfig;
};

export function ProductCard({ config }: ProductCardProps) {
  const { props, style } = config;
  const productId = (props?.productId as string) || '';
  const title = (props?.title as string) || '';
  const price = (props?.price as number) || 0;
  const originalPrice = (props?.originalPrice as number) || 0;
  const image = (props?.image as string) || '';
  const brand = (props?.brand as string) || '';
  const onPress = (props?.onPress as () => void) || (() => {});
  const className = (props?.className as string) || '';
  const navigateToDetail = (props?.navigateToDetail as boolean) ?? true;
  const showWishlist = (props?.showWishlist as boolean) ?? false;

  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const router = useRouter();
  
  const inWishlist = showWishlist && isInWishlist(productId);
  const hasDiscount = originalPrice > 0 && originalPrice > price;

  function handlePress() {
    if (navigateToDetail && productId) {
      router.push(`/storefront/${productId}`);
    } else {
      onPress();
    }
  }

  function handleAddToCart(e?: { stopPropagation?: () => void }) {
    if (e?.stopPropagation) {
      e.stopPropagation();
    }
    if (productId) {
      addToCart({
        id: productId,
        title,
        price,
        image,
        quantity: 1,
      });
    }
  }

  function handleWishlistPress(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    if (productId) {
      if (inWishlist) {
        removeFromWishlist(productId);
      } else {
        addToWishlist({
          id: productId,
          title,
          price,
          image,
          brand,
          originalPrice: originalPrice > 0 ? originalPrice : undefined,
        });
      }
    }
  }

  return (
    <Pressable onPress={handlePress} className={className} style={style}>
      <View className="bg-white rounded-lg shadow-sm overflow-hidden">
        <View className="relative">
          {image && (
            <Image
              source={{ uri: image }}
              style={{ width: '100%', height: 200 }}
              contentFit="cover"
            />
          )}
          {showWishlist && (
            <Pressable
              className="absolute top-2 right-2 bg-white/90 rounded-full p-2"
              onPress={handleWishlistPress}
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
        <View className="p-4">
          {brand && (
            <Text className="text-xs text-gray-500 mb-1">{brand}</Text>
          )}
          <Text className="text-lg font-semibold mb-2" numberOfLines={2}>
            {title}
          </Text>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Text className="text-xl font-bold text-primary">${price.toFixed(2)}</Text>
              {hasDiscount && (
                <Text className="text-xs text-gray-400 line-through ml-2">
                  ${originalPrice.toFixed(2)}
                </Text>
              )}
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              className="bg-primary px-3 py-1 rounded"
            >
              <Text className="text-white text-sm font-semibold">Add</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

