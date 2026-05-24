import { Audio } from "expo-av";
import * as Speech from "expo-speech";

// Configure audio session for full volume playback
Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true,   // Play even when phone is on silent
  shouldDuckAndroid: false,      // Don't lower volume of other apps
  staysActiveInBackground: false,
});

const sounds: Record<string, any> = {
  // High-pitched bell ding (generated WAV — expo-av supports WAV natively)
  correct: require("../assets/sounds/correct.wav"),
  wrong: require("../assets/sounds/wrong.mp3"),
};

export async function playSound(type: "correct" | "wrong") {
  try {
    const { sound } = await Audio.Sound.createAsync(sounds[type], {
      shouldPlay: true,
      volume: 1.0,     // Maximum volume
      isMuted: false,
    });

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

export function speakText(text: string) {
  try {
    Speech.speak(text, {
      language: "en",
      pitch: 1.0,
      rate: 0.9,
      volume: 1.0,
    });
  } catch (error) {
    console.warn("Error in Text-To-Speech:", error);
  }
}
