import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { create } from 'zustand';

import type { EtaKind } from './estimates';
import { EtaLoader } from './eta-loader';

/**
 * One screen-wide loader for work that has no canvas of its own — starting
 * an app natively, copying a template: the ETA card over a dimmed screen.
 * `startEta` shows it; `endEta(true)` fills the bar, learns the duration and
 * fades it out; `endEta(false)` just removes it (a failure is not a time).
 */

type Job = { id: number; kind: EtaKind; label: string; done: boolean };

const useEtaJob = create<{ job: Job | null }>(() => ({ job: null }));

let seq = 0;

export function startEta(kind: EtaKind, label: string): number {
  seq += 1;
  useEtaJob.setState({ job: { id: seq, kind, label, done: false } });
  return seq;
}

export function endEta(id: number, ok: boolean): void {
  const { job } = useEtaJob.getState();
  if (!job || job.id !== id) return;
  if (!ok) {
    useEtaJob.setState({ job: null });
    return;
  }
  useEtaJob.setState({ job: { ...job, done: true } });
  setTimeout(() => {
    if (useEtaJob.getState().job?.id === id) useEtaJob.setState({ job: null });
  }, 260);
}

export function EtaOverlay() {
  const job = useEtaJob((st) => st.job);
  const { colorScheme } = useColorScheme();
  if (!job) return null;
  return (
    <Animated.View
      key={job.id}
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(160)}
      style={[StyleSheet.absoluteFill, s.scrim]}
    >
      <View style={s.center}>
        <EtaLoader
          kind={job.kind}
          label={job.label}
          dark={colorScheme === 'dark'}
          done={job.done}
        />
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(0,0,0,0.38)', zIndex: 1000 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
