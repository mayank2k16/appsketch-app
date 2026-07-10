import * as React from 'react';
import { View } from 'react-native';

import type { ComponentConfig } from '@/types/config';

type SkeletonProps = {
  config: ComponentConfig;
};

export function Skeleton({ config }: SkeletonProps) {
  const { props, style } = config;
  const width = (props?.width as number) || 100;
  const height = (props?.height as number) || 20;
  const variant = (props?.variant as 'text' | 'rect' | 'circle') || 'rect';
  const className = (props?.className as string) || '';

  const borderRadius = variant === 'circle' ? width / 2 : variant === 'text' ? 4 : 8;

  return (
    <View
      className={`bg-gray-200 ${className}`}
      style={[
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
}

