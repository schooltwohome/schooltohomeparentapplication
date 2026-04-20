import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Providers from "./providers";
import "./global.css";

export default function RootLayout() {
  return (
    <Providers>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack />
      </GestureHandlerRootView>
    </Providers>
  );
}
