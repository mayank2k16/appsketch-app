import * as React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui';

type AboutBrandProps = {
  primaryColor?: string;
};

export function HomeOrders({ primaryColor = '#111827' }: AboutBrandProps) {
  return (
    <View className="px-6 py-10 bg-white">
      
      {/* Section Label */}
      <Text className="text-xs tracking-[3px] text-gray-500 uppercase mb-3">
        Our Story
      </Text>

      {/* Headline */}
      <Text className="text-3xl font-bold text-gray-900 leading-snug mb-4">
        Redefining Modern Elegance
      </Text>

      {/* Description */}
      <Text className="text-base text-gray-600 leading-relaxed mb-6">
        We craft timeless silhouettes with a contemporary edge — blending
        precision tailoring, luxurious fabrics, and effortless sophistication.
        Every collection reflects confidence, minimalism, and elevated
        everyday wear designed for those who move with purpose.
      </Text>

      {/* Divider */}
      <View className="h-px bg-gray-200 mb-6" />

      {/* Highlights Row */}
      <View className="flex-row justify-between mb-8">
        <View>
          <Text className="text-xl font-semibold text-gray-900">2018</Text>
          <Text className="text-xs text-gray-500 tracking-wider uppercase">
            Founded
          </Text>
        </View>

        <View>
          <Text className="text-xl font-semibold text-gray-900">15+</Text>
          <Text className="text-xs text-gray-500 tracking-wider uppercase">
            Collections
          </Text>
        </View>

        <View>
          <Text className="text-xl font-semibold text-gray-900">Worldwide</Text>
          <Text className="text-xs text-gray-500 tracking-wider uppercase">
            Shipping
          </Text>
        </View>
      </View>

      {/* CTA */}
      <Pressable
        className="rounded-full py-3 items-center"
        style={{ backgroundColor: primaryColor }}
      >
        <Text className="text-white font-semibold tracking-wide">
          Explore Collection
        </Text>
      </Pressable>

    </View>
  );
}
