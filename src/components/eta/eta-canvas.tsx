import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { EtaKind } from './estimates';
import { EtaLoader } from './eta-loader';

/**
 * The ETA card centred on a canvas that is loading (a live site's panel, a
 * preview's WebView). It appears while `loading`, stays long enough after
 * the load lands to fill its bar (and record the time), then fades out. A
 * load that is abandoned (`loading` drops without `done`) is not recorded.
 */
type Props = {
  kind: EtaKind;
  label: string;
  dark: boolean;
  /** The canvas is loading and in view. */
  loading: boolean;
  /** The load landed. */
  done: boolean;
};

const LINGER_MS = 260;

export function EtaCanvas({ kind, label, dark, loading, done }: Props) {
  const [run, setRun] = React.useState(0);
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    if (loading && !done) {
      setShown(true);
      return;
    }
    if (!shown) return;
    const id = setTimeout(
      () => {
        setShown(false);
        setRun((r) => r + 1);
      },
      done ? LINGER_MS : 0
    );
    return () => clearTimeout(id);
  }, [loading, done, shown]);
  if (!shown) return null;
  return (
    <Animated.View
      key={run}
      pointerEvents="none"
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(160)}
      style={[StyleSheet.absoluteFill, s.center]}
    >
      <View>
        <EtaLoader kind={kind} label={label} dark={dark} done={done} />
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
