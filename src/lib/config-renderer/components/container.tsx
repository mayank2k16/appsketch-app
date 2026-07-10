import * as React from 'react';

import { View } from '@/components/ui';
import type { ComponentConfig } from '@/types/config';

type ContainerProps = {
  config: ComponentConfig;
  children?: React.ReactNode;
};

export function Container({ config, children }: ContainerProps) {
  const { style, props } = config;
  const className = (props?.className as string) || '';
  const padding = (props?.padding as number) || 0;
  const margin = (props?.margin as number) || 0;

  return (
    <View
      className={className}
      style={[
        {
          padding,
          margin,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

