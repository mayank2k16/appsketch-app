import * as React from 'react';
import { Pressable, ScrollView } from 'react-native';

import { Image, Text, View } from '@/components/ui';
import { useCart } from '@/lib/store/cart-store';
import type { ComponentConfig } from '@/types/config';

type CartProps = {
  config: ComponentConfig;
};

export function Cart({ config }: CartProps) {
  const { props, style } = config;
  const className = (props?.className as string) || '';
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <View className={`p-4 ${className}`} style={style}>
        <Text className="text-center text-gray-500">Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${className}`} style={style}>
      <ScrollView className="flex-1">
        {items.map((item) => (
          <View
            key={item.id}
            className="flex-row items-center p-4 border-b border-gray-200 bg-white"
          >
            {item.image && (
              <Image
                source={{ uri: item.image }}
                style={{ width: 80, height: 80 }}
                contentFit="cover"
                className="rounded-lg mr-4"
              />
            )}
            <View className="flex-1">
              <Text className="text-base font-semibold mb-1">{item.title}</Text>
              <Text className="text-lg font-bold text-primary mb-2">
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
              <View className="flex-row items-center">
                <Pressable
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  className="bg-gray-200 w-8 h-8 rounded-full items-center justify-center"
                >
                  <Text>-</Text>
                </Pressable>
                <Text className="mx-4 text-base">{item.quantity}</Text>
                <Pressable
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  className="bg-gray-200 w-8 h-8 rounded-full items-center justify-center"
                >
                  <Text>+</Text>
                </Pressable>
                <Pressable
                  onPress={() => removeFromCart(item.id)}
                  className="ml-auto"
                >
                  <Text className="text-red-500">Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <View className="p-4 border-t border-gray-200 bg-white">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold">Total</Text>
          <Text className="text-2xl font-bold text-primary">${getTotal().toFixed(2)}</Text>
        </View>
        <Pressable
          onPress={clearCart}
          className="bg-red-500 py-3 rounded-lg items-center mb-2"
        >
          <Text className="text-white font-semibold">Clear Cart</Text>
        </Pressable>
      </View>
    </View>
  );
}

