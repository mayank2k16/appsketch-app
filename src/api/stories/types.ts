/**
 * CMS stories domain types — ported from Vite's `Containers/Cms/Stories` +
 * `Api/cmsAPI.js`. The featured story powers the app home hero + greeting;
 * every other active story renders in the "Today's Fresh Story" rail
 * (ordered by priority, lower first).
 */

export type StoryItem = {
  id: number;
  title: string;
  subtitle?: string;
  timestamp_label?: string;
  body?: string;
  cta_label?: string;
  action_link?: string;
  priority?: number | string;
  is_featured: boolean;
  is_active: boolean;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
};

export type PickedStoryAsset = { uri: string; name: string; type: string };

export type StoryFormFields = {
  title: string;
  subtitle: string;
  timestamp_label: string;
  body: string;
  cta_label: string;
  action_link: string;
  priority: string;
  is_featured: boolean;
  is_active: boolean;
};

export type CreateStoryPayload = StoryFormFields & {
  image?: PickedStoryAsset;
};

export type UpdateStoryPayload = StoryFormFields & {
  image?: PickedStoryAsset;
};
