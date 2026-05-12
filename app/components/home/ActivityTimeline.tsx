import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Clock, MapPin, Bus, UserCheck, CheckCircle2 } from "lucide-react-native";

export type ActivityType = "bus" | "board" | "arrive" | "default";

interface Activity {
  id: string;
  title: string;
  time: string;
  /** Raw ISO timestamp — used to display real 12-hour time. Falls back to `time` if absent. */
  createdAt?: string;
  type?: ActivityType;
  description?: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

/** Format an ISO timestamp as 12-hour local time, e.g. "11:57 AM". */
function formatTime12h(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Format today's date using the device locale, e.g. "Tuesday, 12 May 2026". */
function formatTodayLabel(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

const getIconForType = (type?: ActivityType, isActive?: boolean) => {
  const color = isActive ? "#FFFFFF" : "#64748B";
  const size = 16;
  switch (type) {
    case "bus":
      return <Bus size={size} color={color} />;
    case "board":
      return <UserCheck size={size} color={color} />;
    case "arrive":
      return <CheckCircle2 size={size} color={color} />;
    default:
      return <MapPin size={size} color={color} />;
  }
};

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const todayLabel = formatTodayLabel();

  return (
    <View style={styles.container}>
      {/* Header row: title + today's date */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <Text style={styles.dateLabel}>{todayLabel}</Text>
      </View>

      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Bus size={28} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>No activity yet today</Text>
          <Text style={styles.emptySub}>
            Activity will appear here once the bus trip starts
          </Text>
        </View>
      ) : (
        <View style={styles.timelineContainer}>
          {activities.map((activity, index) => {
            const isActive = index === 0;
            const isLast = index === activities.length - 1;
            const displayTime = activity.createdAt
              ? formatTime12h(activity.createdAt)
              : activity.time;

            return (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.leftColumn}>
                  <View
                    style={[
                      styles.iconContainer,
                      isActive && styles.activeIconContainer,
                      !isActive && isLast && styles.lastIconContainer,
                    ]}
                  >
                    {getIconForType(activity.type, isActive)}
                  </View>
                  {!isLast && (
                    <View style={[styles.line, isActive && styles.activeLine]} />
                  )}
                </View>

                <View style={styles.contentColumn}>
                  <View style={styles.card}>
                    <Text
                      style={[styles.activityTitle, isActive && styles.activeText]}
                    >
                      {activity.title}
                    </Text>
                    {activity.description ? (
                      <Text style={styles.descriptionText}>
                        {activity.description}
                      </Text>
                    ) : null}
                    <View style={styles.timeBadge}>
                      <Clock size={12} color="#64748B" />
                      <Text style={styles.timeText}>{displayTime}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F8FAFC",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    flexShrink: 0,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
    textAlign: "right",
    flexShrink: 1,
    marginTop: 3,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 19,
  },
  timelineContainer: {
    paddingLeft: 4,
    paddingRight: 4,
  },
  activityItem: {
    flexDirection: "row",
    minHeight: 80,
  },
  leftColumn: {
    alignItems: "center",
    width: 32,
    marginRight: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeIconContainer: {
    backgroundColor: "#F59E0B",
  },
  lastIconContainer: {
    backgroundColor: "#10B981",
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: -4,
    zIndex: 1,
  },
  activeLine: {
    backgroundColor: "#F59E0B",
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginTop: -8,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
    lineHeight: 22,
    marginBottom: 6,
  },
  activeText: {
    color: "#0F172A",
  },
  descriptionText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 20,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
});
