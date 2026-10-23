# My apps tab (formerly "Studio")

## What changed

The third bottom tab — the account's apps, Discover and Settings — was called
**Studio**. It is now **My apps**, in the label, the screen heading and the URL.

- Route: `src/app/(tabs)/studio.tsx` → `src/app/(tabs)/my-apps.tsx`, so the tab
  is `/my-apps` (`com.appsketch-ai.app://my-apps`).
- Old links keep working: `src/app/studio.tsx` is a `<Redirect href="/my-apps" />`.
  Without it, `/studio` would fall through to the `[...messing]` catch-all.
- Tab config: `src/components/bottom-tabs/tab-config.ts` (`name: 'my-apps'`,
  label `My apps`, which is also the tab button's accessibility label) and
  `src/app/(tabs)/_layout.tsx` (`Tabs.Screen name="my-apps"`). The two must agree.
- Icon: `TabIcon.tsx` key `myApps`, a 2×2 grid of rounded tiles, replacing the
  old palette.
- Screen heading: `src/containers/Studio/StudioScreen.tsx` now reads "My apps".
- CMS back fallback (`CmsShell.tsx`) goes to `/my-apps`.

## What deliberately did not change

- Internal names: `src/containers/Studio/`, `useStudio` / `studio-store`,
  `src/api/studio`, the `studio*` theme tokens. They are not user visible.
- Home's template feed (`src/containers/Home/Studio/`) is a different thing
  (the template "studio" feed), and is untouched.
- Discover's tutorial card copy ("App Sketch Studio Editor") names the web
  editor, not this tab.
- The app has no universal links (no `associatedDomains`), so there was no
  `appsketch.ai/studio` mapping to update.
