# Pro Kabaddi Championship Tournament Platform ⚡

A broadcast-grade, interactive web platform and live scoreboard system designed for professional Kabaddi tournaments. Features real-time touch & tackle tracking, FIFO player revivals, out benches, custom fixtures, points tables, team squads, single-person referee control, and tamper-proof spectator live broadcast.

---

## 🔗 Official Access Links (Live & Local)

### 1. 👑 Official Scorer Access Link (Referee & Operator Console)
Use this link if you are the **authorized match referee or tournament scorer**. This grants full control over match clocks, 30s raid timers, scoring touch/bonus/tackle points, managing FIFO player revivals, substitutions, loading fixtures, editing squads, and archiving completed matches.

- 🌐 **Live Cloud Scorer Link**:  
  **[https://kabaddi-championship-tournament.vercel.app/?role=scorer](https://kabaddi-championship-tournament.vercel.app/?role=scorer)**
- 💻 **Local Server Scorer Link**:  
  **[http://localhost:8081/?role=scorer](http://localhost:8081/?role=scorer)**
- 🔑 **Default Login Credentials**:
  - **Scorer ID / Username**: `admin`
  - **Password / PIN**: `1234`
  *(You can customize the Scorer ID and Password anytime from the header **Set ID/Pass** button or the **Scorer Portal** tab)*.

---

### 2. 👁️ Public Audience & Spectator Link (Watch-Only Live Broadcast)
Share this link with **tournament spectators, audience members, team managers, players, or big-screen LED walls / projectors**. It is completely tamper-proof and locks all scoring controls so audience members cannot accidentally or intentionally alter match scores.

- 🌐 **Live Cloud Spectator Link**:  
  **[https://kabaddi-championship-tournament.vercel.app/?role=viewer](https://kabaddi-championship-tournament.vercel.app/?role=viewer)**
- 💻 **Local Server Spectator Link**:  
  **[http://localhost:8081/?role=viewer](http://localhost:8081/?role=viewer)**
- 🔒 **Permissions**:  
  - Live animated scoreboard, team scores, and 20-min match clock.
  - 30-second raid clock countdown and live raid commentary.
  - Active 7-player court visualization and out-bench FIFO revival queue.
  - Match schedule, tournament fixtures, and league points table.
  - All scoring buttons and timer controls are automatically hidden or locked.

---

### 3. 🎯 Direct Navigation Tabs (All 7 Platform Views)
You can navigate directly to any section of the tournament platform using the links below:

| Tab | Feature / Section | Direct Live URL |
|:---:|:------------------|:----------------|
| ⚡ | **Live Scoreboard Court** | [https://kabaddi-championship-tournament.vercel.app/?tab=live](https://kabaddi-championship-tournament.vercel.app/?tab=live) |
| 📅 | **Schedule & Fixtures** | [https://kabaddi-championship-tournament.vercel.app/?tab=fixtures](https://kabaddi-championship-tournament.vercel.app/?tab=fixtures) |
| 🏆 | **League Points Table** | [https://kabaddi-championship-tournament.vercel.app/?tab=standings](https://kabaddi-championship-tournament.vercel.app/?tab=standings) |
| 👥 | **Teams & Squad Rosters** | [https://kabaddi-championship-tournament.vercel.app/?tab=teams](https://kabaddi-championship-tournament.vercel.app/?tab=teams) |
| 📁 | **Match Archives & History** | [https://kabaddi-championship-tournament.vercel.app/?tab=archives](https://kabaddi-championship-tournament.vercel.app/?tab=archives) |
| 👑 | **Scorer & Operator Portal** | [https://kabaddi-championship-tournament.vercel.app/?tab=portal](https://kabaddi-championship-tournament.vercel.app/?tab=portal) |
| 📖 | **Rules & User Guide (Readme)**| [https://kabaddi-championship-tournament.vercel.app/?tab=guide](https://kabaddi-championship-tournament.vercel.app/?tab=guide) |

---

## 🌟 Platform Features Overview

### 1. ⚡ Live Match Scoreboard (`#view_live`)
- **Single-Person Official Scoring**: Designed for a solo referee to manage high-speed Kabaddi matches without latency.
- **Raid & Defending Actions**: Log touch points, bonus points, tackles, super tackles, and super raids.
- **Strict FIFO Revival Queue**: Compliant with official Pro Kabaddi rules. Players revive in the exact order they were declared out.
- **User-Editable Clocks**:
  - **Match Clock**: 20-minute halves with quick presets (20m, 15m, 10m, 5m) or manual minute/second input.
  - **Raid Clock**: 30-second raid timer with quick presets (30s, 20s, 15s) and manual adjust.
- **Instant Rollback / Undo**: Full undo stack (`↩ Undo` button or `U` key) for correcting any accidental referee input.

---

### 2. 📅 Tournament Schedule & Fixtures (`#view_fixtures`) — *User Editable*
- **Match Timetable**: Filter by All Matches, League Stage, Quarter Finals, Semi Finals, or Grand Finals.
- **➕ Add Match**: Schedule new fixtures on the fly (Match #, Stage, Teams, Date, Time, Court, Status, Scores).
- **✏️ Edit & 🗑️ Delete**: Update scores live, modify match timings, or remove matches.
- **▶ Load in Scoreboard**: Click any fixture to instantly load both teams into the live court!
- **🔄 Reset**: Restores default tournament schedule at any time.

---

### 3. 🏆 League Points Table & Standings (`#view_standings`) — *User Editable*
- **Rankings & Stats**: Matches Played (P), Won (W), Lost (L), Tied (T), Score Differential (Diff), Points (PTS), and Recent Form (W/L/T).
- **➕ Add Team Row**: Insert new franchises or teams directly into the points table.
- **✏️ Edit & 🗑️ Delete**: Modify any team's stats, form, or points on the fly.
- **⚡ Auto-Calculate**: One-click automatic calculation of all team rankings and points directly from completed fixtures:
  - **Win**: 5 Points
  - **Tie**: 3 Points
  - **Close Loss (&le; 7 pts)**: 1 Point
  - **Loss (> 7 pts)**: 0 Points
- **Top 4 Playoff Indicator**: Highlighted qualifying line for playoffs and finals.

---

### 4. 👥 Participating Teams & Squads (`#view_teams`) — *User Editable*
- **Team Profiles**: Team Name, City, Jersey Color, Captain, and Head Coach.
- **Squad Rosters**: 7-player starting court lineup and 3-player substitutes bench.
- **➕ Add New Team**: Create custom tournament teams with color picker and roster format (`Jersey, Name, Role`).
- **✏️ Edit Squad & 🗑️ Delete**: Modify players, captain, or coach with instant local and cloud persistence.
- **⚔️ Load as Team A / 🛡️ Load as Team B**: One-click action to load any team directly into the live scoreboard court.

---

### 5. 📁 Match Archives & Official Results (`#view_archives`)
- **Historical Matches**: Permanent store of completed matches with score progression.
- **Detailed Scorecard**: Final scores, margin of victory, Top Raider MVP, Top Defender, and full player breakdown.
- **Export & Backup**: One-click JSON export.

---

### 6. 👑 Scorer & Operator Portal (`#view_portal`)
- **Scorer ID & Password Settings**: Set custom username and password (Default: `admin` / `1234`).
- **Cloud & Offline Resilient**: Zero network errors on static cloud hosting (Vercel, GitHub Pages) with `localStorage` and serverless API sync.
- **Broadcast & Display Links**: One-click copy buttons for Audience Spectators (`/?role=viewer`) and Scorer Operators (`/?role=scorer`).
- **Stadium TV Guide**: Borderless full-screen display (`F11`) and OBS streaming guidelines.

---

### 7. 📖 Rules & User Manual (`#view_guide`)
- Dedicated in-app tab containing:
  - Official Pro Kabaddi scoring rules (Touch, Bonus, Tackle, Super Tackle, Super Raid, All-Out, Do-or-Die).
  - Referee console step-by-step instructions.
  - Tournament points system explanation.
  - Direct Scorer and Spectator access links with one-click copy buttons.
  - OBS Studio setup and keyboard shortcuts.

---

## 🔑 Official Scorer Credentials

| Role | Username / ID | Password / PIN | Permissions |
|------|---------------|----------------|-------------|
| **Official Scorer** | `admin` (or custom ID) | `1234` (or custom pass) | Full scoring controls, clocks, team edits, resets |
| **Spectator / Audience** | *None required* | *None required* | View-only live score, clocks, commentary, rosters |

*To change credentials, click the **Set ID/Pass** button in the header or visit the **Scorer Portal** tab.*

---

## ⌨️ Referee Keyboard Shortcuts

| Shortcut | Action |
|:--------:|:-------|
| <kbd>Space</kbd> | Start / Pause 30-second Raid Clock |
| <kbd>R</kbd> | Reset Raid Clock to 30s |
| <kbd>U</kbd> | Undo last scoring action |
| <kbd>Esc</kbd> | Close any open modal / dialog |

---

## 🚀 Running Locally & Development

### 1. Python Local Server
```bash
# Start server with live cross-device sync
python server.py
```
- Open `http://localhost:8081/?role=scorer` for the Referee Console.
- Open `http://localhost:8081/?role=viewer` for the Spectator / TV Display.
- Open `http://<your-local-ip>:8081` on mobile phones on the same Wi-Fi.

### 2. Deploying to Vercel
```bash
npx vercel --prod
```
The project includes serverless endpoints in the `api/` directory (`api/fixtures.js`, `api/standings.js`, `api/teams.js`, `api/update-credentials.js`, `api/verify-scorer.js`, `api/state.js`) for seamless deployment on Vercel.

---

## 📄 License
MIT License. Created for professional and amateur Kabaddi championships.
