import { useIsFocused } from 'expo-router';
import * as React from 'react';
import { AppState } from 'react-native';

/** True while this screen is focused AND the app is in the foreground —
 *  every loop on the page (glow drift, LIVE pulse, the WebView's auto-scroll)
 *  runs only then. */
export function usePageActive() {
  const focused = useIsFocused();
  const [foreground, setForeground] = React.useState(
    AppState.currentState === 'active'
  );
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) =>
      setForeground(state === 'active')
    );
    return () => sub.remove();
  }, []);
  return focused && foreground;
}
