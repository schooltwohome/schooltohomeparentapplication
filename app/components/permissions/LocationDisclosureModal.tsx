import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";

type Props = {
  visible: boolean;
  onNotNow: () => void;
  onContinue: () => void;
};

export default function LocationDisclosureModal({
  visible,
  onNotNow,
  onContinue,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onNotNow}
    >
      <Pressable style={styles.backdrop} onPress={onNotNow}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Location access</Text>
          <Text style={styles.body}>
            {
              "SchoolToHome uses your phone's location only while the app is open, to show your distance to the school bus and to power live tracking. Location is never sold or shared with third parties."
            }
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onNotNow}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryLabel}>Not now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onContinue}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryLabel}>Continue</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#F1F5F9",
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
