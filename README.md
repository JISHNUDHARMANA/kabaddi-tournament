# Kabaddi Pro Scoreboard & Match Tracker ⚡

A broadcast-grade, interactive web application designed for scoring professional Kabaddi matches, tracking individual player points, determining raid vs. defending (tackle) points, and tracking exactly **who has to go out of the court** into the bench and **who revives first** (strict FIFO revival queue).

Supports **single-person official scoring** while allowing **unlimited spectators (audience, coaches, parents, big screens)** to watch live in real-time with zero risk of tampering.

---

## 🌟 Major Highlights & New Features

### 1. 👑 Single-Person Operator & 👁️ Spectator Watch Mode
> **"Done by only one person, others should only watch it"**
- **Official Scorer Mode (Admin)**:
  - Protected with a 4-digit PIN (Default: **`1234`**).
  - Only the authenticated scorekeeper can score points, control timers, edit clocks, swap substitutes, rename teams, undo actions, or save/reset matches.
  - Interactive numeric keypad for fast touch typing on mobile devices.
  - One-tap "🔒 Lock" or "👁️ Switch to Watch Mode" to prevent accidental touches.
- **Spectator / Audience Mode (Read-Only Live Broadcast)**:
  - Default view for anyone opening the app or scanning the spectator QR code (`?role=viewer`).
  - **All scoring buttons, timer toggles, rename icons, clock edit pencils, player swap buttons, undo, and resets are completely hidden and locked.**
  - Features the **Spectator Live Match Center Card**:
    - **Raider Spotlight**: Current raider jersey avatar, player name, team, and match raid points.
    - **Defending Wall**: On-court defender census, defending team banner, and live **Super Tackle (2 Pts)** indicator.
    - **Live Situation**: Real-time raid clock, match half, and unrewarded raid counter.
  - **Real-Time Cross-Device Synchronization**:
    - Powered by `server.py` on port `8081`.
    - Every score, timer tick, player swap, or team rename updates all connected spectators' screens instantly in real-time!
    - Also includes browser `BroadcastChannel` for 0ms multi-tab sync on the same computer.

---

### 2. ⏱️ User-Editable Match & Raid Clocks
- **Match Clock**:
  - Click the **✏️** icon or click the match clock digits directly.
  - Set custom **Minutes and Seconds** (MM:SS).
  - Quick presets: **20 Mins** (Pro PKL Half), **15 Mins**, **10 Mins**, **5 Mins**.
  - Fine-tuning buttons: **+1 Min**, **-1 Min**, **+30s**, **-30s**.
- **30-Second Raid Clock**:
  - Click the **✏️** icon on the raid timer.
  - Adjust countdown seconds (e.g. 30s, 20s, 15s).
  - Quick presets: **30s (PKL Standard)**, **20s (Fast Play)**, **15s (Endgame)**.
  - Fine-tuning buttons: **+5s**, **-5s**.

---

### 3. 🔄 Substitute Players & In-Match Player Swaps
- **Up to 5 Substitutes per team**:
  - Visible on dedicated substitute benches alongside the court halves.
- **In-Match Player Swap Dialog**:
  - Click **"🔄 Swap Player"** on Team A or Team B's bench.
  - Step 1: Select which active on-court player exits the court.
  - Step 2: Select which substitute enters the court.
  - Click **"Confirm Player Swap"**:
    - Seamlessly swaps court positions and bench rosters without disrupting the FIFO Out-Bench revival queue.
    - Logs the substitution in the live match event feed.

---

### 4. ✏️ Match-by-Match Team Renaming
- Quick rename buttons (**✏️**) right next to Team A and Team B's names on the scoreboard banner.
- Change team names match-by-match on the fly without resetting points or rosters.
- Automatically updates across headers, banners, scoring desk, live feed, scorecard, and archive summaries.

---

### 5. 💾 Stored Match Summaries & Archive Browser
- **Save & End Match**:
  - Click **"💾 Save Match"** in the top header.
  - Enter Tournament Title and match notes (e.g., "Final, Court 1").
  - Shows preview with final scores, winner, and margin of victory.
- **Match Archives Modal**:
  - Click **"📁 Archives"** to browse all past matches.
  - Each stored match card displays:
    - Match title & timestamp
    - Winning team badge & margin of victory
    - Final score comparison
    - Top Raider (name, jersey, raid + bonus points)
    - Top Defender (name, jersey, tackle points)
    - **"View Full Scorecard"** button to inspect the complete match report.
  - Persistent across page reloads via both `localStorage` and server `data/match_history.json`.
  - Includes **"📥 Export All (JSON)"** and clear archive controls.

---

### 6. 🏟️ Court & Out Bench Revival Engine (FIFO)
- **Live 7-Player Court**: Shows active players on court for each team with jersey numbers, player role (Raider, Defender, All-Rounder), and accumulated points.
- **Out Bench (Sitting Block) Queue**: Declaring a player OUT moves them to the sitting block.
- **Revival Engine (First In, First Out)**: The player who has been out the longest is highlighted with a green **`NEXT REVIVAL`** badge. When touch points or tackles are scored, players automatically return to court in exact FIFO order!
- **Super Tackle Detection**: Defending with <= 3 players awards **2 points**.
- **All-Out (Lona)**: Grants **+2 Bonus Points** and immediately revives all 7 players.

---

## 📱 How to Connect on Mobile & Spectator Screens

### 👑 Official Scorer Access (One Person Only)
1. On your phone or laptop, open:
   ```
   http://10.126.219.251:8081/?role=scorer
   ```
2. Enter the Scorer PIN: **`1234`**.
3. You now have full official control of scoring, clocks, substitutions, and team names.

### 👁️ Audience / Spectator Watch Link (Public)
1. Share this link or show the QR code on a big screen or projector:
   ```
   http://10.126.219.251:8081/?role=viewer
   ```
2. Anyone scanning this QR code enters **Spectator Mode** where scores, court visualizer, commentary, and clocks update live in real-time with all controls securely locked.

---

## ⌨️ Keyboard Shortcuts (Scorer Mode)

| Key | Action |
|-----|--------|
| `Space` | Start / Pause 30-second Raid Clock |
| `R` | Reset 30-second Raid Clock |
| `U` | Undo last scoring action |
| `Esc` | Close any open modal |

---

## 🚀 Running the Server Locally

The project includes an ultra-fast Python synchronization server with zero external dependencies:
```bash
python server.py
```
- Local access: `http://localhost:8081`
- Network access: `http://10.126.219.251:8081`
