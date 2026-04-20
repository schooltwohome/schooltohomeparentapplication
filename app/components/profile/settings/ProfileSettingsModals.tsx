import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { X } from "lucide-react-native";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Device from "expo-device";
import {
  HELP_CENTER_URL,
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
} from "../../../../lib/config";
import {
  canLoadExpoNotifications,
  getExpoPushTokenOrNull,
  getPushPermissionStatus,
  requestPushPermissionFromUser,
  type PushPermissionStatus,
} from "../../../../lib/pushNotifications";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { registerPushDeviceThunk } from "../../../../store/slices/notificationsSlice";

function permissionLabel(s: PushPermissionStatus): string {
  switch (s) {
    case "granted":
      return "Allowed";
    case "denied":
      return "Blocked in system settings";
    case "undetermined":
      return "Not requested yet";
    case "unavailable":
      return "Not available (Expo Go)";
    default:
      return "";
  }
}

function SettingsBottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={sheetStyles.overlay} onPress={onClose}>
        <View style={sheetStyles.centeredView}>
          <Pressable style={sheetStyles.modalView}>
            <View style={sheetStyles.handleBar}>
              <View style={sheetStyles.handle} />
            </View>
            <View style={sheetStyles.header}>
              <Text style={sheetStyles.headerTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={sheetStyles.closeBtn} activeOpacity={0.6}>
                <View style={sheetStyles.closeIconBg}>
                  <X size={18} color="#64748B" />
                </View>
              </TouchableOpacity>
            </View>
            {children}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  centeredView: { width: "100%" },
  modalView: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    width: "100%",
    maxHeight: "92%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
    overflow: "hidden",
  },
  handleBar: {
    alignItems: "center",
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
    flex: 1,
    paddingRight: 8,
  },
  closeBtn: { padding: 2 },
  closeIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
});

const common = StyleSheet.create({
  scroll: {
    maxHeight: Platform.OS === "ios" ? 520 : 480,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  body: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  primaryBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryBtnText: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
  },
  muted: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 18,
    marginTop: 4,
  },
});

