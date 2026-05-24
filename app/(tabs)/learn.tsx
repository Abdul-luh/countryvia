import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  Lock,
  MapPin,
  Play,
  RefreshCw,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  SlideInDown,
} from "react-native-reanimated";
import countries from "../../data/countries.json";
import { useProgressStore } from "../../stores/progressStore";
import { generateQuizForLevel, Question } from "../../utils/quizEngine";
import { playSound, speakText } from "../../utils/soundUtils";

const COUNTRIES_PER_LEVEL = 10;
const TOTAL_LEVELS = Math.ceil(countries.length / COUNTRIES_PER_LEVEL);
const { width } = Dimensions.get("window");

export default function LearnScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: "flag" | "capital" }>();
  
  // Progress store
  const {
    flagsMastery,
    capitalsMastery,
    unlockedFlagsLevel,
    unlockedCapitalsLevel,
    levelStats,
    soundEnabled,
    recordAnswer,
    recordQuizAttempt,
    theme,
  } = useProgressStore();

  const isDark = theme === "dark";

  // Colors
  const textColor = isDark ? "#ffffff" : "#1a1a1a";
  const subtextColor = isDark ? "#b0b0b0" : "#666666";
  const cardBg = isDark ? "#1e1e1e" : "#ffffff";
  const containerBg = isDark ? "#121212" : "#f8f9fa";
  const accentColor = "#1e88e5";

  // Active track state
  const [activeMode, setActiveMode] = useState<"flag" | "capital">("flag");
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  
  // Card reveal state
  const [revealedStates, setRevealedStates] = useState<Record<string, boolean>>({});

  // Quiz states
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  
  // Timers
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [questionDurations, setQuestionDurations] = useState<number[]>([]);
  const [quizHistoryAnswers, setQuizHistoryAnswers] = useState<
    Array<{
      country: any;
      isCorrect: boolean;
      selectedAnswer: string;
      correctAnswer: string;
      duration: number;
    }>
  >([]);

  // Synchronize parameter with mode state
  useEffect(() => {
    if (params.mode === "flag" || params.mode === "capital") {
      setActiveMode(params.mode);
      setSelectedLevel(null); // Reset selected level on mode change
      setQuizActive(false);
      setQuizFinished(false);
    }
  }, [params.mode]);

  const toggleReveal = (code: string) => {
    setRevealedStates((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const getLevelProgress = (levelNum: number, mode: "flag" | "capital") => {
    const startIndex = (levelNum - 1) * COUNTRIES_PER_LEVEL;
    const levelCountries = countries.slice(
      startIndex,
      startIndex + COUNTRIES_PER_LEVEL
    );
    const targetMastery = mode === "flag" ? flagsMastery : capitalsMastery;
    const masteredInLevel = levelCountries.filter(
      (c) => ((targetMastery && targetMastery[c.code]?.level) || 0) >= 3
    ).length;
    return (masteredInLevel / COUNTRIES_PER_LEVEL) * 100;
  };

  // Start quiz flow
  const startQuiz = (level: number) => {
    const questions = generateQuizForLevel(level, activeMode);
    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setQuizActive(true);
    setQuizFinished(false);
    setQuestionStartTime(Date.now());
    setQuestionDurations([]);
    setQuizHistoryAnswers([]);
  };

  // Handle choice submission
  const handleOptionSelect = async (option: string) => {
    if (hasAnswered) return;

    const endTime = Date.now();
    const duration = Math.max(0.1, parseFloat(((endTime - questionStartTime) / 1000).toFixed(1)));
    setQuestionDurations((prev) => [...prev, duration]);
    
    setSelectedOption(option);
    setHasAnswered(true);

    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correctAnswer;

    // Play feedback sound
    if (soundEnabled) {
      playSound(isCorrect ? "correct" : "wrong");
    }

    // Pronounce the correct answer
    speakText(currentQuestion.correctAnswer);

    // Save individual mastery progress
    recordAnswer(currentQuestion.country.code, activeMode, isCorrect);

    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }

    // Save history
    setQuizHistoryAnswers((prev) => [
      ...prev,
      {
        country: currentQuestion.country,
        isCorrect,
        selectedAnswer: option,
        correctAnswer: currentQuestion.correctAnswer,
        duration,
      },
    ]);
  };

  // Next Question or Finish Quiz
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
      setQuestionStartTime(Date.now());
    } else {
      // Completed all 10 questions
      const totalDuration = questionDurations.reduce((a, b) => a + b, 0);
      const passed = quizScore === 10; // Perfect score (10/10) required to pass
      
      // Save stats in store
      recordQuizAttempt(
        selectedLevel!,
        activeMode,
        quizScore,
        Math.round(totalDuration),
        passed
      );
      
      setQuizFinished(true);
    }
  };

  // Render Stars Component
  const renderStars = (starCount: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={28}
            color={s <= starCount ? "#f1c40f" : isDark ? "#444" : "#ccc"}
            fill={s <= starCount ? "#f1c40f" : "transparent"}
            style={{ marginHorizontal: 2 }}
          />
        ))}
      </View>
    );
  };

  // ----------------------------------------------------
  // QUIZ SCREEN
  // ----------------------------------------------------
  if (quizActive) {
    if (quizFinished) {
      // Quiz Review / Results Screen
      const statsKey = `${activeMode}_${selectedLevel}`;
      const currentLevelStats = levelStats?.[statsKey];
      const attempts = currentLevelStats?.attemptsCount || 1;
      const starsEarned = quizScore === 10 ? (currentLevelStats?.stars || 0) : 0;
      const passed = quizScore === 10;

      return (
        <ScrollView
          style={[styles.container, { backgroundColor: containerBg }]}
          contentContainerStyle={styles.resultsContent}
        >
          <Animated.View entering={FadeIn.duration(400)} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              {passed ? (
                <>
                  <View style={styles.trophyWrapper}>
                    <Trophy size={64} color="#f1c40f" />
                  </View>
                  <Text style={[styles.resultTitle, { color: "#2e7d32" }]}>
                    Congratulations! 🎉
                  </Text>
                  <Text style={[styles.resultSubtitle, { color: textColor }]}>
                    Level Passed Perfect 10/10!
                  </Text>
                  <View style={styles.starsWrapper}>
                    {renderStars(starsEarned)}
                    <Text style={styles.starsSummaryText}>
                      Earned {starsEarned} Star{starsEarned !== 1 ? "s" : ""} on Attempt #{attempts}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.failedIconWrapper}>
                    <Award size={64} color="#e53935" />
                  </View>
                  <Text style={[styles.resultTitle, { color: "#c62828" }]}>
                    Quiz Failed
                  </Text>
                  <Text style={[styles.resultSubtitle, { color: subtextColor }]}>
                    Score: {quizScore}/10. Perfect 10/10 score required to unlock next level.
                  </Text>
                  <View style={styles.starsWrapper}>
                    {renderStars(0)}
                    <Text style={styles.starsSummaryText}>
                      0 Stars (Attempts: {attempts})
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? "#333" : "#eee" }]} />

            <View style={styles.resultsStatsRow}>
              <View style={styles.resultsStatBox}>
                <Text style={styles.resultsStatLabel}>Total Duration</Text>
                <Text style={[styles.resultsStatValue, { color: textColor }]}>
                  {questionDurations.reduce((a, b) => a + b, 0).toFixed(1)}s
                </Text>
              </View>
              <View style={styles.resultsStatBox}>
                <Text style={styles.resultsStatLabel}>Avg. Speed</Text>
                <Text style={[styles.resultsStatValue, { color: textColor }]}>
                  {(questionDurations.reduce((a, b) => a + b, 0) / 10).toFixed(1)}s/q
                </Text>
              </View>
            </View>
          </Animated.View>

          <Text style={[styles.breakdownHeader, { color: textColor }]}>
            Question Breakdown
          </Text>

          {quizHistoryAnswers.map((item, idx) => (
            <Animated.View
              key={idx}
              entering={FadeInDown.delay(idx * 50)}
              style={[styles.historyCard, { backgroundColor: cardBg }]}
            >
              <View style={styles.historyCardRow}>
                <Image
                  source={{ uri: item.country.flag }}
                  style={styles.historyFlag}
                  resizeMode="cover"
                />
                <View style={styles.historyTextInfo}>
                  <Text style={[styles.historyCountryName, { color: textColor }]}>
                    {item.country.name}
                  </Text>
                  <Text style={styles.historyDuration}>
                    Answered in {item.duration}s
                  </Text>
                  
                  <View style={styles.historyAnswersSection}>
                    <Text
                      style={[
                        styles.historyAnswerLine,
                        { color: item.isCorrect ? "#4caf50" : "#e53935" },
                      ]}
                    >
                      Your Answer: {item.selectedAnswer}
                    </Text>
                    {!item.isCorrect && (
                      <Text style={[styles.historyAnswerLine, { color: "#4caf50" }]}>
                        Correct Answer: {item.correctAnswer}
                      </Text>
                    )}
                  </View>
                </View>
                {item.isCorrect ? (
                  <CheckCircle2 color="#4caf50" size={24} />
                ) : (
                  <XCircle color="#e53935" size={24} />
                )}
              </View>
            </Animated.View>
          ))}

          <View style={styles.actionButtonsContainer}>
            {passed && selectedLevel && selectedLevel < TOTAL_LEVELS && (
              <Pressable
                style={[styles.actionBtn, styles.nextLevelBtn]}
                onPress={() => {
                  const nextLvl = selectedLevel + 1;
                  setSelectedLevel(nextLvl);
                  setRevealedStates({});
                  setQuizActive(false);
                  setQuizFinished(false);
                }}
              >
                <Text style={styles.actionBtnText}>Next Level</Text>
                <ArrowRight size={20} color="#fff" />
              </Pressable>
            )}

            <Pressable
              style={[styles.actionBtn, styles.retryBtn]}
              onPress={() => startQuiz(selectedLevel!)}
            >
              <RefreshCw size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Retry Quiz</Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, styles.exitBtn, { borderColor: isDark ? "#444" : "#ccc" }]}
              onPress={() => {
                setQuizActive(false);
                setQuizFinished(false);
              }}
            >
              <Text style={[styles.actionBtnText, { color: textColor }]}>
                Back to Study Checklist
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      );
    }

    // Active Quiz Questions Screen
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const progressWidth = ((currentQuestionIndex + (hasAnswered ? 1 : 0)) / 10) * 100;

    return (
      <View style={[styles.container, { backgroundColor: containerBg }]}>
        {/* Progress Bar */}
        <View style={[styles.quizProgressContainer, { backgroundColor: isDark ? "#222" : "#eee" }]}>
          <View style={[styles.quizProgressFill, { width: `${progressWidth}%` }]} />
        </View>

        <View style={styles.quizHeader}>
          <Text style={styles.quizStepText}>
            Question {currentQuestionIndex + 1} of 10
          </Text>
          <Text style={[styles.quizScoreText, { color: textColor }]}>
            Score: {quizScore}/{currentQuestionIndex}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.quizContent}>
          {activeMode === "flag" ? (
            <View style={styles.questionSection}>
              <Text style={[styles.questionText, { color: textColor }]}>
                Which country does this flag belong to?
              </Text>
              <Animated.View entering={FadeIn.duration(300)} style={styles.quizFlagContainer}>
                <Image
                  source={{ uri: currentQuestion.country.flag }}
                  style={styles.quizLargeFlag}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
          ) : (
            <View style={styles.questionSection}>
              <Text style={[styles.questionText, { color: textColor }]}>
                What is the capital of this country?
              </Text>
              <Text style={[styles.questionCountryTitle, { color: accentColor }]}>
                {currentQuestion.country.name}
              </Text>
              <Animated.View entering={FadeIn.duration(300)} style={styles.quizFlagContainerMedium}>
                <Image
                  source={{ uri: currentQuestion.country.flag }}
                  style={styles.quizMediumFlag}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
          )}

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              
              let optionBg = cardBg;
              let optionBorder = isDark ? "#333" : "#e0e0e0";
              let optionTextColor = textColor;

              if (hasAnswered) {
                if (isCorrect) {
                  optionBg = isDark ? "#1b5e20" : "#e8f5e9";
                  optionBorder = "#4caf50";
                  optionTextColor = isDark ? "#fff" : "#2e7d32";
                } else if (isSelected) {
                  optionBg = isDark ? "#b71c1c" : "#ffebee";
                  optionBorder = "#f44336";
                  optionTextColor = isDark ? "#fff" : "#c62828";
                }
              }

              return (
                <Pressable
                  key={index}
                  disabled={hasAnswered}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: optionBg,
                      borderColor: optionBorder,
                    },
                    isSelected && !hasAnswered && styles.optionSelected,
                  ]}
                  onPress={() => handleOptionSelect(option)}
                >
                  <Text style={[styles.optionText, { color: optionTextColor }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Slide-Up Feedback Sheet */}
        {hasAnswered && (
          <Animated.View
            entering={SlideInDown.springify().damping(15)}
            style={[
              styles.feedbackSheet,
              {
                backgroundColor:
                  selectedOption === currentQuestion.correctAnswer
                    ? isDark
                      ? "#1b5e20"
                      : "#e8f5e9"
                    : isDark
                    ? "#b71c1c"
                    : "#ffebee",
              },
            ]}
          >
            <View style={styles.feedbackRow}>
              {selectedOption === currentQuestion.correctAnswer ? (
                <>
                  <CheckCircle2 color="#4caf50" size={28} />
                  <Text style={[styles.feedbackTitle, { color: isDark ? "#fff" : "#2e7d32" }]}>
                    Correct! 🎉
                  </Text>
                </>
              ) : (
                <>
                  <XCircle color="#f44336" size={28} />
                  <Text style={[styles.feedbackTitle, { color: isDark ? "#fff" : "#c62828" }]}>
                    Incorrect! ❌
                  </Text>
                </>
              )}
            </View>
            <Text
              style={[
                styles.feedbackCorrectVal,
                { color: isDark ? "#e0e0e0" : "#555" },
              ]}
            >
              Correct Answer: {currentQuestion.correctAnswer}
            </Text>

            <Pressable style={styles.feedbackBtn} onPress={handleNextQuestion}>
              <Text style={styles.feedbackBtnText}>
                {currentQuestionIndex === 9 ? "Finish Quiz" : "Next Question"}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    );
  }

  // ----------------------------------------------------
  // LEVEL COUNTRY LIST SCREEN (STUDY ROOM)
  // ----------------------------------------------------
  if (selectedLevel !== null) {
    const startIndex = (selectedLevel - 1) * COUNTRIES_PER_LEVEL;
    const levelCountries = countries.slice(
      startIndex,
      startIndex + COUNTRIES_PER_LEVEL
    );

    return (
      <View style={[styles.container, { backgroundColor: containerBg }]}>
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
            <ChevronLeft size={24} color={accentColor} />
            <Text style={styles.backText}>All Levels</Text>
          </Pressable>
          <Text style={[styles.levelTitle, { color: textColor }]}>
            Level {selectedLevel} Lesson
          </Text>
          <Text style={styles.levelSubtitleMini}>
            Study these {COUNTRIES_PER_LEVEL} countries before taking the quiz!
          </Text>
        </View>

        <FlatList
          data={levelCountries}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.studyListContent}
          renderItem={({ item, index }) => {
            const isRevealed = !!revealedStates[item.code];

            return (
              <Animated.View
                entering={FadeInRight.delay(index * 50)}
                style={[styles.studyCard, { backgroundColor: cardBg }]}
              >
                {activeMode === "flag" ? (
                  // Flags Mode Card
                  <View style={styles.studyFlagModeContainer}>
                    <View style={styles.studyFlagWrapper}>
                      <Image
                        source={{ uri: item.flag }}
                        style={styles.studyLargeFlag}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.studyInfoSection}>
                      {isRevealed ? (
                        <View style={styles.revealedInfoContainer}>
                          <View style={styles.revealedTextRow}>
                            <Text style={[styles.revealedCountryName, { color: textColor }]}>
                              {item.name}
                            </Text>
                            <Pressable
                              style={styles.speakerBtn}
                              onPress={() => speakText(item.name)}
                            >
                              <Volume2 size={22} color={accentColor} />
                            </Pressable>
                          </View>
                          <Text style={styles.revealedCapital}>
                            Capital: {item.capital}
                          </Text>
                        </View>
                      ) : (
                        <Pressable
                          style={styles.revealPlaceholderBtn}
                          onPress={() => toggleReveal(item.code)}
                        >
                          <Eye size={20} color={accentColor} />
                          <Text style={styles.revealPlaceholderText}>
                            Reveal Country
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ) : (
                  // Capitals Mode Card
                  <View style={styles.studyCapitalModeContainer}>
                    <View style={styles.studyCapitalTopRow}>
                      <Image
                        source={{ uri: item.flag }}
                        style={styles.studyMediumFlag}
                        resizeMode="cover"
                      />
                      <Text style={[styles.studyCapitalCountryName, { color: textColor }]}>
                        {item.name}
                      </Text>
                    </View>
                    <View style={styles.studyCapitalInfoSection}>
                      {isRevealed ? (
                        <View style={styles.revealedInfoContainer}>
                          <View style={styles.revealedTextRow}>
                            <Text style={[styles.revealedCapitalName, { color: accentColor }]}>
                              {item.capital}
                            </Text>
                            <Pressable
                              style={styles.speakerBtn}
                              onPress={() =>
                                speakText(`${item.capital}, capital of ${item.name}`)
                              }
                            >
                              <Volume2 size={22} color={accentColor} />
                            </Pressable>
                          </View>
                          <Text style={styles.revealedCountrySubtitle}>
                            Capital of {item.name}
                          </Text>
                        </View>
                      ) : (
                        <Pressable
                          style={styles.revealPlaceholderBtn}
                          onPress={() => toggleReveal(item.code)}
                        >
                          <Eye size={20} color={accentColor} />
                          <Text style={styles.revealPlaceholderText}>
                            Reveal Capital
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}
              </Animated.View>
            );
          }}
          ListFooterComponent={
            <View style={styles.studyFooter}>
              <Pressable style={styles.quizStartBtn} onPress={() => startQuiz(selectedLevel)}>
                <Play size={22} color="#fff" fill="#fff" />
                <Text style={styles.quizStartBtnText}>Start Level Quiz</Text>
              </Pressable>
            </View>
          }
        />
      </View>
    );
  }

  // ----------------------------------------------------
  // HOME / LEVELS GRID VIEW
  // ----------------------------------------------------
  const unlockedLevel = activeMode === "flag" ? unlockedFlagsLevel : unlockedCapitalsLevel;

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      {/* Premium Tab Selector */}
      <View style={[styles.tabSelectorContainer, { backgroundColor: isDark ? "#1a1a1a" : "#eaeaea" }]}>
        <Pressable
          style={[
            styles.tabItem,
            activeMode === "flag" && [
              styles.tabItemActive,
              { backgroundColor: cardBg },
            ],
          ]}
          onPress={() => {
            setActiveMode("flag");
            router.setParams({ mode: "flag" });
          }}
        >
          <Flag size={18} color={activeMode === "flag" ? accentColor : "#888"} />
          <Text
            style={[
              styles.tabItemText,
              { color: activeMode === "flag" ? textColor : "#888" },
              activeMode === "flag" && styles.tabItemTextActive,
            ]}
          >
            Flags Track
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabItem,
            activeMode === "capital" && [
              styles.tabItemActive,
              { backgroundColor: cardBg },
            ],
          ]}
          onPress={() => {
            setActiveMode("capital");
            router.setParams({ mode: "capital" });
          }}
        >
          <MapPin size={18} color={activeMode === "capital" ? "#43a047" : "#888"} />
          <Text
            style={[
              styles.tabItemText,
              { color: activeMode === "capital" ? textColor : "#888" },
              activeMode === "capital" && styles.tabItemTextActive,
            ]}
          >
            Capitals Track
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.gridHeader}>
          <Text style={[styles.title, { color: textColor }]}>
            {activeMode === "flag" ? "Flags Learning Road" : "Capitals Roadmap"}
          </Text>
          <Text style={[styles.subtitle, { color: subtextColor }]}>
            Pass each level's 10/10 quiz to unlock the next challenge!
          </Text>
        </View>

        <View style={styles.levelGrid}>
          {Array.from({ length: TOTAL_LEVELS }).map((_, i) => {
            const levelNum = i + 1;
            const isUnlocked = levelNum <= unlockedLevel;
            const progress = getLevelProgress(levelNum, activeMode);
            const statsKey = `${activeMode}_${levelNum}`;
            const attempts = levelStats?.[statsKey]?.attemptsCount || 0;
            const stars = levelStats?.[statsKey]?.stars || 0;
            const hasPassed = levelStats?.[statsKey]?.passed || false;

            return (
              <Animated.View
                key={levelNum}
                entering={FadeInRight.delay(i * 30)}
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
                    <View style={styles.lockedRow}>
                      <Lock size={24} color={isDark ? "#555" : "#aaa"} />
                      <Text style={[styles.lockedText, { color: isDark ? "#555" : "#aaa" }]}>
                        Level {levelNum} Locked
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.levelMainContent}>
                      <View style={styles.levelCardHeader}>
                        <Text style={[styles.levelLabel, { color: textColor }]}>
                          Level {levelNum}
                        </Text>
                        {hasPassed && (
                          <View style={styles.passedBadge}>
                            <Text style={styles.passedBadgeText}>PASSED</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.levelBodyRow}>
                        <View style={styles.levelLeftInfo}>
                          {/* Progress bar */}
                          <View
                            style={[
                              styles.progressBar,
                              { backgroundColor: isDark ? "#333" : "#eee" },
                            ]}
                          >
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${progress}%`,
                                  backgroundColor: activeMode === "flag" ? accentColor : "#4caf50",
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {Math.round(progress)}% Mastery
                          </Text>
                        </View>

                        <View style={styles.levelRightInfo}>
                          {hasPassed ? (
                            <View style={styles.starsSummary}>
                              <View style={styles.miniStarsRow}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    size={14}
                                    color={s <= stars ? "#f1c40f" : "#ccc"}
                                    fill={s <= stars ? "#f1c40f" : "transparent"}
                                  />
                                ))}
                              </View>
                              <Text style={styles.attemptsText}>
                                in {attempts} attempt{attempts !== 1 ? "s" : ""}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.studyStatus}>
                              <Text style={styles.inProgressText}>
                                {attempts > 0 ? `${attempts} Attempts` : "Not Started"}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                  {isUnlocked && (
                    <ChevronRight color={isDark ? "#666" : "#ccc"} size={22} />
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
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
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 20,
  },
  tabSelectorContainer: {
    flexDirection: "row",
    padding: 4,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 25,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 22,
    gap: 8,
  },
  tabItemActive: {
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabItemText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabItemTextActive: {
    fontWeight: "700",
  },
  gridHeader: {
    marginBottom: 20,
  },
  levelGrid: {
    gap: 15,
  },
  levelCardContainer: {
    width: "100%",
  },
  levelCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  levelCardLocked: {
    backgroundColor: "#eaeaea",
    opacity: 0.65,
  },
  levelCardLockedDark: {
    backgroundColor: "#1c1c1c",
    opacity: 0.45,
  },
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingVertical: 8,
  },
  lockedText: {
    fontSize: 16,
    fontWeight: "700",
  },
  levelMainContent: {
    flex: 1,
    paddingRight: 10,
  },
  levelCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  passedBadge: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  passedBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  levelBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelLeftInfo: {
    width: "55%",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    width: "100%",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: "#888",
    fontWeight: "500",
  },
  levelRightInfo: {
    alignItems: "flex-end",
    width: "40%",
  },
  starsSummary: {
    alignItems: "flex-end",
  },
  miniStarsRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  attemptsText: {
    fontSize: 10,
    color: "#888",
    fontWeight: "500",
  },
  studyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  inProgressText: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600",
  },
  levelHeader: {
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    marginLeft: -5,
  },
  backText: {
    fontSize: 15,
    color: "#1e88e5",
    fontWeight: "600",
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  levelSubtitleMini: {
    fontSize: 13,
    color: "#888",
  },
  studyListContent: {
    padding: 15,
    paddingBottom: 40,
  },
  studyCard: {
    borderRadius: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: "hidden",
  },
  studyFlagModeContainer: {
    flexDirection: "column",
    padding: 16,
  },
  studyFlagWrapper: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  studyLargeFlag: {
    width: 190,
    height: 115,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  studyInfoSection: {
    minHeight: 50,
    justifyContent: "center",
  },
  revealedInfoContainer: {
    paddingVertical: 4,
  },
  revealedTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  revealedCountryName: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  speakerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(30,136,229,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  revealedCapital: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    fontWeight: "500",
  },
  revealPlaceholderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#1e88e5",
    borderRadius: 10,
  },
  revealPlaceholderText: {
    color: "#1e88e5",
    fontSize: 14,
    fontWeight: "600",
  },
  studyCapitalModeContainer: {
    padding: 16,
  },
  studyCapitalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  studyMediumFlag: {
    width: 70,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  studyCapitalCountryName: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  studyCapitalInfoSection: {
    minHeight: 50,
    justifyContent: "center",
  },
  revealedCapitalName: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  revealedCountrySubtitle: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    fontWeight: "500",
  },
  studyFooter: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  quizStartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#1e88e5",
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 30,
    width: "80%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  quizStartBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  quizProgressContainer: {
    height: 6,
    width: "100%",
  },
  quizProgressFill: {
    height: "100%",
    backgroundColor: "#2196f3",
  },
  quizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  quizStepText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  quizScoreText: {
    fontSize: 14,
    fontWeight: "700",
  },
  quizContent: {
    padding: 20,
    paddingBottom: 150,
  },
  questionSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  questionCountryTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 15,
  },
  quizFlagContainer: {
    width: "100%",
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  quizLargeFlag: {
    width: 250,
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  quizFlagContainerMedium: {
    width: "100%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
  },
  quizMediumFlag: {
    width: 120,
    height: 75,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  optionsContainer: {
    gap: 12,
    marginTop: 20,
  },
  optionButton: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  optionSelected: {
    borderColor: "#2196f3",
    backgroundColor: "rgba(33,150,243,0.05)",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  feedbackSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  feedbackCorrectVal: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
  },
  feedbackBtn: {
    backgroundColor: "#1976d2",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  resultsContent: {
    padding: 20,
    paddingBottom: 50,
  },
  resultCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#ffffff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 25,
  },
  resultHeader: {
    alignItems: "center",
    marginBottom: 15,
  },
  trophyWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fffde7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  failedIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#ffebee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  resultSubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  starsWrapper: {
    alignItems: "center",
    marginTop: 10,
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  starsSummaryText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 15,
  },
  resultsStatsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  resultsStatBox: {
    flex: 1,
    alignItems: "center",
  },
  resultsStatLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  resultsStatValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  breakdownHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },
  historyCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  historyCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyFlag: {
    width: 48,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    marginRight: 12,
  },
  historyTextInfo: {
    flex: 1,
  },
  historyCountryName: {
    fontSize: 15,
    fontWeight: "700",
  },
  historyDuration: {
    fontSize: 10,
    color: "#999",
    marginTop: 1,
  },
  historyAnswersSection: {
    marginTop: 4,
  },
  historyAnswerLine: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtonsContainer: {
    marginTop: 25,
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
  },
  nextLevelBtn: {
    backgroundColor: "#4caf50",
  },
  retryBtn: {
    backgroundColor: "#1e88e5",
  },
  exitBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
