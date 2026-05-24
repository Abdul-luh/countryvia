import { Tabs } from "expo-router";
import { BarChart3, BookOpen, GraduationCap, Home } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
import { Header } from "../../components/Header";
import { useProgressStore } from "../../stores/progressStore";

export default function TabLayout() {
  const { theme } = useProgressStore();
  const isDark = theme === "dark";

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#f8f9fa" }}>
      <Header />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#2f95dc",
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? "#1e1e1e" : "#fff",
            borderTopWidth: 1,
            borderTopColor: isDark ? "#333" : "#eee",
            height: 60,
            paddingBottom: 8,
          },
          tabBarInactiveTintColor: isDark ? "#888" : "#ccc",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            title: "Learn",
            tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Stats",
            tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="quiz"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

