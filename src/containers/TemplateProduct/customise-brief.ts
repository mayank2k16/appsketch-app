import { create } from 'zustand';

/**
 * "Customise with AI": what the form collects, and the first message the
 * builder's agent gets on the user's copy of the template.
 */
export type CustomiseForm = {
  name: string;
  description: string;
  /** Local image URI; attached to the agent's first message. */
  logo: string | null;
};

export function customisePrompt(templateName: string, f: CustomiseForm) {
  const lines = [
    `Customise this app (copied from the "${templateName}" template) for my business.`,
    '',
    `Business name: ${f.name.trim()}`,
  ];
  const about = f.description.trim();
  if (about) lines.push(`About the business: ${about}`);
  lines.push(
    '',
    f.logo
      ? "Logo: the attached image. Use it as the logo everywhere the template shows one (header, footer, splash/loading screen, favicon or app icon, emails), replacing the template's logo."
      : "Logo: none provided. Replace the template's logo with a clean text wordmark of the business name.",
    `Replace the template's brand name, taglines, page titles, SEO meta, contact details and sample copy with content that fits ${f.name.trim()}${about ? ' and what it does' : ''}.`,
    "The brand name and contact details may live in the app's content tables (e.g. a settings row like brand_name, read by the site with a code fallback) as well as in the code: change both, and check the preview really shows the new name.",
    'Keep the existing design, layout, pages and features; only rebrand and rewrite the content. When done, summarise what you changed.'
  );
  return lines.join('\n');
}

/**
 * The form lives on its own route (a sheet; React Native's Modal cannot open
 * over the template page, itself a modal). It hands its result back here and
 * the template page, which outlives the sheet, does the copy.
 */
type Handoff = {
  pending: { key: string; form: CustomiseForm } | null;
  submit: (key: string, form: CustomiseForm) => void;
  take: () => void;
};

export const useCustomiseHandoff = create<Handoff>((set) => ({
  pending: null,
  submit: (key, form) => set({ pending: { key, form } }),
  take: () => set({ pending: null }),
}));
