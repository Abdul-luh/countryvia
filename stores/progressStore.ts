import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface MasteryData {
  correct: number;
  wrong: number;
  level: number; // 0-5
}

interface ProgressState {
  mastery: Record<string, MasteryData>;
  unlockedLevel: number;
  theme: "light" | "dark";
  soundEnabled: boolean;
  stats: {
    totalQuizzes: number;
    totalCorrect: number;
    totalWrong: number;
    streak: number;
    bestStreak: number;
  };
  recordAnswer: (countryCode: string, isCorrect: boolean) => void;
  unlockNextLevel: () => void;
  toggleTheme: () => void;
  toggleSound: () => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      mastery: {},
      unlockedLevel: 1,
      theme: "light",
      soundEnabled: true,
      stats: {
        totalQuizzes: 0,
        totalCorrect: 0,
        totalWrong: 0,
        streak: 0,
        bestStreak: 0,
      },
      recordAnswer: (countryCode, isCorrect) =>
        set((state) => {
          const currentMastery = state.mastery[countryCode] || {
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

          return {
            mastery: {
              ...state.mastery,
              [countryCode]: {
                correct: newCorrect,
                wrong: newWrong,
                level: newLevel,
              },
            },
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
      unlockNextLevel: () =>
        set((state) => ({ unlockedLevel: state.unlockedLevel + 1 })),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      toggleSound: () =>
        set((state) => ({ soundEnabled: !state.soundEnabled })),
      resetProgress: () =>
        set({
          mastery: {},
          unlockedLevel: 1,
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
