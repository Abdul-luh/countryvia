import { Audio } from "expo-av";

const sounds: Record<string, any> = {
  correct: require("../assets/sounds/correct.mp3"),
  wrong: require("../assets/sounds/wrong.mp3"),
};

export async function playSound(type: "correct" | "wrong") {
  try {
    const { sound } = await Audio.Sound.createAsync(sounds[type]);
    await sound.playAsync();

    // Cleanup after sound finishes
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.warn("Error playing sound:", error);
  }
}
