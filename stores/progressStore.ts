import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface MasteryData {
  correct: number;
  wrong: number;
  level: number; // 0-5
}

export interface LevelStats {
  attemptsCount: number;
  passed: boolean;
  stars: number;
  bestTime: number; // in seconds
  history: Array<{
    score: number;
    duration: number; // in seconds
    passed: boolean;
    timestamp: number;
  }>;
}

interface ProgressState {
  mastery: Record<string, MasteryData>; // Legacy
  flagsMastery: Record<string, MasteryData>;
  capitalsMastery: Record<string, MasteryData>;
  unlockedLevel: number; // Legacy
  unlockedFlagsLevel: number;
  unlockedCapitalsLevel: number;
  levelStats: Record<string, LevelStats>; // Keyed by `${mode}_${level}`
  theme: "light" | "dark";
  soundEnabled: boolean;
  stats: {
    totalQuizzes: number;
    totalCorrect: number;
    totalWrong: number;
    streak: number;
    bestStreak: number;
  };
  recordAnswer: (countryCode: string, mode: "flag" | "capital", isCorrect: boolean) => void;
  recordQuizAttempt: (
    level: number,
    mode: "flag" | "capital",
    score: number,
    duration: number,
    passed: boolean
  ) => void;
  unlockNextLevel: (mode: "flag" | "capital") => void;
  toggleTheme: () => void;
  toggleSound: () => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      mastery: {},
      flagsMastery: {},
      capitalsMastery: {},
      unlockedLevel: 1,
      unlockedFlagsLevel: 1,
      unlockedCapitalsLevel: 1,
      levelStats: {},
      theme: "light",
      soundEnabled: true,
      stats: {
        totalQuizzes: 0,
        totalCorrect: 0,
        totalWrong: 0,
        streak: 0,
        bestStreak: 0,
      },
      recordAnswer: (countryCode, mode, isCorrect) =>
        set((state) => {
          const isFlag = mode === "flag";
          const targetMastery = isFlag
            ? (state.flagsMastery || {})
            : (state.capitalsMastery || {});

          const currentMastery = targetMastery[countryCode] || {
            correct: 0,
            wrong: 0,
            level: 0,
          };
          const newCorrect = isCorrect
            ? currentMastery.correct + 1
            : currentMastery.correct;
          const newWrong = !isCorrect
            ? currentMastery.wrong + 1
            : currentMastery.wrong;

          const netCorrect = newCorrect - newWrong;
          const newLevel = Math.max(0, Math.min(5, Math.floor(netCorrect / 3)));

          const newStreak = isCorrect ? state.stats.streak + 1 : 0;

          const updatedMastery = {
            ...targetMastery,
            [countryCode]: {
              correct: newCorrect,
              wrong: newWrong,
              level: newLevel,
            },
          };

          return {
            flagsMastery: isFlag ? updatedMastery : (state.flagsMastery || {}),
            capitalsMastery: !isFlag ? updatedMastery : (state.capitalsMastery || {}),
            stats: {
              ...state.stats,
              totalQuizzes: state.stats.totalQuizzes + 1,
              totalCorrect: isCorrect
                ? state.stats.totalCorrect + 1
                : state.stats.totalCorrect,
              totalWrong: !isCorrect
                ? state.stats.totalWrong + 1
                : state.stats.totalWrong,
              streak: newStreak,
              bestStreak: Math.max(state.stats.bestStreak, newStreak),
            },
          };
        }),
      recordQuizAttempt: (level, mode, score, duration, passed) =>
        set((state) => {
          const key = `${mode}_${level}`;
          const currentStats = (state.levelStats && state.levelStats[key]) || {
            attemptsCount: 0,
            passed: false,
            stars: 0,
            bestTime: 999999,
            history: [],
          };

          const newAttemptsCount = currentStats.attemptsCount + 1;
          const isNowPassed = currentStats.passed || passed;

          // Calculate stars: 5 if 1st attempt, 4 if 2nd, 3 if 3rd, 2 if 4-5th, 1 if >=6th
          let newStars = currentStats.stars;
          if (passed && !currentStats.passed) {
            if (newAttemptsCount === 1) newStars = 5;
            else if (newAttemptsCount === 2) newStars = 4;
            else if (newAttemptsCount === 3) newStars = 3;
            else if (newAttemptsCount <= 5) newStars = 2;
            else newStars = 1;
          }

          const newBestTime = passed
            ? Math.min(currentStats.bestTime, duration)
            : currentStats.bestTime;

          const newHistory = [
            ...currentStats.history,
            {
              score,
              duration,
              passed,
              timestamp: Date.now(),
            },
          ];

          const updatedLevelStats = {
            ...(state.levelStats || {}),
            [key]: {
              attemptsCount: newAttemptsCount,
              passed: isNowPassed,
              stars: newStars,
              bestTime: newBestTime === 999999 ? 0 : newBestTime,
              history: newHistory,
            },
          };

          let nextUnlockedFlags = state.unlockedFlagsLevel || 1;
          let nextUnlockedCapitals = state.unlockedCapitalsLevel || 1;

          if (passed) {
            if (mode === "flag" && level === nextUnlockedFlags) {
              nextUnlockedFlags = level + 1;
            } else if (mode === "capital" && level === nextUnlockedCapitals) {
              nextUnlockedCapitals = level + 1;
            }
          }

          return {
            levelStats: updatedLevelStats,
            unlockedFlagsLevel: nextUnlockedFlags,
            unlockedCapitalsLevel: nextUnlockedCapitals,
          };
        }),
      unlockNextLevel: (mode) =>
        set((state) => {
          if (mode === "flag") {
            return { unlockedFlagsLevel: (state.unlockedFlagsLevel || 1) + 1 };
          } else {
            return { unlockedCapitalsLevel: (state.unlockedCapitalsLevel || 1) + 1 };
          }
        }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      toggleSound: () =>
        set((state) => ({ soundEnabled: !state.soundEnabled })),
      resetProgress: () =>
        set({
          mastery: {},
          flagsMastery: {},
          capitalsMastery: {},
          unlockedLevel: 1,
          unlockedFlagsLevel: 1,
          unlockedCapitalsLevel: 1,
          levelStats: {},
          theme: "light",
          soundEnabled: true,
          stats: {
            totalQuizzes: 0,
            totalCorrect: 0,
            totalWrong: 0,
            streak: 0,
            bestStreak: 0,
          },
        }),
    }),
    {
      name: "countrivia-progress",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

