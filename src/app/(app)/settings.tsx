import { Env } from '@env';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Linking, Platform, Share as RNShare } from 'react-native';

import { HapticsItem } from '@/components/settings/haptics-item';
import { Item } from '@/components/settings/item';
import { ItemsContainer } from '@/components/settings/items-container';
import { LanguageItem } from '@/components/settings/language-item';
import { ThemeItem } from '@/components/settings/theme-item';
import {
  colors,
  FocusAwareStatusBar,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { Rate, Share, Support, Website } from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { translate } from '@/lib';

const SITE_URL = 'https://appsketch.ai';

function shareApp() {
  RNShare.share({
    message: `Check out AppSketch — build real apps by describing them. ${SITE_URL}`,
    url: SITE_URL,
  }).catch(() => {});
}

// No App Store id is configured, so iOS opens the App Store on a search for
// the app; Android goes straight to the listing (web fallback if the Play
// Store app is missing).
function rateApp() {
  if (Platform.OS === 'android') {
    Linking.openURL(`market://details?id=${Env.PACKAGE}`).catch(() =>
      Linking.openURL(
        `https://play.google.com/store/apps/details?id=${Env.PACKAGE}`
      ).catch(() => {})
    );
    return;
  }
  Linking.openURL(
    'itms-apps://apps.apple.com/search?term=AppSketch&media=software'
  ).catch(() => Linking.openURL(SITE_URL).catch(() => {}));
}

function SupportSection({ iconColor }: { iconColor: string }) {
  const router = useRouter();
  return (
    <ItemsContainer title="settings.support_us">
      <Item
        text="settings.share"
        icon={<Share color={iconColor} />}
        onPress={shareApp}
      />
      <Item
        text="settings.rate"
        icon={<Rate color={iconColor} />}
        onPress={rateApp}
      />
      <Item
        text="settings.support"
        icon={<Support color={iconColor} />}
        onPress={() => router.push('/support')}
      />
    </ItemsContainer>
  );
}

function LinksSection({ iconColor }: { iconColor: string }) {
  const router = useRouter();
  return (
    <ItemsContainer title="settings.links">
      <Item
        text="settings.privacy"
        onPress={() => router.push('/privacy-policy')}
      />
      <Item text="settings.terms" onPress={() => router.push('/tnc')} />
      <Item
        text="settings.website"
        icon={<Website color={iconColor} />}
        onPress={() => Linking.openURL(SITE_URL).catch(() => {})}
      />
    </ItemsContainer>
  );
}

export default function Settings() {
  const signOut = useAuth.use.signOut();
  const { colorScheme } = useColorScheme();
  // White: secondary ink for the row glyphs (docs/white-theme.md).
  const iconColor = colorScheme === 'dark' ? colors.neutral[400] : '#5C5D63';
  return (
    <>
      <FocusAwareStatusBar />

      <ScrollView>
        <View className="flex-1 px-4 pt-16 ">
          <Text className="text-xl font-bold">
            {translate('settings.title')}
          </Text>
          <ItemsContainer title="settings.generale">
            <LanguageItem />
            <ThemeItem />
            <HapticsItem />
          </ItemsContainer>

          <ItemsContainer title="settings.about">
            <Item text="settings.app_name" value={Env.NAME} />
            <Item text="settings.version" value={Env.VERSION} />
          </ItemsContainer>

          <SupportSection iconColor={iconColor} />
          <LinksSection iconColor={iconColor} />

          <View className="my-8">
            <ItemsContainer>
              <Item text="settings.logout" onPress={signOut} />
            </ItemsContainer>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
