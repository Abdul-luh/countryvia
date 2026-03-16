import {
  CheckCircle2,
  ChevronLeft,
  Lock,
  Trophy,
  XCircle,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import countries from "../../data/countries.json";
import { useProgressStore } from "../../stores/progressStore";
import { generateQuestion, Question } from "../../utils/quizEngine";
import { playSound } from "../../utils/soundUtils";

const COUNTRIES_PER_LEVEL = 10;
const TOTAL_LEVELS = Math.ceil(countries.length / COUNTRIES_PER_LEVEL);

export default function QuizScreen() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const {
    mastery,
    unlockedLevel,
    recordAnswer,
    unlockNextLevel,
    theme,
    soundEnabled,
  } = useProgressStore();

  const isDark = theme === "dark";
  const textColor = isDark ? "#fff" : "#333";
  const subtextColor = isDark ? "#aaa" : "#666";
  const cardBg = isDark ? "#1e1e1e" : "#fff";

  const shakeX = useSharedValue(0);
  const QUESTION_LIMIT = 10;

  useEffect(() => {
    if (selectedLevel !== null) {
      nextQuestion();
    }
  }, [selectedLevel]);

  const nextQuestion = () => {
    if (count >= QUESTION_LIMIT) {
      setIsFinished(true);
      checkUnlockCondition();
      return;
    }

    if (selectedLevel === null) return;

    const startIndex = (selectedLevel - 1) * COUNTRIES_PER_LEVEL;
    const levelCountries = countries.slice(
      startIndex,
      startIndex + COUNTRIES_PER_LEVEL,
    );

    setQuestion(
      generateQuestion(
        Math.random() > 0.5 ? "flag" : "capital",
        levelCountries as any,
      ),
    );
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const checkUnlockCondition = () => {
    if (selectedLevel === null) return;

    const startIndex = (selectedLevel - 1) * COUNTRIES_PER_LEVEL;
    const levelCountries = countries.slice(
      startIndex,
      startIndex + COUNTRIES_PER_LEVEL,
    );

    const allMastered = levelCountries.every(
      (c) => (mastery[c.code]?.level || 0) >= 3,
    );

    if (allMastered && selectedLevel === unlockedLevel) {
      unlockNextLevel();
    }
  };

  const handlePress = (option: string) => {
    if (selectedOption || !question) return;

    const correct = option === question.correctAnswer;
    setSelectedOption(option);
    setIsCorrect(correct);
    recordAnswer(question.country.code, correct);

    setCount((prev) => prev + 1);
    setSessionStats((prev) => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      wrong: !correct ? prev.wrong + 1 : prev.wrong,
    }));

    if (soundEnabled) {
      playSound(correct ? "correct" : "wrong");
    }

    if (!correct) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }

    setTimeout(nextQuestion, 1500);
  };

  const restart = () => {
    setCount(0);
    setSessionStats({ correct: 0, wrong: 0 });
    setIsFinished(false);
    nextQuestion();
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  if (selectedLevel === null) {
    return (
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#121212" : "#f8f9fa" },
        ]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: textColor }]}>Select a Level</Text>
        <Text style={[styles.subtitle, { color: subtextColor }]}>
          Test your mastery and unlock more!
        </Text>

        <View style={styles.levelGrid}>
          {Array.from({ length: TOTAL_LEVELS }).map((_, i) => {
            const levelNum = i + 1;
            const isUnlocked = levelNum <= unlockedLevel;

            return (
              <Pressable
                key={levelNum}
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
                <Text
                  style={[
                    styles.levelLabel,
                    { color: textColor },
                    !isUnlocked && styles.levelLabelLocked,
                  ]}
                >
                  Level {levelNum}
                </Text>
                {!isUnlocked && (
                  <Lock size={20} color={isDark ? "#444" : "#aaa"} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  if (isFinished) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#121212" : "#f8f9fa" },
        ]}
      >
        <Animated.View
          entering={FadeIn}
          style={[styles.finishedCard, { backgroundColor: cardBg }]}
        >
          <Trophy size={64} color="#f1c40f" style={{ marginBottom: 20 }} />
          <Text style={[styles.finishedTitle, { color: textColor }]}>
            Quiz Complete!
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{sessionStats.correct}</Text>
              <Text style={styles.summaryLabel}>Correct</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{sessionStats.wrong}</Text>
              <Text style={styles.summaryLabel}>Incorrect</Text>
            </View>
          </View>
          <View style={styles.buttonRow}>
            <Pressable
              style={[
                styles.actionButton,
                isDark ? styles.secondaryButtonDark : styles.secondaryButton,
              ]}
              onPress={() => {
                setSelectedLevel(null);
                setCount(0);
                setIsFinished(false);
              }}
            >
              <Text
                style={
                  isDark
                    ? styles.secondaryButtonTextDark
                    : styles.secondaryButtonText
                }
              >
                Back to Levels
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={restart}
            >
              <Text style={styles.primaryButtonText}>Play Again</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    );
  }

  if (!question) return null;

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f8f9fa" },
      ]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => setSelectedLevel(null)}
          style={[styles.backButton, { backgroundColor: cardBg }]}
        >
          <ChevronLeft size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Level {selectedLevel}
        </Text>
        <View
          style={[
            styles.progressCounter,
            { backgroundColor: isDark ? "#1a237e" : "#e3f2fd" },
          ]}
        >
          <Text
            style={[
              styles.progressText,
              { color: isDark ? "#64b5f6" : "#1e88e5" },
            ]}
          >
            {count + 1}/{QUESTION_LIMIT}
          </Text>
        </View>
      </View>

      <Animated.View
        key={question.country.code}
        entering={FadeInRight}
        style={styles.quizCardWrapper}
      >
        <Animated.View
          style={[styles.quizCard, { backgroundColor: cardBg }, shakeStyle]}
        >
          <Text style={[styles.questionType, { color: subtextColor }]}>
            {question.type === "flag"
              ? "Which country has this flag?"
              : `What is the capital of ${question.country.name}?`}
          </Text>

          {question.type === "flag" ? (
            <Image
              source={{ uri: question.country.flag }}
              style={styles.flag}
              resizeMode="contain"
              defaultSource={require("../../assets/images/splash-icon.png")}
            />
          ) : (
            <View style={styles.countryNameContainer}>
              <Text
                style={[
                  styles.countryName,
                  { color: isDark ? "#64b5f6" : "#1e88e5" },
                ]}
              >
                {question.country.name}
              </Text>
            </View>
          )}

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              const isSelected = selectedOption === option;
              const isOptionCorrect = option === question.correctAnswer;

              let backgroundColor = cardBg;
              let borderColor = isDark ? "#333" : "#eee";

              if (isSelected) {
                backgroundColor = isCorrect
                  ? isDark
                    ? "#1b5e20"
                    : "#e8f5e9"
                  : isDark
                    ? "#b71c1c"
                    : "#ffebee";
                borderColor = isCorrect ? "#4caf50" : "#f44336";
              } else if (selectedOption && isOptionCorrect) {
                backgroundColor = isDark ? "#1b5e20" : "#e8f5e9";
                borderColor = "#4caf50";
              }

              return (
                <Pressable
                  key={index}
                  style={[styles.option, { backgroundColor, borderColor }]}
                  onPress={() => handlePress(option)}
                  disabled={!!selectedOption}
                >
                  <Text style={[styles.optionText, { color: textColor }]}>
                    {option}
                  </Text>
                  {isSelected &&
                    (isCorrect ? (
                      <CheckCircle2 size={24} color="#4caf50" />
                    ) : (
                      <XCircle size={24} color="#f44336" />
                    ))}
                  {!isSelected && selectedOption && isOptionCorrect && (
                    <CheckCircle2 size={24} color="#4caf50" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  levelCard: {
    width: "48%",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelCardLocked: {
    backgroundColor: "#f1f3f5",
    opacity: 0.7,
  },
  levelCardLockedDark: {
    backgroundColor: "#222",
    opacity: 0.5,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  levelLabelLocked: {
    color: "#aaa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  progressCounter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "700",
  },
  quizCardWrapper: {
    width: "100%",
  },
  quizCard: {
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    alignItems: "center",
  },
  questionType: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "500",
  },
  flag: {
    width: "100%",
    height: 180,
    marginBottom: 30,
  },
  countryNameContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  countryName: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  optionsContainer: {
    width: "100%",
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  finishedCard: {
    margin: 20,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginTop: 60,
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 30,
  },
  summaryStats: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 40,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1e88e5",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#888",
    textTransform: "uppercase",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#1e88e5",
  },
  secondaryButton: {
    backgroundColor: "#f1f3f5",
  },
  secondaryButtonDark: {
    backgroundColor: "#333",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButtonTextDark: {
    color: "#aaa",
    fontSize: 16,
    fontWeight: "700",
  },
});
