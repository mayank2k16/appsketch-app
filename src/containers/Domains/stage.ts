import type { DomainStage, DomainView } from '@/api/app-domains';
import type { ServicesPalette } from '@/components/services';

export const STEPS = [
  'DNS connected',
  'Building your site',
  'Securing with HTTPS',
  'Live',
];

/** Which of the 4 tracker steps is current (0-based); 4 = all done. */
export function stepIndex(stage: DomainStage): number {
  switch (stage) {
    case 'awaiting_dns':
      return 0;
    case 'building':
      return 1;
    case 'securing':
      return 2;
    case 'live':
      return 4;
    default:
      return -1;
  }
}

export function stageTone(stage: DomainStage, s: ServicesPalette): string {
  if (stage === 'live') return s.success;
  if (stage === 'failed') return s.error;
  if (stage === 'web_unavailable') return s.warning;
  return s.orange;
}

export const FALLBACK_LABEL: Record<DomainStage, string> = {
  awaiting_dns: 'Waiting for DNS',
  building: 'Building your site',
  securing: 'Securing with HTTPS',
  live: 'Live',
  failed: 'Setup failed',
  web_unavailable: 'Needs a website',
};

export const stageLabel = (d: DomainView) =>
  d.stage_label || FALLBACK_LABEL[d.stage] || d.stage;
