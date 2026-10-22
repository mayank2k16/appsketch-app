import * as React from 'react';

import { Switch, Text, View } from '@/components/ui';
import { translate } from '@/lib';
import { useHapticsEnabled } from '@/lib/hooks/use-haptics-enabled';

/** Settings row: turn the app's haptic feedback on or off (default on). */
export const HapticsItem = () => {
  const [enabled, setEnabled] = useHapticsEnabled();
  return (
    <View className="flex-1 flex-row items-center justify-between px-4 py-2">
      <Text tx="settings.haptics" />
      <Switch.Root
        checked={enabled}
        onChange={setEnabled}
        accessibilityLabel={translate('settings.haptics')}
      >
        <Switch.Icon checked={enabled} />
      </Switch.Root>
    </View>
  );
};
