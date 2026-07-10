import { Redirect } from 'expo-router';

/**
 * Root index - always show splash first. Splash fetches tenant config
 * and redirects to login (if not authenticated) or storefront (if authenticated).
 */
export default function Index() {
  return <Redirect href="/splash" />;
}

