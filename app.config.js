const fs = require("fs");
const path = require("path");

/** Project root — same as `__dirname` for this file; avoids `__dirname` missing under some ESLint/env setups. */
const APP_ROOT = path.dirname(require.resolve("./package.json"));

/** Read PNG width/height from IHDR without extra dependencies. */
function readPngDimensions(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.length < 24) return null;
    if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
      return null;
    }
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
    return { width, height };
  } catch {
    return null;
  }
}

function warnIfIconBelow(root, relPath, minW, minH, label) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) {
    console.warn(`[app.config] ${label}: missing file ${relPath}`);
    return;
  }
  const dim = readPngDimensions(full);
  if (!dim) {
    console.warn(`[app.config] ${label}: could not read dimensions for ${relPath}`);
    return;
  }
  if (dim.width < minW || dim.height < minH) {
    console.warn(
      `[app.config] ${label}: ${relPath} is ${dim.width}×${dim.height}; require at least ${minW}×${minH}`
    );
  }
}

(function warnAdaptiveIcons() {
  warnIfIconBelow(APP_ROOT, "assets/images/icon.png", 1024, 1024, "App icon");
  for (const rel of [
    "assets/images/android-icon-foreground.png",
    "assets/images/android-icon-background.png",
    "assets/images/android-icon-monochrome.png",
  ]) {
    warnIfIconBelow(APP_ROOT, rel, 432, 432, "Android adaptive icon");
  }
})();

module.exports = ({ config }) => {
  const googleMapsApiKeyExtra =
    process.env.GOOGLE_MAPS_API_KEY?.trim() || "AIzaSyAnjJcugrzeD5rNrj5WFwLAV6wUTrF_Ag4";
  const googleMapsIosKey =
    process.env.GOOGLE_MAPS_IOS_API_KEY?.trim() || 
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    "AIzaSyAnjJcugrzeD5rNrj5WFwLAV6wUTrF_Ag4";
  const googleMapsAndroidKey =
    process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    "AIzaSyAnjJcugrzeD5rNrj5WFwLAV6wUTrF_Ag4";

  return {
    ...(config || {}),
    name: "SchoolToHome",
    /** Must match slug of the Expo project for `extra.eas.projectId` (see expo.dev project settings). */
    slug: "schoolToHomeParentApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "SchoolToHomeParentApp",
    userInterfaceStyle: "automatic",

    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      ...((config && config.ios) || {}),
      infoPlist: {
        ...(((config && config.ios) || {}).infoPlist || {}),
        NSUserNotificationsUsageDescription:
          "SchoolToHome sends time-sensitive bus arrival alerts for your child's stop.",
      },
      config: {
        ...(((config && config.ios) || {}).config || {}),
        googleMapsApiKey: googleMapsIosKey,
      },
    },

    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,

      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.VIBRATE",
      ],

      package: "com.school2home.schoolToHomeParentApp",

      ...((config && config.android) || {}),
      versionCode: 1,
      blockedPermissions: [],
      config: {
        ...(((config && config.android) || {}).config || {}),
        googleMaps: {
          ...((((config && config.android) || {}).config || {}).googleMaps || {}),
          apiKey: googleMapsAndroidKey,
        },
      },
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      ...((config && config.web) || {}),
    },

    plugins: [
      "expo-router",

      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],

      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow SchoolToHome to use your location to track your relative distance to the school bus.",
          locationAlwaysPermission:
            "Allow SchoolToHome to use your location to track your relative distance to the school bus.",
          locationWhenInUsePermission:
            "Allow SchoolToHome to use your location to track your relative distance to the school bus.",
        },
      ],

      "expo-secure-store",

      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#0F172A",
          sounds: [],
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      apiUrl:
        process.env.EXPO_PUBLIC_API_URL ?? "https://apidev.school2home.in",
      // Socket.IO origin — falls back to apiUrl when EXPO_PUBLIC_SOCKET_IO_URL is unset (see lib/config.ts).
      socketIoUrl: process.env.EXPO_PUBLIC_SOCKET_IO_URL?.trim() || undefined,

      googleMapsApiKey: googleMapsApiKeyExtra,

      router: {},

      eas: {  
        projectId: "54899e3a-0c2b-456e-a093-20ed9e0e1b90",
      },
    },
  };
};
