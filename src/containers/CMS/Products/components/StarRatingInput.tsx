import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} disabled={readonly} onPress={() => onChange?.(star)} hitSlop={4}>
          <Ionicons
            name={rating >= star ? 'star' : 'star-outline'}
            size={size}
            color={rating >= star ? '#F5A623' : colors.textSecondary}
          />
        </Pressable>
      ))}
    </View>
  );
}
