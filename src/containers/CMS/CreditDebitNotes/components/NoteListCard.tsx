import * as React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { NoteListItem } from '@/api/credit-debit-notes';

import { CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { getNoteTypeMeta, money } from '../utils';

type Props = {
  note: NoteListItem;
  colors: CmsThemeColors;
};

export const NoteListCard = React.memo(function NoteListCard({ note, colors }: Props) {
  const hasUrl = Boolean(note.note_url);

  return (
    <Pressable
      onPress={hasUrl ? () => Linking.openURL(note.note_url!) : undefined}
      style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={st.headerRow}>
        <Text style={[st.ref, { color: colors.textPrimary }]} numberOfLines={1}>
          {note.reference_number || 'N/A'}
        </Text>
        <CmsStatusBadge meta={getNoteTypeMeta(note.type)} />
      </View>

      <Text style={[st.entity, { color: colors.textSecondary }]} numberOfLines={1}>
        {note.entity_details?.title || 'Unknown Entity'}
      </Text>

      <View style={st.footerRow}>
        <Text style={[st.amount, { color: colors.accent }]}>{money(note.final_price)}</Text>
        {hasUrl ? (
          <View style={st.linkRow}>
            <Ionicons name="open-outline" size={14} color={colors.textSecondary} />
            <Text style={[st.linkLabel, { color: colors.textSecondary }]}>View Document</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ref: { ...cmsType.listTitle, flex: 1 },
  entity: cmsType.listMeta,
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  amount: { fontSize: 14.5, fontWeight: '800' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkLabel: cmsType.listMeta,
});
