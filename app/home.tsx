import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, Stack } from "expo-router";
import HomeHeader from "./components/home/HomeHeader";
import DashboardCard from "./components/home/DashboardCard";
import QuickActions from "./components/home/QuickActions";
import BottomTabs from "./components/navigation/BottomTabs";

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("home");

  const handleLogout = () => {
    router.replace("/screens/Auth/LoginScreen" as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <HomeHeader 
        greeting="Welcome Back!" 
        userName="Test User" 
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DashboardCard 
          title="Application Status"
          status="UI Test"
          progress="100%"
        />

        <QuickActions onLogout={handleLogout} />
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
