import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { ArrowRight } from '@/components/ui/icons';
import type { Announcement } from '@/api/home';

type HomeAnnouncementProps = {
  announcement: Announcement | null | undefined;
  primaryColor?: string;
};

export function HomeAnnouncement({
  announcement,
  primaryColor = '#2563EB',
}: HomeAnnouncementProps) {
  if (!announcement) return null;

  return (
    <View className="px-4 py-3">
      <Text className="text-lg font-semibold text-gray-900 mb-2">Announcement</Text>
      <View className="bg-gray-50 rounded-xl p-4 flex-row items-center">
        <Text className="flex-1 text-gray-600 text-sm" numberOfLines={3}>
          {announcement.message}
        </Text>
        <Pressable
          className="w-10 h-10 rounded-full items-center justify-center ml-2"
          style={{ backgroundColor: primaryColor }}
        >
          <ArrowRight color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}
