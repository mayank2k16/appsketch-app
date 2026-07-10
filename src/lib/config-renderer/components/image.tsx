import * as React from 'react';

import { Image } from '@/components/ui';
import type { ComponentConfig } from '@/types/config';

type ImageComponentProps = {
  config: ComponentConfig;
};

export function ImageComponent({ config }: ImageComponentProps) {
  const { props, style } = config;
  const source = (props?.source as string) || '';
  const width = (props?.width as number) || 100;
  const height = (props?.height as number) || 100;
  const resizeMode = (props?.resizeMode as string) || 'cover';
  const className = (props?.className as string) || '';

  return (
    <UIImage
      source={{ uri: source }}
      style={[{ width, height }, style]}
      contentFit={resizeMode as 'cover' | 'contain' | 'fill' | 'scaleDown' | 'none'}
      className={className}
    />
  );
}

