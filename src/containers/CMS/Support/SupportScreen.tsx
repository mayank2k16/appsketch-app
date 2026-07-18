import * as React from 'react';
import { View } from 'react-native';

import { useCmsTheme } from '../theme';
import { ChatView } from './components/ChatView';
import { ConversationsList } from './components/ConversationsList';

/** Vite's `Support.jsx` is a permanent two-pane inbox (list left, chat
 * right). That's the one layout in this whole port where the mobile
 * adaptation isn't a judgment call — it's the universal inbox pattern (Mail,
 * Messages, WhatsApp): list and chat become two states of one screen,
 * exactly mirroring how `Support.jsx` itself already gates the chat pane on
 * `!activeId` internally. `ConversationsList` unmounts (and its inbox socket
 * closes) while a chat is open, and remounts — refetching fresh — when the
 * user taps back; no extra refresh plumbing needed for that. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SupportScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [activeId, setActiveId] = React.useState<number | null>(null);

  return (
    <View style={{ flex: 1 }}>
      {activeId === null ? (
        <ConversationsList colors={colors} activeId={activeId} onSelect={setActiveId} />
      ) : (
        <ChatView colors={colors} conversationId={activeId} onBack={() => setActiveId(null)} />
      )}
    </View>
  );
}
