import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import { LucideIcon, ChevronRight } from "lucide-react-native";

type Props = {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  onPress: () => void;
  /** Omit bottom divider (use on the last row in a group). */
  isLast?: boolean;
};

/**
 * System-style settings row: neutral chrome, inset hairline, readable hierarchy.
 */
export default function GroupedPreferenceRow({
  icon: Icon,
  label,
  subtitle,
  onPress,
  isLast = false,
}: Props) {
  return (
    <View>
      <TouchableOpacity
        style={[styles.row, subtitle ? styles.rowWithSubtitle : null]}
        onPress={onPress}
        activeOpacity={0.55}
        accessibilityRole="button"
      >
        <View style={styles.iconWrap}>
          <Icon size={18} color="#374151" strokeWidth={2.25} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.label}>{label}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <ChevronRight size={18} color="#C5C9D0" style={styles.chevron} />
      </TouchableOpacity>
      {!isLast ? <View style={styles.divider} /> : null}
    </View>
  );
}

const ICON = 32;
const PAD = 16;
const GAP = 12;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingVertical: 12,
    paddingLeft: PAD,
    paddingRight: 12,
    backgroundColor: "transparent",
  },
  rowWithSubtitle: {
    minHeight: 56,
    paddingVertical: 10,
  },
  iconWrap: {
    width: ICON,
    height: ICON,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: GAP,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 0.06,
        shadowRadius: 1,
      },
      android: { elevation: 0 },
    }),
  },
  textBlock: {
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },
  label: {
    fontSize: Platform.OS === "ios" ? 17 : 16,
    fontWeight: "400",
    color: "#111827",
    letterSpacing: Platform.OS === "ios" ? -0.41 : 0,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 18,
  },
  chevron: {
    opacity: 0.9,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D1D5DB",
    marginLeft: PAD + ICON + GAP,
    marginRight: PAD,
  },
});
