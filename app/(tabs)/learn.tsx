import { ChevronLeft, Lock, Star } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { FlagCard } from "../../components/FlagCard";
import countries from "../../data/countries.json";
import { useProgressStore } from "../../stores/progressStore";

const COUNTRIES_PER_LEVEL = 10;
const TOTAL_LEVELS = Math.ceil(countries.length / COUNTRIES_PER_LEVEL);

export default function LearnScreen() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [revealedStates, setRevealedStates] = useState<Record<string, boolean>>(
    {},
  );
  const { mastery, unlockedLevel, theme } = useProgressStore();
  const isDark = theme === "dark";

  const textColor = isDark ? "#fff" : "#333";
  const subtextColor = isDark ? "#aaa" : "#666";
  const cardBg = isDark ? "#1e1e1e" : "#fff";

  const toggleReveal = (code: string) => {
    setRevealedStates((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const getLevelProgress = (levelNum: number) => {
    const startIndex = (levelNum - 1) * COUNTRIES_PER_LEVEL;
    const levelCountries = countries.slice(
      startIndex,
      startIndex + COUNTRIES_PER_LEVEL,
    );
    const masteredInLevel = levelCountries.filter(
      (c) => (mastery[c.code]?.level || 0) >= 3,
    ).length;
    return (masteredInLevel / COUNTRIES_PER_LEVEL) * 100;
  };

  if (selectedLevel !== null) {
    const startIndex = (selectedLevel - 1) * COUNTRIES_PER_LEVEL;
    const levelCountries = countries.slice(
      startIndex,
      startIndex + COUNTRIES_PER_LEVEL,
    );

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#121212" : "#f8f9fa" },
        ]}
      >
        <View
          style={[
            styles.levelHeader,
            {
              backgroundColor: cardBg,
              borderBottomColor: isDark ? "#333" : "#eee",
            },
          ]}
        >
          <Pressable
            onPress={() => setSelectedLevel(null)}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={isDark ? "#fff" : "#333"} />
            <Text style={styles.backText}>All Levels</Text>
          </Pressable>
          <Text style={[styles.levelTitle, { color: textColor }]}>
            Level {selectedLevel}
          </Text>
        </View>

        <FlatList
          data={levelCountries}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <FlagCard
              country={item as any}
              revealed={!!revealedStates[item.code]}
              onPress={() => toggleReveal(item.code)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f8f9fa" },
      ]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: textColor }]}>Learning Path</Text>
      <Text style={[styles.subtitle, { color: subtextColor }]}>
        Master each level to unlock the next one!
      </Text>

      <View style={styles.levelGrid}>
        {Array.from({ length: TOTAL_LEVELS }).map((_, i) => {
          const levelNum = i + 1;
          const isUnlocked = levelNum <= unlockedLevel;
          const progress = getLevelProgress(levelNum);

          return (
            <Animated.View
              key={levelNum}
              entering={FadeInRight.delay(i * 50)}
              style={styles.levelCardContainer}
            >
              <Pressable
                style={[
                  styles.levelCard,
                  { backgroundColor: cardBg },
                  !isUnlocked &&
                    (isDark
                      ? styles.levelCardLockedDark
                      : styles.levelCardLocked),
                ]}
                onPress={() => isUnlocked && setSelectedLevel(levelNum)}
                disabled={!isUnlocked}
              >
                {!isUnlocked ? (
                  <Lock size={32} color={isDark ? "#444" : "#aaa"} />
                ) : (
                  <>
                    <View style={styles.levelInfo}>
                      <Text style={[styles.levelLabel, { color: textColor }]}>
                        Level {levelNum}
                      </Text>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: isDark ? "#333" : "#eee" },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(progress)}% Mastered
                      </Text>
                    </View>
                    {progress === 100 && (
                      <Star size={24} color="#f1c40f" fill="#f1c40f" />
                    )}
                  </>
                )}
              </Pressable>
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
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  levelGrid: {
    gap: 15,
  },
  levelCardContainer: {
    width: "100%",
  },
  levelCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  levelCardLocked: {
    backgroundColor: "#f1f3f5",
    justifyContent: "center",
    opacity: 0.7,
  },
  levelCardLockedDark: {
    backgroundColor: "#222",
    justifyContent: "center",
    opacity: 0.5,
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4caf50",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  levelHeader: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    color: "#1e88e5",
    fontWeight: "600",
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  listContent: {
    paddingBottom: 40,
  },
});
