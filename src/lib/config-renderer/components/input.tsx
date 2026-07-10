import * as React from 'react';

import { Input } from '@/components/ui';
import type { ComponentConfig } from '@/types/config';

type InputComponentProps = {
  config: ComponentConfig;
};

export function InputComponent({ config }: InputComponentProps) {
  const { props, style } = config;
  const placeholder = (props?.placeholder as string) || '';
  const value = (props?.value as string) || '';
  const onChangeText = (props?.onChangeText as (text: string) => void) || (() => {});
  const type = (props?.type as string) || 'text';
  const disabled = (props?.disabled as boolean) || false;
  const className = (props?.className as string) || '';

  return (
    <UIInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={type === 'email' ? 'email-address' : type === 'number' ? 'numeric' : 'default'}
      editable={!disabled}
      className={className}
      style={style}
    />
  );
}

