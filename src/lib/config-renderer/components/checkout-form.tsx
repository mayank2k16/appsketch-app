import * as React from 'react';
import { ScrollView } from 'react-native';

import { Button, Input, Text, View } from '@/components/ui';
import { useCart } from '@/lib/store/cart-store';
import type { ComponentConfig } from '@/types/config';

type CheckoutFormProps = {
  config: ComponentConfig;
};

export function CheckoutForm({ config }: CheckoutFormProps) {
  const { props, style } = config;
  const className = (props?.className as string) || '';
  const onSubmit = (props?.onSubmit as (data: Record<string, unknown>) => void) || (() => {});

  const { getTotal, clearCart } = useCart();
  const [formData, setFormData] = React.useState({
    email: '',
    name: '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  function handleSubmit() {
    onSubmit({
      ...formData,
      total: getTotal(),
    });
    clearCart();
  }

  return (
    <ScrollView className={`flex-1 ${className}`} style={style}>
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Shipping Information</Text>
        <Input
          placeholder="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          className="mb-4"
        />
        <Input
          placeholder="Full Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          className="mb-4"
        />
        <Input
          placeholder="Address"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          className="mb-4"
        />
        <View className="flex-row mb-4">
          <Input
            placeholder="City"
            value={formData.city}
            onChangeText={(text) => setFormData({ ...formData, city: text })}
            className="flex-1 mr-2"
          />
          <Input
            placeholder="ZIP Code"
            value={formData.zipCode}
            onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
            className="flex-1"
          />
        </View>

        <Text className="text-2xl font-bold mb-4 mt-6">Payment Information</Text>
        <Input
          placeholder="Card Number"
          value={formData.cardNumber}
          onChangeText={(text) => setFormData({ ...formData, cardNumber: text })}
          keyboardType="numeric"
          className="mb-4"
        />
        <View className="flex-row mb-4">
          <Input
            placeholder="MM/YY"
            value={formData.expiryDate}
            onChangeText={(text) => setFormData({ ...formData, expiryDate: text })}
            className="flex-1 mr-2"
          />
          <Input
            placeholder="CVV"
            value={formData.cvv}
            onChangeText={(text) => setFormData({ ...formData, cvv: text })}
            keyboardType="numeric"
            className="flex-1"
          />
        </View>

        <View className="mt-4 p-4 bg-gray-100 rounded-lg mb-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold">Total</Text>
            <Text className="text-2xl font-bold text-primary">${getTotal().toFixed(2)}</Text>
          </View>
        </View>

        <Button
          label="Complete Order"
          onPress={handleSubmit}
          variant="default"
          className="w-full"
        />
      </View>
    </ScrollView>
  );
}

