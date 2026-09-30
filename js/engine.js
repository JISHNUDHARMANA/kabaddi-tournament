/**
 * Kabaddi Match Engine & State Machine
 * Implements Pro Kabaddi League regulations:
 * - 7 Starting Players per team + up to 5 Substitutes
 * - Real-time Substitution Engine
 * - FIFO Out-Bench & Revival Queue
 * - Touch & Bonus point calculations
 * - Super Raid detection (>= 3 raid pts)
 * - Super Tackle detection (<= 3 defenders on court = 2 pts)
 * - All-Out / Lona (+2 pts & full court revival)
 * - Do-or-die raid tracking
 * - User-editable Match & Raid Clocks
 * - Per-match Team Renaming & Customization
 * - Persistent Match History & Archive Storage (localStorage)
 * - Complete Snapshot-based Undo history
 */

class KabaddiEngine {
  constructor() {
    this.history = [];
    this.maxHistory = 50;
    this.logs = [];
    this.storageKey = 'KABADDI_PRO_MATCH_ARCHIVES';
    this.currentMatchKey = 'KABADDI_CURRENT_MATCH_STATE';

    // Single-Person Operator & Live Spectator Role Control
    this.role = 'viewer'; // 'scorer' or 'viewer'
    this.scorerToken = null;
    this.stateVersion = 1;
    this.lastServerVersion = 0;

    // Check URL query parameters and session for role
    this.initRoleFromSession();

    // BroadcastChannel for instant local inter-tab synchronization (0ms latency)
    if ('BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('kabaddi_pro_sync');
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'STATE_UPDATE' && event.data.state) {
            if (!this.isScorer()) {
              this.state = event.data.state;
              if (event.data.logs) this.logs = event.data.logs;
              this.stateVersion = event.data.version || (this.stateVersion + 1);
              if (window.kabaddiUI) window.kabaddiUI.renderAll();
            }
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel error', e);
      }
    }

