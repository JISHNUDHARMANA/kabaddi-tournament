/**
 * Kabaddi Match UI Controller
 * Synchronizes Engine state with DOM:
 * - Court player tokens & status
 * - FIFO Bench Revival Queue
 * - Substitutes Bench & Real-time Substitution Dialog
 * - Scoreboard, breakdown & live lead
 * - Editable Match & Raid Clocks
 * - Inline Team Name Editor
 * - Match Archives & History Modal
 * - Save & End Match Dialog
 * - Touch & Tackle action builders
 * - Event log feed & commentary
 * - Comprehensive Scorecard & Team setup
 */

class KabaddiUI {
  constructor(engine) {
    this.engine = engine;
    this.selectedDefenderTouches = new Set();
    this.selectedTackleDefenderId = null;
    this.hasBonusSelected = false;

    // Substitution state
    this.subTeamKey = 'teamA';
    this.subSelectedOutId = null;
    this.subSelectedInId = null;
  }

  init() {
    this.bindStaticElements();
    this.renderAll();
  }

  bindStaticElements() {
    // Top Header & Timers
    this.matchHalfDisplay = document.getElementById('matchHalfDisplay');
    this.matchTimeDisplay = document.getElementById('matchTimeDisplay');
    this.raidTimeDisplay = document.getElementById('raidTimeDisplay');
    this.raidTimerCard = document.getElementById('raidTimerCard');
    this.undoBtn = document.getElementById('undoBtn');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.soundIcon = document.getElementById('soundIcon');
    this.editMatchTimeBtn = document.getElementById('editMatchTimeBtn');
    this.editRaidTimeBtn = document.getElementById('editRaidTimeBtn');
    this.saveAndEndMatchBtn = document.getElementById('saveAndEndMatchBtn');
    this.matchHistoryBtn = document.getElementById('matchHistoryBtn');

    // Scoreboard
    this.teamANameDisplay = document.getElementById('teamANameDisplay');
    this.teamBNameDisplay = document.getElementById('teamBNameDisplay');
    this.renameTeamABtn = document.getElementById('renameTeamABtn');
    this.renameTeamBBtn = document.getElementById('renameTeamBBtn');
    this.teamAColorDot = document.getElementById('teamAColorDot');
    this.teamBColorDot = document.getElementById('teamBColorDot');
    this.teamAScore = document.getElementById('teamAScore');
    this.teamBScore = document.getElementById('teamBScore');
    this.teamARaidPts = document.getElementById('teamARaidPts');
    this.teamBRaidPts = document.getElementById('teamBRaidPts');
    this.teamATacklePts = document.getElementById('teamATacklePts');
    this.teamBTacklePts = document.getElementById('teamBTacklePts');
    this.teamAAllOutPts = document.getElementById('teamAAllOutPts');
    this.teamBAllOutPts = document.getElementById('teamBAllOutPts');
    this.teamAActiveNum = document.getElementById('teamAActiveNum');
    this.teamBActiveNum = document.getElementById('teamBActiveNum');
    this.teamAOutNum = document.getElementById('teamAOutNum');
    this.teamBOutNum = document.getElementById('teamBOutNum');
    this.teamARaidingBadge = document.getElementById('teamARaidingBadge');
    this.teamBRaidingBadge = document.getElementById('teamBRaidingBadge');
    this.teamADoOrDieBadge = document.getElementById('teamADoOrDieBadge');
    this.teamBDoOrDieBadge = document.getElementById('teamBDoOrDieBadge');
    this.leadIndicatorDisplay = document.getElementById('leadIndicatorDisplay');

    // Courts & Bench
    this.courtTitleA = document.getElementById('courtTitleA');
    this.courtTitleB = document.getElementById('courtTitleB');
    this.courtHalfA = document.getElementById('courtHalfA');
    this.courtHalfB = document.getElementById('courtHalfB');
    this.teamACourtGrid = document.getElementById('teamACourtGrid');
    this.teamBCourtGrid = document.getElementById('teamBCourtGrid');
    this.teamABenchQueue = document.getElementById('teamABenchQueue');
    this.teamBBenchQueue = document.getElementById('teamBBenchQueue');
    this.teamASubQueue = document.getElementById('teamASubQueue');
    this.teamBSubQueue = document.getElementById('teamBSubQueue');
    this.teamASuperTackleActive = document.getElementById('teamASuperTackleActive');
    this.teamBSuperTackleActive = document.getElementById('teamBSuperTackleActive');
    this.substituteTeamABtn = document.getElementById('substituteTeamABtn');
    this.substituteTeamBBtn = document.getElementById('substituteTeamBBtn');

    // Action Desk
    this.selectRaidingTeamABtn = document.getElementById('selectRaidingTeamABtn');
    this.selectRaidingTeamBBtn = document.getElementById('selectRaidingTeamBBtn');
    this.activeRaiderStats = document.getElementById('activeRaiderStats');
    this.raiderPillsList = document.getElementById('raiderPillsList');
    this.defenderTouchChips = document.getElementById('defenderTouchChips');
    this.bonusCheckbox = document.getElementById('bonusCheckbox');
    this.raidTotalPreview = document.getElementById('raidTotalPreview');
    this.raidDetailPreview = document.getElementById('raidDetailPreview');
    this.commitRaidBtn = document.getElementById('commitRaidBtn');
    this.emptyRaidBtn = document.getElementById('emptyRaidBtn');

    // Tackle Elements
    this.tackledRaiderName = document.getElementById('tackledRaiderName');
    this.tackleCreditedDefenderGrid = document.getElementById('tackleCreditedDefenderGrid');
    this.superTackleCard = document.getElementById('superTackleCard');
    this.superTackleCardDesc = document.getElementById('superTackleCardDesc');
    this.commitTackleBtn = document.getElementById('commitTackleBtn');
    this.commitTackleBtnText = document.getElementById('commitTackleBtnText');

    // Feed
    this.feedItemsContainer = document.getElementById('feedItemsContainer');

    // Role Banners & Controls
    this.spectatorBanner = document.getElementById('spectatorBanner');
    this.scorerBanner = document.getElementById('scorerBanner');
    this.spectatorMatchCenterCard = document.getElementById('spectatorMatchCenterCard');
    this.actionDeskCard = document.getElementById('actionDeskCard');
    this.specRaiderJersey = document.getElementById('specRaiderJersey');
    this.specRaiderName = document.getElementById('specRaiderName');
    this.specRaiderTeam = document.getElementById('specRaiderTeam');
    this.specRaiderStats = document.getElementById('specRaiderStats');
    this.specDefendersCount = document.getElementById('specDefendersCount');
    this.specDefenderTeam = document.getElementById('specDefenderTeam');
    this.specDefenderStatus = document.getElementById('specDefenderStatus');
    this.specSuperTackleBadge = document.getElementById('specSuperTackleBadge');
    this.specRaidClockVal = document.getElementById('specRaidClockVal');
    this.specHalfVal = document.getElementById('specHalfVal');
    this.specEmptyRaidsVal = document.getElementById('specEmptyRaidsVal');

    // Modals
    this.setupModal = document.getElementById('setupModal');
    this.statsModal = document.getElementById('statsModal');
    this.mobileModal = document.getElementById('mobileModal');
    this.clockModal = document.getElementById('clockModal');
    this.substitutionModal = document.getElementById('substitutionModal');
    this.saveMatchModal = document.getElementById('saveMatchModal');
    this.historyModal = document.getElementById('historyModal');
    this.renameModal = document.getElementById('renameModal');
    this.scorerAuthModal = document.getElementById('scorerAuthModal');
  }

