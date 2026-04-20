import React from "react";
import { TouchableWithoutFeedback, Keyboard, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import LoginHeader from "./components/LoginHeader";
import LoginForm from "./components/LoginForm";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  loginWithPasswordThunk,
  clearError,
} from "../../../store/slices/authSlice";

/**
 * LoginScreen
 *
 * - Uses KeyboardAwareScrollView so inputs are always visible when keyboard opens.
 * - Wraps content in TouchableWithoutFeedback to dismiss keyboard on outside tap.
 *
 * NOTE: For Android, add the following to your AndroidManifest.xml activity tag:
 *   android:windowSoftInputMode="adjustResize"
 */
export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  React.useEffect(() => {
    if (error) {
      Alert.alert("Sign in", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleLogin = async (identifier: string, password: string) => {
    const result = await dispatch(
      loginWithPasswordThunk({ identifier, password })
    );
    if (loginWithPasswordThunk.fulfilled.match(result)) {
      router.replace("/home" as any);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }} edges={["top"]}>
      <StatusBar style="light" />
      <Stack.Screen 
        options={{ 
          headerShown: false,
          animation: "fade" // Smooth symmetric transition
        }} 
      />


      {/* Dismiss keyboard when tapping outside inputs */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
          style={{ flex: 1, backgroundColor: "#F8FAFC" }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          extraScrollHeight={20}
          extraHeight={120}
        >
          <LoginHeader />
          <LoginForm onLogin={handleLogin} loading={loading} />
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
