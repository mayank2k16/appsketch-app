import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable } from 'react-native';

import { Input, Text, View } from '@/components/ui';
import { Search as SearchIcon } from '@/components/ui/icons';
import type { ComponentConfig } from '@/types/config';

type SearchBarProps = {
  config: ComponentConfig;
};

export function SearchBar({ config }: SearchBarProps) {
  const { props, style } = config;
  const placeholder = (props?.placeholder as string) || 'Search products...';
  const className = (props?.className as string) || '';

  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');

  function handleSearch() {
    if (searchQuery.trim()) {
      router.push(`/storefront/explore?q=${encodeURIComponent(searchQuery)}` as never);
    } else {
      router.push('/storefront/explore' as never);
    }
  }

  return (
    <View className={`flex-row items-center bg-gray-100 rounded-lg px-4 ${className}`} style={style}>
      <SearchIcon color="#6B7280" size={20} />
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
        className="flex-1 ml-2 bg-transparent border-0"
      />
      <Pressable onPress={handleSearch}>
        <Text className="text-primary font-semibold">Search</Text>
      </Pressable>
    </View>
  );
}