  renderAll() {
    this.renderRoleUI(this.engine.role);
    this.renderHeader();
    this.renderScoreboard();
    this.renderCourts();
    this.renderActionDesk();
    this.renderSpectatorCard();
    this.renderFeed();
  }

  renderRoleUI(role) {
    const isScorer = this.engine.isScorer();
    const btnScorer = document.getElementById('btnRoleScorer');
    const btnViewer = document.getElementById('btnRoleViewer');

    if (isScorer) {
      document.body.classList.remove('role-spectator');
      document.body.classList.add('role-scorer');
      if (this.scorerBanner) this.scorerBanner.classList.remove('hidden');
      if (this.spectatorBanner) this.spectatorBanner.classList.add('hidden');
      if (btnScorer) btnScorer.classList.add('active');
      if (btnViewer) btnViewer.classList.remove('active');
    } else {
      document.body.classList.remove('role-scorer');
      document.body.classList.add('role-spectator');
      if (this.scorerBanner) this.scorerBanner.classList.add('hidden');
      if (this.spectatorBanner) this.spectatorBanner.classList.remove('hidden');
      if (btnViewer) btnViewer.classList.add('active');
      if (btnScorer) btnScorer.classList.remove('active');
    }
  }

  renderSpectatorCard() {
    if (!this.spectatorMatchCenterCard) return;
    try {
      const s = this.engine.state;
      const raidingTeam = this.engine.getRaidingTeam();
      const defendingTeam = this.engine.getDefendingTeam();
      const raider = (this.engine.getActiveRaider && this.engine.getActiveRaider()) || null;
      const defOnCourt = (defendingTeam && this.engine.getOnCourtPlayers) ? this.engine.getOnCourtPlayers(defendingTeam.id) : [];

      // Raider Spotlight
      if (raider) {
        if (this.specRaiderJersey) this.specRaiderJersey.textContent = '#' + (raider.jersey || '1');
        if (this.specRaiderName) this.specRaiderName.textContent = raider.name || 'Active Raider';
        if (this.specRaiderTeam && raidingTeam) this.specRaiderTeam.textContent = raidingTeam.name;
        if (this.specRaiderStats) this.specRaiderStats.textContent = `Match Pts: ${raider.raidPoints + raider.bonusPoints} (Raid: ${raider.raidPoints}, Bonus: ${raider.bonusPoints})`;
      } else {
        if (this.specRaiderName) this.specRaiderName.textContent = 'Awaiting Raider Selection';
        if (this.specRaiderTeam && raidingTeam) this.specRaiderTeam.textContent = raidingTeam.name;
      }

      // Defending Unit
      if (this.specDefendersCount) this.specDefendersCount.textContent = defOnCourt.length;
      if (this.specDefenderTeam && defendingTeam) this.specDefenderTeam.textContent = defendingTeam.name;
      if (this.specDefenderStatus) {
        this.specDefenderStatus.textContent = `${defOnCourt.length} Active Defender${defOnCourt.length === 1 ? '' : 's'} on Court`;
      }
      if (this.specSuperTackleBadge) {
        if (defOnCourt.length > 0 && defOnCourt.length <= 3) {
          this.specSuperTackleBadge.classList.remove('hidden');
        } else {
          this.specSuperTackleBadge.classList.add('hidden');
        }
      }

      // Situation
      if (this.specRaidClockVal) this.specRaidClockVal.textContent = s.raidTimeRemaining + 's';
      if (this.specHalfVal) this.specHalfVal.textContent = s.matchHalf === 1 ? '1st Half' : '2nd Half';
      if (this.specEmptyRaidsVal && raidingTeam) this.specEmptyRaidsVal.textContent = raidingTeam.emptyRaidsCount || 0;
    } catch (e) {
      console.warn('renderSpectatorCard error', e);
    }
  }

  // -------------------------------------------------------------
  // 1. RENDER HEADER & TIMERS
  // -------------------------------------------------------------
  renderHeader() {
    const s = this.engine.state;
    this.matchHalfDisplay.textContent = s.matchHalf === 1 ? '1st Half' : '2nd Half';

    const mm = String(Math.floor(s.matchTimeRemaining / 60)).padStart(2, '0');
    const ss = String(s.matchTimeRemaining % 60).padStart(2, '0');
    this.matchTimeDisplay.textContent = `${mm}:${ss}`;

    this.raidTimeDisplay.textContent = s.raidTimeRemaining;
    if (s.raidTimeRemaining <= 5 && s.raidTimeRemaining > 0) {
      this.raidTimerCard.classList.add('danger');
    } else {
      this.raidTimerCard.classList.remove('danger');
    }

    this.undoBtn.disabled = !this.engine.canUndo();
  }

