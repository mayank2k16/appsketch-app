import { useFocusEffect } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as React from 'react';
import { AppState, Platform, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getScreenNavConfig } from '@/lib/navigation';
import { useCart } from '@/lib/store/cart-store';
import { useTenant } from '@/lib/tenant';
import { F } from '@/lib/fonts';

function StorefrontCartHydrator() {
  const fetchCart = useCart((s) => s.fetchCart);

  // Fetch for everyone: authenticated users get their account cart,
  // guests get their session cart (no Authorization header = unauthenticated).
  React.useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  useFocusEffect(
    React.useCallback(() => {
      void fetchCart();
    }, [fetchCart])
  );

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void fetchCart();
    });
    return () => sub.remove();
  }, [fetchCart]);

  return null;
}

export default function StorefrontLayout() {
  const { isLoading } = useTenant();

  if (isLoading) {
    return null;
  }

  const primaryColor = '#000';

  return (
    <>
      <StorefrontCartHydrator />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: primaryColor,
          headerTitleStyle: { fontWeight: '600' },
          headerBackTitleVisible: false,
          headerBackTitle: '',
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="categories"
          options={({ navigation, route }) => {
            const params = (route.params ?? {}) as { categoryName?: string };
            const title  = params.categoryName ?? stackOptionsFromConfig('categories').title ?? 'Categories';
            return {
              ...stackOptionsFromConfig('categories'),
              title,
              headerBackTitle: '',
              headerBackTitleVisible: false,
              headerStyle: { backgroundColor: '#C41230' },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                color: '#FFFFFF',
                fontFamily: F.sans800,
                fontSize: 17,
              },
              headerShadowVisible: false,
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ paddingRight: 8, paddingLeft: Platform.OS === 'ios' ? 0 : 4 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              ),
            };
          }}
        />
        <Stack.Screen
          name="[slug]"
          options={{
            ...stackOptionsFromConfig('[slug]'),
          }}
        />
        <Stack.Screen
          name="cart"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            ...stackOptionsFromConfig('checkout'),
          }}
        />
        <Stack.Screen
          name="products"
          options={{
            ...stackOptionsFromConfig('products'),
          }}
        />
        <Stack.Screen
          name="myorders"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="terms"
          options={({ navigation }) => ({
            ...stackOptionsFromConfig('terms'),
            headerBackTitle: '',
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ paddingRight: 8, paddingLeft: Platform.OS === 'ios' ? 0 : 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={28} color="#000" />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="privacy"
          options={({ navigation }) => ({
            ...stackOptionsFromConfig('privacy'),
            headerBackTitle: '',
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ paddingRight: 8, paddingLeft: Platform.OS === 'ios' ? 0 : 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={28} color="#000" />
              </TouchableOpacity>
            ),
          })}
        />
      </Stack>
    </>
  );
}

function stackOptionsFromConfig(routeName: string) {
  const config = getScreenNavConfig(routeName);
  return {
    title: config.title ?? routeName,
    headerShown: config.showHeader,
    headerTransparent: config.headerStyle === 'transparent',
  };
}
