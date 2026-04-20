module.exports = ({ config }) => {
  const googleMapsKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() || 
    process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_IOS_API_KEY?.trim() ||
    "AIzaSyAnjJcugrzeD5rNrj5WFwLAV6wUTrF_Ag4";

  const isEasBuild = !!process.env.EAS_BUILD;

  return {
    ...(config || {}),
    name: "schoolToHomeParentApp",
    slug: "schoolToHomeParentApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "schooltohomeparentapp",
    userInterfaceStyle: "automatic",
    // Expo Go always runs with New Architecture on. We keep it enabled for local
    // dev to avoid mismatches, but disable it for EAS builds for stability.
    newArchEnabled: isEasBuild ? false : true,
    ios: {
      supportsTablet: true,
      ...((config && config.ios) || {}),
      config: {
        ...(((config && config.ios) || {}).config || {}),
        googleMapsApiKey:
          process.env.GOOGLE_MAPS_IOS_API_KEY?.trim() ||
          process.env.GOOGLE_MAPS_API_KEY?.trim() ||
          googleMapsKey,
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
      ],
      package: "com.school2home.schoolToHomeParentApp",
      newArchEnabled: isEasBuild ? false : true,
      ...((config && config.android) || {}),
      config: {
        ...(((config && config.android) || {}).config || {}),
        googleMaps: {
          ...((((config && config.android) || {}).config || {}).googleMaps || {}),
          apiKey:
            process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim() ||
            process.env.GOOGLE_MAPS_API_KEY?.trim() ||
            googleMapsKey,
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
      apiUrl: "https://apidev.school2home.in",
      googleMapsApiKey: googleMapsKey,
      router: {},
      eas: {
        projectId: "54899e3a-0c2b-456e-a093-20ed9e0e1b90",
      },
    },
  };
};

