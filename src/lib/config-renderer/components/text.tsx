import * as React from 'react';

import { Text as UIText } from '@/components/ui';
import type { ComponentConfig } from '@/types/config';

type TextComponentProps = {
  config: ComponentConfig;
  children?: React.ReactNode;
};

export function Text({ config, children }: TextComponentProps) {
  const { props, style } = config;
  const content = (props?.content as string) || '';
  const variant = (props?.variant as string) || 'body';
  const className = (props?.className as string) || '';

  const variantClasses: Record<string, string> = {
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-bold',
    h3: 'text-2xl font-semibold',
    h4: 'text-xl font-semibold',
    body: 'text-base',
    caption: 'text-sm',
    small: 'text-xs',
  };

  return (
    <UIText className={`${variantClasses[variant] || ''} ${className}`} style={style}>
      {content || children}
    </UIText>
  );
}

