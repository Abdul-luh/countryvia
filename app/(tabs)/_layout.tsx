import { Tabs, useRouter } from "expo-router";
import { BarChart3, BookOpen, Gamepad2, Globe, Home } from "lucide-react-native";
import React, { useRef } from "react";
import { PanResponder, View } from "react-native";
import { Header } from "../../components/Header";
import { useProgressStore } from "../../stores/progressStore";

// Tab order that matches the Tabs.Screen definitions
const TAB_ROUTES = ["index", "learn", "multiplayer", "progress"] as const;

export default function TabLayout() {
  const router = useRouter();
  const { theme } = useProgressStore();
  const isDark = theme === "dark";

  // Track which tab is active by index so we know swipe boundaries
  const activeTabIndex = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      // Only claim the gesture if horizontal movement dominates
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 40 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -50) {
          // Swipe left → next tab
          const next = Math.min(
            activeTabIndex.current + 1,
            TAB_ROUTES.length - 1
          );
          activeTabIndex.current = next;
          router.navigate(`/${TAB_ROUTES[next] === "index" ? "" : TAB_ROUTES[next]}` as any);
        } else if (gs.dx > 50) {
          // Swipe right → previous tab
          const prev = Math.max(activeTabIndex.current - 1, 0);
          activeTabIndex.current = prev;
          router.navigate(`/${TAB_ROUTES[prev] === "index" ? "" : TAB_ROUTES[prev]}` as any);
        }
      },
    })
  ).current;

  return (
    <View
      style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#f8f9fa" }}
      {...panResponder.panHandlers}
    >
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
        screenListeners={{
          tabPress: (e) => {
            // Keep activeTabIndex in sync when user taps the tab bar
            const name = (e.target as string).split("-")[0];
            const idx = TAB_ROUTES.indexOf(name as any);
            if (idx !== -1) activeTabIndex.current = idx;
          },
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
          name="multiplayer"
          options={{
            title: "Multiplayer",
            tabBarIcon: ({ color }) => <Gamepad2 size={24} color={color} />,
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
