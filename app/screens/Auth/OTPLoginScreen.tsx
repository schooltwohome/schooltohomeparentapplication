import React from "react";
import { TouchableWithoutFeedback, Keyboard, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import LoginHeader from "./components/LoginHeader";
import OTPLoginForm from "./components/OTPLoginForm";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  loginWithOtpThunk,
  clearError,
} from "../../../store/slices/authSlice";

/**
 * OTPLoginScreen
 *
 * - Phone + OTP via POST /api/v1/parents/send-otp and /verify-otp (matches backend).
 */
export default function OTPLoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((s) => s.auth);

  React.useEffect(() => {
    if (error) {
      Alert.alert("OTP", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleOTPLogin = async (phone: string, otp: string) => {
    const result = await dispatch(loginWithOtpThunk({ phone, otp }));
    if (loginWithOtpThunk.fulfilled.match(result)) {
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
          <OTPLoginForm onLogin={handleOTPLogin} />
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