export function PushNotificationsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const pushRegistered = useAppSelector((s) => s.notifications.pushRegistered);
  const [status, setStatus] = useState<PushPermissionStatus>("undetermined");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setStatus(await getPushPermissionStatus());
  }, []);

  useEffect(() => {
    if (visible) void refresh();
  }, [visible, refresh]);

  const openSystemSettings = () => {
    void Linking.openSettings();
  };

  const onAllowTap = async () => {
    setBusy(true);
    try {
      await requestPushPermissionFromUser();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const onRegisterTap = async () => {
    setBusy(true);
    try {
      const token = await getExpoPushTokenOrNull();
      if (!token) {
        Alert.alert(
          "Cannot register",
          Device.isDevice
            ? "Allow notifications in system settings, then try again. On a development build (not Expo Go), the app can receive remote pushes."
            : "Use a physical device and allow notifications. Simulators cannot receive Expo push tokens."
        );
        await refresh();
        return;
      }
      await dispatch(registerPushDeviceThunk(token)).unwrap();
      Alert.alert("Registered", "This device will receive school alerts when sent.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      Alert.alert("Registration failed", msg);
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  return (
    <SettingsBottomSheet visible={visible} title="Push notifications" onClose={onClose}>
      <ScrollView
        style={common.scroll}
        contentContainerStyle={common.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={common.body}>
          Get alerts when the school sends updates (delays, notices, bus status). Turn alerts on in your
          phone settings if you previously denied them.
        </Text>

        <View style={common.card}>
          <Text style={common.cardLabel}>Permission</Text>
          <Text style={common.cardValue}>{permissionLabel(status)}</Text>
          {!canLoadExpoNotifications() && (
            <Text style={common.muted}>
              Expo Go does not support remote push tokens. Install a development build to test full push
              delivery.
            </Text>
          )}
          {canLoadExpoNotifications() && !Device.isDevice && (
            <Text style={common.muted}>Simulator: use a real device to obtain an Expo push token.</Text>
          )}
        </View>

        <View style={common.card}>
          <Text style={common.cardLabel}>School server</Text>
          <Text style={common.cardValue}>{pushRegistered ? "Device registered" : "Not registered yet"}</Text>
          <Text style={common.muted}>
            After you allow notifications, register once so the backend can target this phone.
          </Text>
        </View>

        {busy ? (
          <ActivityIndicator style={{ marginTop: 16 }} color="#0F172A" />
        ) : (
          <>
            {canLoadExpoNotifications() && status !== "granted" && (
              <TouchableOpacity style={common.primaryBtn} onPress={onAllowTap} activeOpacity={0.85}>
                <Text style={common.primaryBtnText}>Allow notifications</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={common.secondaryBtn} onPress={openSystemSettings} activeOpacity={0.85}>
              <Text style={common.secondaryBtnText}>Open system notification settings</Text>
            </TouchableOpacity>
            {canLoadExpoNotifications() && (
              <TouchableOpacity style={common.secondaryBtn} onPress={onRegisterTap} activeOpacity={0.85}>
                <Text style={common.secondaryBtnText}>Register device with school</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SettingsBottomSheet>
  );
}

export function PrivacySecurityModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const openPrivacy = async () => {
    if (!PRIVACY_POLICY_URL) {
      Alert.alert(
        "Privacy policy URL",
        "Set EXPO_PUBLIC_PRIVACY_POLICY_URL in your .env file to open your school’s policy in the browser."
      );
      return;
    }
    await WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
  };

  return (
    <SettingsBottomSheet visible={visible} title="Privacy & security" onClose={onClose}>
      <ScrollView
        style={common.scroll}
        contentContainerStyle={common.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={common.sectionTitle}>Your account</Text>
        <Text style={common.body}>
          Your sign-in session is stored securely on this device. Sign out from Profile when you want to
          remove local access on this phone.
        </Text>

        <Text style={common.sectionTitle}>Location & map</Text>
        <Text style={common.body}>
          Live bus tracking shows vehicle position shared by your school’s transport system. The map may use
          your device location only to center the map; route data comes from the school, not from selling
          your data.
        </Text>

        <Text style={common.sectionTitle}>Notifications</Text>
        <Text style={common.body}>
          Push alerts are delivered through Expo’s push service to your device token registered with the
          school backend. You can disable alerts in system settings at any time.
        </Text>

        <TouchableOpacity style={common.primaryBtn} onPress={openPrivacy} activeOpacity={0.85}>
          <Text style={common.primaryBtnText}>
            {PRIVACY_POLICY_URL ? "Open privacy policy" : "Privacy policy (configure URL)"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SettingsBottomSheet>
  );
}

export function HelpSupportModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const version = Constants.expoConfig?.version ?? "—";
  const scheme = Constants.expoConfig?.scheme;
  const appName = Constants.expoConfig?.name ?? "School to Home";

  const openHelpUrl = async () => {
    if (!HELP_CENTER_URL) {
      Alert.alert(
        "Help center",
        "Set EXPO_PUBLIC_HELP_CENTER_URL in your .env file to link to your school’s help or FAQ page."
      );
      return;
    }
    await WebBrowser.openBrowserAsync(HELP_CENTER_URL);
  };

  const contactSupport = async () => {
    if (!SUPPORT_EMAIL) {
      Alert.alert(
        "Support email",
        "Set EXPO_PUBLIC_SUPPORT_EMAIL in your .env (e.g. support@yourschool.edu) to email support from the app."
      );
      return;
    }
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      `${appName} parent app — support`
    )}`;
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert("Email", SUPPORT_EMAIL);
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <SettingsBottomSheet visible={visible} title="Help & support" onClose={onClose}>
      <ScrollView
        style={common.scroll}
        contentContainerStyle={common.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={common.card}>
          <Text style={common.cardLabel}>App</Text>
          <Text style={common.cardValue}>{appName}</Text>
          <Text style={[common.muted, { marginTop: 8 }]}>Version {version}</Text>
          {scheme ? (
            <Text style={common.muted}>URL scheme: {String(scheme)}</Text>
          ) : null}
        </View>

        <Text style={common.body}>
          For account access, student linking, or bus assignments, contact your school office — they manage
          roster data in the system.
        </Text>

        <TouchableOpacity style={common.primaryBtn} onPress={contactSupport} activeOpacity={0.85}>
          <Text style={common.primaryBtnText}>
            {SUPPORT_EMAIL ? `Email ${SUPPORT_EMAIL}` : "Email support (configure address)"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={common.secondaryBtn} onPress={openHelpUrl} activeOpacity={0.85}>
          <Text style={common.secondaryBtnText}>
            {HELP_CENTER_URL ? "Open help center" : "Help center (configure URL)"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SettingsBottomSheet>
  );
}

export function pushStatusSubtitle(s: PushPermissionStatus): string {
  switch (s) {
    case "granted":
      return "On";
    case "denied":
      return "Blocked";
    case "undetermined":
      return "Tap to enable";
    case "unavailable":
      return "Limited (Expo Go)";
    default:
      return "";
  }
}
