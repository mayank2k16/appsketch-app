/**
 * CMS short-videos ("Reels") domain types — ported from Vite's
 * `Containers/Cms/ShortVideos` + `Api/cmsAPI.js`. Each active video inside its
 * lifetime window (`start_at`/`end_at`) renders in the Instagram-style
 * circular rail at the top of the app home screen, ordered by priority
 * (lower first).
 */

export type ShortVideoItem = {
  id: number;
  title: string;
  description?: string;
  start_at?: string | null;
  end_at?: string | null;
  priority?: number | string;
  is_active: boolean;
  /** Server-computed: `is_active` AND inside the [start_at, end_at] window. */
  is_live: boolean;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
};

export type PickedShortVideoAsset = { uri: string; name: string; type: string };

export type ShortVideoFormFields = {
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  priority: string;
  is_active: boolean;
};

export type CreateShortVideoPayload = ShortVideoFormFields & {
  image?: PickedShortVideoAsset;
  video?: PickedShortVideoAsset;
};

export type UpdateShortVideoPayload = ShortVideoFormFields & {
  image?: PickedShortVideoAsset;
  video?: PickedShortVideoAsset;
};
