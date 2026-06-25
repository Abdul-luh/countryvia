import { EventEmitter } from "events";

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isConnected: boolean;
}

export interface QuizQuestion {
  type: "flag" | "capital";
  country: {
    name: string;
    capital: string;
    code: string;
    flag: string;
  };
  options: string[];
  correctAnswer: string;
}

export interface GameState {
  phase: "idle" | "hosting" | "discovering" | "lobby" | "playing" | "question_review" | "finished";
  players: Player[];
  hostId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  question?: QuizQuestion;
  timeLeft: number;
  questionResults?: Array<{
    correctAnswer: string;
    playerResults: Array<{ playerId: string; correct: boolean; timeSpent: number }>;
  }>;
  gameName: string;
  localPlayerId: string;
  discoveredGames: Array<{ gameName: string; hostName: string; hostIp: string; hostPort: number }>;
}

export type GameMessage =
  | { type: "DISCOVER"; gameName: string; hostName: string; playerCount: number; hostIp: string; hostPort: number }
  | { type: "JOIN_REQUEST"; playerName: string; playerId: string }
  | { type: "JOIN_ACCEPTED"; playerId: string; gameName: string; players: Player[]; hostId: string }
  | { type: "PLAYER_JOINED"; player: Player }
  | { type: "PLAYER_LEFT"; playerId: string }
  | { type: "START_GAME"; questionCount: number }
  | { type: "NEW_QUESTION"; question: QuizQuestion; questionIndex: number; timeLimit: number }
  | { type: "ANSWER"; questionIndex: number; answer: string; playerId: string; timeSpent: number }
  | { type: "QUESTION_RESULT"; questionIndex: number; correctAnswer: string; playerResults: Array<{ playerId: string; correct: boolean; timeSpent: number }> }
  | { type: "SCORE_UPDATE"; players: Player[] }
  | { type: "GAME_OVER"; players: Player[] };

const DISCOVERY_PORT = 50001;
const GAME_PORT = 50000;
const DISCOVERY_INTERVAL = 2000;
const MESSAGE_PREFIX = "COUNTRIVIA:";
const QUESTION_TIME_LIMIT = 15;

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function encodeMessage(msg: GameMessage): string {
  return MESSAGE_PREFIX + JSON.stringify(msg);
}

function decodeMessage(data: string): GameMessage | null {
  if (!data.startsWith(MESSAGE_PREFIX)) return null;
  try {
    return JSON.parse(data.substring(MESSAGE_PREFIX.length));
  } catch {
    return null;
  }
}

class LocalWifiTransport extends EventEmitter {
  socket: any = null;
  isHost = false;
  localPlayerId: string = generateId();
  localPlayerName = "";
  hostAddress: { ip: string; port: number } | null = null;
  knownPeers: Map<string, { ip: string; port: number }> = new Map();
  private discoveryInterval: any = null;
  private _initialized = false;

  async ensureInitialized() {
    if (this._initialized) return;
    try {
      const udp = require("react-native-udp");
      if (!udp || !udp.createSocket) {
        throw new Error("Module not available");
      }
      this.socket = udp.createSocket({ type: "udp4", reuseAddr: true });

      this.socket.on("message", (msg: Buffer, rinfo: any) => {
        const decoded = decodeMessage(msg.toString());
        if (decoded) {
          this.emit("message", decoded, rinfo);
        }
      });

      this.socket.on("error", (err: Error) => {
        this.emit("error", err);
      });

      this._initialized = true;
    } catch (e) {
      console.error("UDP library not available. Build a dev client with react-native-udp.", e);
      throw new Error("MULTIPLAYER_NOT_AVAILABLE");
    }
  }

