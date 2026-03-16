import { GraduationCap, TrendingUp } from "lucide-react-native";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import countries from "../../data/countries.json";
import { useProgressStore } from "../../stores/progressStore";

export default function ProgressScreen() {
  const { mastery, stats, theme } = useProgressStore();
  const isDark = theme === "dark";

  const textColor = isDark ? "#fff" : "#333";
  const subtextColor = isDark ? "#aaa" : "#666";
  const cardBg = isDark ? "#1e1e1e" : "#fff";

  // Calculate stats
  const masteredCount = Object.values(mastery).filter(
    (m) => m.level >= 3,
  ).length;
  const accuracy = stats.totalQuizzes
    ? Math.round((stats.totalCorrect / stats.totalQuizzes) * 100)
    : 0;

  const topCountries = Object.entries(mastery)
    .sort(([, a], [, b]) => b.level - a.level)
    .slice(0, 5)
    .map(([code, data]) => {
      const country = countries.find((c) => c.code === code);
      return { ...country, ...data };
    });

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f8f9fa" },
      ]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: textColor }]}>Your Progress</Text>

      <View style={styles.statsGrid}>
        <Animated.View
          entering={FadeInUp.delay(100)}
          style={[styles.statCard, { backgroundColor: cardBg }]}
        >
          <GraduationCap color="#1e88e5" size={24} />
          <Text style={[styles.statValue, { color: textColor }]}>
            {masteredCount}
          </Text>
          <Text style={styles.statLabel}>Countries Mastered</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200)}
          style={[styles.statCard, { backgroundColor: cardBg }]}
        >
          <TrendingUp color="#43a047" size={24} />
          <Text style={[styles.statValue, { color: textColor }]}>
            {accuracy}%
          </Text>
          <Text style={styles.statLabel}>Avg. Accuracy</Text>
        </Animated.View>
      </View>

      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Top Countries
      </Text>
      {topCountries.length > 0 ? (
        topCountries.map((country, index) => (
          <Animated.View
            key={country.code}
            entering={FadeIn.delay(index * 100)}
            style={[styles.rankItem, { backgroundColor: cardBg }]}
          >
            <Text style={styles.rankNumber}>#{index + 1}</Text>
            <Image source={{ uri: country.flag }} style={styles.miniFlag} />
            <View style={styles.rankInfo}>
              <Text style={[styles.rankName, { color: textColor }]}>
                {country.name}
              </Text>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: isDark ? "#1a237e" : "#e3f2fd" },
                ]}
              >
                <Text
                  style={[
                    styles.levelText,
                    { color: isDark ? "#64b5f6" : "#1e88e5" },
                  ]}
                >
                  Lvl {country.level}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.masteryBar,
                { backgroundColor: isDark ? "#333" : "#eee" },
              ]}
            >
              <View
                style={[
                  styles.masteryFill,
                  { width: `${(country.level / 5) * 100}%` },
                ]}
              />
            </View>
          </Animated.View>
        ))
      ) : (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={styles.emptyText}>
            Start playing to see your progress!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e88e5",
    width: 30,
  },
  miniFlag: {
    width: 40,
    height: 25,
    borderRadius: 4,
    marginRight: 15,
  },
  rankInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rankName: {
    fontSize: 16,
    fontWeight: "700",
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "800",
  },
  masteryBar: {
    width: 60,
    height: 6,
    borderRadius: 3,
  },
  masteryFill: {
    height: "100%",
    backgroundColor: "#4caf50",
    borderRadius: 3,
  },
  emptyState: {
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
});
