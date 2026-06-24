# 🌍 CounTrivia

> **The fun way to learn the world!** — A geography trivia mobile app that challenges you to master country flags and capital cities through structured lessons, integrated quizzes, and a progressive level system.

---

## 📱 Features

### 🗺️ Dual Learning Tracks
- **Flags Track** — Learn and memorise world flags with large, high-visibility flag cards. Tap to reveal the country name and hear it pronounced aloud via TTS.
- **Capitals Track** — Learn capital cities in context. Each card shows the country name and flag, tap to reveal the capital, and hear it spoken.

### 📚 Lesson-First Flow
- Countries are grouped into levels of 10.
- Study a level's countries before starting the quiz — tapping **Next Level** always takes you to the next **lesson** first, not directly into a quiz.
- Speaker buttons on every card trigger real-time TTS pronunciation.

### 🧠 Integrated Quizzes
- Every level has a built-in 10-question multiple-choice quiz.
- **You must score 10/10 to pass** and unlock the next level.
- Per-question response time is tracked.
- After each answer, a feedback sheet slides up showing whether you were correct and pronounces the right answer.

### ⭐ 5-Star Grading System
Pass a level on your first attempt to earn 5 stars. Stars decrease with more attempts:

| Attempts | Stars |
|----------|-------|
| 1st | ⭐⭐⭐⭐⭐ |
| 2nd | ⭐⭐⭐⭐ |
| 3rd | ⭐⭐⭐ |
| 4th–5th | ⭐⭐ |
| 6th+ | ⭐ |

### 📊 Stats & Progress Dashboard
- **Flags Mastered** — Number of flags mastered (levels passed × 10).
- **Capitals Mastered** — Number of capitals mastered (levels passed × 10).
- **Accuracy** — Your overall correct answer percentage across all quizzes.
- **Streak** — Current and best daily streaks.
- **Level History** — Toggle between Flags/Capitals track and see detailed stats per level: attempts, best completion time, and stars earned.
- **Top Countries** — Combined mastery ranking of your best-learned countries.

### 🌗 Light & Dark Mode
- Full Light & Dark mode support controlled from the header bar.
- The app background, splash screen, and all navigation transitions follow your selected theme — no white flash on startup.

### 🔊 Sound & Accessibility
- Correct answer: high-pitched bell sound at full volume.
- Wrong answer: error sound at full volume.
- Audio session configured to play through silent mode on iOS and not duck other audio on Android.
- TTS pronounces country names and capitals using `expo-speech`.
- Sounds respect the mute toggle in the header bar.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) (React Native) |
| Navigation | [Expo Router](https://expo.github.io/router/) |
| State Management | [Zustand](https://zustand-demo.pmnd.rs/) with AsyncStorage persistence |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) |
| Icons | [Lucide React Native](https://lucide.dev) |
| Speech | [Expo Speech](https://docs.expo.dev/versions/latest/sdk/speech/) |
| Audio | [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Latest LTS recommended)
- npm or yarn
- Expo Go app on your mobile device (iOS or Android)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/countrivia.git
cd countrivia

# Install dependencies
npm install

# Start the development server
npx expo start
```

Then scan the QR code with **Expo Go** on your phone.

### Standalone Build (EAS)

Refer to `deployment_guide.md` for instructions on building standalone APK/IPA files using EAS Build.

---

## 📁 Project Structure

```
countrivia/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Tab bar configuration (3 tabs: Home, Learn, Stats)
│   │   ├── index.tsx         # Home screen with track entry points
│   │   ├── learn.tsx         # Lessons + Integrated quizzes (Flags & Capitals)
│   │   └── progress.tsx      # Stats & progress dashboard
│   ├── _layout.tsx           # Root layout with themed ThemeProvider
│   └── modal.tsx
├── assets/
│   ├── fonts/
│   ├── images/               # App icon & splash screen
│   └── sounds/               # Correct (bell ding) & wrong audio
├── components/
│   └── Header.tsx            # App header with logo, theme & sound toggles
├── data/
│   └── countries.json        # Country database (name, code, capital, flag URL)
├── stores/
│   └── progressStore.ts      # Zustand store — flags/capitals mastery, streaks, level stats
└── utils/
    ├── quizEngine.ts         # Quiz question generation logic (level-specific)
    └── soundUtils.ts         # Audio playback & TTS helpers
```

---

## 🎮 How to Play

1. Open the app and tap **Learn & Quiz Flags** or **Learn & Quiz Capitals** from the Home screen.
2. Select a level (Level 1 is always unlocked; subsequent levels unlock after passing the previous one).
3. Study the 10 countries in the lesson — tap cards to reveal answers and hear pronunciation.
4. Tap **Start Level Quiz** at the bottom when you're ready.
5. Answer all 10 questions. You need **10/10 to pass**.
6. Review your results, see your stars, and proceed to the **next lesson**.

---
download here: [https://expo.dev/accounts/abdullah_odulate/projects/countrivia/builds/e9460dd5-b9a0-4f87-9ed3-bd2624b518db](https://expo.dev/accounts/abdullah_odulate/projects/countrivia/builds/e9460dd5-b9a0-4f87-9ed3-bd2624b518db)

## 📜 Licence

MIT © Abdullah Odulate
