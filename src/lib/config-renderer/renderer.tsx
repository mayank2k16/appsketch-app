import * as React from 'react';
import { ScrollView } from 'react-native';

import { View } from '@/components/ui';
import { useTenant } from '@/lib/tenant';
import type { ComponentConfig, ScreenConfig } from '@/types/config';

import { getComponent } from './component-registry';

type ConfigRendererProps = {
  screenConfig: ScreenConfig;
};

export function ConfigRenderer({ screenConfig }: ConfigRendererProps) {
  const { tenantConfig } = useTenant();

  function renderComponent(config: ComponentConfig): React.ReactNode {
    const Component = getComponent(config.type);
    if (!Component) {
      return null;
    }

    // Check conditions
    if (config.conditions?.show) {
      // TODO: Implement condition evaluation logic
    }

    return (
      <Component key={config.id} config={config}>
        {config.children?.map((child) => renderComponent(child))}
      </Component>
    );
  }

  const content = (
    <View className={getLayoutClass(screenConfig.layout)} style={screenConfig.style}>
      {screenConfig.components.map((component) => renderComponent(component))}
    </View>
  );

  if (screenConfig.layout === 'scroll') {
    return <ScrollView className="flex-1">{content}</ScrollView>;
  }

  return content;
}

function getLayoutClass(layout: string): string {
  switch (layout) {
    case 'stack':
    case 'column':
      return 'flex flex-col';
    case 'row':
      return 'flex flex-row';
    case 'grid':
      return 'flex-row flex-wrap';
    case 'scroll':
      return 'flex flex-col';
    default:
      return 'flex flex-col';
  }
}

