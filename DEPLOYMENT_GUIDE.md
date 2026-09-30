# 🏆 Pro Kabaddi Tournament — Complete Website & Deployment Guide

This guide explains how to deploy and operate the new **Tournament Website & Live Match Platform** for tomorrow's Kabaddi tournament.

---

## 🌟 What Was Built: Full Tournament Web Platform

The application has been transformed into a complete, professional multi-page Tournament Website:

1. **⚡ Live Scoreboard View (`#view_live`):**
   - Live interactive scoreboard, court mat visualizer, FIFO revival bench, 20-min match clock, 30s raid timer, official scorer desk, and spectator watch-only mode.
2. **📅 Fixtures & Schedule View (`#view_fixtures`):**
   - Complete tournament match schedule with timings (09:30 AM to 08:15 PM), courts, stages (League, Quarter, Semi, Grand Final), and status filters.
   - Scorer can click **`▶ Load in Scoreboard`** on any scheduled fixture to automatically populate the live match!
3. **🏆 League Points Table / Standings View (`#view_standings`):**
   - Live tournament rankings: Matches Played, Won, Lost, Tied, Score Difference (+/-), Points, and Form indicator pills (W/L/D).
   - Top 4 playoff cutoff line.
4. **👥 Teams & Squads View (`#view_teams`):**
   - Team cards for all 6 participating franchises (Patna Warriors, Bengal Tigers, Mumbai Warriors, Bengaluru Bulls, Jaipur Panthers, Tamil Thalas).
   - Complete 7 starting players + 3 substitutes bench + Captains and Coaches.
   - Scorer can 1-click load any squad into Team A or Team B!
5. **📁 Match Archives View (`#view_archives`):**
   - Historical match recaps with scores, winning margins, top raider, top defender, and full individual player scorecard modal.
6. **👑 Official Scorer & Operator Portal (`#view_portal`):**
   - Scorer status indicator (Authorized vs Spectator).
   - Scorer ID and Password management (set custom credentials).
   - QR code and quick-copy shareable broadcast links for spectators and scorers.

---

## 🚀 Deployment Options for Tomorrow's Tournament

You can deploy this website using any of the following fast, reliable methods:

---

### Option 1: 1-Click Free Hosting on Vercel (Instant Public Web URL)

Vercel provides a permanent public HTTPS domain (e.g., `https://kabaddi-2026.vercel.app`) that anyone can open on mobile data anywhere:

1. Create a free account at [vercel.com](https://vercel.com) if you don't have one.
2. In your terminal in `c:\KABADDI`, run:
   ```bash
   npx --yes vercel
   ```
3. Follow the 3 prompts (hit Enter to accept defaults).
4. Vercel will immediately output your live public production URL!
   *(The included `vercel.json` is already pre-configured).*

---

### Option 2: 1-Click Drag & Drop on Netlify (No Terminal Needed!)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the `c:\KABADDI` folder directly into your browser window.
3. In under 10 seconds, Netlify generates a live public URL (e.g. `https://kabaddi-live-tournament.netlify.app`) with free SSL.

---

### Option 3: Free Live Internet Tunnel via Cloudflare (Zero Setup)

If you are running the tournament on your laptop and want spectators to watch live from anywhere over 4G/5G mobile internet:

1. Double-click `start_tournament.bat` to run the local server.
2. Open a PowerShell/Terminal window and run:
   ```bash
   npx --yes cloudflared tunnel --url http://localhost:8081
   ```
3. Cloudflare gives you an instant free HTTPS link (e.g. `https://random-words.trycloudflare.com`).
4. Share that link on WhatsApp groups or print the QR code — spectators can follow the match from home or stadium seats.

---

### Option 4: Local Stadium / Ground Wi-Fi & Hotspot (Offline / Closed Network)

No internet required! If Wi-Fi is weak at the ground:

1. Turn on a mobile phone's **Personal Hotspot**.
2. Connect your laptop and the scorer's phone to the hotspot.
3. Double-click **`start_tournament.bat`**.
4. The console prints your local IP address (e.g., `10.126.219.251`).
5. **Stadium Big Display / TV:** Connect laptop to TV via HDMI, open `http://localhost:8081`, and press **F11**.
6. **Scorer Phone:** Open `http://<LAPTOP_IP>:8081/?role=scorer` and enter Scorer ID & Password.
7. **Spectator Phones:** Spectators connect to the hotspot and open `http://<LAPTOP_IP>:8081/?role=viewer`.

---

## 🔑 Official Scorer Credentials

- **Default Scorer ID:** `admin`
- **Default Password / PIN:** `1234`

### How to Change Credentials:
- Go to the **👑 Scorer Portal** tab on the website, or click **`🔑 Set ID/Pass`** in the top banner.
- Enter current password (`1234`), choose your new Scorer ID & Password, and click **`💾 Save Scorer Credentials`**.
- Credentials persist permanently in `data/server_config.json`.
