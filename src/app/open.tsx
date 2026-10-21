import { Redirect, useLocalSearchParams } from 'expo-router';

/** `<scheme>://open?url=<app link>` — the deep link inside workspace QR codes. */
export default function OpenRoute() {
  const { url } = useLocalSearchParams<{ url?: string }>();
  return <Redirect href={{ pathname: '/scan', params: url ? { url } : {} }} />;
}
