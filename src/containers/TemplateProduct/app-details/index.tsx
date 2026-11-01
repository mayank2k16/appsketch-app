import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';

import type { MarketTemplate } from '@/api/templates';

import { pageTheme } from '../theme';
import { About } from './about';
import { Comments } from './comments';
import { DetailsHeader } from './header';
import { Info } from './info';
import { Ratings } from './ratings';
import { Related } from './related';
import { useAppDetails } from './use-app-details';

/**
 * Everything under an app's screenshots, App Store style: name and quick
 * stats, about, ratings & reviews, comments, related apps, information.
 * Fetched from the template detail, reviews and comments APIs once the
 * page is near (`enabled`).
 */
export function AppDetails({
  template,
  dark,
  enabled,
}: {
  template: MarketTemplate;
  dark: boolean;
  enabled: boolean;
}) {
  const t = pageTheme(dark);
  const code = template.kind === 'code' ? template : null;
  const { detail, reviews, comments, loading } = useAppDetails(
    code?.id ?? 0,
    code?.uuid ?? '',
    enabled && !!code
  );
  if (!code) return null;
  return (
    <View>
      <DetailsHeader template={template} detail={detail} t={t} />
      <About
        text={detail?.long_description || code.description || ''}
        features={detail?.features ?? []}
        tags={code.tags ?? []}
        t={t}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={t.muted} />
      ) : null}
      <Ratings ratings={detail?.ratings} reviews={reviews} t={t} />
      <Comments comments={comments} total={detail?.comments ?? 0} t={t} />
      <Related items={detail?.related ?? []} t={t} />
      <Info detail={detail} screens={code.screenshots?.length ?? 0} t={t} />
    </View>
  );
}
