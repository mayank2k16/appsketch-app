import * as React from 'react';
import { Pressable } from 'react-native';

import { Image, Text, View } from '@/components/ui';
import type { ComponentConfig } from '@/types/config';

type HeroProps = {
  config: ComponentConfig;
  children?: React.ReactNode;
};

export function Hero({ config, children }: HeroProps) {
  const { props, style } = config;
  const image = (props?.image as string) || '';
  const title = (props?.title as string) || '';
  const subtitle = (props?.subtitle as string) || '';
  const ctaText = (props?.ctaText as string) || '';
  const onPress = (props?.onPress as () => void) || (() => {});
  const height = (props?.height as number) || 400;
  const className = (props?.className as string) || '';

  return (
    <View className={className} style={[{ height }, style]}>
      {image && (
        <Image
          source={{ uri: image }}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          contentFit="cover"
        />
      )}
      <View className="flex-1 justify-center items-center p-6 bg-black/40">
        {title && (
          <Text className="text-white text-4xl font-bold mb-4 text-center">{title}</Text>
        )}
        {subtitle && (
          <Text className="text-white text-lg mb-6 text-center">{subtitle}</Text>
        )}
        {ctaText && (
          <Pressable
            onPress={onPress}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">{ctaText}</Text>
          </Pressable>
        )}
        {children}
      </View>
    </View>
  );
}