  // -------------------------------------------------------------
  // 2. RENDER SCOREBOARD BANNER
  // -------------------------------------------------------------
  renderScoreboard() {
    const { teamA, teamB, activeRaidingTeam } = this.engine.state;

    this.teamANameDisplay.textContent = teamA.name;
    this.teamBNameDisplay.textContent = teamB.name;
    this.teamAColorDot.style.backgroundColor = teamA.color;
    this.teamBColorDot.style.backgroundColor = teamB.color;

    // Scores
    this.teamAScore.textContent = teamA.score;
    this.teamBScore.textContent = teamB.score;

    this.teamARaidPts.textContent = teamA.raidPoints;
    this.teamBRaidPts.textContent = teamB.raidPoints;
    this.teamATacklePts.textContent = teamA.tacklePoints;
    this.teamBTacklePts.textContent = teamB.tacklePoints;
    this.teamAAllOutPts.textContent = teamA.allOutPoints;
    this.teamBAllOutPts.textContent = teamB.allOutPoints;

    // Court counts
    const onCourtA = this.engine.getOnCourtPlayers('teamA').length;
    const outA = teamA.benchQueue.length;
    const onCourtB = this.engine.getOnCourtPlayers('teamB').length;
    const outB = teamB.benchQueue.length;

    this.teamAActiveNum.textContent = onCourtA;
    this.teamAOutNum.textContent = outA;
    this.teamBActiveNum.textContent = onCourtB;
    this.teamBOutNum.textContent = outB;

    // Raiding Indicators
    if (activeRaidingTeam === 'teamA') {
      this.teamARaidingBadge.classList.remove('hidden');
      this.teamBRaidingBadge.classList.add('hidden');
    } else {
      this.teamARaidingBadge.classList.add('hidden');
      this.teamBRaidingBadge.classList.remove('hidden');
    }

    // Do-or-die indicators
    if (this.engine.isDoOrDieRaid('teamA') && activeRaidingTeam === 'teamA') {
      this.teamADoOrDieBadge.classList.remove('hidden');
    } else {
      this.teamADoOrDieBadge.classList.add('hidden');
    }

    if (this.engine.isDoOrDieRaid('teamB') && activeRaidingTeam === 'teamB') {
      this.teamBDoOrDieBadge.classList.remove('hidden');
    } else {
      this.teamBDoOrDieBadge.classList.add('hidden');
    }

    // Lead Indicator
    const diff = teamA.score - teamB.score;
    if (diff === 0) {
      this.leadIndicatorDisplay.textContent = 'Scores Level';
      this.leadIndicatorDisplay.style.color = 'var(--text-muted)';
    } else if (diff > 0) {
      this.leadIndicatorDisplay.textContent = `${teamA.name} leads by ${diff}`;
      this.leadIndicatorDisplay.style.color = teamA.color;
    } else {
      this.leadIndicatorDisplay.textContent = `${teamB.name} leads by ${Math.abs(diff)}`;
      this.leadIndicatorDisplay.style.color = teamB.color;
    }
  }

  // -------------------------------------------------------------
  // 3. RENDER COURTS, FIFO BENCH & SUBSTITUTES
  // -------------------------------------------------------------
  renderCourts() {
    const { teamA, teamB, activeRaidingTeam } = this.engine.state;

    this.courtTitleA.textContent = teamA.name;
    this.courtTitleB.textContent = teamB.name;

    // Super Tackle tags on court
    const isSuperA = this.engine.isSuperTackleOn('teamA');
    const isSuperB = this.engine.isSuperTackleOn('teamB');

    if (activeRaidingTeam === 'teamB' && isSuperA) {
      this.teamASuperTackleActive.classList.remove('hidden');
    } else {
      this.teamASuperTackleActive.classList.add('hidden');
    }

    if (activeRaidingTeam === 'teamA' && isSuperB) {
      this.teamBSuperTackleActive.classList.remove('hidden');
    } else {
      this.teamBSuperTackleActive.classList.add('hidden');
    }

    // Render Court Players (On Court)
    this.renderCourtGrid('teamA', this.teamACourtGrid, teamA);
    this.renderCourtGrid('teamB', this.teamBCourtGrid, teamB);

    // Render Out Bench Queue (FIFO)
    this.renderBenchQueue('teamA', this.teamABenchQueue);
    this.renderBenchQueue('teamB', this.teamBBenchQueue);

    // Render Substitutes Bench
    this.renderSubstituteQueue('teamA', this.teamASubQueue);
    this.renderSubstituteQueue('teamB', this.teamBSubQueue);
  }

  renderCourtGrid(teamKey, container, team) {
    container.innerHTML = '';
    const onCourtPlayers = team.players.filter(p => p.isOnCourt);

    if (onCourtPlayers.length === 0) {
      container.innerHTML = `<div class="empty-bench-msg" style="color:#EF4444; grid-column:1/-1;">ALL PLAYERS OUT (LONA)!</div>`;
      return;
    }

    const { activeRaidingTeam, activeRaiderId } = this.engine.state;

    onCourtPlayers.forEach(p => {
      const card = document.createElement('div');
      card.className = `player-card ${teamKey === 'teamA' ? 'team-a' : 'team-b'}`;
      card.dataset.playerId = p.id;

      const isRaider = (teamKey === activeRaidingTeam && p.id === activeRaiderId);
      if (isRaider) {
        card.classList.add('active-raider-target');
      }

      card.innerHTML = `
        <div class="jersey-circle" style="color:${team.color}">${p.jersey}</div>
        <div class="player-name" title="${p.name}">${p.name}</div>
        <div class="player-role-tag">${p.role}</div>
        <div class="player-stats-mini">${p.raidPoints + p.bonusPoints + p.tacklePoints} pts</div>
      `;

      card.addEventListener('click', () => {
        if (teamKey === activeRaidingTeam) {
          this.engine.setActiveRaider(p.id);
          this.renderAll();
        } else {
          this.toggleDefenderTouch(p.id);
        }
      });

      container.appendChild(card);
    });
  }

