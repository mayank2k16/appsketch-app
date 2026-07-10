# Quick Start - E-commerce Storefront

## Issue: Seeing Old Obytes App Instead of Storefront?

If you're seeing the old Feed/Settings app instead of the e-commerce storefront, follow these steps:

### 1. Clear Cache and Restart

```bash
# Stop the current server (Ctrl+C), then:
pnpm start --clear
```

Or:
```bash
npx expo start --clear
```

### 2. Reload the App

- **iOS Simulator**: Press `Cmd + R` or shake device → Reload
- **Android Emulator**: Press `R` twice or shake device → Reload
- **Terminal**: Press `r` to reload

### 3. Check the Route

The app should automatically:
1. Start at `/tenant-selector`
2. Auto-initialize the default e-commerce tenant
3. Redirect to `/storefront` with the e-commerce UI

### 4. Manual Navigation

If auto-initialization doesn't work:
1. Navigate to `/tenant-selector` manually
2. Click "Use Default E-commerce Store"
3. You'll be redirected to the storefront

### 5. Verify Files

Make sure these files exist:
- ✅ `src/app/index.tsx` - redirects to tenant-selector
- ✅ `src/app/tenant-selector.tsx` - tenant selection screen
- ✅ `src/app/storefront/` - storefront screens
- ✅ `src/configs/default-ecommerce.json` - default config

### 6. Check Console

Look for any errors in the terminal or device console that might indicate:
- Config loading issues
- Route navigation problems
- Component rendering errors

### 7. Force Clear Storage (If Needed)

If the app is stuck, you can clear the app's storage:
- **iOS**: Delete and reinstall the app
- **Android**: Clear app data in Settings

## Expected Behavior

When working correctly:
1. App starts → Shows loading spinner briefly
2. Auto-loads default e-commerce config
3. Shows storefront with:
   - Hero section
   - Featured products grid
   - Promotional banner
   - Navigation tabs (Home, Products, Cart)

## Troubleshooting

### Still seeing old app?
- Check that `src/app/_layout.tsx` has `initialRouteName: 'tenant-selector'`
- Verify `src/app/index.tsx` exists and redirects to tenant-selector
- Check that `(app)/_layout.tsx` redirects to tenant-selector when no tenant

### Storefront not loading?
- Check console for config loading errors
- Verify `src/configs/default-ecommerce.json` exists
- Check that tenant context is properly initialized

### Components not rendering?
- Verify all component files exist in `src/lib/config-renderer/components/`
- Check that component registry includes all component types
- Look for TypeScript errors in the terminal

