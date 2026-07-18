import * as React from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { NoteListItem } from '@/api/credit-debit-notes';
import { useNotes } from '@/api/credit-debit-notes';
import { useModal } from '@/components/ui';

import { CmsButton } from '../components';
import { useCmsTheme } from '../theme';
import { CreateNoteModal } from './components/CreateNoteModal';
import { NoteListCard } from './components/NoteListCard';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CreditDebitNotesScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [query, setQuery] = React.useState('');

  const notesQuery = useNotes();
  const notes = notesQuery.data ?? [];
  const createModal = useModal();

  const filteredNotes = React.useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (note) => note.entity_details?.title?.toLowerCase().includes(q) || note.reference_number?.toLowerCase().includes(q)
    );
  }, [notes, query]);

  const renderItem = React.useCallback(
    ({ item }: { item: NoteListItem }) => <NoteListCard note={item} colors={colors} />,
    [colors]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={[st.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Credit/Debit Note…"
          placeholderTextColor={colors.textSecondary}
          style={[st.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      <View style={st.createBtnWrap}>
        <CmsButton colors={colors} label="Generate Credit/Debit Note" onPress={createModal.present} />
      </View>

      {notesQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading notes…</Text>
        </View>
      ) : filteredNotes.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No credit/debit notes found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}

      <CreateNoteModal ref={createModal.ref} colors={colors} onDone={createModal.dismiss} />
    </View>
  );
}

const st = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  createBtnWrap: { paddingHorizontal: 16, marginBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
});