  renderBenchQueue(teamKey, container) {
    container.innerHTML = '';
    const benchPlayers = this.engine.getBenchPlayers(teamKey);

    if (benchPlayers.length === 0) {
      container.innerHTML = `<div class="empty-bench-msg">No players on out bench</div>`;
      return;
    }

    benchPlayers.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = `bench-card ${idx === 0 ? 'next-to-revive' : ''}`;
      card.innerHTML = `
        <div class="bench-order-num">#${idx + 1}</div>
        <div class="bench-player-info">
          <strong>#${p.jersey} ${p.name}</strong>
          <small>${p.role} (Out)</small>
        </div>
      `;
      container.appendChild(card);
    });
  }

  renderSubstituteQueue(teamKey, container) {
    if (!container) return;
    container.innerHTML = '';
    const subs = this.engine.getSubstitutes(teamKey);

    if (subs.length === 0) {
      container.innerHTML = `<div class="empty-bench-msg">No substitutes listed</div>`;
      return;
    }

    subs.forEach(p => {
      const pill = document.createElement('div');
      pill.className = 'sub-player-card';
      pill.title = `Click to swap #${p.jersey} ${p.name} into the match`;
      pill.innerHTML = `
        <span class="sub-num-badge">#${p.jersey}</span>
        <strong>${p.name}</strong>
        <small class="muted">(${p.role})</small>
      `;
      pill.addEventListener('click', () => {
        this.openSubstitutionModal(teamKey, p.id);
      });
      container.appendChild(pill);
    });
  }

  // -------------------------------------------------------------
  // 4. RENDER ACTION DESK
  // -------------------------------------------------------------
  renderActionDesk() {
    const { activeRaidingTeam, activeRaiderId } = this.engine.state;
    const defendingTeam = this.engine.getDefendingTeam();

    // Toggle Buttons style
    this.selectRaidingTeamABtn.textContent = this.engine.state.teamA.name.split(' ')[0] || 'Team A';
    this.selectRaidingTeamBBtn.textContent = this.engine.state.teamB.name.split(' ')[0] || 'Team B';

    if (activeRaidingTeam === 'teamA') {
      this.selectRaidingTeamABtn.className = 'team-toggle-btn active-raiding-a';
      this.selectRaidingTeamBBtn.className = 'team-toggle-btn';
    } else {
      this.selectRaidingTeamABtn.className = 'team-toggle-btn';
      this.selectRaidingTeamBBtn.className = 'team-toggle-btn active-raiding-b';
    }

    // Active Raider Pills
    const onCourtRaiders = this.engine.getOnCourtPlayers(activeRaidingTeam);
    this.raiderPillsList.innerHTML = '';

    if (onCourtRaiders.length === 0) {
      this.raiderPillsList.innerHTML = `<div class="empty-bench-msg" style="color:#EF4444">No active players on court!</div>`;
      this.activeRaiderStats.textContent = 'None';
    } else {
      if (!onCourtRaiders.some(p => p.id === activeRaiderId)) {
        const nextRaider = onCourtRaiders.find(p => p.role === 'Raider') || onCourtRaiders[0];
        this.engine.setActiveRaider(nextRaider.id);
      }

      onCourtRaiders.forEach(p => {
        const isSelected = (p.id === this.engine.state.activeRaiderId);
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `raider-pill ${isSelected ? 'selected' : ''}`;
        pill.innerHTML = `
          <span class="raider-pill-num">#${p.jersey}</span>
          <span>${p.name}</span>
        `;
        pill.addEventListener('click', () => {
          this.engine.setActiveRaider(p.id);
          this.renderCourts();
          this.renderActionDesk();
        });
        this.raiderPillsList.appendChild(pill);
      });

      const currentRaider = this.engine.getPlayer(this.engine.state.activeRaiderId)?.player;
      if (currentRaider) {
        this.activeRaiderStats.textContent = `P: ${currentRaider.raidPoints + currentRaider.bonusPoints} | T: ${currentRaider.tacklePoints}`;
        this.tackledRaiderName.textContent = `#${currentRaider.jersey} ${currentRaider.name}`;
      } else {
        this.activeRaiderStats.textContent = 'P: 0 | T: 0';
        this.tackledRaiderName.textContent = 'Raider';
      }
    }

    // Render Defender Touch Chips
    this.renderDefenderTouchChips(defendingTeam);

    // Render Tackle Defending Primary radio selector
    this.renderTackleDefenderRadios(defendingTeam);

    // Super Tackle Detection Card
    const isSuperTackle = this.engine.isSuperTackleOn(defendingTeam.id);
    if (isSuperTackle) {
      this.superTackleCard.classList.add('active');
      this.superTackleCardDesc.innerHTML = `Defending team has <strong>${this.engine.getOnCourtPlayers(defendingTeam.id).length} players</strong> (&le;3) on court. Successful tackle awards <strong>2 POINTS</strong>!`;
      this.commitTackleBtnText.textContent = 'COMMIT SUPER TACKLE (+2 PTS)';
    } else {
      this.superTackleCard.classList.remove('active');
      this.commitTackleBtnText.textContent = 'COMMIT TACKLE (+1 PT)';
    }

    this.updateRaidPointPreview();
  }

  renderDefenderTouchChips(defendingTeam) {
    this.defenderTouchChips.innerHTML = '';
    const onCourtDefenders = this.engine.getOnCourtPlayers(defendingTeam.id);

    const validIds = new Set(onCourtDefenders.map(p => p.id));
    this.selectedDefenderTouches = new Set(
      [...this.selectedDefenderTouches].filter(id => validIds.has(id))
    );

    if (onCourtDefenders.length === 0) {
      this.defenderTouchChips.innerHTML = `<div class="empty-bench-msg">No defenders left on court!</div>`;
      return;
    }

    onCourtDefenders.forEach(p => {
      const isSelected = this.selectedDefenderTouches.has(p.id);
      const chip = document.createElement('div');
      chip.className = `defender-chip ${isSelected ? 'selected' : ''}`;
      chip.innerHTML = `
        <span class="defender-num-badge">#${p.jersey}</span>
        <span>${p.name}</span>
      `;
      chip.addEventListener('click', () => {
        this.toggleDefenderTouch(p.id);
      });
      this.defenderTouchChips.appendChild(chip);
    });
  }

  renderTackleDefenderRadios(defendingTeam) {
    this.tackleCreditedDefenderGrid.innerHTML = '';
    const onCourtDefenders = this.engine.getOnCourtPlayers(defendingTeam.id);

    if (onCourtDefenders.length === 0) {
      this.tackleCreditedDefenderGrid.innerHTML = `<div class="empty-bench-msg">No defenders available.</div>`;
      return;
    }

    if (!this.selectedTackleDefenderId || !onCourtDefenders.some(p => p.id === this.selectedTackleDefenderId)) {
      this.selectedTackleDefenderId = onCourtDefenders[0].id;
    }

    onCourtDefenders.forEach(p => {
      const isSelected = (p.id === this.selectedTackleDefenderId);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `defender-radio-btn ${isSelected ? 'selected' : ''}`;
      btn.innerHTML = `
        <strong>#${p.jersey}</strong>
        <span>${p.name}</span>
      `;
      btn.addEventListener('click', () => {
        this.selectedTackleDefenderId = p.id;
        this.renderTackleDefenderRadios(defendingTeam);
      });
      this.tackleCreditedDefenderGrid.appendChild(btn);
    });
  }

  toggleDefenderTouch(playerId) {
    if (this.selectedDefenderTouches.has(playerId)) {
      this.selectedDefenderTouches.delete(playerId);
    } else {
      this.selectedDefenderTouches.add(playerId);
    }
    const defendingTeam = this.engine.getDefendingTeam();
    this.renderDefenderTouchChips(defendingTeam);
    this.updateRaidPointPreview();
  }

  selectQuickTouches(count) {
    if (count === 0) {
      this.resetRaidSelection();
      return;
    }

    const defendingTeam = this.engine.getDefendingTeam();
    const onCourtDefenders = this.engine.getOnCourtPlayers(defendingTeam.id);
    if (onCourtDefenders.length === 0) {
      this.showToast('No defenders currently on court to tag!', 'info');
      return;
    }

    this.selectedDefenderTouches.clear();

    if (count <= onCourtDefenders.length) {
      for (let i = 0; i < count; i++) {
        this.selectedDefenderTouches.add(onCourtDefenders[i].id);
      }
    } else {
      // Select all available defenders
      onCourtDefenders.forEach(p => this.selectedDefenderTouches.add(p.id));
      // For +3 or +4 Super Raid when fewer defenders on court, automatically check bonus to reach 3+ points
      if (count >= 3 && this.bonusCheckbox) {
        this.bonusCheckbox.checked = true;
      }
    }

    this.renderDefenderTouchChips(defendingTeam);
    this.updateRaidPointPreview();
  }

  updateRaidPointPreview() {
    const touchCount = this.selectedDefenderTouches.size;
    const hasBonus = this.bonusCheckbox.checked;
    const totalPts = touchCount + (hasBonus ? 1 : 0);

    this.raidTotalPreview.textContent = totalPts;

    if (totalPts === 0) {
      this.raidDetailPreview.textContent = 'Select touched defenders or check bonus point to commit raid';
      this.commitRaidBtn.disabled = true;
      this.commitRaidBtn.classList.remove('btn-super-raid');
      this.commitRaidBtn.innerHTML = `
        <span class="btn-icon">⚡</span>
        <span class="btn-text">COMMIT RAID POINTS</span>
      `;
    } else {
      const raidingTeam = this.engine.getRaidingTeam();
      const benchCount = raidingTeam.benchQueue.length;
      const revivesPossible = Math.min(touchCount, benchCount);

      let text = `Raider will score <strong>+${totalPts} Point${totalPts > 1 ? 's' : ''}</strong> `;
      if (touchCount > 0 && hasBonus) text += `(${touchCount} touch + 1 bonus). `;
      else if (touchCount > 0) text += `(${touchCount} touch). `;
      else text += `(Bonus point). `;

      if (touchCount > 0) {
        text += `<strong>${touchCount} Defender${touchCount > 1 ? 's' : ''} will go OUT</strong> to the bench. `;
      }
      if (revivesPossible > 0) {
        text += `<span style="color:#34D399">Revives <strong>${revivesPossible} player${revivesPossible > 1 ? 's' : ''}</strong> (FIFO)!</span>`;
      } else if (touchCount > 0) {
        text += `<span class="muted">All teammates already on court.</span>`;
      }

      if (totalPts >= 3) {
        text = `🔥 <strong>SUPER RAID!</strong> ` + text;
        this.commitRaidBtn.classList.add('btn-super-raid');
        this.commitRaidBtn.innerHTML = `
          <span class="btn-icon">🔥</span>
          <span class="btn-text">COMMIT SUPER RAID (+${totalPts} PTS)</span>
        `;
      } else {
        this.commitRaidBtn.classList.remove('btn-super-raid');
        this.commitRaidBtn.innerHTML = `
          <span class="btn-icon">⚡</span>
          <span class="btn-text">COMMIT RAID (+${totalPts} PT${totalPts > 1 ? 'S' : ''})</span>
        `;
      }

      this.raidDetailPreview.innerHTML = text;
      this.commitRaidBtn.disabled = false;
    }
  }

  resetRaidSelection() {
    this.selectedDefenderTouches.clear();
    this.bonusCheckbox.checked = false;
    this.updateRaidPointPreview();
  }

  // -------------------------------------------------------------
  // 5. RENDER FEED / COMMENTARY
  // -------------------------------------------------------------
  renderFeed() {
    this.feedItemsContainer.innerHTML = '';
    const logs = this.engine.logs;

    if (logs.length === 0) {
      this.feedItemsContainer.innerHTML = `<div class="feed-welcome">Match initialized. Select a raider and log the first action!</div>`;
      return;
    }

    logs.forEach(log => {
      const item = document.createElement('div');
      item.className = `feed-item`;

      let badgeClass = 'feed-badge-raid';
      let badgeLabel = 'RAID';

      if (log.type === 'tackle' || log.type === 'super-tackle') {
        badgeClass = 'feed-badge-tackle';
        badgeLabel = log.type === 'super-tackle' ? 'SUPER TACKLE' : 'TACKLE';
      } else if (log.type === 'allout') {
        badgeClass = 'feed-badge-allout';
        badgeLabel = 'ALL-OUT';
        item.classList.add('feed-allout');
      } else if (log.type === 'super-raid') {
        badgeClass = 'feed-badge-raid';
        badgeLabel = 'SUPER RAID';
      } else if (log.type === 'empty') {
        badgeClass = 'feed-badge-empty';
        badgeLabel = 'EMPTY';
      } else if (log.type === 'technical') {
        badgeClass = 'feed-badge-allout';
        badgeLabel = 'TECH PT';
      }

      item.innerHTML = `
        <div class="feed-top-row">
          <span class="feed-badge ${badgeClass}">${badgeLabel}</span>
          <span class="feed-time">H${log.half} • ${log.timestamp}</span>
        </div>
        <div class="feed-desc">${log.description}</div>
      `;

      this.feedItemsContainer.appendChild(item);
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'super' ? 'toast-super' : ''} ${type === 'allout' ? 'toast-allout' : ''}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'super' ? '🔥' : type === 'allout' ? '💥' : '⚡'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // -------------------------------------------------------------
  // 6. CLOCK EDIT MODAL
  // -------------------------------------------------------------
  openClockModal() {
    const s = this.engine.state;
    const mm = Math.floor(s.matchTimeRemaining / 60);
    const ss = s.matchTimeRemaining % 60;

    document.getElementById('clockEditMinutes').value = mm;
    document.getElementById('clockEditSeconds').value = ss;
    document.getElementById('clockEditRaidSeconds').value = s.raidTimeRemaining;

    this.clockModal.classList.remove('hidden');
  }

  // -------------------------------------------------------------
  // 7. SUBSTITUTION MODAL
  // -------------------------------------------------------------
  openSubstitutionModal(teamKey = 'teamA', preselectedSubId = null) {
    this.subTeamKey = teamKey;
    this.subSelectedOutId = null;
    this.subSelectedInId = preselectedSubId || null;

    this.renderSubstitutionModal();
    this.substitutionModal.classList.remove('hidden');
  }

  renderSubstitutionModal() {
    const team = this.engine.getTeam(this.subTeamKey);
    const btnA = document.getElementById('subSelectTeamABtn');
    const btnB = document.getElementById('subSelectTeamBBtn');

    btnA.className = this.subTeamKey === 'teamA' ? 'team-toggle-btn active-raiding-a' : 'team-toggle-btn';
    btnB.className = this.subTeamKey === 'teamB' ? 'team-toggle-btn active-raiding-b' : 'team-toggle-btn';
    btnA.textContent = this.engine.state.teamA.name.split(' ')[0] || 'Team A';
    btnB.textContent = this.engine.state.teamB.name.split(' ')[0] || 'Team B';

    // 1. On-court players
    const onCourtList = document.getElementById('subOnCourtList');
    onCourtList.innerHTML = '';
    const onCourtPlayers = team.players.filter(p => p.isOnCourt);

    onCourtPlayers.forEach(p => {
      const item = document.createElement('div');
      const isSelected = (p.id === this.subSelectedOutId);
      item.className = `sub-pick-item ${isSelected ? 'selected-out' : ''}`;
      item.innerHTML = `
        <span><strong>#${p.jersey}</strong> ${p.name} <small class="muted">(${p.role})</small></span>
        <span>${isSelected ? '🔴 EXITING' : 'Select'}</span>
      `;
      item.addEventListener('click', () => {
        this.subSelectedOutId = p.id;
        this.renderSubstitutionModal();
      });
      onCourtList.appendChild(item);
    });

    // 2. Available substitutes
    const subList = document.getElementById('subAvailableList');
    subList.innerHTML = '';
    const substitutes = team.substitutes || [];

    if (substitutes.length === 0) {
      subList.innerHTML = `<div class="empty-bench-msg">No substitutes registered for ${team.name}</div>`;
    } else {
      substitutes.forEach(p => {
        const isSelected = (p.id === this.subSelectedInId);
        const item = document.createElement('div');
        item.className = `sub-pick-item ${isSelected ? 'selected-in' : ''}`;
        item.innerHTML = `
          <span><strong>#${p.jersey}</strong> ${p.name} <small class="muted">(${p.role})</small></span>
          <span>${isSelected ? '🟢 ENTERING' : 'Select'}</span>
        `;
        item.addEventListener('click', () => {
          this.subSelectedInId = p.id;
          this.renderSubstitutionModal();
        });
        subList.appendChild(item);
      });
    }

    // Update banner & confirm button
    const banner = document.getElementById('subSummaryBanner');
    const confirmBtn = document.getElementById('confirmSubModalBtn');

    if (this.subSelectedOutId && this.subSelectedInId) {
      const outP = team.players.find(p => p.id === this.subSelectedOutId);
      const inP = team.substitutes.find(p => p.id === this.subSelectedInId);
      banner.innerHTML = `🔄 <strong>${team.name}:</strong> #${inP.jersey} <strong>${inP.name}</strong> will ENTER COURT replacing #${outP.jersey} <strong>${outP.name}</strong>.`;
      confirmBtn.disabled = false;
    } else {
      banner.textContent = 'Select one on-court player to exit and one substitute to enter.';
      confirmBtn.disabled = true;
    }
  }

  // -------------------------------------------------------------
  // 8. RENAME TEAM MODAL
  // -------------------------------------------------------------
  openRenameModal(teamKey) {
    const team = this.engine.getTeam(teamKey);
    document.getElementById('renameTeamTargetKey').value = teamKey;
    document.getElementById('renameTeamLabel').textContent = `Enter New Name for ${teamKey === 'teamA' ? 'Team A' : 'Team B'}:`;
    document.getElementById('renameTeamInput').value = team.name;
    this.renameModal.classList.remove('hidden');
    setTimeout(() => document.getElementById('renameTeamInput').select(), 100);
  }

  // -------------------------------------------------------------
  // 9. SAVE MATCH MODAL
  // -------------------------------------------------------------
  openSaveMatchModal() {
    const s = this.engine.state;
    const diff = s.teamA.score - s.teamB.score;
    let winner = 'Scores Tied';
    if (diff > 0) winner = `🏆 ${s.teamA.name} Wins by ${diff} points!`;
    else if (diff < 0) winner = `🏆 ${s.teamB.name} Wins by ${Math.abs(diff)} points!`;

    document.getElementById('saveMatchPreview').innerHTML = `
      <div style="font-size: 1.3rem; font-weight: 800; font-family: var(--font-display);">
        ${s.teamA.name} <span style="color:var(--accent-gold); font-size: 2rem;">${s.teamA.score}</span> - 
        <span style="color:var(--accent-gold); font-size: 2rem;">${s.teamB.score}</span> ${s.teamB.name}
      </div>
      <div style="color: #34D399; font-weight: 700;">${winner}</div>
      <small class="muted">H${s.matchHalf} • ${s.teamA.raidPoints + s.teamB.raidPoints} Total Raid Pts • ${s.teamA.tacklePoints + s.teamB.tacklePoints} Total Tackle Pts</small>
    `;

    document.getElementById('saveMatchTitleInput').value = `${s.teamA.name} vs ${s.teamB.name}`;
    document.getElementById('saveMatchNotesInput').value = `Match played on ${new Date().toLocaleDateString()}`;
    this.saveMatchModal.classList.remove('hidden');
  }

  // -------------------------------------------------------------
  // 10. MATCH ARCHIVES & HISTORY MODAL
  // -------------------------------------------------------------
  openHistoryModal() {
    this.renderHistoryModal();
    this.historyModal.classList.remove('hidden');
  }

  renderHistoryModal() {
    const archives = this.engine.getArchivedMatches();
    document.getElementById('historyCountDisplay').textContent = archives.length;
    const container = document.getElementById('historyCardsContainer');
    container.innerHTML = '';

    if (archives.length === 0) {
      container.innerHTML = `
        <div class="empty-bench-msg" style="padding: 40px;">
          📁 No matches archived yet.<br>Click "💾 Save Match" in the top bar to store match summaries here!
        </div>
      `;
      return;
    }

    archives.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'match-archive-card';

      const dateStr = item.savedAt ? new Date(item.savedAt).toLocaleString() : 'Recent Match';
      const teamA = item.teamA || { name: 'Team A', score: item.scoreA || 0, raidPoints: 0, tacklePoints: 0 };
      const teamB = item.teamB || { name: 'Team B', score: item.scoreB || 0, raidPoints: 0, tacklePoints: 0 };
      const itemId = item.id || item.matchId || ('match_' + index);

      card.innerHTML = `
        <div class="archive-card-top">
          <span class="archive-title">#${archives.length - index} • ${item.matchTitle || `${teamA.name} vs ${teamB.name}`}</span>
          <span class="archive-date">${dateStr}</span>
        </div>

        <div class="archive-score-hero">
          <div class="archive-team">
            <h3>${teamA.name}</h3>
            <span class="archive-score">${item.scoreA !== undefined ? item.scoreA : teamA.score}</span>
            <small class="muted">R: ${teamA.raidPoints || 0} | T: ${teamA.tacklePoints || 0}</small>
          </div>

          <div class="archive-vs-col">
            <span class="archive-winner-badge">${item.winner === 'Tie' ? 'MATCH TIED' : `${item.winner || 'WINNER'} WON`}</span>
            <small class="muted">Margin: ${item.margin !== undefined ? item.margin : Math.abs((item.scoreA || 0) - (item.scoreB || 0))} Pts</small>
          </div>

          <div class="archive-team">
            <h3>${teamB.name}</h3>
            <span class="archive-score">${item.scoreB !== undefined ? item.scoreB : teamB.score}</span>
            <small class="muted">R: ${teamB.raidPoints || 0} | T: ${teamB.tacklePoints || 0}</small>
          </div>
        </div>

        <div class="archive-performers">
          <span>⚡ Top Raider: <strong>${item.topRaider ? `${item.topRaider.name} (${item.topRaider.points} pts)` : 'N/A'}</strong></span>
          <span>🛡️ Top Defender: <strong>${item.topDefender ? `${item.topDefender.name} (${item.topDefender.points} pts)` : 'N/A'}</strong></span>
        </div>

        ${item.notes ? `<div style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Notes: ${item.notes}</div>` : ''}

        <div class="archive-card-footer">
          <button class="btn btn-secondary btn-tiny-action" data-action="view-scorecard" data-id="${itemId}">📊 View Full Scorecard</button>
          <button class="btn btn-danger-micro" data-action="delete-archive" data-id="${itemId}">Delete</button>
        </div>
      `;

      // Event listener for action buttons
      card.querySelector('[data-action="view-scorecard"]').addEventListener('click', () => {
        this.openArchivedScorecard(item);
      });

      card.querySelector('[data-action="delete-archive"]').addEventListener('click', () => {
        if (confirm(`Delete archive "${item.matchTitle || 'this match'}"?`)) {
          this.engine.deleteArchivedMatch(itemId);
          this.renderHistoryModal();
        }
      });

      container.appendChild(card);
    });
  }

  openArchivedScorecard(archiveItem) {
    this.historyModal.classList.add('hidden');

    const teamA = archiveItem.teamA || { name: 'Team A', score: archiveItem.scoreA || 0, raidPoints: 0, tacklePoints: 0, allOutPoints: 0, superRaids: 0, players: [], substitutes: [] };
    const teamB = archiveItem.teamB || { name: 'Team B', score: archiveItem.scoreB || 0, raidPoints: 0, tacklePoints: 0, allOutPoints: 0, superRaids: 0, players: [], substitutes: [] };

    document.getElementById('statsSummaryTeamA').textContent = teamA.name;
    document.getElementById('statsSummaryTeamB').textContent = teamB.name;
    document.getElementById('statsScoreA').textContent = archiveItem.scoreA !== undefined ? archiveItem.scoreA : teamA.score;
    document.getElementById('statsScoreB').textContent = archiveItem.scoreB !== undefined ? archiveItem.scoreB : teamB.score;

    document.getElementById('statsMatchStatus').textContent = 'Archived Match';
    document.getElementById('statsMatchTime').textContent = archiveItem.savedAt ? new Date(archiveItem.savedAt).toLocaleDateString() : 'Finished';

    const raidA = teamA.raidPoints || 0;
    const raidB = teamB.raidPoints || 0;
    document.getElementById('statsRaidPtsA').textContent = raidA;
    document.getElementById('statsRaidPtsB').textContent = raidB;
    const totalRaid = (raidA + raidB) || 1;
    document.getElementById('barFillRaidA').style.width = `${(raidA / totalRaid) * 100}%`;
    document.getElementById('barFillRaidB').style.width = `${(raidB / totalRaid) * 100}%`;

    const tackleA = teamA.tacklePoints || 0;
    const tackleB = teamB.tacklePoints || 0;
    document.getElementById('statsTacklePtsA').textContent = tackleA;
    document.getElementById('statsTacklePtsB').textContent = tackleB;
    const totalTackle = (tackleA + tackleB) || 1;
    document.getElementById('barFillTackleA').style.width = `${(tackleA / totalTackle) * 100}%`;
    document.getElementById('barFillTackleB').style.width = `${(tackleB / totalTackle) * 100}%`;

    const allOutA = teamA.allOutPoints || 0;
    const allOutB = teamB.allOutPoints || 0;
    document.getElementById('statsAllOutPtsA').textContent = allOutA;
    document.getElementById('statsAllOutPtsB').textContent = allOutB;
    const totalAllOut = (allOutA + allOutB) || 1;
    document.getElementById('barFillAllOutA').style.width = `${(allOutA / totalAllOut) * 100}%`;
    document.getElementById('barFillAllOutB').style.width = `${(allOutB / totalAllOut) * 100}%`;

    const srA = archiveItem.teamA.superRaids || 0;
    const srB = archiveItem.teamB.superRaids || 0;
    const statsSuperRaidA = document.getElementById('statsSuperRaidA');
    const statsSuperRaidB = document.getElementById('statsSuperRaidB');
    if (statsSuperRaidA) statsSuperRaidA.textContent = srA;
    if (statsSuperRaidB) statsSuperRaidB.textContent = srB;
    const totalSR = (srA + srB) || 1;
    const barSRA = document.getElementById('barFillSuperRaidA');
    const barSRB = document.getElementById('barFillSuperRaidB');
    if (barSRA) barSRA.style.width = `${(srA / totalSR) * 100}%`;
    if (barSRB) barSRB.style.width = `${(srB / totalSR) * 100}%`;

    this.populatePlayerTable('tbodyTeamA', archiveItem.teamA);
    this.populatePlayerTable('tbodyTeamB', archiveItem.teamB);
    document.getElementById('statsTableTitleA').textContent = `${archiveItem.teamA.name} Player Stats`;
    document.getElementById('statsTableTitleB').textContent = `${archiveItem.teamB.name} Player Stats`;

    this.statsModal.classList.remove('hidden');
  }

  // -------------------------------------------------------------
  // 11. SCORECARD MODAL POPULATION
  // -------------------------------------------------------------
  populateScorecardModal() {
    const { teamA, teamB, matchHalf, matchTimeRemaining } = this.engine.state;

    document.getElementById('statsSummaryTeamA').textContent = teamA.name;
    document.getElementById('statsSummaryTeamB').textContent = teamB.name;
    document.getElementById('statsScoreA').textContent = teamA.score;
    document.getElementById('statsScoreB').textContent = teamB.score;

    document.getElementById('statsMatchStatus').textContent = matchHalf === 1 ? '1st Half' : '2nd Half';
    const mm = String(Math.floor(matchTimeRemaining / 60)).padStart(2, '0');
    const ss = String(matchTimeRemaining % 60).padStart(2, '0');
    document.getElementById('statsMatchTime').textContent = `${mm}:${ss}`;

    document.getElementById('statsRaidPtsA').textContent = teamA.raidPoints;
    document.getElementById('statsRaidPtsB').textContent = teamB.raidPoints;
    const totalRaid = (teamA.raidPoints + teamB.raidPoints) || 1;
    document.getElementById('barFillRaidA').style.width = `${(teamA.raidPoints / totalRaid) * 100}%`;
    document.getElementById('barFillRaidB').style.width = `${(teamB.raidPoints / totalRaid) * 100}%`;

    document.getElementById('statsTacklePtsA').textContent = teamA.tacklePoints;
    document.getElementById('statsTacklePtsB').textContent = teamB.tacklePoints;
    const totalTackle = (teamA.tacklePoints + teamB.tacklePoints) || 1;
    document.getElementById('barFillTackleA').style.width = `${(teamA.tacklePoints / totalTackle) * 100}%`;
    document.getElementById('barFillTackleB').style.width = `${(teamB.tacklePoints / totalTackle) * 100}%`;

    document.getElementById('statsAllOutPtsA').textContent = teamA.allOutPoints;
    document.getElementById('statsAllOutPtsB').textContent = teamB.allOutPoints;
    const totalAllOut = (teamA.allOutPoints + teamB.allOutPoints) || 1;
    document.getElementById('barFillAllOutA').style.width = `${(teamA.allOutPoints / totalAllOut) * 100}%`;
    document.getElementById('barFillAllOutB').style.width = `${(teamB.allOutPoints / totalAllOut) * 100}%`;

    const srA = teamA.superRaids || 0;
    const srB = teamB.superRaids || 0;
    const statsSuperRaidA = document.getElementById('statsSuperRaidA');
    const statsSuperRaidB = document.getElementById('statsSuperRaidB');
    if (statsSuperRaidA) statsSuperRaidA.textContent = srA;
    if (statsSuperRaidB) statsSuperRaidB.textContent = srB;
    const totalSR = (srA + srB) || 1;
    const barSRA = document.getElementById('barFillSuperRaidA');
    const barSRB = document.getElementById('barFillSuperRaidB');
    if (barSRA) barSRA.style.width = `${(srA / totalSR) * 100}%`;
    if (barSRB) barSRB.style.width = `${(srB / totalSR) * 100}%`;

    this.populatePlayerTable('tbodyTeamA', teamA);
    this.populatePlayerTable('tbodyTeamB', teamB);
    document.getElementById('statsTableTitleA').textContent = `${teamA.name} Player Stats`;
    document.getElementById('statsTableTitleB').textContent = `${teamB.name} Player Stats`;
  }

  populatePlayerTable(tbodyId, team) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';

    // Active roster
    team.players.forEach(p => {
      const tr = document.createElement('tr');
      const totalPoints = p.raidPoints + p.bonusPoints + p.tacklePoints;
      const statusBadge = p.isOnCourt 
        ? `<span class="status-badge-oncourt">On Court</span>` 
        : `<span class="status-badge-out">Out (Bench)</span>`;

      tr.innerHTML = `
        <td><strong>#${p.jersey}</strong></td>
        <td>${p.name}</td>
        <td><small class="muted">${p.role}</small></td>
        <td><strong>${totalPoints}</strong></td>
        <td>${p.raidPoints} / ${p.bonusPoints}</td>
        <td><strong style="color:var(--accent-gold); font-size:1.05rem;">${p.superRaids || 0}</strong></td>
        <td>${p.tacklePoints}</td>
        <td>${p.outsCount}</td>
        <td>${statusBadge}</td>
      `;
      tbody.appendChild(tr);
    });

    // Substitutes
    (team.substitutes || []).forEach(p => {
      const tr = document.createElement('tr');
      const totalPoints = p.raidPoints + p.bonusPoints + p.tacklePoints;
      tr.innerHTML = `
        <td><strong style="color:#34D399">#${p.jersey}</strong></td>
        <td>${p.name} <small style="color:#34D399">(Sub)</small></td>
        <td><small class="muted">${p.role}</small></td>
        <td><strong>${totalPoints}</strong></td>
        <td>${p.raidPoints} / ${p.bonusPoints}</td>
        <td><strong style="color:var(--accent-gold); font-size:1.05rem;">${p.superRaids || 0}</strong></td>
        <td>${p.tacklePoints}</td>
        <td>${p.outsCount}</td>
        <td><span style="color:#34D399; font-weight:600;">Substitute</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // -------------------------------------------------------------
  // 12. SETUP MODAL POPULATION
  // -------------------------------------------------------------
  populateSetupModal() {
    const { teamA, teamB } = this.engine.state;

    document.getElementById('setupTeamAName').value = teamA.name;
    document.getElementById('setupTeamAColor').value = teamA.color;
    document.getElementById('teamAColorHex').textContent = teamA.color;

    document.getElementById('setupTeamBName').value = teamB.name;
    document.getElementById('setupTeamBColor').value = teamB.color;
    document.getElementById('teamBColorHex').textContent = teamB.color;

    this.renderRosterInputs('teamARosterInputs', teamA.players);
    this.renderRosterInputs('teamASubInputs', teamA.substitutes || [], 'AS');

    this.renderRosterInputs('teamBRosterInputs', teamB.players);
    this.renderRosterInputs('teamBSubInputs', teamB.substitutes || [], 'BS');
  }

  renderRosterInputs(containerId, playersList, idPrefix = 'P') {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    playersList.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'player-input-row';
      row.innerHTML = `
        <input type="text" class="form-input jersey-input" value="${p.jersey}" placeholder="#" data-idx="${idx}" data-field="jersey">
        <input type="text" class="form-input" value="${p.name}" placeholder="Player Name" data-idx="${idx}" data-field="name">
        <select class="role-select" data-idx="${idx}" data-field="role">
          <option value="Raider" ${p.role === 'Raider' ? 'selected' : ''}>Raider</option>
          <option value="Defender" ${p.role === 'Defender' ? 'selected' : ''}>Defender</option>
          <option value="All-Rounder" ${p.role === 'All-Rounder' ? 'selected' : ''}>All-Rounder</option>
        </select>
      `;
      container.appendChild(row);
    });
  }

  readRosterInputs(containerId, teamKey, isSub = false) {
    const container = document.getElementById(containerId);
    const existing = isSub 
      ? (this.engine.getTeam(teamKey).substitutes || [])
      : this.engine.getTeam(teamKey).players;

    const newPlayers = [];
    const rows = container.querySelectorAll('.player-input-row');

    rows.forEach((row, i) => {
      const jersey = row.querySelector('[data-field="jersey"]').value.trim() || String(i + 1);
      const name = row.querySelector('[data-field="name"]').value.trim() || `Player ${jersey}`;
      const role = row.querySelector('[data-field="role"]').value;
      const prev = existing[i] || {};

      newPlayers.push({
        id: prev.id || `${teamKey === 'teamA' ? 'A' : 'B'}${isSub ? 'S' : ''}${i + 1}`,
        name,
        jersey,
        role,
        isOnCourt: isSub ? false : (prev.isOnCourt !== undefined ? prev.isOnCourt : true),
        raidPoints: prev.raidPoints || 0,
        bonusPoints: prev.bonusPoints || 0,
        tacklePoints: prev.tacklePoints || 0,
        superRaids: prev.superRaids || 0,
        outsCount: prev.outsCount || 0,
        revivalsCount: prev.revivalsCount || 0
      });
    });

    return newPlayers;
  }
}

// Global UI instance
window.kabaddiUI = new KabaddiUI(window.kabaddiEngine);
