# Release checklist (Google Play)

## EAS secrets

Configure these in [EAS Secrets](https://docs.expo.dev/build-reference/variables/) for production (and locally via `.env` for development):

- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_MAPS_ANDROID_API_KEY`
- `GOOGLE_MAPS_IOS_API_KEY`

Optional local/dev: `EXPO_PUBLIC_API_URL` (preview and production builds set this via `eas.json` profiles).

## Steps

1. Bump `version` in [`app.config.js`](app.config.js) when shipping a new user-visible release.
2. Run `npm run build:android` to produce an Android App Bundle with the **production** profile.
3. Download the `.aab` from the EAS build page.
4. Upload the AAB to Google Play Console on the **internal** testing track first; validate, then promote through closed/open testing and production as your process requires.

## Maps API key restrictions

After the **first** production upload to Play, Google Play App Signing provides an app signing certificate. Update your Google Cloud Console API key restrictions (Android SHA-1 fingerprint) to include the **Play App Signing** SHA-1, not only the upload key, so Maps and other restricted APIs keep working for installs from the Play Store.
