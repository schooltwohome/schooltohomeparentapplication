import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {
  sendParentOtpThunk,
  resendParentOtpThunk,
} from "../../../../store/slices/authSlice";
import Animated, { 
  FadeInDown, 
  FadeOutUp, 
  Layout, 
  FadeIn,
  FadeOut,
  LinearTransition
} from "react-native-reanimated";


interface OTPLoginFormProps {
  onLogin: (phone: string, otp: string) => Promise<void>;
}

function isValidPhone(raw: string): boolean {
  const t = raw.trim();
  return /^\+?[1-9]\d{1,14}$/.test(t);
}

export default function OTPLoginForm({ onLogin }: OTPLoginFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const otpPending = useAppSelector((s) => s.auth.otpPending);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [errors, setErrors] = useState({ phone: "", otp: "" });
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const validatePhone = (): boolean => {
    if (!phone.trim()) {
      setErrors((e) => ({ ...e, phone: "Phone number is required." }));
      return false;
    }
    if (!isValidPhone(phone)) {
      setErrors((e) => ({
        ...e,
        phone: "Use international format, e.g. +919876543210",
      }));
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePhone()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await dispatch(sendParentOtpThunk(phone.trim())).unwrap();
      setOtpSent(true);
      setTimer(60);
      setErrors((e) => ({ ...e, phone: "" }));
    } catch (e) {
      Alert.alert("Send OTP", String(e));
    }
  };

  const handleResendOTP = async () => {
    if (!validatePhone()) return;
    try {
      await dispatch(resendParentOtpThunk(phone.trim())).unwrap();
      setTimer(60);
    } catch (e) {
      Alert.alert("Resend OTP", String(e));
    }
  };

  const handleSignIn = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors((e) => ({ ...e, otp: "Enter the 6-digit code." }));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVerifyLoading(true);
    try {
      await onLogin(phone.trim(), otp);
    } finally {
      setVerifyLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Animated.View layout={LinearTransition} style={styles.formWrapper}>

        {/* Phone (E.164) — backend parent OTP is phone-only */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mobile number</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="+919876543210"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors((e) => ({ ...e, phone: "" }));
              }}
              style={[styles.input, errors.phone ? styles.inputError : null]}
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!otpSent}
            />
            {otpSent && (
              <TouchableOpacity 
                style={styles.changeButton} 
                onPress={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
              >
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
          {errors.phone ? (
            <Text style={styles.errorText}>{errors.phone}</Text>
          ) : null}
        </View>

        {/* Conditional Buttons / Fields with Smooth Transitions */}
        {!otpSent ? (
          <Animated.View 
            entering={FadeInDown.duration(400)} 
            exiting={FadeOutUp.duration(300)}
            layout={LinearTransition}
          >
            <TouchableOpacity 
              style={styles.sendOtpButton} 
              onPress={handleSendOTP} 
              disabled={otpPending}
              activeOpacity={0.8}
            >
              {otpPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.sendOtpText}>Send OTP</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* OTP Field - only shown after sending */
          <Animated.View 
            entering={FadeInDown.springify()} 
            exiting={FadeOutUp}
            layout={LinearTransition}
            style={[styles.fieldGroup, { marginTop: 10 }]}
          >
            <View style={styles.labelRow}>
              <Text style={styles.label}>Verification Code</Text>
              {timer > 0 ? (
                <Text style={styles.timerText}>Resend in {timer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResendOTP}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              placeholder="6-digit code"
              value={otp}
              onChangeText={(text) => {
                setOtp(text.replace(/[^0-9]/g, ""));
                if (errors.otp) setErrors((e) => ({ ...e, otp: "" }));
              }}
              style={[styles.input, styles.otpInput, errors.otp ? styles.inputError : null]}
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
            />
            {errors.otp ? (
              <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.errorText}>
                {errors.otp}
              </Animated.Text>
            ) : null}
          </Animated.View>
        )}


        <View style={styles.optionsRow}>
          <TouchableOpacity 
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text style={styles.linkBlue}>Back to Password Login</Text>
          </TouchableOpacity>

        </View>
      </Animated.View>

      {/* Sign In Button */}

      <View style={styles.buttonSection}>
        <TouchableOpacity 
          style={[styles.signInButton, (!otpSent || otp.length !== 6 || verifyLoading) && styles.disabledButton]} 
          onPress={handleSignIn} 
          disabled={!otpSent || otp.length !== 6 || verifyLoading}
          activeOpacity={0.85}
        >
          {verifyLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signInText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.signUpGray}>
          Parent accounts are created by your school. Contact them if you need access.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  formWrapper: {
    marginTop: 56,
    gap: 0,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    color: "#0F172A",
  },
  otpInput: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 8,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FFF5F5",
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#EF4444",
    paddingLeft: 4,
  },
  changeButton: {
    position: "absolute",
    right: 14,
    top: 15,
  },
  changeText: {
    fontSize: 13,
    color: "#38BDF8",
    fontWeight: "600",
  },
  sendOtpButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    backgroundColor: "#14B8A6",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: "#14B8A6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  sendOtpText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  timerText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  resendText: {
    fontSize: 12,
    color: "#14B8A6",
    fontWeight: "600",
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  linkBlue: {
    fontSize: 13,
    color: "#38BDF8",
    fontWeight: "600",
  },
  buttonSection: {
    marginTop: 36,
  },
  signInButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
    elevation: 0,
  },
  signInText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  signUpGray: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
});
