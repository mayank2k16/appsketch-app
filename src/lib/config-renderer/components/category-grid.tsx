import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView } from 'react-native';

import { Image, Text, View } from '@/components/ui';
import type { ComponentConfig } from '@/types/config';

type CategoryGridProps = {
  config: ComponentConfig;
};

export function CategoryGrid({ config }: CategoryGridProps) {
  const { props, style } = config;
  const categories = (props?.categories as Array<Record<string, unknown>>) || [];
  const columns = (props?.columns as number) || 4;
  const className = (props?.className as string) || '';

  const router = useRouter();

  function handlePress(category: Record<string, unknown>) {
    const route = category.route as string;
    if (route) {
      // Always navigate to categories screen, with optional query params
      if (route.includes('?')) {
        const query = route.split('?')[1];
        router.push(`/storefront/categories?${query}` as never);
      } else {
        router.push('/storefront/categories' as never);
      }
    }
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <View className={className} style={style}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
        {categories.map((category, index) => (
          <Pressable
            key={category.id as string || index}
            onPress={() => handlePress(category)}
            className="items-center mr-4"
            style={{ width: 80 }}
          >
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-2 overflow-hidden">
              {category.image ? (
                <Image
                  source={{ uri: category.image as string }}
                  style={{ width: 64, height: 64 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-16 h-16 bg-gray-200 rounded-full" />
              )}
            </View>
            <Text className="text-xs text-center" numberOfLines={2}>
              {category.label as string || category.name as string}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

