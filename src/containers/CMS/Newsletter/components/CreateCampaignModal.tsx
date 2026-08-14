import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';

import { useCreateNewsletterCampaign } from '@/api/newsletter';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSheetScrollView } from '../../components';
import type { CmsThemeColors } from '../../theme';

type FormState = { subject: string; body_html: string; body_text: string };

function getDefaultForm(): FormState {
  return { subject: '', body_html: '', body_text: '' };
}

type Props = {
  colors: CmsThemeColors;
  openKey: number;
  onDone: () => void;
};

/** Drafts a `NewsletterCampaign` (status starts as "draft" — sending is a
 * separate explicit action from the campaigns list, not part of this form,
 * matching the backend's `CampaignListCreateView`/`CampaignSendView` split). */
export const CreateCampaignModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, openKey, onDone }, ref) => {
    const [form, setForm] = React.useState<FormState>(getDefaultForm());
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const createCampaign = useCreateNewsletterCampaign();

    React.useEffect(() => {
      setForm(getDefaultForm());
      setErrors({});
    }, [openKey]);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
      setForm((prev) => ({ ...prev, [key]: value }));
    }

    function validate() {
      const next: Record<string, string> = {};
      if (!form.subject.trim()) next.subject = 'Subject is required';
      if (!form.body_html.trim()) next.body_html = 'Body (HTML) is required';
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    function handleSubmit() {
      if (!validate()) return;
      createCampaign.mutate(
        { subject: form.subject.trim(), body_html: form.body_html, body_text: form.body_text },
        { onSuccess: () => onDone() }
      );
    }

    return (
      <CmsModal
        ref={ref}
        colors={colors}
        snapPoints={['75%']}
        title="New campaign"
        footer={
          <CmsButton
            colors={colors}
            label={createCampaign.isPending ? 'Saving…' : 'Save draft'}
            onPress={handleSubmit}
            loading={createCampaign.isPending}
          />
        }
      >
        <CmsSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors}>
            <CmsInput
              colors={colors}
              label="Subject"
              placeholder="What's new this month"
              value={form.subject}
              onChangeText={(v) => set('subject', v)}
              error={errors.subject}
              required
              maxLength={200}
            />
            <CmsInput
              colors={colors}
              label="Body (HTML)"
              placeholder="<h1>Hello!</h1><p>...</p>"
              value={form.body_html}
              onChangeText={(v) => set('body_html', v)}
              error={errors.body_html}
              required
              multiline
              numberOfLines={8}
            />
            <CmsInput
              colors={colors}
              label="Body (plain text, optional)"
              placeholder="Plain-text fallback for clients that don't render HTML."
              value={form.body_text}
              onChangeText={(v) => set('body_text', v)}
              multiline
              numberOfLines={4}
            />
          </CmsCard>
        </CmsSheetScrollView>
      </CmsModal>
    );
  }
);
