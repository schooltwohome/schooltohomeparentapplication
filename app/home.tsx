import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BusStatusCard from "./components/home/BusStatusCard";
import HomeHeader from "./components/home/HomeHeader";
import ChildStatusCard from "./components/home/ChildStatusCard";
import ActivityTimeline from "./components/home/ActivityTimeline";
import BottomTabs from "./components/navigation/BottomTabs";

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("home");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      <HomeHeader greeting="Welcome Back!" userName="Test User" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BusStatusCard
          route="Route 12 - Morning Trip"
          distance="2.5 km away"
          eta="10 mins"
          onTrackPress={() => console.log("Tracking...")}
        />

        <ChildStatusCard 
          name="Alex Johnson" 
          className="Grade 4-B" 
          isOnBus={true} 
        />

        <ChildStatusCard 
          name="Sarah Johnson" 
          className="Grade 2-A" 
          isOnBus={false} 
        />

        <ActivityTimeline 
          activities={[
            { id: "1", title: "Bus departed from depot", time: "7:30 AM", type: "bus", description: "Route 12 morning trip started." },
            { id: "2", title: "Liam boarded at Stop #12", time: "7:45 AM", type: "board", description: "Checked in via student ID card." },
            { id: "3", title: "Arrived at school", time: "8:05 AM", type: "arrive", description: "Safe arrival at the main campus." },
          ]} 
        />
      </ScrollView>

      <BottomTabs
        activeTab={activeTab}
        onTabPress={(tab) => setActiveTab(tab)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // Increased to avoid overlap with bottom navigation
  },
});