  async bind(port: number): Promise<void> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.socket.bind(port, () => {
        this.socket.setBroadcast(true);
        resolve();
      }).on("error", reject);
    });
  }

  async send(msg: GameMessage, targetIp: string, targetPort: number) {
    if (!this.socket) return;
    const data = encodeMessage(msg);
    this.socket.send(data, 0, data.length, targetPort, targetIp, (err: Error) => {
      if (err) this.emit("error", err);
    });
  }

  async broadcast(msg: GameMessage, port: number = DISCOVERY_PORT) {
    if (!this.socket) return;
    const data = encodeMessage(msg);
    this.socket.send(data, 0, data.length, port, "255.255.255.255", (err: Error) => {
      if (err) this.emit("error", err);
    });
  }

  startDiscovery(gameName: string, hostName: string) {
    this.isHost = true;
    this.localPlayerName = hostName;
    this.discoveryInterval = setInterval(() => {
      this.broadcast({
        type: "DISCOVER",
        gameName,
        hostName,
        playerCount: this.knownPeers.size,
        hostIp: "",
        hostPort: GAME_PORT,
      });
    }, DISCOVERY_INTERVAL);
  }

  stopDiscovery() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
  }

  sendJoinRequest(hostIp: string, playerName: string) {
    this.localPlayerName = playerName;
    this.hostAddress = { ip: hostIp, port: GAME_PORT };
    this.send(
      {
        type: "JOIN_REQUEST",
        playerName,
        playerId: this.localPlayerId,
      },
      hostIp,
      GAME_PORT
    );
  }

  cleanup() {
    this.stopDiscovery();
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this._initialized = false;
    this.removeAllListeners();
  }
}

export class MultiplayerGame extends EventEmitter {
  transport: LocalWifiTransport;
  state: GameState = {
    phase: "idle",
    players: [],
    hostId: "",
    currentQuestionIndex: 0,
    totalQuestions: 0,
    timeLeft: QUESTION_TIME_LIMIT,
    gameName: "",
    localPlayerId: "",
    discoveredGames: [],
  };
  private questionTimer: any = null;
  private questions: QuizQuestion[] = [];
  private currentAnswers: Record<string, { answer: string; timeSpent: number }> = {};
  private timeLimit = QUESTION_TIME_LIMIT;

  constructor() {
    super();
    this.transport = new LocalWifiTransport();
    this.transport.on("message", this.handleMessage.bind(this));
    this.transport.on("error", (err: Error) => {
      if (err.message === "MULTIPLAYER_NOT_AVAILABLE") {
        this.emit("unavailable", "Multiplayer requires a development build with react-native-udp. Please build via EAS dev client.");
      } else {
        console.error("Transport error:", err);
      }
    });
  }

  async initialize() {
    await this.transport.ensureInitialized();
    this.state = {
      phase: "idle",
      players: [],
      hostId: "",
      currentQuestionIndex: 0,
      totalQuestions: 0,
      timeLeft: this.timeLimit,
      gameName: "",
      localPlayerId: this.transport.localPlayerId,
      discoveredGames: [],
    };
    this.emit("stateChanged", this.state);
  }

  async hostGame(playerName: string, gameName: string): Promise<void> {
    await this.transport.bind(GAME_PORT);
    await this.transport.bind(DISCOVERY_PORT);

    const me: Player = {
      id: this.transport.localPlayerId,
      name: playerName,
      score: 0,
      isHost: true,
      isConnected: true,
    };

    this.state = {
      phase: "hosting",
      players: [me],
      hostId: this.transport.localPlayerId,
      currentQuestionIndex: 0,
      totalQuestions: 0,
      timeLeft: this.timeLimit,
      gameName,
      localPlayerId: this.transport.localPlayerId,
      discoveredGames: [],
    };
    this.emit("stateChanged", this.state);
    this.transport.startDiscovery(gameName, playerName);
  }

  async joinGame(hostIp: string, playerName: string): Promise<void> {
    try {
      await this.transport.bind(GAME_PORT);
      this.state = {
        phase: "discovering",
        players: [],
        hostId: "",
        currentQuestionIndex: 0,
        totalQuestions: 0,
        timeLeft: this.timeLimit,
        gameName: "",
        localPlayerId: this.transport.localPlayerId,
        discoveredGames: [],
      };
      this.emit("stateChanged", this.state);
      this.transport.sendJoinRequest(hostIp, playerName);
    } catch (e) {
      console.error("Failed to join game:", e);
    }
  }

  startGame(questions: QuizQuestion[]) {
    if (this.state.hostId !== this.transport.localPlayerId) return;
    this.questions = questions;
    this.state.players.forEach((p) => {
      p.score = 0;
      p.isConnected = true;
    });
    this.transport.stopDiscovery();
    this.transport.broadcast({
      type: "START_GAME",
      questionCount: questions.length,
    });
    this.state.phase = "playing";
    this.state.totalQuestions = questions.length;
    this.state.currentQuestionIndex = 0;
    this.state.questionResults = [];
    this.emit("stateChanged", this.state);
    this.sendNextQuestion();
  }

