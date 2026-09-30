/**
 * Kabaddi Pro Scoreboard - Main Application Controller
 * Connects Engine, UI, Audio, Timers, Editable Clocks, Substitutions,
 * Per-Match Team Renaming, Match History Archives, and Keyboard Shortcuts.
 */

document.addEventListener('DOMContentLoaded', () => {
  const engine = window.kabaddiEngine;
  const ui = window.kabaddiUI;
  const audio = window.kabaddiAudio;

  // Initialize UI
  ui.init();

  // -------------------------------------------------------------
  // 1. TIMERS ENGINE
  // -------------------------------------------------------------
  let matchTimerInterval = null;
  let raidTimerInterval = null;

  function toggleMatchTimer() {
    if (!engine.isScorer()) return;
    audio.init();
    if (engine.state.matchTimerRunning) {
      clearInterval(matchTimerInterval);
      engine.state.matchTimerRunning = false;
      document.getElementById('matchTimerToggleBtn').textContent = '▶';
    } else {
      engine.state.matchTimerRunning = true;
      document.getElementById('matchTimerToggleBtn').textContent = '⏸';
      audio.whistle();
      matchTimerInterval = setInterval(() => {
        if (engine.state.matchTimeRemaining > 0) {
          engine.state.matchTimeRemaining--;
          ui.renderHeader();
        } else {
          // Half ended!
          clearInterval(matchTimerInterval);
          engine.state.matchTimerRunning = false;
          document.getElementById('matchTimerToggleBtn').textContent = '▶';
          audio.buzzer();
          ui.showToast(`⏱️ ${engine.state.matchHalf === 1 ? '1st Half' : '2nd Half'} Finished!`, 'info');
          engine.syncStateToServer();
        }
      }, 1000);
    }
    engine.syncStateToServer();
  }

  function resetMatchTimer() {
    if (!engine.isScorer()) return;
    clearInterval(matchTimerInterval);
    engine.state.matchTimerRunning = false;
    engine.state.matchTimeRemaining = 20 * 60;
    document.getElementById('matchTimerToggleBtn').textContent = '▶';
    ui.renderHeader();
    engine.syncStateToServer();
  }

  function toggleRaidTimer() {
    if (!engine.isScorer()) return;
    audio.init();
    if (engine.state.raidTimerRunning) {
      clearInterval(raidTimerInterval);
      engine.state.raidTimerRunning = false;
      document.getElementById('raidTimerToggleBtn').textContent = '▶';
    } else {
      engine.state.raidTimerRunning = true;
      document.getElementById('raidTimerToggleBtn').textContent = '⏸';
      audio.whistle();
      raidTimerInterval = setInterval(() => {
        if (engine.state.raidTimeRemaining > 0) {
          engine.state.raidTimeRemaining--;
          const isUrgent = engine.state.raidTimeRemaining <= 5;
          audio.tick(isUrgent);
          ui.renderHeader();
        } else {
          // 30s expired!
          clearInterval(raidTimerInterval);
          engine.state.raidTimerRunning = false;
          document.getElementById('raidTimerToggleBtn').textContent = '▶';
          audio.buzzer();
          if ('vibrate' in navigator) navigator.vibrate(400);
          ui.showToast('🚨 30-Second Raid Clock Expired!', 'allout');
        }
      }, 1000);
    }
    engine.syncStateToServer();
  }

  function resetRaidTimer() {
    clearInterval(raidTimerInterval);
    engine.state.raidTimerRunning = false;
    engine.state.raidTimeRemaining = 30;
    document.getElementById('raidTimerToggleBtn').textContent = '▶';
    ui.renderHeader();
  }

  document.getElementById('matchTimerToggleBtn').addEventListener('click', toggleMatchTimer);
  document.getElementById('matchTimerResetBtn').addEventListener('click', resetMatchTimer);
  document.getElementById('raidTimerToggleBtn').addEventListener('click', toggleRaidTimer);
  document.getElementById('raidTimerResetBtn').addEventListener('click', () => {
    resetRaidTimer();
    engine.syncStateToServer();
  });

  // -------------------------------------------------------------
  // 2. USER-EDITABLE CLOCKS (Match Clock & Raid Clock)
  // -------------------------------------------------------------
  const clockModal = document.getElementById('clockModal');

  // Trigger modal from clock displays or edit buttons
  [
    document.getElementById('editMatchTimeBtn'),
    document.getElementById('matchTimeDisplay'),
    document.getElementById('editRaidTimeBtn'),
    document.getElementById('raidTimeDisplay')
  ].forEach(el => {
    if (el) {
      el.addEventListener('click', () => {
        ui.openClockModal();
      });
    }
  });

  // Preset Buttons for Match Clock
  document.querySelectorAll('.btn-clock-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('clockEditMinutes').value = btn.dataset.min;
      document.getElementById('clockEditSeconds').value = btn.dataset.sec;
    });
  });

  // Increment / Decrement buttons for Match Clock
  document.querySelectorAll('.btn-clock-adjust').forEach(btn => {
    btn.addEventListener('click', () => {
      const adj = parseInt(btn.dataset.adj, 10);
      let mins = parseInt(document.getElementById('clockEditMinutes').value, 10) || 0;
      let secs = parseInt(document.getElementById('clockEditSeconds').value, 10) || 0;
      let total = mins * 60 + secs + adj;
      if (total < 0) total = 0;
      document.getElementById('clockEditMinutes').value = Math.floor(total / 60);
      document.getElementById('clockEditSeconds').value = total % 60;
    });
  });

  // Preset buttons for Raid Clock
  document.querySelectorAll('.btn-raid-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('clockEditRaidSeconds').value = btn.dataset.sec;
    });
  });

  // Adjust buttons for Raid Clock
  document.querySelectorAll('.btn-raid-adjust').forEach(btn => {
    btn.addEventListener('click', () => {
      const adj = parseInt(btn.dataset.adj, 10);
      let secs = parseInt(document.getElementById('clockEditRaidSeconds').value, 10) || 30;
      let total = secs + adj;
      if (total < 1) total = 1;
      if (total > 60) total = 60;
      document.getElementById('clockEditRaidSeconds').value = total;
    });
  });

  // Apply Clocks
  document.getElementById('saveClockModalBtn').addEventListener('click', () => {
    const mins = parseInt(document.getElementById('clockEditMinutes').value, 10) || 0;
    const secs = parseInt(document.getElementById('clockEditSeconds').value, 10) || 0;
    const raidSecs = parseInt(document.getElementById('clockEditRaidSeconds').value, 10) || 30;

    engine.setMatchTime(mins * 60 + secs);
    engine.setRaidTime(raidSecs);

    clockModal.classList.add('hidden');
    ui.renderHeader();
    ui.showToast('⏱️ Clocks successfully adjusted!');
  });

  document.getElementById('closeClockModalBtn').addEventListener('click', () => {
    clockModal.classList.add('hidden');
  });
  document.getElementById('cancelClockModalBtn').addEventListener('click', () => {
    clockModal.classList.add('hidden');
  });

  // -------------------------------------------------------------
  // 3. EDIT TEAM NAMES MATCH BY MATCH
  // -------------------------------------------------------------
  const renameModal = document.getElementById('renameModal');

  [
    { trigger: document.getElementById('renameTeamABtn'), title: document.getElementById('teamANameDisplay'), key: 'teamA' },
    { trigger: document.getElementById('renameTeamBBtn'), title: document.getElementById('teamBNameDisplay'), key: 'teamB' }
  ].forEach(pair => {
    if (pair.trigger) {
      pair.trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        ui.openRenameModal(pair.key);
      });
    }
    if (pair.title) {
      pair.title.addEventListener('click', () => {
        ui.openRenameModal(pair.key);
      });
    }
  });

  document.getElementById('saveRenameBtn').addEventListener('click', () => {
    const targetKey = document.getElementById('renameTeamTargetKey').value;
    const newName = document.getElementById('renameTeamInput').value.trim();
    if (newName) {
      engine.renameTeam(targetKey, newName);
      renameModal.classList.add('hidden');
      ui.renderScoreboard();
      ui.renderCourts();
      ui.renderActionDesk();
      ui.showToast(`Team name updated to "${newName.toUpperCase()}"`);
    }
  });

  document.getElementById('closeRenameModalBtn').addEventListener('click', () => {
    renameModal.classList.add('hidden');
  });
  document.getElementById('cancelRenameModalBtn').addEventListener('click', () => {
    renameModal.classList.add('hidden');
  });

  // -------------------------------------------------------------
  // 4. PLAYER SUBSTITUTION SYSTEM
  // -------------------------------------------------------------
  const substitutionModal = document.getElementById('substitutionModal');

  document.getElementById('substituteTeamABtn').addEventListener('click', () => {
    ui.openSubstitutionModal('teamA');
  });
  document.getElementById('substituteTeamBBtn').addEventListener('click', () => {
    ui.openSubstitutionModal('teamB');
  });

  document.getElementById('subSelectTeamABtn').addEventListener('click', () => {
    ui.subTeamKey = 'teamA';
    ui.subSelectedOutId = null;
    ui.subSelectedInId = null;
    ui.renderSubstitutionModal();
  });

  document.getElementById('subSelectTeamBBtn').addEventListener('click', () => {
    ui.subTeamKey = 'teamB';
    ui.subSelectedOutId = null;
    ui.subSelectedInId = null;
    ui.renderSubstitutionModal();
  });

  document.getElementById('confirmSubModalBtn').addEventListener('click', () => {
    if (!ui.subSelectedOutId || !ui.subSelectedInId) return;

    const res = engine.substitutePlayer(ui.subTeamKey, ui.subSelectedOutId, ui.subSelectedInId);
    if (res.success) {
      substitutionModal.classList.add('hidden');
      ui.renderAll();
      audio.whistle();
      if ('vibrate' in navigator) navigator.vibrate(60);
      ui.showToast(`🔄 #${res.incomingSub.jersey} ${res.incomingSub.name} entered the match!`);
    } else {
      alert(res.message || 'Substitution failed');
    }
  });

  document.getElementById('closeSubModalBtn').addEventListener('click', () => {
    substitutionModal.classList.add('hidden');
  });
  document.getElementById('cancelSubModalBtn').addEventListener('click', () => {
    substitutionModal.classList.add('hidden');
  });

  // -------------------------------------------------------------
  // 5. SAVE MATCH & MATCH HISTORY ARCHIVES
  // -------------------------------------------------------------
  const saveMatchModal = document.getElementById('saveMatchModal');
  const historyModal = document.getElementById('historyModal');

  // Open Save Match Dialog
  document.getElementById('saveAndEndMatchBtn').addEventListener('click', () => {
    ui.openSaveMatchModal();
  });

  document.getElementById('confirmSaveMatchBtn').addEventListener('click', () => {
    const title = document.getElementById('saveMatchTitleInput').value.trim();
    const notes = document.getElementById('saveMatchNotesInput').value.trim();

    if (title) {
      engine.state.matchTitle = title;
    }

    const archived = engine.archiveCurrentMatch(notes);
    if (archived) {
      saveMatchModal.classList.add('hidden');
      audio.pointScored();
      ui.showToast('💾 Match summary saved to archives!');
    }
  });

  document.getElementById('closeSaveMatchModalBtn').addEventListener('click', () => {
    saveMatchModal.classList.add('hidden');
  });
  document.getElementById('cancelSaveMatchModalBtn').addEventListener('click', () => {
    saveMatchModal.classList.add('hidden');
  });

  // Open History Modal from anywhere
  const openHistoryHandler = () => {
    ui.openHistoryModal();
  };

  const matchHistoryBtn = document.getElementById('matchHistoryBtn');
  if (matchHistoryBtn) matchHistoryBtn.addEventListener('click', openHistoryHandler);

  const mSegmentArchivesBtn = document.getElementById('mSegmentArchivesBtn');
  if (mSegmentArchivesBtn) mSegmentArchivesBtn.addEventListener('click', openHistoryHandler);

  const specViewArchivesBtn = document.getElementById('specViewArchivesBtn');
  if (specViewArchivesBtn) specViewArchivesBtn.addEventListener('click', openHistoryHandler);

  const openArchivesFromStatsBtn = document.getElementById('openArchivesFromStatsBtn');
  if (openArchivesFromStatsBtn) {
    openArchivesFromStatsBtn.addEventListener('click', () => {
      if (statsModal) statsModal.classList.add('hidden');
      ui.openHistoryModal();
    });
  }

  document.getElementById('closeHistoryModalBtn').addEventListener('click', () => {
    historyModal.classList.add('hidden');
  });
  document.getElementById('closeHistoryModalFooterBtn').addEventListener('click', () => {
    historyModal.classList.add('hidden');
  });

  // Export All Archives as JSON
  document.getElementById('exportAllArchivesBtn').addEventListener('click', () => {
    const all = engine.getArchivedMatches();
    if (all.length === 0) {
      alert('No archived matches to export.');
      return;
    }

    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kabaddi-match-archives-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Clear All Archives
  document.getElementById('clearAllArchivesBtn').addEventListener('click', () => {
    if (confirm('Clear all stored match summaries? This action cannot be undone.')) {
      engine.clearAllArchives();
      ui.renderHistoryModal();
      ui.showToast('Match archives cleared.');
    }
  });

  // -------------------------------------------------------------
  // 6. GENERAL CONTROLS, AUDIO & SHORTCUTS
  // -------------------------------------------------------------
  document.getElementById('soundToggleBtn').addEventListener('click', () => {
    const isMuted = audio.toggleMute();
    document.getElementById('soundIcon').textContent = isMuted ? '🔇' : '🔊';
  });

  document.getElementById('undoBtn').addEventListener('click', () => {
    if (engine.undo()) {
      audio.playTone(350, 'sine', 0.15, 0.1);
      ui.resetRaidSelection();
      ui.renderAll();
      ui.showToast('Last action undone');
    }
  });

  document.getElementById('switchHalfBtn').addEventListener('click', () => {
    if (confirm('Switch match half? Clock will reset to 20:00.')) {
      engine.switchHalf();
      resetMatchTimer();
      resetRaidTimer();
      ui.renderAll();
      audio.whistle();
    }
  });

  // Reset Match
  document.getElementById('newMatchBtn').addEventListener('click', () => {
    const teamAName = prompt('Enter Team A Name for new match:', engine.state.teamA.name);
    if (teamAName === null) return;
    const teamBName = prompt('Enter Team B Name for new match:', engine.state.teamB.name);
    if (teamBName === null) return;

    // Offer to archive current match before resetting if points scored
    if (engine.state.teamA.score > 0 || engine.state.teamB.score > 0) {
      if (confirm('Do you want to archive current match summary before starting the new match?')) {
        engine.archiveCurrentMatch('Auto-archived prior to new match reset');
      }
    }

    engine.resetMatch(teamAName.trim() || 'Team A', teamBName.trim() || 'Team B');
    resetMatchTimer();
    resetRaidTimer();
    ui.resetRaidSelection();
    ui.renderAll();
    audio.whistle();
    ui.showToast(`New Match Started: ${engine.state.teamA.name} vs ${engine.state.teamB.name}!`);
  });

  // -------------------------------------------------------------
  // 7. ACTION DESK TABS & TEAM TOGGLES
  // -------------------------------------------------------------
  const tabButtons = document.querySelectorAll('.action-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      document.getElementById(targetId)?.classList.add('active');
    });
  });

  document.getElementById('selectRaidingTeamABtn').addEventListener('click', () => {
    engine.setActiveRaidingTeam('teamA');
    resetRaidTimer();
    ui.resetRaidSelection();
    ui.renderAll();
  });

  document.getElementById('selectRaidingTeamBBtn').addEventListener('click', () => {
    engine.setActiveRaidingTeam('teamB');
    resetRaidTimer();
    ui.resetRaidSelection();
    ui.renderAll();
  });

  document.getElementById('bonusCheckbox').addEventListener('change', () => {
    ui.updateRaidPointPreview();
  });

  // Quick Raid Presets (+1, +2, +3 Super Raid, +4 Super Raid, Clear)
  document.querySelectorAll('.btn-touch-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const touches = parseInt(btn.dataset.touches, 10);
      ui.selectQuickTouches(touches);
      audio.init();
      audio.playTone(touches >= 3 ? 550 : 440, 'sine', 0.08, 0.08);
      if ('vibrate' in navigator) navigator.vibrate(touches >= 3 ? [40, 30, 40] : 25);
    });
  });

  // -------------------------------------------------------------
  // 8. COMMIT SCORING ACTIONS
  // -------------------------------------------------------------
  document.getElementById('commitRaidBtn').addEventListener('click', () => {
    const raiderId = engine.state.activeRaiderId;
    if (!raiderId) {
      alert('Please select an active raider from the on-court list.');
      return;
    }

    const touchedDefenderIds = Array.from(ui.selectedDefenderTouches);
    const hasBonus = document.getElementById('bonusCheckbox').checked;

    if (touchedDefenderIds.length === 0 && !hasBonus) {
      alert('Please select at least 1 touched defender or check the Bonus point box.');
      return;
    }

    const res = engine.commitRaid({
      raiderId,
      touchedDefenderIds,
      hasBonus
    });

    if (res.success) {
      if (res.isSuperRaid) {
        audio.superCelebration();
        ui.showToast(`🔥 SUPER RAID! +${res.totalRaidPoints} Points!`, 'super');
        if ('vibrate' in navigator) navigator.vibrate([60, 40, 80]);
      } else {
        audio.pointScored();
        if ('vibrate' in navigator) navigator.vibrate(50);
      }

      if (res.allOutOccurred) {
        audio.allOutGong();
        ui.showToast(`💥 ALL-OUT! +2 Points awarded! All players return to court!`, 'allout');
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
      }

      if (res.scoringTeamKey) {
        animateScore(res.scoringTeamKey === 'teamA' ? 'teamAScore' : 'teamBScore');
      } else {
        animateScore(engine.state.activeRaidingTeam === 'teamA' ? 'teamBScore' : 'teamAScore');
      }

      // Reset raid timer after raid concludes (match clock keeps running as before)
      resetRaidTimer();
      ui.resetRaidSelection();
      ui.renderAll();
    }
  });

  document.getElementById('emptyRaidBtn').addEventListener('click', () => {
    const raiderId = engine.state.activeRaiderId;
    if (!raiderId) return;

    const res = engine.commitEmptyRaid({ raiderId });

    if (res.doOrDieFailed) {
      audio.buzzer();
      ui.showToast('⚠️ DO-OR-DIE FAILED! Raider is OUT!', 'allout');
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 150]);
      animateScore(engine.state.activeRaidingTeam === 'teamA' ? 'teamAScore' : 'teamBScore');
    } else {
      audio.playTone(300, 'sine', 0.1, 0.1);
      if (res.isNowDoOrDie) {
        ui.showToast('⚠️ Next raid is DO-OR-DIE for raiding team!');
      }
      if ('vibrate' in navigator) navigator.vibrate(30);
    }

    if (res.allOutOccurred) {
      audio.allOutGong();
      ui.showToast(`💥 ALL-OUT! +2 Points awarded! All players revived!`, 'allout');
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
    }

    // Reset raid timer after raid concludes (match clock keeps running as before)
    resetRaidTimer();
    ui.resetRaidSelection();
    ui.renderAll();
  });

  document.getElementById('commitTackleBtn').addEventListener('click', () => {
    const raiderId = engine.state.activeRaiderId;
    if (!raiderId) {
      alert('No active raider currently selected.');
      return;
    }

    const creditedDefenderId = ui.selectedTackleDefenderId;

    const res = engine.commitTackle({
      raiderId,
      creditedDefenderId
    });

    if (res.success) {
      if (res.isSuperTackle) {
        audio.superCelebration();
        ui.showToast(`🛡️⚡ SUPER TACKLE! +2 Points to Defending Team!`, 'super');
        if ('vibrate' in navigator) navigator.vibrate([60, 40, 80]);
      } else {
        audio.pointScored();
        ui.showToast(`🛡️ Successful Tackle! Raider is OUT!`);
        if ('vibrate' in navigator) navigator.vibrate(70);
      }

      if (res.allOutOccurred) {
        audio.allOutGong();
        ui.showToast(`💥 ALL-OUT! +2 Points awarded! All players revived!`, 'allout');
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
      }

      if (res.scoringTeamKey) {
        animateScore(res.scoringTeamKey === 'teamA' ? 'teamAScore' : 'teamBScore');
      } else {
        animateScore(engine.state.activeRaidingTeam === 'teamA' ? 'teamAScore' : 'teamBScore');
      }

      // Reset raid timer after tackle concludes (match clock keeps running as before)
      resetRaidTimer();
      ui.resetRaidSelection();
      ui.renderAll();
    }
  });

  document.getElementById('allOutTeamABtn').addEventListener('click', () => {
    if (confirm(`Enforce All-Out on ${engine.state.teamA.name}? This gives +2 points to ${engine.state.teamB.name} and revives all Team A players.`)) {
      engine.enforceAllOut('teamA', 'teamB');
      audio.allOutGong();
      ui.showToast(`💥 All-Out on ${engine.state.teamA.name}!`, 'allout');
      ui.renderAll();
    }
  });

  document.getElementById('allOutTeamBBtn').addEventListener('click', () => {
    if (confirm(`Enforce All-Out on ${engine.state.teamB.name}? This gives +2 points to ${engine.state.teamA.name} and revives all Team B players.`)) {
      engine.enforceAllOut('teamB', 'teamA');
      audio.allOutGong();
      ui.showToast(`💥 All-Out on ${engine.state.teamB.name}!`, 'allout');
      ui.renderAll();
    }
  });

  document.getElementById('techPointABtn').addEventListener('click', () => {
    engine.addTechnicalPoint('teamA');
    audio.pointScored();
    ui.renderAll();
  });

  document.getElementById('techPointBBtn').addEventListener('click', () => {
    engine.addTechnicalPoint('teamB');
    audio.pointScored();
    ui.renderAll();
  });

  document.getElementById('manualReviveABtn').addEventListener('click', () => {
    if (engine.manualRevive('teamA')) {
      audio.playTone(600, 'sine', 0.1, 0.1);
      ui.renderAll();
    } else {
      alert('Team A bench is empty (no players to revive).');
    }
  });

  document.getElementById('manualReviveBBtn').addEventListener('click', () => {
    if (engine.manualRevive('teamB')) {
      audio.playTone(600, 'sine', 0.1, 0.1);
      ui.renderAll();
    } else {
      alert('Team B bench is empty (no players to revive).');
    }
  });

  document.getElementById('clearLogBtn').addEventListener('click', () => {
    engine.clearLogs();
    ui.renderFeed();
  });

  // -------------------------------------------------------------
  // 9. TEAM SETUP MODAL (Starting 7 + Substitutes)
  // -------------------------------------------------------------
  const setupModal = document.getElementById('setupModal');

  document.getElementById('teamConfigBtn').addEventListener('click', () => {
    ui.populateSetupModal();
    setupModal.classList.remove('hidden');
  });

  document.getElementById('closeSetupModalBtn').addEventListener('click', () => {
    setupModal.classList.add('hidden');
  });

  document.getElementById('cancelSetupBtn').addEventListener('click', () => {
    setupModal.classList.add('hidden');
  });

  document.getElementById('setupTeamAColor').addEventListener('input', (e) => {
    document.getElementById('teamAColorHex').textContent = e.target.value.toUpperCase();
  });
  document.getElementById('setupTeamBColor').addEventListener('input', (e) => {
    document.getElementById('teamBColorHex').textContent = e.target.value.toUpperCase();
  });

  // Presets
  const presets = {
    pro1: {
      teamAName: 'PATNA WARRIORS',
      teamAColor: '#FF6B00',
      teamAPlayers: [
        { id: 'A1', name: 'Sachin Tanwar', jersey: '1', role: 'Raider' },
        { id: 'A2', name: 'Manjeet Dahiya', jersey: '2', role: 'Raider' },
        { id: 'A3', name: 'Neeraj Kumar', jersey: '3', role: 'Defender' },
        { id: 'A4', name: 'Sunil Kumar', jersey: '4', role: 'Defender' },
        { id: 'A5', name: 'Mohit Goyat', jersey: '5', role: 'All-Rounder' },
        { id: 'A6', name: 'Sajin C.', jersey: '6', role: 'Defender' },
        { id: 'A7', name: 'Shubham Shinde', jersey: '7', role: 'Defender' }
      ],
      teamBName: 'BENGAL TIGERS',
      teamBColor: '#00B4D8',
      teamBPlayers: [
        { id: 'B1', name: 'Maninder Singh', jersey: '9', role: 'Raider' },
        { id: 'B2', name: 'Shrikant Jadhav', jersey: '10', role: 'Raider' },
        { id: 'B3', name: 'Vaibhav Garje', jersey: '11', role: 'Defender' },
        { id: 'B4', name: 'Jaskirat Singh', jersey: '12', role: 'Defender' },
        { id: 'B5', name: 'Nitin Rawal', jersey: '13', role: 'All-Rounder' },
        { id: 'B6', name: 'Darshan J.', jersey: '14', role: 'Defender' },
        { id: 'B7', name: 'Shubham Kumar', jersey: '15', role: 'Defender' }
      ]
    },
    pro2: {
      teamAName: 'U MUMBA',
      teamAColor: '#FF5722',
      teamAPlayers: [
        { id: 'A1', name: 'Guman Singh', jersey: '1', role: 'Raider' },
        { id: 'A2', name: 'Zafardanesh', jersey: '2', role: 'Raider' },
        { id: 'A3', name: 'Surinder Singh', jersey: '3', role: 'Defender' },
        { id: 'A4', name: 'Rinku Sharma', jersey: '4', role: 'Defender' },
        { id: 'A5', name: 'Mahender Singh', jersey: '5', role: 'Defender' },
        { id: 'A6', name: 'Bittu Banwala', jersey: '6', role: 'Defender' },
        { id: 'A7', name: 'Visvanath V.', jersey: '7', role: 'All-Rounder' }
      ],
      teamBName: 'JAIPUR PINK PANTHERS',
      teamBColor: '#EC4899',
      teamBPlayers: [
        { id: 'B1', name: 'Arjun Deshwal', jersey: '9', role: 'Raider' },
        { id: 'B2', name: 'V. Ajith Kumar', jersey: '10', role: 'Raider' },
        { id: 'B3', name: 'Sunil Kumar', jersey: '11', role: 'Defender' },
        { id: 'B4', name: 'Sahul Kumar', jersey: '12', role: 'Defender' },
        { id: 'B5', name: 'Ankush Rathee', jersey: '13', role: 'Defender' },
        { id: 'B6', name: 'Reza Mirbagheri', jersey: '14', role: 'Defender' },
        { id: 'B7', name: 'Bhavani Rajput', jersey: '15', role: 'Raider' }
      ]
    },
    pro3: {
      teamAName: 'BENGALURU BULLS',
      teamAColor: '#DC2626',
      teamAPlayers: [
        { id: 'A1', name: 'Bharat Hooda', jersey: '1', role: 'Raider' },
        { id: 'A2', name: 'Vikash Kandola', jersey: '2', role: 'Raider' },
        { id: 'A3', name: 'Saurabh Nandal', jersey: '3', role: 'Defender' },
        { id: 'A4', name: 'Aman Antil', jersey: '4', role: 'Defender' },
        { id: 'A5', name: 'Surjeet Singh', jersey: '5', role: 'Defender' },
        { id: 'A6', name: 'Neeraj Narwal', jersey: '6', role: 'All-Rounder' },
        { id: 'A7', name: 'Ran Singh', jersey: '7', role: 'All-Rounder' }
      ],
      teamBName: 'DABANG DELHI',
      teamBColor: '#2563EB',
      teamBPlayers: [
        { id: 'B1', name: 'Naveen Kumar', jersey: '9', role: 'Raider' },
        { id: 'B2', name: 'Ashu Malik', jersey: '10', role: 'Raider' },
        { id: 'B3', name: 'Vishal Lather', jersey: '11', role: 'Defender' },
        { id: 'B4', name: 'Yogesh Dahiya', jersey: '12', role: 'Defender' },
        { id: 'B5', name: 'Ashish Malik', jersey: '13', role: 'Defender' },
        { id: 'B6', name: 'Meet Sharma', jersey: '14', role: 'Raider' },
        { id: 'B7', name: 'Vijay Malik', jersey: '15', role: 'All-Rounder' }
      ]
    }
  };

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset;
      const data = presets[presetKey];
      if (data) {
        document.getElementById('setupTeamAName').value = data.teamAName;
        document.getElementById('setupTeamAColor').value = data.teamAColor;
        document.getElementById('teamAColorHex').textContent = data.teamAColor;

        document.getElementById('setupTeamBName').value = data.teamBName;
        document.getElementById('setupTeamBColor').value = data.teamBColor;
        document.getElementById('teamBColorHex').textContent = data.teamBColor;

        ui.renderRosterInputs('teamARosterInputs', data.teamAPlayers);
        ui.renderRosterInputs('teamBRosterInputs', data.teamBPlayers);
      }
    });
  });

  document.getElementById('saveSetupBtn').addEventListener('click', () => {
    const teamAName = document.getElementById('setupTeamAName').value.trim() || 'Team A';
    const teamAColor = document.getElementById('setupTeamAColor').value;
    const teamAPlayers = ui.readRosterInputs('teamARosterInputs', 'teamA', false);
    const teamASubstitutes = ui.readRosterInputs('teamASubInputs', 'teamA', true);

    const teamBName = document.getElementById('setupTeamBName').value.trim() || 'Team B';
    const teamBColor = document.getElementById('setupTeamBColor').value;
    const teamBPlayers = ui.readRosterInputs('teamBRosterInputs', 'teamB', false);
    const teamBSubstitutes = ui.readRosterInputs('teamBSubInputs', 'teamB', true);

    document.documentElement.style.setProperty('--team-a-primary', teamAColor);
    document.documentElement.style.setProperty('--team-b-primary', teamBColor);

    engine.updateTeamsConfig({
      teamAName,
      teamAColor,
      teamAPlayers,
      teamASubstitutes,
      teamBName,
      teamBColor,
      teamBPlayers,
      teamBSubstitutes
    });

    setupModal.classList.add('hidden');
    ui.renderAll();
    ui.showToast('✅ Team rosters & substitutes updated successfully!');
  });

  // -------------------------------------------------------------
  // 10. SCORECARD MODAL HANDLERS
  // -------------------------------------------------------------
  const statsModal = document.getElementById('statsModal');

  document.getElementById('statsModalBtn').addEventListener('click', () => {
    ui.populateScorecardModal();
    statsModal.classList.remove('hidden');
  });

  document.getElementById('closeStatsModalBtn').addEventListener('click', () => {
    statsModal.classList.add('hidden');
  });

  document.getElementById('exportScorecardBtn').addEventListener('click', () => {
    const matchData = {
      timestamp: new Date().toISOString(),
      matchHalf: engine.state.matchHalf,
      timeRemaining: engine.state.matchTimeRemaining,
      teamA: engine.state.teamA,
      teamB: engine.state.teamB,
      matchLog: engine.logs
    };

    const blob = new Blob([JSON.stringify(matchData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kabaddi-scorecard-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('printScorecardBtn').addEventListener('click', () => {
    window.print();
  });

  // -------------------------------------------------------------
  // 11. MOBILE VIEW SWITCHER & CONNECT MODAL
  // -------------------------------------------------------------
  const matchConsole = document.getElementById('matchConsole');
  const mobileSegmentBtns = document.querySelectorAll('.mobile-segment-btn');

  mobileSegmentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      mobileSegmentBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      if (matchConsole) {
        matchConsole.dataset.mobileView = view;
      }
      if ('vibrate' in navigator) navigator.vibrate(30);
    });
  });

  // -------------------------------------------------------------
  // 12. ROLE MANAGEMENT, SCORER AUTHENTICATION & CREDENTIALS
  // -------------------------------------------------------------
  const scorerAuthModal = document.getElementById('scorerAuthModal');
  const scorerIdInput = document.getElementById('scorerIdInput');
  const scorerPassInput = document.getElementById('scorerPassInput');
  const scorerPinInput = document.getElementById('scorerPinInput');
  const tabLoginIdPass = document.getElementById('tabLoginIdPass');
  const tabLoginPin = document.getElementById('tabLoginPin');
  const loginIdPassSection = document.getElementById('loginIdPassSection');
  const loginPinSection = document.getElementById('loginPinSection');
  const pinKeypad = document.getElementById('pinKeypad');
  const submitScorerPinBtn = document.getElementById('submitScorerPinBtn');
  const cancelScorerAuthBtn = document.getElementById('cancelScorerAuthBtn');
  const closeScorerAuthModalBtn = document.getElementById('closeScorerAuthModalBtn');
  const scorerAuthError = document.getElementById('scorerAuthError');
  const quickUnlockScorerBtn = document.getElementById('quickUnlockScorerBtn');
  const openChangeCredsFromLoginBtn = document.getElementById('openChangeCredsFromLoginBtn');

  // Change Credentials Modal Elements
  const changeCredsModal = document.getElementById('changeCredsModal');
  const openChangeCredsBtn = document.getElementById('openChangeCredsBtn');
  const closeChangeCredsModalBtn = document.getElementById('closeChangeCredsModalBtn');
  const cancelChangeCredsBtn = document.getElementById('cancelChangeCredsBtn');
  const saveChangeCredsBtn = document.getElementById('saveChangeCredsBtn');
  const currentCredPassInput = document.getElementById('currentCredPassInput');
  const newScorerIdInput = document.getElementById('newScorerIdInput');
  const newScorerPassInput = document.getElementById('newScorerPassInput');
  const confirmNewScorerPassInput = document.getElementById('confirmNewScorerPassInput');
  const changeCredsError = document.getElementById('changeCredsError');
  const changeCredsSuccess = document.getElementById('changeCredsSuccess');

  const openScorerLoginBtn = document.getElementById('openScorerLoginBtn');
  const specUnlockControlsBtn = document.getElementById('specUnlockControlsBtn');
  const switchSpectatorBtn = document.getElementById('switchSpectatorBtn');
  const lockControlsBtn = document.getElementById('lockControlsBtn');
  const btnRoleScorer = document.getElementById('btnRoleScorer');
  const btnRoleViewer = document.getElementById('btnRoleViewer');

  // Login Tabs Switcher
  if (tabLoginIdPass && tabLoginPin) {
    tabLoginIdPass.addEventListener('click', () => {
      tabLoginIdPass.classList.add('active');
      tabLoginPin.classList.remove('active');
      if (loginIdPassSection) loginIdPassSection.classList.remove('hidden');
      if (loginPinSection) loginPinSection.classList.add('hidden');
      if (scorerPassInput) scorerPassInput.focus();
    });

    tabLoginPin.addEventListener('click', () => {
      tabLoginPin.classList.add('active');
      tabLoginIdPass.classList.remove('active');
      if (loginPinSection) loginPinSection.classList.remove('hidden');
      if (loginIdPassSection) loginIdPassSection.classList.add('hidden');
      if (scorerPinInput) scorerPinInput.focus();
    });
  }

  // Prepopulate active scorer ID from local config
  if (scorerIdInput && engine && engine.getLocalScorerConfig) {
    const initCfg = engine.getLocalScorerConfig();
    if (initCfg.scorerId) {
      scorerIdInput.value = initCfg.scorerId;
    }
  }

  function openScorerAuth() {
    const localCfg = (engine && engine.getLocalScorerConfig) ? engine.getLocalScorerConfig() : { scorerId: 'admin' };
    if (scorerIdInput) scorerIdInput.value = localCfg.scorerId || 'admin';
    if (scorerPassInput) scorerPassInput.value = '';
    if (scorerPinInput) scorerPinInput.value = '';
    if (scorerAuthError) scorerAuthError.classList.add('hidden');
    if (scorerAuthModal) {
      scorerAuthModal.classList.remove('hidden');
      setTimeout(() => {
        if (loginIdPassSection && !loginIdPassSection.classList.contains('hidden')) {
          if (scorerPassInput) scorerPassInput.focus();
        } else if (scorerPinInput) {
          scorerPinInput.focus();
        }
      }, 100);
    }
    if ('vibrate' in navigator) navigator.vibrate(30);
  }

  function closeScorerAuth() {
    if (scorerAuthModal) scorerAuthModal.classList.add('hidden');
  }

  async function handlePinSubmit() {
    let id = scorerIdInput ? scorerIdInput.value.trim() : 'admin';
    let pass = scorerPassInput ? scorerPassInput.value.trim() : '';

    // If pin section is active or password input is empty, fallback to pin input
    const pinVal = scorerPinInput ? scorerPinInput.value.trim() : '';
    if ((!pass && pinVal) || (loginPinSection && !loginPinSection.classList.contains('hidden') && pinVal)) {
      pass = pinVal;
    }

    if (!pass) {
      if (scorerAuthError) {
        scorerAuthError.textContent = 'Please enter Scorer Password or 4-digit PIN.';
        scorerAuthError.classList.remove('hidden');
      }
      return;
    }

    const res = await engine.verifyScorer(id, pass);
    if (res.success) {
      closeScorerAuth();
      ui.renderAll();
      audio.whistle();
      ui.showToast(`👑 Official Scorer Authenticated (${res.scorerId || id})! Controls Unlocked.`, 'super');
      if ('vibrate' in navigator) navigator.vibrate([80, 50, 80]);
    } else {
      if (scorerAuthError) {
        scorerAuthError.textContent = res.error || 'Incorrect ID or Password.';
        scorerAuthError.classList.remove('hidden');
      }
      if (scorerPassInput) {
        scorerPassInput.value = '';
        scorerPassInput.focus();
      }
      if (scorerPinInput) scorerPinInput.value = '';
      if ('vibrate' in navigator) navigator.vibrate(200);
    }
  }

  if (quickUnlockScorerBtn) {
    quickUnlockScorerBtn.addEventListener('click', () => {
      const cfg = (engine && engine.getLocalScorerConfig) ? engine.getLocalScorerConfig() : { scorerId: 'admin', scorerPass: '1234', scorerPin: '1234' };
      if (scorerIdInput) scorerIdInput.value = cfg.scorerId || 'admin';
      if (scorerPassInput) scorerPassInput.value = cfg.scorerPass || '1234';
      if (scorerPinInput) scorerPinInput.value = cfg.scorerPin || '1234';
      handlePinSubmit();
    });
  }

  // Change Scorer Credentials Dialog
  function openChangeCreds() {
    if (scorerAuthModal) scorerAuthModal.classList.add('hidden');
    const localCfg = (engine && engine.getLocalScorerConfig) ? engine.getLocalScorerConfig() : { scorerId: 'admin' };
    if (currentCredPassInput) currentCredPassInput.value = '';
    if (newScorerIdInput) newScorerIdInput.value = localCfg.scorerId || (scorerIdInput ? scorerIdInput.value : 'admin');
    if (newScorerPassInput) newScorerPassInput.value = '';
    if (confirmNewScorerPassInput) confirmNewScorerPassInput.value = '';
    if (changeCredsError) changeCredsError.classList.add('hidden');
    if (changeCredsSuccess) changeCredsSuccess.classList.add('hidden');
    if (changeCredsModal) {
      changeCredsModal.classList.remove('hidden');
      setTimeout(() => currentCredPassInput && currentCredPassInput.focus(), 100);
    }
  }

  function closeChangeCreds() {
    if (changeCredsModal) changeCredsModal.classList.add('hidden');
  }

  if (openChangeCredsBtn) openChangeCredsBtn.addEventListener('click', openChangeCreds);
  if (openChangeCredsFromLoginBtn) openChangeCredsFromLoginBtn.addEventListener('click', openChangeCreds);
  if (closeChangeCredsModalBtn) closeChangeCredsModalBtn.addEventListener('click', closeChangeCreds);
  if (cancelChangeCredsBtn) cancelChangeCredsBtn.addEventListener('click', closeChangeCreds);

  if (saveChangeCredsBtn) {
    saveChangeCredsBtn.addEventListener('click', async () => {
      const currentPass = currentCredPassInput ? currentCredPassInput.value.trim() : '';
      const newId = newScorerIdInput ? newScorerIdInput.value.trim() : '';
      const newPass = newScorerPassInput ? newScorerPassInput.value.trim() : '';
      const confirmPass = confirmNewScorerPassInput ? confirmNewScorerPassInput.value.trim() : '';

      if (changeCredsError) changeCredsError.classList.add('hidden');
      if (changeCredsSuccess) changeCredsSuccess.classList.add('hidden');

      if (!currentPass) {
        changeCredsError.textContent = 'Please enter your current Password or PIN.';
        changeCredsError.classList.remove('hidden');
        return;
      }

      if (!newId && !newPass) {
        changeCredsError.textContent = 'Please specify a new Scorer ID or new Password.';
        changeCredsError.classList.remove('hidden');
        return;
      }

      if (newPass) {
        if (newPass.length < 4) {
          changeCredsError.textContent = 'New Password must be at least 4 characters.';
          changeCredsError.classList.remove('hidden');
          return;
        }
        if (newPass !== confirmPass) {
          changeCredsError.textContent = 'New Password and Confirm Password do not match.';
          changeCredsError.classList.remove('hidden');
          return;
        }
      }

      saveChangeCredsBtn.disabled = true;
      saveChangeCredsBtn.textContent = 'Saving...';

      const res = await engine.updateScorerCredentials(currentPass, newId, newPass);
      saveChangeCredsBtn.disabled = false;
      saveChangeCredsBtn.textContent = '💾 Save New Credentials';

      if (res.success) {
        if (newId && scorerIdInput) scorerIdInput.value = newId;
        changeCredsSuccess.textContent = res.message || 'Credentials successfully updated!';
        changeCredsSuccess.classList.remove('hidden');
        ui.showToast(`🔑 Scorer credentials updated! Active ID: ${res.scorerId || newId}`, 'super');
        setTimeout(() => {
          closeChangeCreds();
        }, 1500);
      } else {
        changeCredsError.textContent = res.error || 'Failed to update credentials. Please check current password.';
        changeCredsError.classList.remove('hidden');
      }
    });
  }

  if (btnRoleScorer) {
    btnRoleScorer.addEventListener('click', () => {
      if (engine.isScorer()) {
        ui.showToast('👑 Official Scorer Mode is already active', 'info');
      } else {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
          engine.setScorerAuth('scorer_local_' + Date.now());
          ui.renderAll();
          ui.showToast('👑 Switched to Official Scorer Mode!', 'super');
        } else {
          openScorerAuth();
        }
      }
      if ('vibrate' in navigator) navigator.vibrate(30);
    });
  }

  if (btnRoleViewer) {
    btnRoleViewer.addEventListener('click', () => {
      engine.lockScorer();
      ui.renderAll();
      ui.showToast('👁️ Switched to Spectator Mode (Watch Only)', 'info');
      if ('vibrate' in navigator) navigator.vibrate(30);
    });
  }

  if (openScorerLoginBtn) openScorerLoginBtn.addEventListener('click', openScorerAuth);
  if (specUnlockControlsBtn) specUnlockControlsBtn.addEventListener('click', openScorerAuth);
  if (closeScorerAuthModalBtn) closeScorerAuthModalBtn.addEventListener('click', closeScorerAuth);
  if (cancelScorerAuthBtn) cancelScorerAuthBtn.addEventListener('click', closeScorerAuth);
  if (submitScorerPinBtn) submitScorerPinBtn.addEventListener('click', handlePinSubmit);

  if (scorerIdInput) {
    scorerIdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && scorerPassInput) {
        scorerPassInput.focus();
      }
    });
  }

  if (scorerPassInput) {
    scorerPassInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handlePinSubmit();
      }
    });
  }

  if (scorerPinInput) {
    scorerPinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handlePinSubmit();
      }
    });
  }

  if (pinKeypad && scorerPinInput) {
    pinKeypad.addEventListener('click', (e) => {
      const btn = e.target.closest('.keypad-btn');
      if (!btn) return;
      const key = btn.dataset.key;
      if (key === 'C') {
        scorerPinInput.value = '';
      } else if (key === 'backspace') {
        scorerPinInput.value = scorerPinInput.value.slice(0, -1);
      } else if (scorerPinInput.value.length < 6) {
        scorerPinInput.value += key;
        if (scorerPinInput.value.length === 4) {
          handlePinSubmit();
        }
      }
      if (scorerAuthError) scorerAuthError.classList.add('hidden');
      if ('vibrate' in navigator) navigator.vibrate(20);
    });
  }

  // Switch to Spectator / Lock
  if (switchSpectatorBtn) {
    switchSpectatorBtn.addEventListener('click', () => {
      engine.lockScorer();
      ui.renderAll();
      ui.showToast('👁️ Switched to Spectator Mode (Watch Only)', 'info');
      if ('vibrate' in navigator) navigator.vibrate(30);
    });
  }

  if (lockControlsBtn) {
    lockControlsBtn.addEventListener('click', () => {
      engine.lockScorer();
      ui.renderAll();
      ui.showToast('🔒 Controls Locked. Match is in Live Spectator Mode.', 'info');
      if ('vibrate' in navigator) navigator.vibrate(40);
    });
  }

  // Check if URL requests scorer role
  const urlRoleParam = new URLSearchParams(window.location.search).get('role');
  if (urlRoleParam === 'scorer' && !engine.isScorer()) {
    openScorerAuth();
  }

  // -------------------------------------------------------------
  // 13. REAL-TIME SPECTATOR SYNCHRONIZATION LOOP
  // -------------------------------------------------------------
  // Polls server for live state updates when viewing in spectator mode
  setInterval(async () => {
    if (!engine.isScorer()) {
      const stateChanged = await engine.fetchStateFromServer();
      if (stateChanged) {
        ui.renderAll();
      }
    }
  }, 500);

  // Initial fetch of archives from server
  engine.fetchServerArchives().then(() => {
    ui.renderScoreboard();
  });

  // -------------------------------------------------------------
  // 14. MOBILE & BROADCAST CONNECT MODAL (Spectator vs Scorer tabs)
  // -------------------------------------------------------------
  const mobileModal = document.getElementById('mobileModal');
  const mobileConnectBtn = document.getElementById('mobileConnectBtn');
  const closeMobileModalBtn = document.getElementById('closeMobileModalBtn');
  const closeMobileModalFooterBtn = document.getElementById('closeMobileModalFooterBtn');

  const tabMobileViewer = document.getElementById('tabMobileViewer');
  const tabMobileScorer = document.getElementById('tabMobileScorer');
  const mContentViewer = document.getElementById('mContentViewer');
  const mContentScorer = document.getElementById('mContentScorer');

  const copyViewerUrlBtn = document.getElementById('copyViewerUrlBtn');
  const copyScorerUrlBtn = document.getElementById('copyScorerUrlBtn');
  const mobileUrlInputViewer = document.getElementById('mobileUrlInputViewer');
  const mobileUrlInputScorer = document.getElementById('mobileUrlInputScorer');

  if (tabMobileViewer && tabMobileScorer) {
    tabMobileViewer.addEventListener('click', () => {
      tabMobileViewer.classList.add('active');
      tabMobileScorer.classList.remove('active');
      mContentViewer.classList.remove('hidden');
      mContentScorer.classList.add('hidden');
      if ('vibrate' in navigator) navigator.vibrate(20);
    });

    tabMobileScorer.addEventListener('click', () => {
      tabMobileScorer.classList.add('active');
      tabMobileViewer.classList.remove('active');
      mContentScorer.classList.remove('hidden');
      mContentViewer.classList.add('hidden');
      if ('vibrate' in navigator) navigator.vibrate(20);
    });
  }

  function handleCopy(inputElem, btnElem, label) {
    if (!inputElem) return;
    navigator.clipboard.writeText(inputElem.value).then(() => {
      ui.showToast(`📋 ${label} copied to clipboard!`);
      if (btnElem) {
        btnElem.textContent = '✅ Copied!';
        setTimeout(() => { btnElem.textContent = '📋 Copy'; }, 2000);
      }
    }).catch(() => {
      inputElem.select();
      document.execCommand('copy');
      ui.showToast(`📋 ${label} copied!`);
    });
    if ('vibrate' in navigator) navigator.vibrate(40);
  }

  if (copyViewerUrlBtn && mobileUrlInputViewer) {
    copyViewerUrlBtn.addEventListener('click', () => {
      handleCopy(mobileUrlInputViewer, copyViewerUrlBtn, 'Spectator Watch Link');
    });
  }

  if (copyScorerUrlBtn && mobileUrlInputScorer) {
    copyScorerUrlBtn.addEventListener('click', () => {
      handleCopy(mobileUrlInputScorer, copyScorerUrlBtn, 'Official Scorer Link');
    });
  }

  if (mobileConnectBtn && mobileModal) {
    mobileConnectBtn.addEventListener('click', () => {
      mobileModal.classList.remove('hidden');
      if ('vibrate' in navigator) navigator.vibrate(30);
    });
  }
  if (closeMobileModalBtn && mobileModal) {
    closeMobileModalBtn.addEventListener('click', () => {
      mobileModal.classList.add('hidden');
    });
  }
  if (closeMobileModalFooterBtn && mobileModal) {
    closeMobileModalFooterBtn.addEventListener('click', () => {
      mobileModal.classList.add('hidden');
    });
  }

  // -------------------------------------------------------------
  // 15. ANIMATIONS & KEYBOARD SHORTCUTS
  // -------------------------------------------------------------
  function animateScore(boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.classList.add('score-animate');
    setTimeout(() => {
      box.classList.remove('score-animate');
    }, 350);
  }

  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      toggleRaidTimer();
    } else if (e.key === 'r' || e.key === 'R') {
      resetRaidTimer();
    } else if (e.key === 'u' || e.key === 'U') {
      if (engine.isScorer() && engine.undo()) {
        audio.playTone(350, 'sine', 0.15, 0.1);
        ui.resetRaidSelection();
        ui.renderAll();
        ui.showToast('Last action undone');
      }
    } else if (e.key === 'Escape') {
      [setupModal, statsModal, mobileModal, clockModal, substitutionModal, saveMatchModal, historyModal, renameModal, scorerAuthModal, changeCredsModal].forEach(m => {
        if (m) m.classList.add('hidden');
      });
    }
  });
});
