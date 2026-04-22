import { Stack } from "expo-router";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Providers from "./providers";
import PushNotificationRoot from "./PushNotificationRoot";
import "./global.css";

export default function RootLayout() {
  return (
    <Providers>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Stack />
          <PushNotificationRoot />
        </View>
      </GestureHandlerRootView>
    </Providers>
  );
}
