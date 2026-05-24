import { useRouter } from "expo-router";
import {
  Activity,
  ChevronRight,
  Flag,
  MapPin,
  Trophy,
} from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useProgressStore } from "../../stores/progressStore";

export default function HomeScreen() {
  const router = useRouter();
  const { stats, theme } = useProgressStore();
  const isDark = theme === "dark";

  const textColor = isDark ? "#fff" : "#333";
  const subtextColor = isDark ? "#aaa" : "#666";
  const cardBg = isDark ? "#1e1e1e" : "#fff";

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f8f9fa" },
      ]}
      contentContainerStyle={styles.content}
    >
      <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
        <Text style={styles.welcome}>Welcome to</Text>
        <Text style={[styles.title, { color: textColor }]}>
          Coun<Text style={{ color: "#f1c40f" }}>T</Text><Text style={{ color: "#1e88e5" }}>rivia</Text>
        </Text>
        <Text style={[styles.subtitle, { color: subtextColor }]}>
          The fun way to learn the world!
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(200)}
        style={[styles.statsCard, { backgroundColor: cardBg }]}
      >
        <View style={styles.statItem}>
          <Trophy color="#f1c40f" size={32} />
          <Text style={[styles.statValue, { color: textColor }]}>
            {stats.bestStreak}
          </Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? "#333" : "#eee" },
          ]}
        />
        <View style={styles.statItem}>
          <Activity color="#1e88e5" size={32} />
          <Text style={[styles.statValue, { color: textColor }]}>
            {stats.totalQuizzes}
          </Text>
          <Text style={styles.statLabel}>Total Quizzes</Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(300)}
        style={styles.menuContainer}
      >
        <Pressable
          style={[styles.menuItem, { backgroundColor: cardBg }]}
          onPress={() => router.push({ pathname: "/learn", params: { mode: "flag" } })}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isDark ? "#1a237e" : "#e3f2fd" },
            ]}
          >
            <Flag color="#1e88e5" size={28} />
          </View>
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: textColor }]}>
              Learn & Quiz Flags
            </Text>
            <Text style={[styles.menuSubtitle, { color: subtextColor }]}>
              Master country flags and unlock levels
            </Text>
          </View>
          <ChevronRight color={isDark ? "#666" : "#ccc"} />
        </Pressable>

        <Pressable
          style={[styles.menuItem, { backgroundColor: cardBg }]}
          onPress={() => router.push({ pathname: "/learn", params: { mode: "capital" } })}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isDark ? "#1b5e20" : "#f1f8e9" },
            ]}
          >
            <MapPin color="#43a047" size={28} />
          </View>
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: textColor }]}>
              Learn & Quiz Capitals
            </Text>
            <Text style={[styles.menuSubtitle, { color: subtextColor }]}>
              Learn capitals of countries and level up
            </Text>
          </View>
          <ChevronRight color={isDark ? "#666" : "#ccc"} />
        </Pressable>
      </Animated.View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  welcome: {
    fontSize: 18,
    color: "#888",
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    marginBottom: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
  },
  divider: {
    width: 1,
    height: "100%",
    backgroundColor: "#eee",
  },
  menuContainer: {
    gap: 15,
  },
  menuItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#888",
  },
});
