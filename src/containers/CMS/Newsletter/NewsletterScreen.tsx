import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { NewsletterCampaign, NewsletterSubscriber } from '@/api/newsletter';
import {
  flattenNewsletterPages,
  totalNewsletterCount,
  useNewsletterCampaigns,
  useNewsletterSubscribers,
  useSendNewsletterCampaign,
} from '@/api/newsletter';
import { useModal } from '@/components/ui';

import { CmsConfirmModal } from '../components';
import { useCmsTheme } from '../theme';
import { cmsType } from '../theme/cms-typography';
import { CampaignRow } from './components/CampaignRow';
import { CreateCampaignModal } from './components/CreateCampaignModal';
import { CampaignsSkeleton, SubscribersSkeleton } from './components/NewsletterSkeleton';
import { SubscriberRow } from './components/SubscriberRow';

type Segment = 'subscribers' | 'campaigns';

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'subscribers', label: 'Subscribers' },
  { key: 'campaigns', label: 'Campaigns' },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NewsletterScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [segment, setSegment] = React.useState<Segment>('subscribers');

  const subscribersQuery = useNewsletterSubscribers();
  const campaignsQuery = useNewsletterCampaigns();
  const subscribers = React.useMemo(
    () => flattenNewsletterPages(subscribersQuery.data?.pages),
    [subscribersQuery.data]
  );
  const campaigns = React.useMemo(() => flattenNewsletterPages(campaignsQuery.data?.pages), [campaignsQuery.data]);
  const subscriberCount = React.useMemo(() => totalNewsletterCount(subscribersQuery.data?.pages), [subscribersQuery.data]);
  const campaignCount = React.useMemo(() => totalNewsletterCount(campaignsQuery.data?.pages), [campaignsQuery.data]);

  const [sendTarget, setSendTarget] = React.useState<NewsletterCampaign | null>(null);
  const [sendingId, setSendingId] = React.useState<number | null>(null);
  const createModal = useModal();
  const sendConfirmModal = useModal();
  const sendCampaign = useSendNewsletterCampaign();
  const [createKey, setCreateKey] = React.useState(0);

  function openCreate() {
    setCreateKey((k) => k + 1);
    createModal.present();
  }
  function openSendConfirm(campaign: NewsletterCampaign) {
    setSendTarget(campaign);
    sendConfirmModal.present();
  }
  function confirmSend() {
    if (!sendTarget) return;
    setSendingId(sendTarget.id);
    sendCampaign.mutate(sendTarget.id, {
      onSettled: () => {
        setSendingId(null);
        sendConfirmModal.dismiss();
        setSendTarget(null);
      },
    });
  }

  const renderSubscriber = React.useCallback(
    ({ item }: { item: NewsletterSubscriber }) => <SubscriberRow subscriber={item} colors={colors} />,
    [colors]
  );
  const renderCampaign = React.useCallback(
    ({ item }: { item: NewsletterCampaign }) => (
      <CampaignRow campaign={item} colors={colors} sending={sendingId === item.id} onSend={() => openSendConfirm(item)} />
    ),
    [colors, sendingId]
  );

  const activeQuery = segment === 'subscribers' ? subscribersQuery : campaignsQuery;

  return (
    <View style={[st.root, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={st.statScroll}
        contentContainerStyle={st.statScrollContent}
      >
        <StatCard label="Subscribers" value={String(subscriberCount)} colors={colors} accent={colors.accent} />
        <StatCard label="Campaigns" value={String(campaignCount)} colors={colors} accent={colors.info} />
      </ScrollView>

      <View style={st.controlsRow}>
        <View style={[st.segmentGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {SEGMENTS.map((s) => {
            const active = s.key === segment;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSegment(s.key)}
                style={[st.segment, active && { backgroundColor: colors.accent }]}
              >
                <Text style={[st.segmentLabel, { color: active ? colors.accentText : colors.textSecondary }]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {segment === 'campaigns' ? (
          <Pressable onPress={openCreate} style={[st.newBtn, { backgroundColor: colors.accent }]}>
            <Text style={[st.newBtnLabel, { color: colors.accentText }]}>+ New campaign</Text>
          </Pressable>
        ) : null}
      </View>

      {segment === 'subscribers' ? (
        subscribersQuery.isLoading ? (
          <SubscribersSkeleton colors={colors} />
        ) : subscribers.length === 0 ? (
          <View style={st.center}>
            <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>No subscribers yet</Text>
            <Text style={[st.emptyHint, { color: colors.textSecondary }]}>
              People join this list from the storefront newsletter block.
            </Text>
          </View>
        ) : (
          <FlatList
            data={subscribers}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderSubscriber}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (subscribersQuery.hasNextPage && !subscribersQuery.isFetchingNextPage) subscribersQuery.fetchNextPage();
            }}
            ListFooterComponent={<ListFooter query={activeQuery} colors={colors} />}
          />
        )
      ) : campaignsQuery.isLoading ? (
        <CampaignsSkeleton colors={colors} />
      ) : campaigns.length === 0 ? (
        <View style={st.center}>
          <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>No campaigns yet</Text>
          <Text style={[st.emptyHint, { color: colors.textSecondary }]}>
            Draft one to send an update to your confirmed subscriber list.
          </Text>
        </View>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCampaign}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (campaignsQuery.hasNextPage && !campaignsQuery.isFetchingNextPage) campaignsQuery.fetchNextPage();
          }}
          ListFooterComponent={<ListFooter query={activeQuery} colors={colors} />}
        />
      )}

      <CreateCampaignModal ref={createModal.ref} colors={colors} openKey={createKey} onDone={() => createModal.dismiss()} />
      <CmsConfirmModal
        ref={sendConfirmModal.ref}
        colors={colors}
        title="Send this campaign?"
        description={
          sendTarget
            ? `"${sendTarget.subject}" will be sent to every confirmed, subscribed recipient.`
            : undefined
        }
        confirmLabel="Send"
        destructive={false}
        loading={sendCampaign.isPending}
        onConfirm={confirmSend}
      />
    </View>
  );
}

function ListFooter({
  query,
  colors,
}: {
  query: { isFetchingNextPage: boolean };
  colors: ReturnType<typeof useCmsTheme>['colors'];
}) {
  if (!query.isFetchingNextPage) return null;
  return (
    <View style={{ paddingVertical: 16 }}>
      <ActivityIndicator size="small" color={colors.accent} />
    </View>
  );
}

function StatCard({
  label,
  value,
  colors,
  accent,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useCmsTheme>['colors'];
  accent: string;
}) {
  return (
    <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[st.statValue, { color: accent }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[st.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  statScroll: { flexGrow: 0, marginTop: 12 },
  statScrollContent: { paddingHorizontal: 16, gap: 10 },
  statCard: {
    width: 120,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  segmentGroup: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, padding: 3, gap: 2 },
  segment: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  segmentLabel: cmsType.buttonLabel,
  newBtn: { marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8 },
  newBtnLabel: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyHint: { fontSize: 12.5, textAlign: 'center', marginTop: 2, lineHeight: 18, maxWidth: 300 },
});
