import * as React from 'react';

import { Button as UIButton } from '@/components/ui';
import type { ComponentConfig } from '@/types/config';

type ButtonComponentProps = {
  config: ComponentConfig;
  children?: React.ReactNode;
};

export function Button({ config, children }: ButtonComponentProps) {
  const { props, style } = config;
  const label = (props?.label as string) || '';
  const onPress = (props?.onPress as () => void) || (() => {});
  const variant = (props?.variant as string) || 'default';
  const disabled = (props?.disabled as boolean) || false;
  const className = (props?.className as string) || '';

  // Map config variants to UI button variants
  const variantMap: Record<string, 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary'> = {
    default: 'default',
    outline: 'outline',
    ghost: 'ghost',
    destructive: 'destructive',
    secondary: 'secondary',
  };

  return (
    <UIButton
      label={label || (children as string)}
      onPress={onPress}
      variant={variantMap[variant] || 'default'}
      disabled={disabled}
      className={className}
      style={style}
    />
  );
}

