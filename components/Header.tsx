import { Moon, Sun, Volume2, VolumeX } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProgressStore } from "../stores/progressStore";

export const Header: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, toggleTheme, soundEnabled, toggleSound } = useProgressStore();
  const isDark = theme === "dark";

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 10,
          backgroundColor: isDark ? "#121212" : "#fff",
        },
      ]}
    >
      <View style={styles.logoContainer}>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#333" }]}>
          Coun<Text style={styles.highlight}>trivia</Text>
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={toggleSound} style={styles.iconButton}>
          {soundEnabled ? (
            <Volume2 size={24} color={isDark ? "#fff" : "#333"} />
          ) : (
            <VolumeX size={24} color="#ff4444" />
          )}
        </Pressable>
        <Pressable onPress={toggleTheme} style={styles.iconButton}>
          {isDark ? (
            <Sun size={24} color="#f1c40f" />
          ) : (
            <Moon size={24} color="#333" />
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  logoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  highlight: {
    color: "#1e88e5",
  },
  actions: {
    flexDirection: "row",
    gap: 15,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
});
