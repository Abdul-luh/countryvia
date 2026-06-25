import { useRouter } from "expo-router";
import { Globe, Users, Wifi, WifiOff, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useProgressStore } from "../../stores/progressStore";
import { generateQuizForLevel } from "../../utils/quizEngine";
import { GameState, multiplayerGame, QuizQuestion } from "../../utils/multiplayer";

type UiPhase = "idle" | "discovering" | "hosting" | "lobby" | "playing" | "question_review" | "finished";

export default function MultiplayerScreen() {
  const router = useRouter();
  const { theme } = useProgressStore();
  const isDark = theme === "dark";

  const textColor = isDark ? "#ffffff" : "#1a1a1a";
  const bgColor = isDark ? "#121212" : "#f8f9fa";
  const cardBg = isDark ? "#1e1e1e" : "#ffffff";
  const accentColor = "#1e88e5";

  const [gameState, setGameState] = useState<GameState>(multiplayerGame.state);
  const [uiPhase, setUiPhase] = useState<UiPhase>("idle");
  const [playerName, setPlayerName] = useState("");
  const [gameName, setGameName] = useState("Countrivia Battle");
  const [selectedLevel, setSelectedLevel] = useState("1");
  const [unavailableMsg, setUnavailableMsg] = useState("");

  useEffect(() => {
    multiplayerGame.on("stateChanged", (state: GameState) => {
      setGameState(state);
    });
    multiplayerGame.on("unavailable", (msg: string) => {
      setUnavailableMsg(msg);
    });

    multiplayerGame.initialize().catch(console.error);
    return () => {
      multiplayerGame.removeAllListeners("stateChanged");
      multiplayerGame.removeAllListeners("unavailable");
    };
  }, []);

  const handleHost = async () => {
    try {
      await multiplayerGame.hostGame(playerName || "Player1", gameName);
    } catch (e: any) {
      if (e.message === "MULTIPLAYER_NOT_AVAILABLE") {
        setUnavailableMsg("Multiplayer requires react-native-udp. Build a dev client.");
      }
    }
  };

  const handleStart = () => {
    const questions: QuizQuestion[] = generateQuizForLevel(
      parseInt(selectedLevel),
      "flag"
    ).map((q) => ({
      type: q.type,
      country: {
        name: q.country.name,
        capital: q.country.capital,
        code: q.country.code,
        flag: q.country.flag,
      },
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));
    multiplayerGame.startGame(questions);
  };

  const handleAnswer = (option: string) => {
    multiplayerGame.submitAnswer(option);
  };

  const handleLeave = () => {
    multiplayerGame.leave();
    setUiPhase("idle");
  };

  // Render different screens based on UI phase
  if (unavailableMsg) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.centerContent}>
          <WifiOff size={64} color="#e53935" />
          <Text style={[styles.errorTitle, { color: textColor }]}>
            Multiplayer Unavailable
          </Text>
          <Text style={styles.errorText}>
            {unavailableMsg || "UDP networking requires a development build."}
          </Text>
          <Text style={styles.errorSubtext}>
            Build a dev client: npx expo install react-native-udp
          </Text>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: accentColor }]}
            onPress={() => router.navigate("/")}
          >
            <Text style={styles.actionBtnText}>Back to Learn</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (uiPhase === "idle") {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.heroSection}>
          <Globe size={64} color={accentColor} />
          <Text style={[styles.title, { color: textColor }]}>Multiplayer</Text>
          <Text style={styles.subtitle}>Local WiFi Battle Mode</Text>
        </View>

        <View style={styles.formSection}>
          <TextInput
            style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
            placeholder="Your name"
            placeholderTextColor="#888"
            value={playerName}
            onChangeText={setPlayerName}
          />
          <TextInput
            style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
            placeholder="Game name"
            placeholderTextColor="#888"
            value={gameName}
            onChangeText={setGameName}
          />

          <Text style={[styles.label, { color: textColor }]}>Level</Text>
          <TextInput
            style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
            placeholder="1"
            placeholderTextColor="#888"
            value={selectedLevel}
            onChangeText={setSelectedLevel}
            keyboardType="numeric"
          />

          <Pressable
            style={[styles.actionBtn, { backgroundColor: "#4caf50" }]}
            onPress={handleHost}
          >
            <Wifi size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Host Game (Hotspot)</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, { backgroundColor: accentColor, marginTop: 12 }]}
            onPress={() => setUiPhase("discovering")}
          >
            <Users size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Join Game</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (uiPhase === "discovering") {
    const [manualIp, setManualIp] = useState("");

    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleLeave}>
            <X size={24} color={accentColor} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Join a Game
          </Text>
        </View>

        <Text style={styles.scanningText}>Scanning for games...</Text>

        <FlatList
          data={gameState.discoveredGames}
          keyExtractor={(item) => item.hostIp}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.gameCard, { backgroundColor: cardBg }]}
              onPress={() => multiplayerGame.joinGame(item.hostIp, playerName || "Player2")}
            >
              <Wifi size={24} color={accentColor} />
              <View style={styles.gameInfo}>
                <Text style={[styles.gameName, { color: textColor }]}>
                  {item.gameName}
                </Text>
                <Text style={styles.gameMeta}>Host: {item.hostName}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: textColor }]}>
                No games found. Ask your friend to enable hotspot and host.
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, color: textColor, marginTop: 20 }]}
                placeholder="Enter host hotspot IP (e.g. 192.168.43.1)"
                placeholderTextColor="#888"
                value={manualIp}
                onChangeText={setManualIp}
                keyboardType="numeric"
              />
              <Pressable
                style={[styles.actionBtn, { backgroundColor: accentColor, marginTop: 12 }]}
                onPress={() => {
                  if (manualIp.trim()) {
                    multiplayerGame.joinGame(manualIp.trim(), playerName || "Player2");
                  }
                }}
              >
                <Text style={styles.actionBtnText}>Connect</Text>
              </Pressable>
            </View>
          }
        />
      </View>
    );
  }

  if (uiPhase === "hosting" || uiPhase === "lobby") {
    const isHost = multiplayerGame.isHost();
    const canStart = gameState.players.length >= 2 && isHost;

    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleLeave}>
            <X size={24} color={accentColor} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {gameState.gameName}
          </Text>
        </View>

        <Text style={styles.waitingText}>
          {isHost ? "Waiting for players..." : "Connected to lobby"}
        </Text>

        <FlatList
          data={gameState.players}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 100)}
              style={[styles.playerCard, { backgroundColor: cardBg }]}
            >
              <View style={styles.playerAvatar}>
                <Text style={styles.playerInitial}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.playerName, { color: textColor }]}>
                {item.name} {item.isHost && "(Host)"}
              </Text>
              <Text style={styles.playerScore}>{item.score} pts</Text>
            </Animated.View>
          )}
        />

        {isHost && (
          <Pressable
            style={[
              styles.actionBtn,
              { backgroundColor: canStart ? "#4caf50" : "#888" },
            ]}
            onPress={canStart ? handleStart : undefined}
          >
            <Text style={styles.actionBtnText}>
              {canStart ? "Start Game" : "Need 2+ players"}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (gameState.phase === "playing" || gameState.phase === "question_review") {
    const currentQuestion = gameState.question;

    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.gameHeader}>
          <Text style={[styles.gameTimer, { color: textColor }]}>
            {gameState.timeLeft}s
          </Text>
          <Text style={[styles.gameProgress, { color: textColor }]}>
            Q{gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}
          </Text>
        </View>

        <View style={styles.scoreboard}>
          <FlatList
            horizontal
            data={gameState.players}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.scoreEntry}>
                <Text style={styles.scoreName}>{item.name}</Text>
                <Text style={[styles.scoreValue, { color: accentColor }]}>
                  {item.score}
                </Text>
              </View>
            )}
          />
        </View>

        {currentQuestion && (
          <View style={styles.questionSection}>
            {currentQuestion.type === "flag" ? (
              <>
                <Text style={[styles.questionText, { color: textColor }]}>
                  Which country does this flag belong to?
                </Text>
                <Image
                  source={{ uri: currentQuestion.country.flag }}
                  style={styles.quizLargeFlag}
                  resizeMode="contain"
                />
              </>
            ) : (
              <>
                <Text style={[styles.questionText, { color: textColor }]}>
                  What is the capital of this country?
                </Text>
                <Text style={[styles.questionCountry, { color: accentColor }]}>
                  {currentQuestion.country.name}
                </Text>
              </>
            )}

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, idx) => (
                <Pressable
                  key={idx}
                  style={[styles.optionBtn, { backgroundColor: cardBg }]}
                  onPress={() => handleAnswer(option)}
                >
                  <Text style={[styles.optionText, { color: textColor }]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {gameState.phase === "question_review" && gameState.questionResults && (
          <View style={styles.reviewBanner}>
            <Text style={styles.reviewText}>
              Correct: {gameState.question?.correctAnswer}
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (gameState.phase === "finished") {
    const winner = gameState.players.reduce(
      (best, p) => (p.score > best.score ? p : best),
      gameState.players[0]
    );

    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.centerContent}>
          <Users size={64} color={accentColor} />
          <Text style={[styles.title, { color: textColor }]}>Game Over</Text>
          <Text style={[styles.winnerText, { color: "#4caf50" }]}>
            Winner: {winner.name} ({winner.score} pts)
          </Text>

          <FlatList
            data={gameState.players.sort((a, b) => b.score - a.score)}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={styles.finalScoreRow}>
                <Text style={[styles.rank, { color: textColor }]}>#{index + 1}</Text>
                <Text style={[styles.finalName, { color: textColor }]}>
                  {item.name}
                </Text>
                <Text style={[styles.finalScore, { color: accentColor }]}>
                  {item.score}
                </Text>
              </View>
            )}
          />

          <Pressable
            style={[styles.actionBtn, { backgroundColor: accentColor }]}
            onPress={handleLeave}
          >
            <Text style={styles.actionBtnText}>Back to Menu</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  heroSection: { alignItems: "center", marginTop: 60, gap: 12 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 16, color: "#888" },
  formSection: { marginTop: 40, gap: 16 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  input: { padding: 14, borderRadius: 10, fontSize: 16 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  scanningText: { fontSize: 16, color: "#888", marginBottom: 20, textAlign: "center" },
  gameCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  gameInfo: { flex: 1 },
  gameName: { fontSize: 16, fontWeight: "600" },
  gameMeta: { fontSize: 12, color: "#888" },
  emptyState: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 14, textAlign: "center" },
  waitingText: { fontSize: 16, color: "#888", marginBottom: 20, textAlign: "center" },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1e88e5",
    alignItems: "center",
    justifyContent: "center",
  },
  playerInitial: { color: "#fff", fontSize: 18, fontWeight: "700" },
  playerName: { flex: 1, fontSize: 16, fontWeight: "600" },
  playerScore: { fontSize: 14, color: "#888" },
  gameHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  gameTimer: { fontSize: 24, fontWeight: "700" },
  gameProgress: {
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreboard: { marginBottom: 20 },
  scoreEntry: { alignItems: "center", marginRight: 20 },
  scoreName: { fontSize: 12, color: "#888" },
  scoreValue: { fontSize: 18, fontWeight: "700" },
  questionSection: { flex: 1, alignItems: "center" },
  questionText: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 20 },
  questionCountry: { fontSize: 24, fontWeight: "800", marginBottom: 20 },
  quizLargeFlag: { width: 220, height: 140, borderRadius: 12, marginBottom: 20 },
  optionsContainer: { width: "100%", gap: 12 },
  optionBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  optionText: { fontSize: 16, fontWeight: "600" },
  reviewBanner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(76,175,80,0.9)",
    padding: 16,
    alignItems: "center",
  },
  reviewText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  errorTitle: { fontSize: 20, fontWeight: "700" },
  errorText: { fontSize: 14, color: "#888", textAlign: "center" },
  errorSubtext: { fontSize: 12, color: "#666", textAlign: "center", marginTop: 8 },
  winnerText: { fontSize: 22, fontWeight: "700", marginVertical: 20 },
  finalScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  rank: { fontSize: 16, fontWeight: "600", width: 40 },
  finalName: { flex: 1, fontSize: 16 },
  finalScore: { fontSize: 16, fontWeight: "700" },
});