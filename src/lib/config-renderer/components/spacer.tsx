import * as React from 'react';

import { View } from '@/components/ui';
import type { ComponentConfig } from '@/types/config';

type SpacerProps = {
  config: ComponentConfig;
};

export function Spacer({ config }: SpacerProps) {
  const { props } = config;
  const height = (props?.height as number) || 16;
  const width = (props?.width as number) || 0;

  return <View style={{ height, width }} />;
}