  private async sendNextQuestion() {
    if (this.state.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    const question = this.questions[this.state.currentQuestionIndex];
    this.currentAnswers = {};
    this.state.question = question;
    this.state.timeLeft = this.timeLimit;
    this.emit("stateChanged", this.state);

    this.transport.broadcast({
      type: "NEW_QUESTION",
      question,
      questionIndex: this.state.currentQuestionIndex,
      timeLimit: this.timeLimit,
    });
  }

  submitAnswer(answer: string) {
    if (!this.transport.isHost && this.transport.hostAddress) {
      this.transport.send(
        {
          type: "ANSWER",
          questionIndex: this.state.currentQuestionIndex,
          answer,
          playerId: this.transport.localPlayerId,
          timeSpent: this.timeLimit - this.state.timeLeft,
        },
        this.transport.hostAddress.ip,
        GAME_PORT
      );
    }
  }

  private handleMessage(msg: GameMessage, rinfo: any) {
    switch (msg.type) {
      case "DISCOVER":
        if (!this.transport.isHost && msg.hostIp) {
          const exists = this.state.discoveredGames.find((g) => g.hostIp === msg.hostIp && g.hostPort === msg.hostPort);
          if (!exists) {
            this.state.discoveredGames.push({
              gameName: msg.gameName,
              hostName: msg.hostName,
              hostIp: msg.hostIp,
              hostPort: msg.hostPort,
            });
            this.emit("stateChanged", this.state);
          }
        }
        break;
      case "JOIN_REQUEST":
        this.handleJoinRequest(msg, rinfo);
        break;
      case "JOIN_ACCEPTED":
        this.handleJoinAccepted(msg);
        break;
      case "PLAYER_JOINED":
        this.handlePlayerJoined(msg);
        break;
      case "PLAYER_LEFT":
        this.handlePlayerLeft(msg);
        break;
      case "START_GAME":
        this.handleStartGame();
        break;
      case "NEW_QUESTION":
        this.handleNewQuestion(msg);
        break;
      case "ANSWER":
        this.handleIncomingAnswer(msg);
        break;
      case "QUESTION_RESULT":
        this.handleQuestionResult(msg);
        break;
      case "SCORE_UPDATE":
        this.handleScoreUpdate(msg);
        break;
      case "GAME_OVER":
        this.handleGameOver(msg);
        break;
    }
  }

  private handleJoinRequest(msg: { playerName: string; playerId: string }, rinfo: any) {
    if (!this.transport.isHost || this.state.phase !== "hosting") return;

    const newPlayer: Player = {
      id: msg.playerId,
      name: msg.playerName,
      score: 0,
      isHost: false,
      isConnected: true,
    };

    this.transport.knownPeers.set(msg.playerId, { ip: rinfo.address, port: rinfo.port });
    this.state.players.push(newPlayer);

    this.transport.send(
      {
        type: "JOIN_ACCEPTED",
        playerId: this.transport.localPlayerId,
        gameName: this.state.gameName,
        players: this.state.players,
        hostId: this.state.hostId,
      },
      rinfo.address,
      rinfo.port
    );

    this.broadcastToAll({ type: "PLAYER_JOINED", player: newPlayer });
    this.emit("stateChanged", this.state);
  }

  private handleJoinAccepted(msg: { players: Player[]; hostId: string }) {
    this.state.players = msg.players;
    this.state.hostId = msg.hostId;
    this.state.phase = "lobby";
    this.emit("stateChanged", this.state);
  }

  private handlePlayerJoined(msg: { player: Player }) {
    if (["lobby", "discovering"].includes(this.state.phase)) {
      const exists = this.state.players.find((p) => p.id === msg.player.id);
      if (!exists) {
        this.state.players.push(msg.player);
        this.emit("stateChanged", this.state);
      }
    }
  }

  private handlePlayerLeft(msg: { playerId: string }) {
    this.state.players = this.state.players.filter((p) => p.id !== msg.playerId);
    this.emit("stateChanged", this.state);
  }

  private handleStartGame() {
    this.state.phase = "playing";
    this.emit("stateChanged", this.state);
  }

  private handleNewQuestion(msg: { question: QuizQuestion; questionIndex: number; timeLimit: number }) {
    this.state.question = msg.question;
    this.state.currentQuestionIndex = msg.questionIndex;
    this.state.timeLeft = msg.timeLimit;
    this.state.questionResults = [];
    this.currentAnswers = {};
    this.emit("stateChanged", this.state);

    if (this.questionTimer) clearInterval(this.questionTimer);
    this.questionTimer = setInterval(() => {
      this.state.timeLeft -= 1;
      this.emit("stateChanged", this.state);
    }, 1000);
  }

  private handleIncomingAnswer(msg: { playerId: string; answer: string; timeSpent: number }) {
    if (this.transport.isHost) {
      this.currentAnswers[msg.playerId] = {
        answer: msg.answer,
        timeSpent: msg.timeSpent,
      };

      const expectedPlayers = this.state.players.filter((p) => !p.isHost);
      if (Object.keys(this.currentAnswers).length >= expectedPlayers.length) {
        this.handleQuestionComplete();
      }
    }
  }

  private handleQuestionComplete() {
    if (this.questionTimer) clearInterval(this.questionTimer);
    const question = this.state.question!;
    const results: Array<{ playerId: string; correct: boolean; timeSpent: number }> = [];

    for (const [playerId, answerData] of Object.entries(this.currentAnswers)) {
      const correct = answerData.answer === question.correctAnswer;
      results.push({
        playerId,
        correct,
        timeSpent: answerData.timeSpent,
      });

      const player = this.state.players.find((p) => p.id === playerId);
      if (player && correct) {
        player.score += Math.max(1, Math.round(10 - answerData.timeSpent));
      }
    }

    this.state.questionResults = [{
      correctAnswer: question.correctAnswer,
      playerResults: results,
    }];
    this.state.timeLeft = 0;
    this.emit("stateChanged", this.state);

    this.transport.broadcast({
      type: "QUESTION_RESULT",
      questionIndex: this.state.currentQuestionIndex,
      correctAnswer: question.correctAnswer,
      playerResults: results,
    });

    setTimeout(() => {
      this.transport.broadcast({
        type: "SCORE_UPDATE",
        players: this.state.players,
      });
    }, 1500);

    this.state.phase = "question_review";

    setTimeout(() => {
      this.state.questionResults = undefined;
      this.state.currentQuestionIndex += 1;
      this.emit("stateChanged", this.state);
      this.sendNextQuestion();
    }, 3500);
  }

  private handleQuestionResult(msg: { correctAnswer: string; playerResults: Array<{ playerId: string; correct: boolean; timeSpent: number }> }) {
    this.state.questionResults = [{
      correctAnswer: msg.correctAnswer,
      playerResults: msg.playerResults,
    }];
    const myResult = msg.playerResults.find((r) => r.playerId === this.transport.localPlayerId);
    if (myResult && myResult.correct) {
      const me = this.state.players.find((p) => p.id === this.transport.localPlayerId);
      if (me) {
        me.score += Math.max(1, Math.round(10 - myResult.timeSpent));
      }
    }
    this.emit("stateChanged", this.state);
  }

  private handleScoreUpdate(msg: { players: Player[] }) {
    this.state.players = msg.players;
    this.emit("stateChanged", this.state);
  }

  private handleGameOver(msg: { players: Player[] }) {
    this.state.players = msg.players;
    this.state.phase = "finished";
    this.stopTimer();
    this.emit("stateChanged", this.state);
    this.cleanup();
  }

  private endGame() {
    this.stopTimer();
    const winner = this.state.players.reduce((best, p) => (p.score > best.score ? p : best), this.state.players[0]);
    this.transport.broadcast({
      type: "GAME_OVER",
      players: this.state.players,
    });
    this.state.phase = "finished";
    this.emit("stateChanged", this.state);
    this.cleanup();
  }

private stopTimer() {
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }
  }

  private cleanup() {
    this.stopTimer();
    this.transport.stopDiscovery();
  }

  private broadcastToAll(msg: GameMessage, excludePlayerId?: string) {
    for (const [peerId, addr] of this.transport.knownPeers) {
      if (peerId !== excludePlayerId) {
        this.transport.send(msg, addr.ip, addr.port);
      }
    }
  }

  isHost(): boolean {
    return this.transport.isHost && this.state.hostId === this.transport.localPlayerId;
  }

  leave() {
    this.transport.broadcast({
      type: "PLAYER_LEFT",
      playerId: this.transport.localPlayerId,
    });
    this.cleanup();
    this.state = {
      phase: "idle",
      players: [],
      hostId: "",
      currentQuestionIndex: 0,
      totalQuestions: 0,
      timeLeft: this.timeLimit,
      gameName: "",
      localPlayerId: this.transport.localPlayerId,
      discoveredGames: [],
    };
    this.transport.cleanup();
    this.emit("stateChanged", this.state);
  }
}

export const multiplayerGame = new MultiplayerGame();