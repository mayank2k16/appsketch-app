import * as React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PressableScale } from '@/components/ui';

import type { CmsThemeColors } from '../../theme';

type Props = {
  colors: CmsThemeColors;
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
};

/** Five tappable stars — no hover state needed on mobile, tapping a star
 * sets the rating directly (replaces Vite's `StarRating`'s hover-preview
 * behavior, which has no touch equivalent). */
export function StarRatingInput({ colors, rating, onChange, size = 18, readonly }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = (
          <Ionicons
            name={rating >= star ? 'star' : 'star-outline'}
            size={size}
            color={rating >= star ? '#F5A623' : colors.textSecondary}
          />
        );
        // Read-only stars are a display, not a control — a plain View keeps
        // them at full opacity (PressableScale dims `disabled` to 50%).
        if (readonly || !onChange) return <View key={star}>{icon}</View>;
        return (
          <PressableScale key={star} onPress={() => onChange(star)} hitSlop={4}>
            {icon}
          </PressableScale>
        );
      })}
    </View>
  );
}