    // Initialize or load state
    this.state = this.getInitialState();
    this.tryRestoreCurrentMatch();
  }

  initRoleFromSession() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get('role');
      const savedToken = sessionStorage.getItem('KABADDI_SCORER_TOKEN');
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      if (urlRole === 'viewer') {
        this.role = 'viewer';
        this.scorerToken = null;
      } else if (urlRole === 'scorer' || isLocalhost || savedToken) {
        // Automatically default to Scorer mode on local host or with token
        this.role = 'scorer';
        this.scorerToken = savedToken || 'scorer_auth_granted_' + Date.now();
        try {
          sessionStorage.setItem('KABADDI_SCORER_TOKEN', this.scorerToken);
        } catch (e) {}
      } else {
        // External remote devices default to Spectator
        this.role = 'viewer';
        this.scorerToken = null;
      }
    } catch (e) {
      this.role = 'scorer';
    }
  }

  isScorer() {
    return this.role === 'scorer';
  }

  setScorerAuth(token) {
    this.role = 'scorer';
    this.scorerToken = token || 'scorer_auth_granted_' + Date.now();
    try {
      sessionStorage.setItem('KABADDI_SCORER_TOKEN', this.scorerToken);
    } catch (e) {}
  }

  lockScorer() {
    this.role = 'viewer';
    this.scorerToken = null;
    try {
      sessionStorage.removeItem('KABADDI_SCORER_TOKEN');
    } catch (e) {}
  }

  toggleRole(newRole) {
    if (newRole === 'scorer') {
      this.setScorerAuth('scorer_auth_granted_' + Date.now());
    } else {
      this.lockScorer();
    }
  }

  async verifyScorer(scorerId, scorerPass) {
    try {
      const res = await fetch('/api/verify-scorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scorerId: (scorerId || 'admin').trim(),
          scorerPass: String(scorerPass || '').trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.setScorerAuth(data.token);
        return { success: true, token: data.token, scorerId: data.scorerId };
      } else {
        return { success: false, error: data.error || 'Invalid Scorer ID or Password' };
      }
    } catch (err) {
      // Offline fallback: check default 'admin' / '1234'
      if (String(scorerPass).trim() === '1234') {
        const fallbackToken = 'scorer_offline_' + Date.now();
        this.setScorerAuth(fallbackToken);
        return { success: true, token: fallbackToken };
      }
      return { success: false, error: 'Network error or invalid credentials' };
    }
  }

  async verifyPin(pin) {
    return this.verifyScorer('admin', pin);
  }

  async updateScorerCredentials(currentPass, newScorerId, newScorerPass) {
    try {
      const res = await fetch('/api/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPass: String(currentPass || '').trim(),
          newScorerId: String(newScorerId || '').trim(),
          newScorerPass: String(newScorerPass || '').trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message, scorerId: data.scorerId };
      } else {
        return { success: false, error: data.error || 'Failed to update credentials' };
      }
    } catch (e) {
      return { success: false, error: 'Network error communicating with server' };
    }
  }

  getInitialState() {
    return {
      matchId: 'match_' + Date.now(),
      matchDate: new Date().toISOString(),
      matchTitle: 'Pro Match #1',
      matchHalf: 1, // 1 or 2
      matchTimeRemaining: 20 * 60, // 20 minutes in seconds
      matchTimerRunning: false,

      raidTimeRemaining: 30, // 30 seconds raid clock
      raidTimerRunning: false,

      activeRaidingTeam: 'teamA', // 'teamA' or 'teamB'
      activeRaiderId: null,

      teamA: {
        id: 'teamA',
        name: 'PATNA WARRIORS',
        color: '#FF6B00',
        score: 0,
        raidPoints: 0,
        tacklePoints: 0,
        allOutPoints: 0,
        emptyRaidsCount: 0,
        superRaids: 0,
        players: [
          { id: 'A1', name: 'Sachin Tanwar', jersey: '1', role: 'Raider', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'A2', name: 'Manjeet Dahiya', jersey: '2', role: 'Raider', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'A3', name: 'Neeraj Kumar', jersey: '3', role: 'Defender', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'A4', name: 'Sunil Kumar', jersey: '4', role: 'Defender', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'A5', name: 'Mohit Goyat', jersey: '5', role: 'All-Rounder', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'A6', name: 'Sajin C.', jersey: '6', role: 'Defender', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'A7', name: 'Shubham Shinde', jersey: '7', role: 'Defender', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 }
        ],
        substitutes: [
          { id: 'AS1', name: 'Rohit Gulia', jersey: '18', role: 'All-Rounder', raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'AS2', name: 'Ankit Jaglan', jersey: '20', role: 'Defender', raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'AS3', name: 'Rakesh Narwal', jersey: '22', role: 'Raider', raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 }
        ],
        benchQueue: [] // Array of player IDs in order of going OUT (FIFO)
      },

      teamB: {
        id: 'teamB',
        name: 'BENGAL TIGERS',
        color: '#00B4D8',
        score: 0,
        raidPoints: 0,
        tacklePoints: 0,
        allOutPoints: 0,
        emptyRaidsCount: 0,
        superRaids: 0,
        players: [
          { id: 'B1', name: 'Maninder Singh', jersey: '9', role: 'Raider', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'B2', name: 'Shrikant Jadhav', jersey: '10', role: 'Raider', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'B3', name: 'Vaibhav Garje', jersey: '11', role: 'Defender', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'B4', name: 'Jaskirat Singh', jersey: '12', role: 'Defender', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'B5', name: 'Nitin Rawal', jersey: '13', role: 'All-Rounder', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'B6', name: 'Darshan J.', jersey: '14', role: 'Defender', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'B7', name: 'Shubham Kumar', jersey: '15', role: 'Defender', isOnCourt: true, raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 }
        ],
        substitutes: [
          { id: 'BS1', name: 'Akshay Kumar', jersey: '25', role: 'Defender', raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'BS2', name: 'Suyog Gaikar', jersey: '27', role: 'Raider', raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 },
          { id: 'BS3', name: 'Hem Raj', jersey: '29', role: 'All-Rounder', raidPoints: 0, bonusPoints: 0, tacklePoints: 0, superRaids: 0, outsCount: 0, revivalsCount: 0 }
        ],
        benchQueue: []
      }
    };
  }

  // Save state before any mutation
  saveSnapshot(actionLabel = 'Action') {
    const serialized = JSON.stringify(this.state);
    this.history.push({ state: serialized, actionLabel });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.saveCurrentMatchState();
  }

  canUndo() {
    return this.history.length > 0;
  }

  undo() {
    if (!this.canUndo()) return false;
    const last = this.history.pop();
    this.state = JSON.parse(last.state);
    this.addLog(`Undo performed: reverted "${last.actionLabel}"`, 'undo');
    this.saveCurrentMatchState();
    return true;
  }

  // Helpers to get teams
  getRaidingTeam() {
    return this.state.activeRaidingTeam === 'teamA' ? this.state.teamA : this.state.teamB;
  }

  getDefendingTeam() {
    return this.state.activeRaidingTeam === 'teamA' ? this.state.teamB : this.state.teamA;
  }

  getTeam(teamKey) {
    return teamKey === 'teamA' ? this.state.teamA : this.state.teamB;
  }

  getPlayer(playerId) {
    const teamA = this.state.teamA;
    const teamB = this.state.teamB;

    let p = teamA.players.find(x => x.id === playerId) || (teamA.substitutes || []).find(x => x.id === playerId);
    if (p) return { player: p, teamKey: 'teamA' };

    p = teamB.players.find(x => x.id === playerId) || (teamB.substitutes || []).find(x => x.id === playerId);
    if (p) return { player: p, teamKey: 'teamB' };

    return null;
  }

  getOnCourtPlayers(teamKey) {
    return this.getTeam(teamKey).players.filter(p => p.isOnCourt);
  }

  getBenchPlayers(teamKey) {
    const team = this.getTeam(teamKey);
    return team.benchQueue.map(id => team.players.find(p => p.id === id)).filter(Boolean);
  }

  getSubstitutes(teamKey) {
    return this.getTeam(teamKey).substitutes || [];
  }

  isSuperTackleOn(teamKey) {
    return this.getOnCourtPlayers(teamKey).length <= 3;
  }

  isDoOrDieRaid(teamKey) {
    return this.getTeam(teamKey).emptyRaidsCount >= 2;
  }

  setActiveRaidingTeam(teamKey) {
    this.state.activeRaidingTeam = teamKey;
    const onCourt = this.getOnCourtPlayers(teamKey);
    if (onCourt.length > 0) {
      const defaultRaider = onCourt.find(p => p.role === 'Raider') || onCourt[0];
      this.state.activeRaiderId = defaultRaider ? defaultRaider.id : null;
    } else {
      this.state.activeRaiderId = null;
    }
  }

  setActiveRaider(playerId) {
    this.state.activeRaiderId = playerId;
  }

  getActiveRaider() {
    const raidingTeam = this.getRaidingTeam();
    if (!raidingTeam) return null;
    if (this.state.activeRaiderId) {
      const p = raidingTeam.players.find(x => x.id === this.state.activeRaiderId);
      if (p) return p;
    }
    const onCourt = this.getOnCourtPlayers(this.state.activeRaidingTeam);
    return onCourt.find(p => p.role === 'Raider') || onCourt[0] || null;
  }

  toggleTurn() {
    const nextTeam = this.state.activeRaidingTeam === 'teamA' ? 'teamB' : 'teamA';
    this.setActiveRaidingTeam(nextTeam);
    this.state.raidTimeRemaining = 30;
  }

  putPlayerOut(teamKey, playerId) {
    const team = this.getTeam(teamKey);
    const player = team.players.find(p => p.id === playerId);
    if (!player || !player.isOnCourt) return null;

    player.isOnCourt = false;
    player.outsCount++;
    team.benchQueue.push(playerId);
    return player;
  }

  revivePlayers(teamKey, count) {
    const team = this.getTeam(teamKey);
    const revivedList = [];

    while (count > 0 && team.benchQueue.length > 0) {
      const nextId = team.benchQueue.shift();
      const player = team.players.find(p => p.id === nextId);
      if (player) {
        player.isOnCourt = true;
        player.revivalsCount++;
        revivedList.push(player);
      }
      count--;
    }
    return revivedList;
  }

  // -------------------------------------------------------------
  // SUBSTITUTION SYSTEM
  // -------------------------------------------------------------
  substitutePlayer(teamKey, onCourtPlayerId, subPlayerId) {
    const team = this.getTeam(teamKey);
    const onCourtIdx = team.players.findIndex(p => p.id === onCourtPlayerId && p.isOnCourt);
    const subIdx = (team.substitutes || []).findIndex(p => p.id === subPlayerId);

    if (onCourtIdx === -1 || subIdx === -1) {
      return { success: false, message: 'Invalid player or substitute' };
    }

    this.saveSnapshot(`Substitution: ${team.name}`);

    const onCourtPlayer = team.players[onCourtIdx];
    const incomingSub = team.substitutes[subIdx];

    // Swap players
    onCourtPlayer.isOnCourt = false;
    incomingSub.isOnCourt = true;

    team.players[onCourtIdx] = incomingSub;
    team.substitutes[subIdx] = onCourtPlayer;

    // Update active raider if needed
    if (this.state.activeRaiderId === onCourtPlayerId) {
      this.state.activeRaiderId = incomingSub.id;
    }

    const desc = `🔄 SUBSTITUTION (${team.name}): #${incomingSub.jersey} ${incomingSub.name} IN ➔ #${onCourtPlayer.jersey} ${onCourtPlayer.name} OUT to substitutes bench.`;
    this.addLog(desc, 'info');

    return {
      success: true,
      incomingSub,
      onCourtPlayer
    };
  }

  // -------------------------------------------------------------
  // EDITABLE CLOCKS
  // -------------------------------------------------------------
  setMatchTime(seconds) {
    this.saveSnapshot('Edit Match Clock');
    this.state.matchTimeRemaining = Math.max(0, parseInt(seconds, 10) || 0);
    const mm = Math.floor(this.state.matchTimeRemaining / 60);
    const ss = this.state.matchTimeRemaining % 60;
    this.addLog(`⏱️ Match Clock adjusted to ${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.`, 'info');
  }

  setRaidTime(seconds) {
    this.state.raidTimeRemaining = Math.max(0, Math.min(60, parseInt(seconds, 10) || 30));
  }

  // -------------------------------------------------------------
  // EDIT TEAM NAMES MATCH BY MATCH
  // -------------------------------------------------------------
  renameTeam(teamKey, newName) {
    const cleanName = (newName || '').trim();
    if (!cleanName) return false;
    this.saveSnapshot(`Rename ${teamKey}`);
    const prevName = this.getTeam(teamKey).name;
    this.getTeam(teamKey).name = cleanName.toUpperCase();
    this.addLog(`🏷️ Team renamed: "${prevName}" ➔ "${this.getTeam(teamKey).name}".`, 'info');
    return true;
  }

  enforceAllOut(allOutTeamKey, awardedTeamKey) {
    const allOutTeam = this.getTeam(allOutTeamKey);
    const awardedTeam = this.getTeam(awardedTeamKey);

    awardedTeam.score += 2;
    awardedTeam.allOutPoints += 2;

    allOutTeam.players.forEach(p => {
      p.isOnCourt = true;
    });
    allOutTeam.benchQueue = [];

    this.addLog(
      `💥 ALL-OUT (LONA)! ${allOutTeam.name} suffered All-Out! +2 Points awarded to ${awardedTeam.name}. All 7 players return to court!`,
      'allout'
    );

    return { allOutTeam, awardedTeam };
  }

  // -------------------------------------------------------------
  // MATCH ACTIONS
  // -------------------------------------------------------------
  commitRaid({ raiderId, touchedDefenderIds = [], hasBonus = false }) {
    this.saveSnapshot('Raid Point');

    const raidingTeam = this.getRaidingTeam();
    const defendingTeam = this.getDefendingTeam();
    const raiderObj = this.getPlayer(raiderId);
    const raider = raiderObj ? raiderObj.player : null;

    const touchCount = touchedDefenderIds.length;
    const bonusCount = hasBonus ? 1 : 0;
    const totalRaidPoints = touchCount + bonusCount;

    if (totalRaidPoints === 0) {
      return { success: false, message: 'No points specified in raid' };
    }

    raidingTeam.score += totalRaidPoints;
    raidingTeam.raidPoints += totalRaidPoints;
    raidingTeam.emptyRaidsCount = 0;

    if (raider) {
      raider.raidPoints += touchCount;
      raider.bonusPoints += bonusCount;
    }

    const outDefenders = [];
    touchedDefenderIds.forEach(dId => {
      const p = this.putPlayerOut(defendingTeam.id, dId);
      if (p) outDefenders.push(p);
    });

    const revivedPlayers = touchCount > 0 ? this.revivePlayers(raidingTeam.id, touchCount) : [];
    const isSuperRaid = totalRaidPoints >= 3;

    if (isSuperRaid) {
      raidingTeam.superRaids = (raidingTeam.superRaids || 0) + 1;
      if (raider) {
        raider.superRaids = (raider.superRaids || 0) + 1;
      }
    }

    const raiderName = raider ? `#${raider.jersey} ${raider.name}` : 'Raider';
    const defenderNames = outDefenders.map(d => `#${d.jersey} ${d.name}`).join(', ');
    const revivedNames = revivedPlayers.map(r => `#${r.jersey} ${r.name}`).join(', ');

    let desc = `${isSuperRaid ? '🔥 SUPER RAID! ' : ''}${raiderName} (${raidingTeam.name}) scored ${totalRaidPoints} point${totalRaidPoints > 1 ? 's' : ''}`;
    if (touchCount > 0 && hasBonus) desc += ` (${touchCount} touch + 1 bonus).`;
    else if (touchCount > 0) desc += ` (${touchCount} touch).`;
    else desc += ` (1 bonus point).`;

    if (outDefenders.length > 0) desc += ` Defenders OUT: [${defenderNames}] went to the bench.`;
    if (revivedPlayers.length > 0) desc += ` Revived: [${revivedNames}] returned to court (FIFO).`;

    this.addLog(desc, isSuperRaid ? 'super-raid' : 'raid');

    let allOutOccurred = false;
    if (this.getOnCourtPlayers(defendingTeam.id).length === 0) {
      this.enforceAllOut(defendingTeam.id, raidingTeam.id);
      allOutOccurred = true;
    }

    const scoringTeamKey = raidingTeam.id;
    this.toggleTurn();

    return {
      success: true,
      scoringTeamKey,
      totalRaidPoints,
      touchCount,
      bonusCount,
      outDefenders,
      revivedPlayers,
      isSuperRaid,
      allOutOccurred
    };
  }

  commitEmptyRaid({ raiderId }) {
    this.saveSnapshot('Empty Raid');

    const raidingTeam = this.getRaidingTeam();
    const defendingTeam = this.getDefendingTeam();
    const raiderObj = this.getPlayer(raiderId);
    const raider = raiderObj ? raiderObj.player : null;
    const raiderName = raider ? `#${raider.jersey} ${raider.name}` : 'Raider';

    if (this.isDoOrDieRaid(raidingTeam.id)) {
      raidingTeam.emptyRaidsCount = 0;
      this.putPlayerOut(raidingTeam.id, raiderId);

      defendingTeam.score += 1;
      defendingTeam.tacklePoints += 1;

      const revived = this.revivePlayers(defendingTeam.id, 1);
      const revStr = revived.length > 0 ? ` [${revived.map(r => `#${r.jersey} ${r.name}`).join(', ')}] revived.` : '';

      this.addLog(
        `⚠️ DO-OR-DIE FAILED! ${raiderName} (${raidingTeam.name}) failed to score in Do-or-Die raid and is OUT! +1 Pt to ${defendingTeam.name}.${revStr}`,
        'tackle'
      );

      let allOutOccurred = false;
      if (this.getOnCourtPlayers(raidingTeam.id).length === 0) {
        this.enforceAllOut(raidingTeam.id, defendingTeam.id);
        allOutOccurred = true;
      }

      this.toggleTurn();
      return { success: true, doOrDieFailed: true, allOutOccurred };
    }

    raidingTeam.emptyRaidsCount++;
    const isNowDoOrDie = this.isDoOrDieRaid(raidingTeam.id);

    this.addLog(
      `⚪ Empty raid by ${raiderName} (${raidingTeam.name}). Safe return.${isNowDoOrDie ? ' ⚠️ NEXT RAID IS DO-OR-DIE!' : ''}`,
      'empty'
    );

    this.toggleTurn();
    return { success: true, emptyRaidsCount: raidingTeam.emptyRaidsCount, isNowDoOrDie };
  }

  commitTackle({ raiderId, creditedDefenderId = null }) {
    this.saveSnapshot('Tackle Point');

    const raidingTeam = this.getRaidingTeam();
    const defendingTeam = this.getDefendingTeam();

    const raiderObj = this.getPlayer(raiderId);
    const raider = raiderObj ? raiderObj.player : null;
    const raiderName = raider ? `#${raider.jersey} ${raider.name}` : 'Raider';

    const defenderObj = creditedDefenderId ? this.getPlayer(creditedDefenderId) : null;
    const defender = defenderObj ? defenderObj.player : null;
    const defenderName = defender ? `#${defender.jersey} ${defender.name}` : 'Defense Unit';

    const isSuperTackle = this.isSuperTackleOn(defendingTeam.id);
    const tacklePts = isSuperTackle ? 2 : 1;

    defendingTeam.score += tacklePts;
    defendingTeam.tacklePoints += tacklePts;
    raidingTeam.emptyRaidsCount = 0;

    const outRaider = this.putPlayerOut(raidingTeam.id, raiderId);

    if (defender) {
      defender.tacklePoints += tacklePts;
    }

    const revivedPlayers = this.revivePlayers(defendingTeam.id, 1);
    const revStr = revivedPlayers.length > 0 
      ? ` Defending team revived [${revivedPlayers.map(r => `#${r.jersey} ${r.name}`).join(', ')}] (FIFO).` 
      : '';

    let logText = '';
    if (isSuperTackle) {
      logText = `🛡️⚡ SUPER TACKLE! ${defenderName} (${defendingTeam.name}) pinned ${raiderName}! Defending team was &le;3 players, awarded +2 POINTS! ${raiderName} is OUT.${revStr}`;
      this.addLog(logText, 'super-tackle');
    } else {
      logText = `🛡️ TACKLE! ${defenderName} (${defendingTeam.name}) successfully tackled ${raiderName}! +1 Point to ${defendingTeam.name}. ${raiderName} is OUT to the bench.${revStr}`;
      this.addLog(logText, 'tackle');
    }

    let allOutOccurred = false;
    if (this.getOnCourtPlayers(raidingTeam.id).length === 0) {
      this.enforceAllOut(raidingTeam.id, defendingTeam.id);
      allOutOccurred = true;
    }

    const scoringTeamKey = defendingTeam.id;
    this.toggleTurn();

    return {
      success: true,
      scoringTeamKey,
      isSuperTackle,
      tacklePts,
      outRaider,
      revivedPlayers,
      allOutOccurred
    };
  }

  addTechnicalPoint(teamKey) {
    this.saveSnapshot('Technical Point');
    const team = this.getTeam(teamKey);
    team.score += 1;
    this.addLog(`⭐ Technical Point awarded to ${team.name} (+1 Pt).`, 'technical');
    return true;
  }

  manualRevive(teamKey) {
    this.saveSnapshot('Manual Revival');
    const team = this.getTeam(teamKey);
    const revived = this.revivePlayers(teamKey, 1);
    if (revived.length > 0) {
      const p = revived[0];
      this.addLog(`🔄 Manual Revival: #${p.jersey} ${p.name} (${team.name}) restored to court.`, 'technical');
      return true;
    }
    return false;
  }

  switchHalf() {
    this.saveSnapshot('Switch Half');
    this.state.matchHalf = this.state.matchHalf === 1 ? 2 : 1;
    this.state.matchTimeRemaining = 20 * 60;
    this.state.raidTimeRemaining = 30;
    this.addLog(`⏱️ Switched to ${this.state.matchHalf === 1 ? '1st' : '2nd'} Half. Court sides rotated.`, 'info');
  }

  resetMatch(newTeamAName = null, newTeamBName = null) {
    this.saveSnapshot('Reset Match');
    const prevA = { name: newTeamAName || this.state.teamA.name, color: this.state.teamA.color, players: this.state.teamA.players, substitutes: this.state.teamA.substitutes };
    const prevB = { name: newTeamBName || this.state.teamB.name, color: this.state.teamB.color, players: this.state.teamB.players, substitutes: this.state.teamB.substitutes };

    this.state = this.getInitialState();
    this.state.teamA.name = prevA.name;
    this.state.teamA.color = prevA.color;
    this.state.teamA.players = prevA.players;
    this.state.teamA.substitutes = prevA.substitutes || [];

    this.state.teamB.name = prevB.name;
    this.state.teamB.color = prevB.color;
    this.state.teamB.players = prevB.players;
    this.state.teamB.substitutes = prevB.substitutes || [];

    // Reset scores & status
    [this.state.teamA, this.state.teamB].forEach(team => {
      team.superRaids = 0;
      team.players.forEach(p => {
        p.isOnCourt = true;
        p.raidPoints = 0;
        p.bonusPoints = 0;
        p.tacklePoints = 0;
        p.superRaids = 0;
        p.outsCount = 0;
        p.revivalsCount = 0;
      });
      (team.substitutes || []).forEach(p => {
        p.isOnCourt = false;
        p.raidPoints = 0;
        p.bonusPoints = 0;
        p.tacklePoints = 0;
        p.superRaids = 0;
        p.outsCount = 0;
        p.revivalsCount = 0;
      });
      team.benchQueue = [];
    });

    this.setActiveRaidingTeam('teamA');
    this.addLog('🔄 Match reset to starting 0-0. All players on court.', 'info');
    this.saveCurrentMatchState();
  }

  addLog(description, type = 'info') {
    const elapsedMinutes = Math.floor((20 * 60 - this.state.matchTimeRemaining) / 60);
    const elapsedSeconds = (20 * 60 - this.state.matchTimeRemaining) % 60;
    const timestamp = `${String(Math.max(0, elapsedMinutes)).padStart(2, '0')}:${String(Math.max(0, elapsedSeconds)).padStart(2, '0')}`;

    this.logs.unshift({
      id: Date.now() + Math.random(),
      timestamp,
      half: this.state.matchHalf,
      description,
      type
    });
    this.saveCurrentMatchState();
  }

  clearLogs() {
    this.logs = [];
    this.saveCurrentMatchState();
  }

  updateTeamsConfig({ teamAName, teamAColor, teamAPlayers, teamASubstitutes, teamBName, teamBColor, teamBPlayers, teamBSubstitutes }) {
    this.saveSnapshot('Update Team Setup');
    if (teamAName) this.state.teamA.name = teamAName;
    if (teamAColor) this.state.teamA.color = teamAColor;
    if (teamBName) this.state.teamB.name = teamBName;
    if (teamBColor) this.state.teamB.color = teamBColor;

    if (teamAPlayers) {
      this.state.teamA.players = teamAPlayers;
      this.state.teamA.benchQueue = this.state.teamA.benchQueue.filter(id => teamAPlayers.some(p => p.id === id));
    }
    if (teamASubstitutes) {
      this.state.teamA.substitutes = teamASubstitutes;
    }

    if (teamBPlayers) {
      this.state.teamB.players = teamBPlayers;
      this.state.teamB.benchQueue = this.state.teamB.benchQueue.filter(id => teamBPlayers.some(p => p.id === id));
    }
    if (teamBSubstitutes) {
      this.state.teamB.substitutes = teamBSubstitutes;
    }

    this.setActiveRaidingTeam(this.state.activeRaidingTeam);
    this.addLog('⚙️ Team rosters and names updated.', 'info');
  }

  // -------------------------------------------------------------
  // MATCH ARCHIVE, PERSISTENCE & REAL-TIME SERVER SYNC
  // -------------------------------------------------------------
  getSerializableState() {
    return {
      ...this.state,
      timerTimestamp: Date.now(),
      recentLogs: this.logs.slice(-25)
    };
  }

  saveCurrentMatchState() {
    try {
      const data = {
        state: this.state,
        logs: this.logs
      };
      localStorage.setItem(this.currentMatchKey, JSON.stringify(data));
      // If scorer is operating, sync to Python server and local broadcast channel
      if (this.isScorer()) {
        this.syncStateToServer();
      }
    } catch (e) {
      console.warn('Failed to save current state', e);
    }
  }

  async syncStateToServer() {
    this.stateVersion++;
    const serialized = this.getSerializableState();

    // 1. Broadcast locally across tabs (0ms latency)
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'STATE_UPDATE',
          state: this.state,
          logs: this.logs,
          version: this.stateVersion
        });
      } catch (e) {}
    }

    // 2. Broadcast over HTTP to Python backend for remote spectators
    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Scorer-PIN': '1234'
        },
        body: JSON.stringify({
          token: this.scorerToken,
          pin: '1234',
          state: serialized
        })
      });
    } catch (err) {
      // Backend sync error silently handled (offline supported)
    }
  }

  async fetchStateFromServer() {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) return false;
      const data = await res.json();
      if (data && data.state && data.version > this.lastServerVersion) {
        this.lastServerVersion = data.version;
        if (!this.isScorer()) {
          const incoming = data.state;
          // Synchronize clocks if running on server
          if (incoming.matchTimerRunning && incoming.timerTimestamp) {
            const elapsed = Math.floor((Date.now() - incoming.timerTimestamp) / 1000);
            incoming.matchTimeRemaining = Math.max(0, incoming.matchTimeRemaining - elapsed);
          }
          if (incoming.raidTimerRunning && incoming.timerTimestamp) {
            const elapsed = Math.floor((Date.now() - incoming.timerTimestamp) / 1000);
            incoming.raidTimeRemaining = Math.max(0, incoming.raidTimeRemaining - elapsed);
          }
          this.state = incoming;
          if (incoming.recentLogs && incoming.recentLogs.length > 0) {
            this.logs = incoming.recentLogs;
          }
          this.stateVersion = data.version;
          return true; // updated!
        }
      }
    } catch (e) {
      // Server unreachable or offline
    }
    return false;
  }

  tryRestoreCurrentMatch() {
    try {
      const raw = localStorage.getItem(this.currentMatchKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.state && data.state.teamA && data.state.teamB) {
          this.state = data.state;
          this.logs = data.logs || [];
        }
      }
    } catch (e) {
      console.warn('Failed to restore current match', e);
    }
  }

  async archiveCurrentMatch(notes = '') {
    const s = this.state;
    const diff = s.teamA.score - s.teamB.score;
    let winner = 'Tie';
    if (diff > 0) winner = s.teamA.name;
    else if (diff < 0) winner = s.teamB.name;

    // Find top raider & defender
    const allPlayers = [
      ...s.teamA.players, ...(s.teamA.substitutes || []),
      ...s.teamB.players, ...(s.teamB.substitutes || [])
    ];

    let topRaider = allPlayers.reduce((max, p) => (p.raidPoints + p.bonusPoints > (max ? max.raidPoints + max.bonusPoints : -1) ? p : max), null);
    let topDefender = allPlayers.reduce((max, p) => (p.tacklePoints > (max ? max.tacklePoints : -1) ? p : max), null);

    const archiveRecord = {
      id: 'match_' + Date.now(),
      savedAt: new Date().toISOString(),
      matchTitle: s.matchTitle || `${s.teamA.name} vs ${s.teamB.name}`,
      notes: notes,
      winner: winner,
      margin: Math.abs(diff),
      scoreA: s.teamA.score,
      scoreB: s.teamB.score,
      teamA: JSON.parse(JSON.stringify(s.teamA)),
      teamB: JSON.parse(JSON.stringify(s.teamB)),
      topRaider: topRaider ? { name: topRaider.name, jersey: topRaider.jersey, points: topRaider.raidPoints + topRaider.bonusPoints } : null,
      topDefender: topDefender ? { name: topDefender.name, jersey: topDefender.jersey, points: topDefender.tacklePoints } : null,
      logs: [...this.logs]
    };

    const archives = this.getArchivedMatches();
    archives.unshift(archiveRecord);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(archives));
      this.addLog(`💾 Match archived successfully: ${archiveRecord.matchTitle} (${s.teamA.score} - ${s.teamB.score})`, 'info');
      
      // Also post to Python server so any spectator device can view archives
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: archiveRecord })
      }).catch(() => {});

      return archiveRecord;
    } catch (e) {
      console.error('Failed to store match in archive', e);
      return null;
    }
  }

  getArchivedMatches() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  async fetchServerArchives() {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        if (data && data.archives && Array.isArray(data.archives)) {
          // Merge with local archives
          const local = this.getArchivedMatches();
          const merged = [...data.archives];
          for (const l of local) {
            if (!merged.some(m => m.id === l.id)) {
              merged.push(l);
            }
          }
          localStorage.setItem(this.storageKey, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {}
    return this.getArchivedMatches();
  }

  getArchivedMatch(id) {
    const list = this.getArchivedMatches();
    return list.find(m => m.id === id) || null;
  }

  deleteArchivedMatch(id) {
    const list = this.getArchivedMatches().filter(m => (m.id || m.matchId) !== id);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: id })
      }).catch(() => {});
      return true;
    } catch (e) {
      return false;
    }
  }

  clearAllArchives() {
    localStorage.removeItem(this.storageKey);
    fetch('/api/history', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).catch(() => {});
    return true;
  }
}

// Global engine instance
window.kabaddiEngine = new KabaddiEngine();
