import {
  Activity,
  Award,
  Clock,
  Flag,
  GraduationCap,
  Lock,
  MapPin,
  ShieldCheck,
  Star,
  TrendingUp,
  Trophy,
} from "lucide-react-native";
import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import countries from "../../data/countries.json";
import { useProgressStore } from "../../stores/progressStore";

const COUNTRIES_PER_LEVEL = 10;
const TOTAL_LEVELS = Math.ceil(countries.length / COUNTRIES_PER_LEVEL);

export default function ProgressScreen() {
  const {
    flagsMastery,
    capitalsMastery,
    unlockedFlagsLevel,
    unlockedCapitalsLevel,
    levelStats,
    stats,
    theme,
  } = useProgressStore();

  const isDark = theme === "dark";

  const textColor = isDark ? "#ffffff" : "#1a1a1a";
  const subtextColor = isDark ? "#b0b0b0" : "#666666";
  const cardBg = isDark ? "#1e1e1e" : "#ffffff";
  const containerBg = isDark ? "#121212" : "#f8f9fa";
  const accentColor = "#1e88e5";

  // Toggle for level history track
  const [historyMode, setHistoryMode] = useState<"flag" | "capital">("flag");

  // Calculate masteries
  const flagsMasteredCount = Math.max(0, (unlockedFlagsLevel - 1) * 10);
  const capitalsMasteredCount = Math.max(0, (unlockedCapitalsLevel - 1) * 10);

  const accuracy = stats.totalQuizzes
    ? Math.round((stats.totalCorrect / stats.totalQuizzes) * 100)
    : 0;

  // Calculate combined top countries based on max mastery level
  const combinedMastery: Record<string, number> = {};
  
  Object.entries(flagsMastery || {}).forEach(([code, data]) => {
    combinedMastery[code] = data.level;
  });

  Object.entries(capitalsMastery || {}).forEach(([code, data]) => {
    combinedMastery[code] = Math.max(combinedMastery[code] || 0, data.level);
  });

  const topCountries = Object.entries(combinedMastery)
    .map(([code, lvl]) => {
      const country = countries.find((c) => c.code === code);
      return country ? { ...country, level: lvl } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => b.level - a.level)
    .slice(0, 5);


  // Render Mini Stars
  const renderMiniStars = (starCount: number) => {
    return (
      <View style={styles.miniStarsRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={12}
            color={s <= starCount ? "#f1c40f" : isDark ? "#444" : "#ccc"}
            fill={s <= starCount ? "#f1c40f" : "transparent"}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: containerBg }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: textColor }]}>Your Progress</Text>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <Animated.View
          entering={FadeInUp.delay(100)}
          style={[styles.statCard, { backgroundColor: cardBg }]}
        >
          <Flag color={accentColor} size={24} />
          <Text style={[styles.statValue, { color: textColor }]}>
            {flagsMasteredCount}
          </Text>
          <Text style={styles.statLabel}>Flags Mastered</Text>
          <Text style={styles.statSublabel}>Level {unlockedFlagsLevel}</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(150)}
          style={[styles.statCard, { backgroundColor: cardBg }]}
        >
          <MapPin color="#43a047" size={24} />
          <Text style={[styles.statValue, { color: textColor }]}>
            {capitalsMasteredCount}
          </Text>
          <Text style={styles.statLabel}>Capitals Mastered</Text>
          <Text style={styles.statSublabel}>Level {unlockedCapitalsLevel}</Text>
        </Animated.View>
      </View>

      <View style={styles.statsGrid}>
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={[styles.statCard, { backgroundColor: cardBg }]}
        >
          <TrendingUp color="#ab47bc" size={24} />
          <Text style={[styles.statValue, { color: textColor }]}>
            {accuracy}%
          </Text>
          <Text style={styles.statLabel}>Avg. Accuracy</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(250)}
          style={[styles.statCard, { backgroundColor: cardBg }]}
        >
          <Trophy color="#f1c40f" size={24} />
          <Text style={[styles.statValue, { color: textColor }]}>
            {stats.streak}
          </Text>
          <Text style={styles.statLabel}>Current Streak</Text>
          <Text style={styles.statSublabel}>Best: {stats.bestStreak}</Text>
        </Animated.View>
      </View>

      {/* Top Countries Section */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Top Countries (Highest Mastery)
      </Text>
      {topCountries.length > 0 ? (
        topCountries.map((country, index) => (
          <Animated.View
            key={country.code}
            entering={FadeIn.delay(index * 80)}
            style={[styles.rankItem, { backgroundColor: cardBg }]}
          >
            <Text style={styles.rankNumber}>#{index + 1}</Text>
            <Image source={{ uri: country.flag }} style={styles.miniFlag} />
            <View style={styles.rankInfo}>
              <Text style={[styles.rankName, { color: textColor }]} numberOfLines={1}>
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
                  {
                    width: `${(country.level / 5) * 100}%`,
                    backgroundColor: country.level >= 3 ? "#4caf50" : "#ff9800",
                  },
                ]}
              />
            </View>
          </Animated.View>
        ))
      ) : (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: subtextColor }]}>
            Start studying levels and taking quizzes to see your top mastered countries!
          </Text>
        </View>
      )}

      {/* Level History Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>
          Level History
        </Text>
        
        {/* Toggle between Flags and Capitals history */}
        <View style={[styles.toggleBtnGroup, { backgroundColor: isDark ? "#222" : "#eaeaea" }]}>
          <Pressable
            style={[
              styles.toggleBtn,
              historyMode === "flag" && [styles.toggleBtnActive, { backgroundColor: cardBg }],
            ]}
            onPress={() => setHistoryMode("flag")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                { color: historyMode === "flag" ? textColor : "#888" },
              ]}
            >
              Flags
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleBtn,
              historyMode === "capital" && [styles.toggleBtnActive, { backgroundColor: cardBg }],
            ]}
            onPress={() => setHistoryMode("capital")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                { color: historyMode === "capital" ? textColor : "#888" },
              ]}
            >
              Capitals
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.levelHistoryList}>
        {Array.from({ length: TOTAL_LEVELS }).map((_, i) => {
          const levelNum = i + 1;
          const unlockedLvl = historyMode === "flag" ? unlockedFlagsLevel : unlockedCapitalsLevel;
          const isUnlocked = levelNum <= unlockedLvl;
          const statsKey = `${historyMode}_${levelNum}`;
          const currentStats = levelStats?.[statsKey];
          const passed = currentStats?.passed || false;
          const attempts = currentStats?.attemptsCount || 0;
          const stars = passed ? (currentStats?.stars || 0) : 0;
          const bestTime = currentStats?.bestTime || 0;

          let statusText = "Locked";
          let statusColor = "#888";
          let statusBg = isDark ? "#222" : "#eee";

          if (isUnlocked) {
            if (passed) {
              statusText = "Passed";
              statusColor = "#fff";
              statusBg = "#4caf50";
            } else {
              statusText = "In Progress";
              statusColor = "#fff";
              statusBg = accentColor;
            }
          }

          return (
            <Animated.View
              key={levelNum}
              entering={FadeInUp.delay(i * 20)}
              style={[
                styles.historyItem,
                { backgroundColor: cardBg },
                !isUnlocked && { opacity: 0.5 },
              ]}
            >
              <View style={styles.historyItemMain}>
                <View style={styles.historyItemHeader}>
                  <Text style={[styles.historyItemTitle, { color: textColor }]}>
                    Level {levelNum}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                      {statusText}
                    </Text>
                  </View>
                </View>

                {isUnlocked ? (
                  <View style={styles.historyItemDetails}>
                    <View style={styles.detailRow}>
                      <Activity size={14} color="#888" />
                      <Text style={[styles.detailText, { color: subtextColor }]}>
                        Attempts: {attempts}
                      </Text>
                    </View>
                    
                    {passed && (
                      <View style={styles.detailRow}>
                        <Clock size={14} color="#888" />
                        <Text style={[styles.detailText, { color: subtextColor }]}>
                          Best Time: {bestTime}s
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.lockedItemRow}>
                    <Lock size={14} color="#888" />
                    <Text style={styles.lockedItemText}>Unlock Level {levelNum - 1} first</Text>
                  </View>
                )}
              </View>

              {passed && (
                <View style={styles.historyItemStars}>
                  {renderMiniStars(stars)}
                </View>
              )}
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 3,
    fontWeight: "600",
  },
  statSublabel: {
    fontSize: 10,
    color: "#bbb",
    marginTop: 2,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 25,
    marginBottom: 15,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 25,
    marginBottom: 15,
  },
  toggleBtnGroup: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 15,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleBtnActive: {
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e88e5",
    width: 25,
  },
  miniFlag: {
    width: 44,
    height: 28,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  rankInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 10,
  },
  rankName: {
    fontSize: 15,
    fontWeight: "700",
    maxWidth: "65%",
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 9,
    fontWeight: "800",
  },
  masteryBar: {
    width: 60,
    height: 6,
    borderRadius: 3,
  },
  masteryFill: {
    height: "100%",
    borderRadius: 3,
  },
  emptyState: {
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 18,
  },
  levelHistoryList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  historyItemMain: {
    flex: 1,
  },
  historyItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  historyItemDetails: {
    flexDirection: "row",
    gap: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: "500",
  },
  lockedItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lockedItemText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  historyItemStars: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  miniStarsRow: {
    flexDirection: "row",
  },
});
