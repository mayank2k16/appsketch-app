import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ChatThread } from '@/api/ai-assistant';

import { CmsButton, CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type Props = {
  colors: CmsThemeColors;
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelect: (threadId: string) => void;
  onNewChat: () => void;
};

/** Replaces Vite's permanent thread-list sidebar — same "split pane → tap
 * target" adaptation used for Categories' tree/products split. */
export const ThreadsSheet = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, threads, activeThreadId, onSelect, onNewChat }, ref) => {
    return (
      <CmsModal ref={ref} colors={colors} title="Chats" snapPoints={['70%']}>
        <View style={st.header}>
          <CmsButton colors={colors} label="+ New chat" onPress={onNewChat} />
        </View>
        <BottomSheetFlatList
          data={threads}
          keyExtractor={(item) => item.thread_id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const active = item.thread_id === activeThreadId;
            return (
              <Pressable
                onPress={() => onSelect(item.thread_id)}
                style={[
                  st.row,
                  { borderColor: colors.border },
                  active && { backgroundColor: `${colors.accent}1A` },
                ]}
              >
                <Ionicons name="chatbubble-outline" size={16} color={active ? colors.accent : colors.textSecondary} />
                <Text style={[st.rowLabel, { color: active ? colors.accent : colors.textPrimary }]} numberOfLines={1}>
                  {item.title || 'Chat'}
                </Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={<Text style={{ color: colors.textSecondary, padding: 16 }}>No chats yet.</Text>}
        />
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { ...cmsType.inputValue, flex: 1 },
});
