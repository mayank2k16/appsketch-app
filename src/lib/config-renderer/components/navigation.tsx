import * as React from 'react';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/ui';
import { useTenant } from '@/lib/tenant';
import type { ComponentConfig } from '@/types/config';

type NavigationProps = {
  config: ComponentConfig;
};

export function Navigation({ config }: NavigationProps) {
  const { tenantConfig } = useTenant();
  const { props, style } = config;
  const className = (props?.className as string) || '';

  const navigationItems = tenantConfig?.navigation?.items || [];

  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200 ${className}`}
      style={style}
    >
      {navigationItems.map((item) => (
        <Pressable key={item.id} className="px-3 py-2">
          <Text className="text-base font-medium">{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

