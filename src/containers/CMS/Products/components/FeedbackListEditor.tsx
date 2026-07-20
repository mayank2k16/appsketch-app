import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTenantUsersSearch } from '@/api/orders';
import type { FeedbackItem } from '@/api/products';
import { useModal } from '@/components/ui';
import { SearchableSelect } from '@/components/ui/searchable-select';

import { CmsButton, CmsInput, CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { MediaGalleryField } from './MediaGalleryField';
import { StarRatingInput } from './StarRatingInput';

const EMPTY_DRAFT: FeedbackItem = {
  rating: 0,
  title: '',
  content: '',
  images: [],
  videos: [],
  user_id: undefined,
  user_name: '',
};

type Props = {
  colors: CmsThemeColors;
  items: FeedbackItem[];
  onChange: (items: FeedbackItem[]) => void;
};

/** Review list + add/edit popup — ports Vite's `AddFeedbacks` +
 * `PostFeedbackModal` + `StarRating`. Required-field check on save is kept
 * simple (rating > 0, title, content non-empty) rather than porting Vite's
 * exact character-count thresholds — a UX nicety, not core behavior. */
export function FeedbackListEditor({ colors, items, onChange }: Props) {
  const modal = useModal();
  const [draft, setDraft] = React.useState<FeedbackItem>(EMPTY_DRAFT);
  const [editIndex, setEditIndex] = React.useState<number | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const tenantUsers = useTenantUsersSearch();
  const userOptions = React.useMemo(
    () => (tenantUsers.data ?? []).map((u) => ({ label: u.name, value: u.id, phone_number: u.phone_number })),
    [tenantUsers.data]
  );
  const searchUsers = React.useCallback(
    async (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return userOptions;
      return userOptions.filter((o) => o.label.toLowerCase().includes(q));
    },
    [userOptions]
  );

  function openAdd() {
    setDraft(EMPTY_DRAFT);
    setEditIndex(null);
    setErrors({});
    modal.present();
  }
  function openEdit(index: number) {
    setDraft({ ...items[index] });
    setEditIndex(index);
    setErrors({});
    modal.present();
  }
  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function set<K extends keyof FeedbackItem>(key: K, value: FeedbackItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!draft.rating) nextErrors.rating = 'Please select a rating';
    if (!draft.title.trim()) nextErrors.title = 'Title is required';
    if (!draft.content.trim()) nextErrors.content = 'Review content is required';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const next = editIndex !== null ? items.map((it, i) => (i === editIndex ? draft : it)) : [...items, draft];
    onChange(next);
    modal.dismiss();
  }

  return (
    <View style={{ gap: 8 }}>
      {items.length > 0 ? (
        items.map((fb, idx) => (
          <View key={idx} style={[st.row, { borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[st.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {fb.user_name || 'Untitled'}
              </Text>
              <StarRatingInput colors={colors} rating={fb.rating} readonly size={13} />
            </View>
            <Pressable onPress={() => openEdit(idx)} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="create-outline" size={17} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => removeAt(idx)} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={17} color={colors.danger} />
            </Pressable>
          </View>
        ))
      ) : (
        <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>No reviews added yet</Text>
      )}

      <Pressable onPress={openAdd} style={[st.addBtn, { borderColor: colors.accent }]}>
        <Ionicons name="add" size={16} color={colors.accent} />
        <Text style={[st.addLabel, { color: colors.accent }]}>Add Review</Text>
      </Pressable>

      <CmsModal ref={modal.ref} colors={colors} snapPoints={['90%']} title={editIndex !== null ? 'Edit Review' : 'Add Review'}>
        <View style={st.popupBody}>
          <SearchableSelect
            label="User"
            placeholder="Select user"
            value={draft.user_id}
            displayValue={draft.user_name}
            onSearch={searchUsers}
            onSelect={(option) => {
              set('user_id', option.value as number);
              set('user_name', String(option.label));
            }}
          />

          <View style={{ gap: 6 }}>
            <Text style={[cmsType.inputLabel, { color: colors.textSecondary }]}>Rating</Text>
            <StarRatingInput colors={colors} rating={draft.rating} onChange={(r) => set('rating', r)} size={24} />
            {errors.rating ? <Text style={[cmsType.inputError, { color: colors.danger }]}>{errors.rating}</Text> : null}
          </View>

          <CmsInput
            colors={colors}
            label="Title"
            placeholder="Review title"
            value={draft.title}
            onChangeText={(v) => set('title', v)}
            error={errors.title}
          />
          <CmsInput
            colors={colors}
            label="Content"
            placeholder="Write review…"
            value={draft.content}
            onChangeText={(v) => set('content', v)}
            multiline
            numberOfLines={3}
            error={errors.content}
          />

          <MediaGalleryField colors={colors} label="Images" kind="image" multiple value={draft.images} onChange={(v) => set('images', v)} />
          <MediaGalleryField colors={colors} label="Videos" kind="video" multiple value={draft.videos} onChange={(v) => set('videos', v)} />

          <CmsButton colors={colors} label={editIndex !== null ? 'Save Changes' : 'Add Review'} onPress={handleSave} />
        </View>
      </CmsModal>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  rowTitle: { ...cmsType.listSubtitle, marginBottom: 3 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
  },
  addLabel: { fontSize: 12.5, fontWeight: '700' },
  popupBody: { padding: 16, gap: 12, paddingBottom: 40 },
});
