import { useRouter } from 'expo-router';
import * as React from 'react';
import { Dimensions, Pressable, ScrollView } from 'react-native';

import { Image, Text, View } from '@/components/ui';
import type { ComponentConfig } from '@/types/config';

type HeroCarouselProps = {
  config: ComponentConfig;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HeroCarousel({ config }: HeroCarouselProps) {
  const { props, style } = config;
  const items = (props?.items as Array<Record<string, unknown>>) || [];
  const height = (props?.height as number) || 300;
  const autoPlay = (props?.autoPlay as boolean) ?? false;
  const className = (props?.className as string) || '';

  const router = useRouter();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (autoPlay && items.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % items.length;
          scrollViewRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
          return next;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoPlay, items.length]);

  function handlePress(item: Record<string, unknown>) {
    const route = item.route as string;
    if (route) {
      router.push(route as never);
    }
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <View className={className} style={style}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
      >
        {items.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => handlePress(item)}
            style={{ width: SCREEN_WIDTH, height }}
          >
            <Image
              source={{ uri: item.image as string }}
              style={{ width: SCREEN_WIDTH, height }}
              contentFit="cover"
            />
            {(item.title || item.subtitle) && (
              <View className="absolute inset-0 justify-center items-center bg-black/30 p-4">
                {item.title && (
                  <Text className="text-white text-3xl font-bold mb-2 text-center">
                    {item.title as string}
                  </Text>
                )}
                {item.subtitle && (
                  <Text className="text-white text-lg text-center">{item.subtitle as string}</Text>
                )}
                {item.ctaText && (
                  <Pressable
                    className="bg-white px-6 py-3 rounded-lg mt-4"
                    onPress={() => handlePress(item)}
                  >
                    <Text className="text-black font-semibold">{item.ctaText as string}</Text>
                  </Pressable>
                )}
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
      {items.length > 1 && (
        <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
          {items.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/50 w-2'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

