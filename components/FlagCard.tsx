import { ChevronRight, Eye, MapPin } from "lucide-react-native";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FlipInYRight, Layout } from "react-native-reanimated";
import { useProgressStore } from "../stores/progressStore";
import { Country } from "../utils/quizEngine";

interface FlagCardProps {
  country: Country;
  revealed: boolean;
  onPress: () => void;
}

export const FlagCard: React.FC<FlagCardProps> = ({
  country,
  revealed,
  onPress,
}) => {
  const { theme } = useProgressStore();
  const isDark = theme === "dark";

  return (
    <Pressable onPress={onPress} style={styles.cardContainer}>
      <Animated.View style={styles.cardWrapper}>
        <Animated.View
          layout={Layout.springify()}
          style={[
            styles.card,
            { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
            revealed &&
              (isDark ? styles.cardRevealedDark : styles.cardRevealed),
          ]}
        >
          <Image
            source={{ uri: country.flag }}
            style={styles.flag}
            resizeMode="contain"
            defaultSource={require("../assets/images/splash-icon.png")}
            onError={() =>
              console.warn(`Failed to load flag for ${country.name}`)
            }
          />
          <View style={styles.info}>
            {revealed ? (
              <Animated.View
                entering={FlipInYRight}
                style={styles.revealedInfo}
              >
                <Text
                  style={[styles.name, { color: isDark ? "#fff" : "#333" }]}
                >
                  {country.name}
                </Text>
                <View style={styles.capitalRow}>
                  <MapPin size={14} color="#1e88e5" />
                  <Text
                    style={[
                      styles.capital,
                      { color: isDark ? "#bbb" : "#666" },
                    ]}
                  >
                    {country.capital}
                  </Text>
                </View>
              </Animated.View>
            ) : (
              <View style={styles.placeholder}>
                <Eye size={20} color="#1e88e5" />
                <Text style={styles.tapToReveal}>Tap to reveal</Text>
              </View>
            )}
          </View>
          <ChevronRight color={isDark ? "#444" : "#ccc"} size={20} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  cardWrapper: {
    width: "100%",
  },
  card: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardRevealed: {
    borderColor: "#e3f2fd",
    backgroundColor: "#f1faff",
  },
  cardRevealedDark: {
    borderColor: "#1e88e533",
    backgroundColor: "#1e88e511",
  },
  flag: {
    width: 60,
    height: 40,
    borderRadius: 6,
    marginRight: 15,
  },
  info: {
    flex: 1,
  },
  revealedInfo: {
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
  },
  capitalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  capital: {
    fontSize: 14,
    fontWeight: "500",
  },
  placeholder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tapToReveal: {
    fontSize: 14,
    color: "#1e88e5",
    fontWeight: "600",
  },
});
