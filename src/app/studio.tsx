import { Redirect } from 'expo-router';

/**
 * The "Studio" tab was renamed to "My apps" (route `/my-apps`). Keeps old
 * links — `com.appsketch-ai.app://studio`, bookmarks, pushes — landing on the
 * renamed tab instead of the catch-all 404.
 */
export default function StudioRedirect() {
  return <Redirect href="/my-apps" />;
}
