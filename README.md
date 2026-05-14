CodeCombat Arena ⚔️

AI-powered competitive coding platform with tournaments, virtual economy, AI referee, and LeetCode-style coding arena.

🚀 Overview

CodeCombat Arena is a full-stack competitive programming platform where users can:

Compete in AI-powered coding battles
Join tournaments and ranked matches
Earn virtual coins and rewards
Get AI-based code reviews
Solve dynamically generated DSA problems
Practice in a LeetCode-style coding environment

The platform combines:

Competitive coding
Gamification
AI evaluation
Tournament systems
Real-time ranking mechanics
✨ Features
🔐 Authentication System
JWT Authentication
Secure Login/Register
Protected Routes
Persistent Sessions
🏆 Rank System

Ranks update automatically based on wins.

Rank	Wins Required
Bronze	0–4
Silver	5–14
Gold	15+
💰 Virtual Coin Economy

Users earn and spend coins inside the platform.

Economy Rules
Signup Bonus → +100 Coins
Join Match → -20 Coins
Match Win → +30 Coins
Match Loss → -10 Coins
Daily Bonus → +10 Coins
Includes
Wallet System
Transaction Ledger
Coin History Tracking
⚔️ Match System
1v1 asynchronous coding battles
Match submissions
AI-powered judging
Winner determination
Rank progression
🤖 AI Referee

The AI analyzes:

Code readability
Naming conventions
Maintainability
Logic structure
AI Verdict Includes
Winner
Code quality score
Improvement suggestions
AI explanation
🏟 Tournament System
Join tournaments using coins
Difficulty-based contests
Live countdown timers
Leaderboards
Reward distribution
Tournament Features
Easy / Medium / Hard contests
Participant tracking
Prize rewards
AI-generated problem sets
🧠 AI Tournament Generator

Users can create custom tournaments.

The AI automatically:

Generates DSA problems
Sets constraints
Creates examples
Assigns timers based on difficulty
Timer Rules
Difficulty	Timer
Easy	10 Minutes
Medium	20 Minutes
Hard	40 Minutes
💻 Coding Arena

LeetCode-style coding interface with:

Problem statements
Constraints
Timer countdown
Code editor
Multi-problem navigation
Submission system
🛠 Tech Stack
Frontend
React (Vite)
TailwindCSS
React Router
Axios
Backend
Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
AI Integration
LLM-based AI Referee
AI Problem Generator
📂 Project Structure
codecombat-arena/
│
├── client/               # Frontend
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   └── services/
│
├── server/               # Backend
│   ├── src/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   └── utils/
│
└── README.md
⚙️ Installation
1️⃣ Clone Repository
git clone https://github.com/your-username/codecombat-arena.git
cd codecombat-arena
2️⃣ Install Dependencies
Frontend
cd client
npm install
Backend
cd server
npm install
3️⃣ Environment Variables

Create .env inside server/

PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
AI_API_KEY=your_ai_key
4️⃣ Run Application
Backend
cd server
npm run dev
Frontend
cd client
npm run dev
📸 Screenshots
Dashboard
Rank progression
Coin wallet
Match stats
Daily rewards
Tournament Arena
Tournament cards
Live contests
Leaderboards
AI-generated challenges
AI Verdict System
Winner analysis
Suggestions
Scoring
🔥 Future Improvements
Real code execution engine (Judge0)
Real-time multiplayer battles
WebSocket live leaderboards
Friend system
Team tournaments
Contest replays
AI interview simulator
🧪 Core Concepts Implemented
Authentication & Authorization
REST APIs
AI Integration
Virtual Economy
Tournament Management
State Management
Role-based Logic
Dynamic Timers
Full-stack Architecture
👨‍💻 Author

Shivam Kumar

Built for elite coders and competitive programmers ⚡
