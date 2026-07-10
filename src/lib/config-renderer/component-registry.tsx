import React from 'react';

import type { ComponentConfig, ComponentType } from '@/types/config';

import { Banner } from './components/banner';
import { Button } from './components/button';
import { Cart } from './components/cart';
import { CategoryGrid } from './components/category-grid';
import { CheckoutForm } from './components/checkout-form';
import { Container } from './components/container';
import { Divider } from './components/divider';
import { Hero } from './components/hero';
import { HeroCarousel } from './components/hero-carousel';
import { Image } from './components/image';
import { Input } from './components/input';
import { Navigation } from './components/navigation';
import { ProductCard } from './components/product-card';
import { ProductGrid } from './components/product-grid';
import { ProductRail } from './components/product-rail';
import { SearchBar } from './components/search-bar';
import { Skeleton } from './components/skeleton';
import { Spacer } from './components/spacer';
import { Text } from './components/text';
import { WishlistGrid } from './components/wishlist-grid';

type ComponentRegistryType = Record<
  ComponentType,
  React.ComponentType<{ config: ComponentConfig }>
>;

export const componentRegistry: ComponentRegistryType = {
  container: Container,
  text: Text,
  image: Image,
  button: Button,
  'product-grid': ProductGrid,
  'product-card': ProductCard,
  'product-rail': ProductRail,
  banner: Banner,
  hero: Hero,
  'hero-carousel': HeroCarousel,
  'category-grid': CategoryGrid,
  navigation: Navigation,
  cart: Cart,
  'checkout-form': CheckoutForm,
  input: Input,
  'search-bar': SearchBar,
  'wishlist-grid': WishlistGrid,
  spacer: Spacer,
  divider: Divider,
  skeleton: Skeleton,
};

export function getComponent(type: ComponentType) {
  const Component = componentRegistry[type];
  if (!Component) {
    console.warn(`Component type "${type}" not found in registry`);
    return null;
  }
  return Component;
}

