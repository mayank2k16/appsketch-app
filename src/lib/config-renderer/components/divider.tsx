import * as React from 'react';

import { View } from '@/components/ui';
import type { ComponentConfig } from '@/types/config';

type DividerProps = {
  config: ComponentConfig;
};

export function Divider({ config }: DividerProps) {
  const { props, style } = config;
  const color = (props?.color as string) || '#E5E5E5';
  const thickness = (props?.thickness as number) || 1;
  const orientation = (props?.orientation as 'horizontal' | 'vertical') || 'horizontal';

  if (orientation === 'vertical') {
    return <View style={[{ width: thickness, backgroundColor: color }, style]} />;
  }

  return <View style={[{ height: thickness, backgroundColor: color, width: '100%' }, style]} />;
}

