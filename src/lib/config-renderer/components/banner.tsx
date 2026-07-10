import * as React from 'react';
import { Pressable } from 'react-native';

import { Image, Text, View } from '@/components/ui';
import type { ComponentConfig } from '@/types/config';

type BannerProps = {
  config: ComponentConfig;
  children?: React.ReactNode;
};

export function Banner({ config, children }: BannerProps) {
  const { props, style } = config;
  const image = (props?.image as string) || '';
  const title = (props?.title as string) || '';
  const subtitle = (props?.subtitle as string) || '';
  const onPress = (props?.onPress as () => void) || (() => {});
  const height = (props?.height as number) || 200;
  const className = (props?.className as string) || '';

  return (
    <Pressable onPress={onPress} className={className} style={style}>
      <View style={{ height, position: 'relative' }} className="overflow-hidden rounded-lg">
        {image && (
          <Image
            source={{ uri: image }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        )}
        {(title || subtitle) && (
          <View className="absolute inset-0 justify-center items-center bg-black/30 p-4">
            {title && (
              <Text className="text-white text-2xl font-bold mb-2 text-center">{title}</Text>
            )}
            {subtitle && (
              <Text className="text-white text-base text-center">{subtitle}</Text>
            )}
          </View>
        )}
        {children}
      </View>
    </Pressable>
  );
}

