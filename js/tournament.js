/**
 * Pro Kabaddi Tournament Website Controller
 * Handles Multi-View Navigation (Live Match, Fixtures, Standings, Teams, Archives, Scorer Portal)
 */

(function () {
  'use strict';

  class TournamentApp {
    constructor() {
      this.currentView = 'live';
      this.fixtures = [];
      this.teams = [];
      this.standings = [];
      this.activeFixtureId = 'fixture_1';
    }

    async init() {
      this.setupNavigation();
      await this.loadInitialData();
      this.wireEditModalsAndActions();
      this.renderAllViews();
      this.checkUrlView();
    }

    setupNavigation() {
      const navButtons = document.querySelectorAll('.t-nav-btn');
      navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.targetView;
          if (target) {
            this.switchView(target);
          }
        });
      });

      // Quick links from other elements
      document.querySelectorAll('[data-goto-view]').forEach(elem => {
        elem.addEventListener('click', (e) => {
          e.preventDefault();
          const target = elem.dataset.gotoView;
          if (target) this.switchView(target);
        });
      });

      // Listen to popstate for back/forward browser navigation
      window.addEventListener('popstate', (e) => {
        if (e.state && e.state.view) {
          this.switchView(e.state.view, false);
        }
      });
    }

    switchView(viewName, updateHistory = true) {
      this.currentView = viewName;

      // Update navbar buttons
      document.querySelectorAll('.t-nav-btn').forEach(btn => {
        if (btn.dataset.targetView === viewName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Update views visibility
      document.querySelectorAll('.tournament-view').forEach(v => {
        if (v.id === `view_${viewName}`) {
          v.classList.add('active');
        } else {
          v.classList.remove('active');
        }
      });

      // Specific view render triggers
      if (viewName === 'fixtures') this.renderFixtures();
      if (viewName === 'standings') this.renderStandings();
      if (viewName === 'teams') this.renderTeams();
      if (viewName === 'archives') this.renderArchivesView();
      if (viewName === 'portal') this.renderPortal();
      if (viewName === 'guide') this.renderGuide();

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (updateHistory) {
        const url = new URL(window.location);
        url.searchParams.set('tab', viewName);
        window.history.pushState({ view: viewName }, '', url);
      }
    }

    checkUrlView() {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['live', 'fixtures', 'standings', 'teams', 'archives', 'portal', 'guide'].includes(tab)) {
        this.switchView(tab, false);
      }
    }

    async loadInitialData() {
      // 1. Load Fixtures
      try {
        const res = await fetch('/api/fixtures');
        if (res.ok) {
          this.fixtures = await res.json();
        } else {
          throw new Error('API unavailable');
        }
      } catch (e) {
        // Fallback to local storage or defaults
        const stored = localStorage.getItem('KABADDI_TOURNAMENT_FIXTURES');
        if (stored) {
          try { this.fixtures = JSON.parse(stored); } catch (err) {}
        }
        if (!this.fixtures || this.fixtures.length === 0) {
          this.fixtures = this.getDefaultFixtures();
        }
      }

      // 2. Load Teams
      try {
        const res = await fetch('/api/teams');
        if (res.ok) {
          this.teams = await res.json();
        } else {
          throw new Error('API unavailable');
        }
      } catch (e) {
        const stored = localStorage.getItem('KABADDI_TOURNAMENT_TEAMS');
        if (stored) {
          try { this.teams = JSON.parse(stored); } catch (err) {}
        }
        if (!this.teams || this.teams.length === 0) {
          this.teams = this.getDefaultTeams();
        }
      }

      // 3. Load Standings
      try {
        const res = await fetch('/api/standings');
        if (res.ok) {
          this.standings = await res.json();
        } else {
          throw new Error('API unavailable');
        }
      } catch (e) {
        this.standings = this.getDefaultStandings();
      }
    }

    renderAllViews() {
      this.renderFixtures();
      this.renderStandings();
      this.renderTeams();
      this.renderArchivesView();
      this.renderPortal();
      this.updateNavbarRole();
    }

    updateNavbarRole() {
      const pill = document.getElementById('navOperatorPill');
      if (!pill) return;
      const isScorer = window.kabaddiEngine && window.kabaddiEngine.isScorer();
      if (isScorer) {
        pill.className = 't-operator-pill is-scorer';
        pill.innerHTML = '👑 <strong>Scorer Active</strong>';
      } else {
        pill.className = 't-operator-pill';
        pill.innerHTML = '👁️ <strong>Spectator</strong>';
      }
    }

    // -------------------------------------------------------------
    // FIXTURES & SCHEDULE RENDERER
    // -------------------------------------------------------------
    renderFixtures(filter = 'all') {
      const container = document.getElementById('fixturesGrid');
      if (!container) return;
      container.innerHTML = '';

      let list = this.fixtures;
      if (filter === 'upcoming') list = list.filter(f => f.status === 'upcoming');
      if (filter === 'completed') list = list.filter(f => f.status === 'completed');
      if (filter === 'live') list = list.filter(f => f.status === 'live');

      list.forEach((f) => {
        const card = document.createElement('div');
        const isLive = f.status === 'live';
        card.className = `fixture-card ${isLive ? 'is-live' : ''}`;

        const teamAObj = this.teams.find(t => t.name.toLowerCase() === f.teamA.toLowerCase()) || { color: '#FF6B00' };
        const teamBObj = this.teams.find(t => t.name.toLowerCase() === f.teamB.toLowerCase()) || { color: '#00B4D8' };

        let statusBadge = '<span class="fixture-status-badge status-upcoming">Upcoming</span>';
        if (isLive) {
          statusBadge = '<span class="fixture-status-badge status-live">🔴 Live Now</span>';
        } else if (f.status === 'completed') {
          statusBadge = '<span class="fixture-status-badge status-completed">Final</span>';
        }

        card.innerHTML = `
          <div class="fixture-header">
            <span class="fixture-match-badge">Match #${f.matchNumber} • ${f.stage}</span>
            ${statusBadge}
          </div>

          <div class="fixture-teams-versus">
            <div class="fixture-team-row">
              <div class="fixture-team-info">
                <span class="fixture-team-dot" style="background:${teamAObj.color || '#FF6B00'}"></span>
                <span class="fixture-team-name">${f.teamA}</span>
              </div>
              <span class="fixture-score-digit">${isLive || f.status === 'completed' ? (f.scoreA || 0) : '-'}</span>
            </div>

            <div class="fixture-team-row">
              <div class="fixture-team-info">
                <span class="fixture-team-dot" style="background:${teamBObj.color || '#00B4D8'}"></span>
                <span class="fixture-team-name">${f.teamB}</span>
              </div>
              <span class="fixture-score-digit">${isLive || f.status === 'completed' ? (f.scoreB || 0) : '-'}</span>
            </div>
          </div>

          <div class="fixture-meta">
            <span>📅 ${f.date} • ⏰ ${f.time}</span>
            <span>🏟️ ${f.court}</span>
          </div>

          <div class="fixture-actions" style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${isLive 
              ? `<button class="btn btn-primary btn-tiny" style="flex:1;" data-action="go-live">⚡ Watch Live</button>`
              : `<button class="btn btn-outline-gold btn-tiny" style="flex:1;" data-action="load-match" data-id="${f.id}">▶ Load</button>
                 <button class="btn btn-secondary btn-tiny" data-action="go-live">Scoreboard</button>`
            }
            <button class="btn btn-outline-gold btn-tiny" data-action="edit-fixture" data-id="${f.id}" title="Edit Match Fixture">✏️ Edit</button>
            <button class="btn btn-danger btn-tiny" data-action="delete-fixture" data-id="${f.id}" title="Delete Match">🗑️</button>
          </div>
        `;

        // Button handlers
        const goLiveBtn = card.querySelector('[data-action="go-live"]');
        if (goLiveBtn) {
          goLiveBtn.addEventListener('click', () => {
            this.switchView('live');
          });
        }

        const loadMatchBtn = card.querySelector('[data-action="load-match"]');
        if (loadMatchBtn) {
          loadMatchBtn.addEventListener('click', () => {
            this.loadFixtureIntoScoreboard(f);
          });
        }

        const editBtn = card.querySelector('[data-action="edit-fixture"]');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            this.openEditFixtureModal(f);
          });
        }

        const delBtn = card.querySelector('[data-action="delete-fixture"]');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            if (confirm(`Delete Match #${f.matchNumber} (${f.teamA} vs ${f.teamB})?`)) {
              this.fixtures = this.fixtures.filter(item => item.id !== f.id);
              this.persistFixtures();
              this.renderFixtures();
              if (window.kabaddiUI) window.kabaddiUI.showToast(`🗑️ Match #${f.matchNumber} deleted`, 'info');
            }
          });
        }

        container.appendChild(card);
      });
    }

    loadFixtureIntoScoreboard(fixture) {
      if (!window.kabaddiEngine) return;
      if (!window.kabaddiEngine.isScorer()) {
        if (window.kabaddiUI) {
          window.kabaddiUI.showToast('🔒 Please log in as Scorer to load fixtures into the live match', 'info');
        }
        document.getElementById('openScorerLoginBtn')?.click();
        return;
      }

      if (confirm(`Load Match #${fixture.matchNumber} (${fixture.teamA} vs ${fixture.teamB}) into the live scoreboard?`)) {
        const engine = window.kabaddiEngine;
        engine.state.matchTitle = `Match #${fixture.matchNumber} (${fixture.stage})`;
        engine.setTeamName('teamA', fixture.teamA);
        engine.setTeamName('teamB', fixture.teamB);
        engine.resetMatch();

        // Mark fixture as live
        this.fixtures.forEach(item => {
          if (item.id === fixture.id) item.status = 'live';
          else if (item.status === 'live') item.status = 'upcoming';
        });
        this.persistFixtures();

        if (window.kabaddiUI) {
          window.kabaddiUI.renderAll();
          window.kabaddiUI.showToast(`⚡ Match #${fixture.matchNumber} Loaded: ${fixture.teamA} vs ${fixture.teamB}!`, 'super');
        }

        this.switchView('live');
      }
    }

    persistFixtures() {
      localStorage.setItem('KABADDI_TOURNAMENT_FIXTURES', JSON.stringify(this.fixtures));
      fetch('/api/fixtures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixtures: this.fixtures })
      }).catch(() => {});
    }

    persistStandings() {
      localStorage.setItem('KABADDI_TOURNAMENT_STANDINGS', JSON.stringify(this.standings));
      fetch('/api/standings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standings: this.standings })
      }).catch(() => {});
    }

    persistTeams() {
      localStorage.setItem('KABADDI_TOURNAMENT_TEAMS', JSON.stringify(this.teams));
      fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: this.teams })
      }).catch(() => {});
    }

    // -------------------------------------------------------------
    // STANDINGS / POINTS TABLE RENDERER
    // -------------------------------------------------------------
    renderStandings() {
      const tbody = document.getElementById('standingsTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      // Sort by points desc, then scoreDiff desc
      const sorted = [...this.standings].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.scoreDiff - a.scoreDiff;
      });

      sorted.forEach((item, index) => {
        const rank = index + 1;
        const tr = document.createElement('tr');
        tr.className = `rank-${rank} ${rank === 4 ? 'playoff-cutoff-line' : ''}`;

        const teamObj = this.teams.find(t => t.name.toLowerCase() === item.name.toLowerCase()) || { color: '#FF6B00' };

        const formHtml = (item.form || []).map(f => {
          const cls = f === 'W' ? 'form-w' : (f === 'L' ? 'form-l' : 'form-d');
          return `<span class="form-dot ${cls}">${f}</span>`;
        }).join('') || '<span class="muted" style="font-size:0.75rem;">-</span>';

        tr.innerHTML = `
          <td><span class="rank-badge">${rank}</span></td>
          <td>
            <div class="team-cell-wrap">
              <span class="team-color-indicator" style="background:${teamObj.color || '#FF6B00'};"></span>
              <strong>${item.name}</strong>
              <small class="muted">(${item.short || 'KAB'})</small>
            </div>
          </td>
          <td>${item.played}</td>
          <td><strong style="color:#10B981;">${item.won}</strong></td>
          <td><span style="color:#EF4444;">${item.lost}</span></td>
          <td>${item.tied}</td>
          <td><strong>${item.scoreDiff > 0 ? `+${item.scoreDiff}` : item.scoreDiff}</strong></td>
          <td><span class="pts-highlight">${item.points}</span></td>
          <td><div class="form-pill-group">${formHtml}</div></td>
          <td style="text-align: center; white-space: nowrap;">
            <button class="btn btn-outline-gold btn-tiny" data-action="edit-standing" data-name="${item.name}" title="Edit Team Standing">✏️ Edit</button>
            <button class="btn btn-danger btn-tiny" data-action="delete-standing" data-name="${item.name}" title="Remove Row">🗑️</button>
          </td>
        `;

        tr.querySelector('[data-action="edit-standing"]').addEventListener('click', () => {
          const realIdx = this.standings.findIndex(s => s.name.toLowerCase() === item.name.toLowerCase());
          this.openEditStandingModal(realIdx !== -1 ? realIdx : index);
        });

        tr.querySelector('[data-action="delete-standing"]').addEventListener('click', () => {
          if (confirm(`Remove "${item.name}" from points table?`)) {
            const origIdx = this.standings.findIndex(s => s.name.toLowerCase() === item.name.toLowerCase());
            if (origIdx !== -1) {
              this.standings.splice(origIdx, 1);
              this.persistStandings();
              this.renderStandings();
              if (window.kabaddiUI) window.kabaddiUI.showToast(`🗑️ Removed ${item.name}`, 'info');
            }
          }
        });

        tbody.appendChild(tr);
      });
    }

    // -------------------------------------------------------------
    // TEAMS & SQUADS RENDERER
    // -------------------------------------------------------------
    renderTeams() {
      const container = document.getElementById('teamsGrid');
      if (!container) return;
      container.innerHTML = '';

      this.teams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'team-card-profile';

        const startersHtml = (team.players || []).map(p => `
          <div class="player-roster-pill ${p.isCaptain ? 'is-c' : ''}">
            <span>#${p.jersey}</span>
            <strong>${p.name}</strong>
            <small class="muted">(${p.role})</small>
          </div>
        `).join('');

        const subsHtml = (team.substitutes || []).map(p => `
          <div class="player-roster-pill">
            <span>#${p.jersey}</span>
            <span>${p.name}</span>
            <small class="muted">(${p.role})</small>
          </div>
        `).join('') || '<span class="muted" style="font-size:0.75rem;">None listed</span>';

        card.innerHTML = `
          <div class="team-banner-header" style="background: linear-gradient(135deg, ${team.color}22 0%, rgba(8,12,20,0.6) 100%);">
            <div class="team-title-row">
              <span class="team-color-swatch" style="background:${team.color};"></span>
              <div class="team-headline">
                <h3>${team.name}</h3>
                <span>City: ${team.city || 'Championship'} • Capt: ${team.captain || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div class="team-body-roster">
            <div class="roster-sec-title">
              <span>On-Court Starting 7:</span>
              <span>Coach: ${team.coach || 'N/A'}</span>
            </div>
            <div class="roster-chips-wrap">
              ${startersHtml}
            </div>

            <div class="roster-sec-title">
              <span>Substitutes Bench (3):</span>
            </div>
            <div class="roster-chips-wrap">
              ${subsHtml}
            </div>
          </div>

          <div class="team-card-actions" style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-tiny" data-action="load-team-a" data-name="${team.name}">⚔️ Load Team A</button>
            <button class="btn btn-secondary btn-tiny" data-action="load-team-b" data-name="${team.name}">🛡️ Load Team B</button>
            <button class="btn btn-outline-gold btn-tiny" data-action="edit-team" data-name="${team.name}">✏️ Edit Squad</button>
            <button class="btn btn-danger btn-tiny" data-action="delete-team" data-name="${team.name}" title="Delete Team">🗑️</button>
          </div>
        `;

        card.querySelector('[data-action="load-team-a"]').addEventListener('click', () => {
          this.applyTeamToEngine('teamA', team);
        });

        card.querySelector('[data-action="load-team-b"]').addEventListener('click', () => {
          this.applyTeamToEngine('teamB', team);
        });

        card.querySelector('[data-action="edit-team"]').addEventListener('click', () => {
          this.openEditTeamModal(team);
        });

        card.querySelector('[data-action="delete-team"]').addEventListener('click', () => {
          if (confirm(`Delete team "${team.name}" and their squad?`)) {
            this.teams = this.teams.filter(t => t.name.toLowerCase() !== team.name.toLowerCase());
            this.persistTeams();
            this.renderTeams();
            if (window.kabaddiUI) window.kabaddiUI.showToast(`🗑️ Team "${team.name}" deleted`, 'info');
          }
        });

        container.appendChild(card);
      });
    }

    // -------------------------------------------------------------
    // MODAL DIALOGS & USER EDITING ACTIONS FOR 3 SECTIONS
    // -------------------------------------------------------------
    openEditFixtureModal(fixture = null) {
      const modal = document.getElementById('modalEditFixture');
      if (!modal) return;

      const titleElem = document.getElementById('fixtureModalTitle');
      const idInput = document.getElementById('editFixtureId');
      const matchNum = document.getElementById('editFixtureMatchNum');
      const stage = document.getElementById('editFixtureStage');
      const teamA = document.getElementById('editFixtureTeamA');
      const teamB = document.getElementById('editFixtureTeamB');
      const date = document.getElementById('editFixtureDate');
      const time = document.getElementById('editFixtureTime');
      const court = document.getElementById('editFixtureCourt');
      const status = document.getElementById('editFixtureStatus');
      const scoreA = document.getElementById('editFixtureScoreA');
      const scoreB = document.getElementById('editFixtureScoreB');
      const deleteBtn = document.getElementById('btnDeleteFixture');

      if (fixture) {
        if (titleElem) titleElem.textContent = `EDIT MATCH #${fixture.matchNumber}`;
        if (idInput) idInput.value = fixture.id;
        if (matchNum) matchNum.value = fixture.matchNumber || 1;
        if (stage) stage.value = fixture.stage || 'League Match';
        if (teamA) teamA.value = fixture.teamA || '';
        if (teamB) teamB.value = fixture.teamB || '';
        if (date) date.value = fixture.date || 'Tomorrow';
        if (time) time.value = fixture.time || '10:00 AM';
        if (court) court.value = fixture.court || 'Mat 1';
        if (status) status.value = fixture.status || 'upcoming';
        if (scoreA) scoreA.value = fixture.scoreA || 0;
        if (scoreB) scoreB.value = fixture.scoreB || 0;
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
      } else {
        if (titleElem) titleElem.textContent = '➕ ADD NEW MATCH FIXTURE';
        if (idInput) idInput.value = '';
        const nextNum = (this.fixtures.length > 0 ? Math.max(...this.fixtures.map(f => f.matchNumber || 0)) + 1 : 1);
        if (matchNum) matchNum.value = nextNum;
        if (stage) stage.value = 'League Match';
        if (teamA) teamA.value = (this.teams[0] ? this.teams[0].name : 'Patna Warriors');
        if (teamB) teamB.value = (this.teams[1] ? this.teams[1].name : 'Bengal Tigers');
        if (date) date.value = 'Tomorrow';
        if (time) time.value = '10:00 AM';
        if (court) court.value = 'Mat 1';
        if (status) status.value = 'upcoming';
        if (scoreA) scoreA.value = 0;
        if (scoreB) scoreB.value = 0;
        if (deleteBtn) deleteBtn.style.display = 'none';
      }

      modal.classList.remove('hidden');
    }

    closeEditFixtureModal() {
      document.getElementById('modalEditFixture')?.classList.add('hidden');
    }

    saveFixtureFromModal() {
      const idInput = document.getElementById('editFixtureId')?.value;
      const matchNum = parseInt(document.getElementById('editFixtureMatchNum')?.value || 1, 10);
      const stage = document.getElementById('editFixtureStage')?.value.trim() || 'League Match';
      const teamA = document.getElementById('editFixtureTeamA')?.value.trim() || 'Team A';
      const teamB = document.getElementById('editFixtureTeamB')?.value.trim() || 'Team B';
      const date = document.getElementById('editFixtureDate')?.value.trim() || 'Tomorrow';
      const time = document.getElementById('editFixtureTime')?.value.trim() || '10:00 AM';
      const court = document.getElementById('editFixtureCourt')?.value.trim() || 'Mat 1';
      const status = document.getElementById('editFixtureStatus')?.value || 'upcoming';
      const scoreA = parseInt(document.getElementById('editFixtureScoreA')?.value || 0, 10);
      const scoreB = parseInt(document.getElementById('editFixtureScoreB')?.value || 0, 10);

      if (!teamA || !teamB) {
        alert('Please enter names for both Team A and Team B');
        return;
      }

      if (idInput) {
        const idx = this.fixtures.findIndex(f => f.id === idInput);
        if (idx !== -1) {
          this.fixtures[idx] = {
            ...this.fixtures[idx],
            matchNumber: matchNum,
            stage,
            teamA,
            teamB,
            date,
            time,
            court,
            status,
            scoreA,
            scoreB
          };
        }
      } else {
        this.fixtures.push({
          id: 'fixture_' + Date.now(),
          matchNumber: matchNum,
          stage,
          court,
          time,
          date,
          teamA,
          teamB,
          status,
          scoreA,
          scoreB
        });
      }

      this.persistFixtures();
      this.renderFixtures();
      this.closeEditFixtureModal();
      if (window.kabaddiUI) window.kabaddiUI.showToast(`✅ Fixture Match #${matchNum} saved!`, 'super');
    }

    deleteFixtureFromModal() {
      const idInput = document.getElementById('editFixtureId')?.value;
      if (!idInput) return;
      if (confirm('Are you sure you want to delete this match fixture?')) {
        this.fixtures = this.fixtures.filter(f => f.id !== idInput);
        this.persistFixtures();
        this.renderFixtures();
        this.closeEditFixtureModal();
        if (window.kabaddiUI) window.kabaddiUI.showToast('🗑️ Fixture deleted', 'info');
      }
    }

    openEditStandingModal(index) {
      const modal = document.getElementById('modalEditStanding');
      if (!modal) return;

      const titleElem = document.getElementById('standingModalTitle');
      const indexInput = document.getElementById('editStandingIndex');
      const name = document.getElementById('editStandingName');
      const short = document.getElementById('editStandingShort');
      const p = document.getElementById('editStandingP');
      const w = document.getElementById('editStandingW');
      const l = document.getElementById('editStandingL');
      const t = document.getElementById('editStandingT');
      const diff = document.getElementById('editStandingDiff');
      const pts = document.getElementById('editStandingPts');
      const form = document.getElementById('editStandingForm');
      const deleteBtn = document.getElementById('btnDeleteStanding');

      if (index >= 0 && index < this.standings.length) {
        const item = this.standings[index];
        if (titleElem) titleElem.textContent = `EDIT STANDINGS: ${item.name.toUpperCase()}`;
        if (indexInput) indexInput.value = index;
        if (name) name.value = item.name || '';
        if (short) short.value = item.short || (item.name ? item.name.substring(0, 3).toUpperCase() : 'KAB');
        if (p) p.value = item.played ?? 0;
        if (w) w.value = item.won ?? 0;
        if (l) l.value = item.lost ?? 0;
        if (t) t.value = item.tied ?? 0;
        if (diff) diff.value = item.scoreDiff ?? 0;
        if (pts) pts.value = item.points ?? 0;
        if (form) form.value = (item.form || []).join(', ');
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
      } else {
        if (titleElem) titleElem.textContent = '➕ ADD TEAM TO POINTS TABLE';
        if (indexInput) indexInput.value = -1;
        if (name) name.value = '';
        if (short) short.value = '';
        if (p) p.value = 0;
        if (w) w.value = 0;
        if (l) l.value = 0;
        if (t) t.value = 0;
        if (diff) diff.value = 0;
        if (pts) pts.value = 0;
        if (form) form.value = '';
        if (deleteBtn) deleteBtn.style.display = 'none';
      }

      modal.classList.remove('hidden');
    }

    closeEditStandingModal() {
      document.getElementById('modalEditStanding')?.classList.add('hidden');
    }

    saveStandingFromModal() {
      const index = parseInt(document.getElementById('editStandingIndex')?.value ?? -1, 10);
      const name = document.getElementById('editStandingName')?.value.trim();
      const short = (document.getElementById('editStandingShort')?.value.trim() || (name ? name.substring(0, 3) : 'KAB')).toUpperCase();
      const played = parseInt(document.getElementById('editStandingP')?.value || 0, 10);
      const won = parseInt(document.getElementById('editStandingW')?.value || 0, 10);
      const lost = parseInt(document.getElementById('editStandingL')?.value || 0, 10);
      const tied = parseInt(document.getElementById('editStandingT')?.value || 0, 10);
      const scoreDiff = parseInt(document.getElementById('editStandingDiff')?.value || 0, 10);
      const points = parseInt(document.getElementById('editStandingPts')?.value || 0, 10);
      const formStr = document.getElementById('editStandingForm')?.value || '';
      const form = formStr.split(',').map(s => s.trim().toUpperCase()).filter(s => ['W', 'L', 'T', 'D'].includes(s));

      if (!name) {
        alert('Please enter a team name');
        return;
      }

      const row = {
        rank: 1,
        name,
        short,
        played,
        won,
        lost,
        tied,
        scoreDiff,
        points,
        form
      };

      if (index >= 0 && index < this.standings.length) {
        this.standings[index] = { ...this.standings[index], ...row };
      } else {
        this.standings.push(row);
      }

      this.persistStandings();
      this.renderStandings();
      this.closeEditStandingModal();
      if (window.kabaddiUI) window.kabaddiUI.showToast(`🏆 Points table updated for ${name}!`, 'super');
    }

    deleteStandingFromModal() {
      const index = parseInt(document.getElementById('editStandingIndex')?.value ?? -1, 10);
      if (index >= 0 && index < this.standings.length) {
        if (confirm(`Remove "${this.standings[index].name}" from points table?`)) {
          this.standings.splice(index, 1);
          this.persistStandings();
          this.renderStandings();
          this.closeEditStandingModal();
          if (window.kabaddiUI) window.kabaddiUI.showToast('🗑️ Row removed from points table', 'info');
        }
      }
    }

    recalcStandingsFromFixtures() {
      const completed = this.fixtures.filter(f => f.status === 'completed');
      if (completed.length === 0) {
        if (window.kabaddiUI) window.kabaddiUI.showToast('ℹ️ No completed matches found to auto-calculate.', 'info');
        return;
      }

      const tableMap = {};
      this.teams.forEach(t => {
        tableMap[t.name.toLowerCase()] = {
          name: t.name,
          short: t.name.substring(0, 3).toUpperCase(),
          played: 0,
          won: 0,
          lost: 0,
          tied: 0,
          scoreDiff: 0,
          points: 0,
          form: []
        };
      });

      completed.forEach(f => {
        const keyA = f.teamA.toLowerCase();
        const keyB = f.teamB.toLowerCase();
        if (!tableMap[keyA]) tableMap[keyA] = { name: f.teamA, short: f.teamA.substring(0, 3).toUpperCase(), played: 0, won: 0, lost: 0, tied: 0, scoreDiff: 0, points: 0, form: [] };
        if (!tableMap[keyB]) tableMap[keyB] = { name: f.teamB, short: f.teamB.substring(0, 3).toUpperCase(), played: 0, won: 0, lost: 0, tied: 0, scoreDiff: 0, points: 0, form: [] };

        const scoreA = f.scoreA || 0;
        const scoreB = f.scoreB || 0;
        const diff = scoreA - scoreB;

        tableMap[keyA].played++;
        tableMap[keyB].played++;
        tableMap[keyA].scoreDiff += diff;
        tableMap[keyB].scoreDiff -= diff;

        if (scoreA > scoreB) {
          tableMap[keyA].won++;
          tableMap[keyA].points += 5;
          tableMap[keyA].form.push('W');

          tableMap[keyB].lost++;
          if (Math.abs(diff) <= 7) tableMap[keyB].points += 1;
          tableMap[keyB].form.push('L');
        } else if (scoreB > scoreA) {
          tableMap[keyB].won++;
          tableMap[keyB].points += 5;
          tableMap[keyB].form.push('W');

          tableMap[keyA].lost++;
          if (Math.abs(diff) <= 7) tableMap[keyA].points += 1;
          tableMap[keyA].form.push('L');
        } else {
          tableMap[keyA].tied++;
          tableMap[keyA].points += 3;
          tableMap[keyA].form.push('T');

          tableMap[keyB].tied++;
          tableMap[keyB].points += 3;
          tableMap[keyB].form.push('T');
        }
      });

      this.standings = Object.values(tableMap);
      this.persistStandings();
      this.renderStandings();
      if (window.kabaddiUI) window.kabaddiUI.showToast('⚡ Standings auto-calculated from completed matches!', 'super');
    }

    openEditTeamModal(team = null) {
      const modal = document.getElementById('modalEditTeam');
      if (!modal) return;

      const titleElem = document.getElementById('teamModalTitle');
      const origName = document.getElementById('editTeamOriginalName');
      const name = document.getElementById('editTeamName');
      const city = document.getElementById('editTeamCity');
      const color = document.getElementById('editTeamColor');
      const picker = document.getElementById('editTeamColorPicker');
      const captain = document.getElementById('editTeamCaptain');
      const coach = document.getElementById('editTeamCoach');
      const players = document.getElementById('editTeamPlayers');
      const subs = document.getElementById('editTeamSubs');
      const deleteBtn = document.getElementById('btnDeleteTeam');

      if (team) {
        if (titleElem) titleElem.textContent = `EDIT TEAM: ${team.name.toUpperCase()}`;
        if (origName) origName.value = team.name;
        if (name) name.value = team.name || '';
        if (city) city.value = team.city || '';
        if (color) color.value = team.color || '#FF6B00';
        if (picker) picker.value = team.color || '#FF6B00';
        if (captain) captain.value = team.captain || '';
        if (coach) coach.value = team.coach || '';

        const pLines = (team.players || []).map(p => `${p.jersey}, ${p.name}, ${p.role}`).join('\n');
        if (players) players.value = pLines;

        const sLines = (team.substitutes || []).map(p => `${p.jersey}, ${p.name}, ${p.role}`).join('\n');
        if (subs) subs.value = sLines;

        if (deleteBtn) deleteBtn.style.display = 'inline-block';
      } else {
        if (titleElem) titleElem.textContent = '➕ ADD NEW TEAM & SQUAD';
        if (origName) origName.value = '';
        if (name) name.value = '';
        if (city) city.value = '';
        if (color) color.value = '#10B981';
        if (picker) picker.value = '#10B981';
        if (captain) captain.value = '';
        if (coach) coach.value = '';
        if (players) players.value = '1, Raider One, Raider\n2, Raider Two, Raider\n3, Defender Left, Defender\n4, Defender Right, Defender\n5, All-Rounder Main, All-Rounder\n6, Corner Left, Defender\n7, Corner Right, Defender';
        if (subs) subs.value = '11, Sub Raider, Raider\n12, Sub Defender, Defender\n13, Sub All-Rounder, All-Rounder';
        if (deleteBtn) deleteBtn.style.display = 'none';
      }

      modal.classList.remove('hidden');
    }

    closeEditTeamModal() {
      document.getElementById('modalEditTeam')?.classList.add('hidden');
    }

    parseRosterText(text, isCaptainFirst = false) {
      if (!text) return [];
      return text.split('\n').map((line, idx) => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 2 && parts[1]) {
          return {
            jersey: parts[0] || String(idx + 1),
            name: parts[1],
            role: parts[2] || 'All-Rounder',
            isCaptain: isCaptainFirst && idx === 0
          };
        }
        return null;
      }).filter(Boolean);
    }

    saveTeamFromModal() {
      const origName = document.getElementById('editTeamOriginalName')?.value;
      const name = document.getElementById('editTeamName')?.value.trim();
      const city = document.getElementById('editTeamCity')?.value.trim() || 'Championship';
      const color = document.getElementById('editTeamColor')?.value.trim() || '#FF6B00';
      const captain = document.getElementById('editTeamCaptain')?.value.trim() || '';
      const coach = document.getElementById('editTeamCoach')?.value.trim() || '';
      const playersText = document.getElementById('editTeamPlayers')?.value || '';
      const subsText = document.getElementById('editTeamSubs')?.value || '';

      if (!name) {
        alert('Please enter a team name');
        return;
      }

      const players = this.parseRosterText(playersText, true);
      const substitutes = this.parseRosterText(subsText, false);

      const teamData = {
        name,
        city,
        color,
        captain: captain || (players[0] ? players[0].name : 'N/A'),
        coach,
        players: players.length > 0 ? players : this.getDefaultPlayersForTeam(),
        substitutes
      };

      if (origName) {
        const idx = this.teams.findIndex(t => t.name.toLowerCase() === origName.toLowerCase());
        if (idx !== -1) {
          this.teams[idx] = teamData;
        } else {
          this.teams.push(teamData);
        }
      } else {
        this.teams.push(teamData);
      }

      this.persistTeams();
      this.renderTeams();
      this.closeEditTeamModal();
      if (window.kabaddiUI) window.kabaddiUI.showToast(`👥 Team "${name}" & Squad saved!`, 'super');
    }

    deleteTeamFromModal() {
      const origName = document.getElementById('editTeamOriginalName')?.value;
      if (!origName) return;
      if (confirm(`Are you sure you want to delete team "${origName}"?`)) {
        this.teams = this.teams.filter(t => t.name.toLowerCase() !== origName.toLowerCase());
        this.persistTeams();
        this.renderTeams();
        this.closeEditTeamModal();
        if (window.kabaddiUI) window.kabaddiUI.showToast(`🗑️ Team deleted`, 'info');
      }
    }

    getDefaultPlayersForTeam() {
      return [
        { jersey: "1", name: "Player 1", role: "Raider", isCaptain: true },
        { jersey: "2", name: "Player 2", role: "Raider" },
        { jersey: "3", name: "Player 3", role: "Defender" },
        { jersey: "4", name: "Player 4", role: "Defender" },
        { jersey: "5", name: "Player 5", role: "All-Rounder" },
        { jersey: "6", name: "Player 6", role: "Defender" },
        { jersey: "7", name: "Player 7", role: "Defender" }
      ];
    }

    wireEditModalsAndActions() {
      // 1. Fixture Modal Wiring
      document.getElementById('btnAddFixtureBtn')?.addEventListener('click', () => this.openEditFixtureModal(null));
      document.getElementById('btnCloseFixtureModal')?.addEventListener('click', () => this.closeEditFixtureModal());
      document.getElementById('btnCancelFixture')?.addEventListener('click', () => this.closeEditFixtureModal());
      document.getElementById('btnSaveFixture')?.addEventListener('click', () => this.saveFixtureFromModal());
      document.getElementById('btnDeleteFixture')?.addEventListener('click', () => this.deleteFixtureFromModal());
      document.getElementById('btnResetFixturesBtn')?.addEventListener('click', () => {
        if (confirm('Reset all match fixtures to the default tournament schedule?')) {
          this.fixtures = this.getDefaultFixtures();
          this.persistFixtures();
          this.renderFixtures();
          if (window.kabaddiUI) window.kabaddiUI.showToast('🔄 Fixtures reset to default', 'info');
        }
      });

      // 2. Standings Modal Wiring
      document.getElementById('btnAddStandingBtn')?.addEventListener('click', () => this.openEditStandingModal(-1));
      document.getElementById('btnCloseStandingModal')?.addEventListener('click', () => this.closeEditStandingModal());
      document.getElementById('btnCancelStanding')?.addEventListener('click', () => this.closeEditStandingModal());
      document.getElementById('btnSaveStanding')?.addEventListener('click', () => this.saveStandingFromModal());
      document.getElementById('btnDeleteStanding')?.addEventListener('click', () => this.deleteStandingFromModal());
      document.getElementById('btnRecalcStandingsBtn')?.addEventListener('click', () => this.recalcStandingsFromFixtures());
      document.getElementById('btnResetStandingsBtn')?.addEventListener('click', () => {
        if (confirm('Reset points table to default initial standings?')) {
          this.standings = this.getDefaultStandings();
          this.persistStandings();
          this.renderStandings();
          if (window.kabaddiUI) window.kabaddiUI.showToast('🔄 Points table reset', 'info');
        }
      });

      // 3. Teams Modal Wiring
      document.getElementById('btnAddTeamBtn')?.addEventListener('click', () => this.openEditTeamModal(null));
      document.getElementById('btnCloseTeamModal')?.addEventListener('click', () => this.closeEditTeamModal());
      document.getElementById('btnCancelTeam')?.addEventListener('click', () => this.closeEditTeamModal());
      document.getElementById('btnSaveTeam')?.addEventListener('click', () => this.saveTeamFromModal());
      document.getElementById('btnDeleteTeam')?.addEventListener('click', () => this.deleteTeamFromModal());
      document.getElementById('btnResetTeamsBtn')?.addEventListener('click', () => {
        if (confirm('Reset all teams & squads to default?')) {
          this.teams = this.getDefaultTeams();
          this.persistTeams();
          this.renderTeams();
          if (window.kabaddiUI) window.kabaddiUI.showToast('🔄 Teams reset to default', 'info');
        }
      });

      // Color picker sync
      const colorInput = document.getElementById('editTeamColor');
      const pickerInput = document.getElementById('editTeamColorPicker');
      if (pickerInput && colorInput) {
        pickerInput.addEventListener('input', () => { colorInput.value = pickerInput.value; });
        colorInput.addEventListener('input', () => {
          if (/^#[0-9A-F]{6}$/i.test(colorInput.value)) pickerInput.value = colorInput.value;
        });
      }
    }

    applyTeamToEngine(targetKey, team) {
      if (!window.kabaddiEngine) return;
      if (!window.kabaddiEngine.isScorer()) {
        if (window.kabaddiUI) {
          window.kabaddiUI.showToast('🔒 Please log in as Scorer to change match teams', 'info');
        }
        document.getElementById('openScorerLoginBtn')?.click();
        return;
      }

      const engine = window.kabaddiEngine;
      engine.setTeamName(targetKey, team.name);

      // Populate players if available
      if (team.players && team.players.length >= 7) {
        const teamObj = engine.state[targetKey];
        teamObj.players = team.players.map((p, idx) => ({
          id: p.id || `${targetKey.toUpperCase()}_P${idx+1}`,
          name: p.name,
          jersey: String(p.jersey || idx+1),
          role: p.role || 'Player',
          isOnCourt: true,
          raidPoints: 0,
          bonusPoints: 0,
          tacklePoints: 0,
          outsCount: 0,
          revivalsCount: 0
        }));
        if (team.substitutes) {
          teamObj.substitutes = team.substitutes.map((p, idx) => ({
            id: p.id || `${targetKey.toUpperCase()}_SUB${idx+1}`,
            name: p.name,
            jersey: String(p.jersey || 20+idx),
            role: p.role || 'Substitute',
            raidPoints: 0,
            bonusPoints: 0,
            tacklePoints: 0,
            outsCount: 0,
            revivalsCount: 0
          }));
        }
        teamObj.benchQueue = [];
      }

      if (window.kabaddiUI) {
        window.kabaddiUI.renderAll();
        window.kabaddiUI.showToast(`Loaded ${team.name} as ${targetKey === 'teamA' ? 'Team A' : 'Team B'}!`, 'super');
      }
      this.switchView('live');
    }

    // -------------------------------------------------------------
    // ARCHIVES PAGE RENDERER
    // -------------------------------------------------------------
    renderArchivesView() {
      const container = document.getElementById('archivesPageGrid');
      if (!container || !window.kabaddiEngine) return;

      const archives = window.kabaddiEngine.getArchivedMatches();
      const countElem = document.getElementById('archivesPageCount');
      if (countElem) countElem.textContent = archives.length;

      container.innerHTML = '';

      if (archives.length === 0) {
        container.innerHTML = `
          <div class="empty-bench-msg" style="padding: 60px 20px; grid-column: 1 / -1; text-align: center;">
            📁 No matches archived yet.<br>
            Completed tournament matches will be listed here with full player scorecards!
          </div>
        `;
        return;
      }

      archives.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'fixture-card';

        const dateStr = item.savedAt ? new Date(item.savedAt).toLocaleString() : 'Tournament Match';
        const teamA = item.teamA || { name: 'Team A', score: item.scoreA || 0, raidPoints: 0, tacklePoints: 0 };
        const teamB = item.teamB || { name: 'Team B', score: item.scoreB || 0, raidPoints: 0, tacklePoints: 0 };
        const itemId = item.id || item.matchId || ('match_' + index);

        card.innerHTML = `
          <div class="fixture-header">
            <span class="fixture-match-badge">#${archives.length - index} • ${item.matchTitle || 'Completed Match'}</span>
            <span class="fixture-status-badge status-completed">Official Result</span>
          </div>

          <div class="fixture-teams-versus">
            <div class="fixture-team-row">
              <div class="fixture-team-info">
                <span class="fixture-team-dot" style="background:#FF6B00;"></span>
                <span class="fixture-team-name">${teamA.name}</span>
              </div>
              <span class="fixture-score-digit" style="color:#fff;">${item.scoreA !== undefined ? item.scoreA : teamA.score}</span>
            </div>

            <div class="fixture-team-row">
              <div class="fixture-team-info">
                <span class="fixture-team-dot" style="background:#00B4D8;"></span>
                <span class="fixture-team-name">${teamB.name}</span>
              </div>
              <span class="fixture-score-digit" style="color:#fff;">${item.scoreB !== undefined ? item.scoreB : teamB.score}</span>
            </div>
          </div>

          <div class="fixture-meta">
            <span>🏆 Winner: <strong>${item.winner === 'Tie' ? 'MATCH TIED' : `${item.winner || 'WINNER'}`}</strong></span>
            <span>Margin: ${item.margin !== undefined ? item.margin : Math.abs((item.scoreA || 0) - (item.scoreB || 0))} pts</span>
          </div>

          <div style="font-size:0.8rem; margin-bottom: 12px; color: var(--text-muted); display:flex; flex-direction:column; gap:4px;">
            <span>⚡ Top Raider: <strong>${item.topRaider ? `${item.topRaider.name} (${item.topRaider.points} pts)` : 'N/A'}</strong></span>
            <span>🛡️ Top Defender: <strong>${item.topDefender ? `${item.topDefender.name} (${item.topDefender.points} pts)` : 'N/A'}</strong></span>
          </div>

          <div class="fixture-actions">
            <button class="btn btn-secondary btn-tiny" style="width:100%;" data-action="view-card" data-id="${itemId}">📊 View Complete Scorecard</button>
          </div>
        `;

        card.querySelector('[data-action="view-card"]').addEventListener('click', () => {
          if (window.kabaddiUI) {
            window.kabaddiUI.openArchivedScorecard(item);
          }
        });

        container.appendChild(card);
      });
    }

    // -------------------------------------------------------------
    // SCORER & ORGANIZER PORTAL
    // -------------------------------------------------------------
    renderPortal() {
      const isScorer = window.kabaddiEngine && window.kabaddiEngine.isScorer();
      const statusTag = document.getElementById('portalAuthStatusTag');
      if (statusTag) {
        if (isScorer) {
          statusTag.className = 'badge status-completed';
          statusTag.textContent = '👑 Authorized Operator Active';
        } else {
          statusTag.className = 'badge status-live';
          statusTag.textContent = '🔒 Spectator Mode (Controls Locked)';
        }
      }

      // Update dynamic links
      const origin = window.location.origin;
      const specInput = document.getElementById('portalSpectatorUrl');
      if (specInput) specInput.value = `${origin}/?role=viewer`;
      const scorerInput = document.getElementById('portalScorerUrl');
      if (scorerInput) scorerInput.value = `${origin}/?role=scorer`;

      const guideSpec = document.getElementById('guideSpectatorUrl');
      if (guideSpec) guideSpec.value = `${origin}/?role=viewer`;
      const guideScorer = document.getElementById('guideScorerUrl');
      if (guideScorer) guideScorer.value = `${origin}/?role=scorer`;

      // Update current Scorer ID in portal
      const localCfg = (window.kabaddiEngine && window.kabaddiEngine.getLocalScorerConfig)
        ? window.kabaddiEngine.getLocalScorerConfig()
        : { scorerId: 'admin' };
      const portalNewId = document.getElementById('portalNewId');
      if (portalNewId && (!portalNewId.value || portalNewId.value === 'admin')) {
        portalNewId.value = localCfg.scorerId || 'admin';
      }

      this.updateNavbarRole();
      this.wirePortalEvents();
    }

    renderGuide() {
      const origin = window.location.origin;
      const guideSpec = document.getElementById('guideSpectatorUrl');
      if (guideSpec) guideSpec.value = `${origin}/?role=viewer`;
      const guideScorer = document.getElementById('guideScorerUrl');
      if (guideScorer) guideScorer.value = `${origin}/?role=scorer`;
      this.wireGuideEvents();
    }

    wireGuideEvents() {
      if (this.guideEventsWired) return;
      this.guideEventsWired = true;

      const guideCopySpec = document.getElementById('guideCopySpectatorBtn');
      if (guideCopySpec) {
        guideCopySpec.addEventListener('click', () => {
          const val = document.getElementById('guideSpectatorUrl')?.value;
          if (val) {
            navigator.clipboard.writeText(val);
            guideCopySpec.textContent = '✅ Copied!';
            if (window.kabaddiUI) window.kabaddiUI.showToast('📋 Copied Public Spectator Link!', 'info');
            setTimeout(() => { guideCopySpec.textContent = '📋 Copy'; }, 2000);
          }
        });
      }

      const guideCopyScorer = document.getElementById('guideCopyScorerBtn');
      if (guideCopyScorer) {
        guideCopyScorer.addEventListener('click', () => {
          const val = document.getElementById('guideScorerUrl')?.value;
          if (val) {
            navigator.clipboard.writeText(val);
            guideCopyScorer.textContent = '✅ Copied!';
            if (window.kabaddiUI) window.kabaddiUI.showToast('👑 Copied Official Scorer Link!', 'super');
            setTimeout(() => { guideCopyScorer.textContent = '📋 Copy'; }, 2000);
          }
        });
      }
    }

    wirePortalEvents() {
      if (this.portalEventsWired) return;
      this.portalEventsWired = true;

      this.wireGuideEvents();

      // Fixtures filter tabs
      const filterTabs = document.querySelectorAll('#fixturesFilterTabs .fixtures-tab-btn');
      filterTabs.forEach(btn => {
        btn.addEventListener('click', () => {
          filterTabs.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderFixtures(btn.dataset.filter);
        });
      });

      // Navbar login button
      const navLogin = document.getElementById('navOpenLoginBtn');
      if (navLogin) {
        navLogin.addEventListener('click', () => {
          document.getElementById('openScorerLoginBtn')?.click();
        });
      }

      // Copy buttons
      const copyViewer = document.getElementById('portalCopyViewerBtn');
      if (copyViewer) {
        copyViewer.addEventListener('click', () => {
          const val = document.getElementById('portalSpectatorUrl')?.value;
          if (val) {
            navigator.clipboard.writeText(val);
            copyViewer.textContent = '✅ Copied!';
            if (window.kabaddiUI) window.kabaddiUI.showToast('📋 Copied Public Spectator Link!', 'info');
            setTimeout(() => { copyViewer.textContent = '📋 Copy'; }, 2000);
          }
        });
      }

      const copyScorer = document.getElementById('portalCopyScorerBtn');
      if (copyScorer) {
        copyScorer.addEventListener('click', () => {
          const val = document.getElementById('portalScorerUrl')?.value;
          if (val) {
            navigator.clipboard.writeText(val);
            copyScorer.textContent = '✅ Copied!';
            if (window.kabaddiUI) window.kabaddiUI.showToast('👑 Copied Official Scorer Link!', 'super');
            setTimeout(() => { copyScorer.textContent = '📋 Copy'; }, 2000);
          }
        });
      }

      // Save credentials in portal
      const saveCredsBtn = document.getElementById('portalSaveCredsBtn');
      if (saveCredsBtn) {
        saveCredsBtn.addEventListener('click', async () => {
          const currentPass = document.getElementById('portalCurrentPass')?.value.trim();
          const newId = document.getElementById('portalNewId')?.value.trim();
          const newPass = document.getElementById('portalNewPass')?.value.trim();
          const confirmPass = document.getElementById('portalConfirmPass')?.value.trim();
          const msgElem = document.getElementById('portalCredMsg');

          if (!currentPass) {
            if (msgElem) {
              msgElem.className = 'auth-error-msg';
              msgElem.textContent = 'Please enter your current Password or PIN.';
            }
            return;
          }

          if (newPass && newPass.length < 4) {
            if (msgElem) {
              msgElem.className = 'auth-error-msg';
              msgElem.textContent = 'New Password must be at least 4 characters.';
            }
            return;
          }

          if (newPass && newPass !== confirmPass) {
            if (msgElem) {
              msgElem.className = 'auth-error-msg';
              msgElem.textContent = 'New Password and Confirm Password do not match.';
            }
            return;
          }

          saveCredsBtn.disabled = true;
          saveCredsBtn.textContent = 'Saving...';

          if (window.kabaddiEngine) {
            const res = await window.kabaddiEngine.updateScorerCredentials(currentPass, newId, newPass);
            saveCredsBtn.disabled = false;
            saveCredsBtn.textContent = '💾 Save Scorer Credentials';

            if (res.success) {
              if (msgElem) {
                msgElem.className = '';
                msgElem.style.color = '#10B981';
                msgElem.textContent = `✅ ${res.message || 'Credentials updated successfully!'}`;
              }
              if (window.kabaddiUI) {
                window.kabaddiUI.showToast(`🔑 Scorer Credentials updated for "${res.scorerId || newId}"!`, 'super');
              }
            } else {
              if (msgElem) {
                msgElem.className = 'auth-error-msg';
                msgElem.textContent = `❌ ${res.error || 'Failed to update credentials.'}`;
              }
            }
          }
        });
      }
    }

    // Default Fallback Data
    getDefaultFixtures() {
      return [
        { id: "fixture_1", matchNumber: 1, stage: "League Match", court: "Mat 1", time: "09:30 AM", date: "Tomorrow", teamA: "Patna Warriors", teamB: "Bengal Tigers", status: "live", scoreA: 0, scoreB: 0 },
        { id: "fixture_2", matchNumber: 2, stage: "League Match", court: "Mat 1", time: "11:00 AM", date: "Tomorrow", teamA: "Mumbai Warriors", teamB: "Bengaluru Bulls", status: "upcoming", scoreA: 0, scoreB: 0 },
        { id: "fixture_3", matchNumber: 3, stage: "League Match", court: "Mat 1", time: "02:00 PM", date: "Tomorrow", teamA: "Jaipur Panthers", teamB: "Tamil Thalas", status: "upcoming", scoreA: 0, scoreB: 0 },
        { id: "fixture_4", matchNumber: 4, stage: "Quarter Final", court: "Mat 1", time: "04:30 PM", date: "Tomorrow", teamA: "Top Qualifier A", teamB: "Top Qualifier B", status: "upcoming", scoreA: 0, scoreB: 0 },
        { id: "fixture_5", matchNumber: 5, stage: "Semi Final", court: "Mat 1", time: "06:30 PM", date: "Tomorrow", teamA: "Semi-Finalist 1", teamB: "Semi-Finalist 2", status: "upcoming", scoreA: 0, scoreB: 0 },
        { id: "fixture_6", matchNumber: 6, stage: "Grand Final", court: "Mat 1", time: "08:15 PM", date: "Tomorrow", teamA: "Finalist 1", teamB: "Finalist 2", status: "upcoming", scoreA: 0, scoreB: 0 }
      ];
    }

    getDefaultTeams() {
      return [
        {
          name: "Patna Warriors",
          city: "Patna",
          color: "#FF6B00",
          captain: "Sachin Tanwar",
          coach: "Ram Mehar Singh",
          players: [
            { jersey: "1", name: "Sachin Tanwar", role: "Raider", isCaptain: true },
            { jersey: "2", name: "Manjeet Dahiya", role: "Raider" },
            { jersey: "3", name: "Neeraj Kumar", role: "Defender" },
            { jersey: "4", name: "Sunil Kumar", role: "Defender" },
            { jersey: "5", name: "Mohit Goyat", role: "All-Rounder" },
            { jersey: "6", name: "Sajin C.", role: "Defender" },
            { jersey: "7", name: "Shubham Shinde", role: "Defender" }
          ],
          substitutes: [
            { jersey: "21", name: "Rohit Gulia", role: "Raider" },
            { jersey: "22", name: "Monu Goyat", role: "Raider" },
            { jersey: "24", name: "Vikas Jaglan", role: "All-Rounder" }
          ]
        },
        {
          name: "Bengal Tigers",
          city: "Kolkata",
          color: "#00B4D8",
          captain: "Maninder Singh",
          coach: "K. Baskaran",
          players: [
            { jersey: "9", name: "Maninder Singh", role: "Raider", isCaptain: true },
            { jersey: "10", name: "Shrikant Jadhav", role: "Raider" },
            { jersey: "11", name: "Vaibhav Garje", role: "Defender" },
            { jersey: "12", name: "Jaskirat Singh", role: "Defender" },
            { jersey: "13", name: "Nitin Rawal", role: "All-Rounder" },
            { jersey: "14", name: "Darshan J.", role: "Defender" },
            { jersey: "15", name: "Shubham Kumar", role: "Defender" }
          ],
          substitutes: [
            { jersey: "25", name: "Akshay Kumar", role: "Defender" },
            { jersey: "27", name: "Suyog Gaikar", role: "Raider" },
            { jersey: "29", name: "Hem Raj", role: "All-Rounder" }
          ]
        },
        {
          name: "Mumbai Warriors",
          city: "Mumbai",
          color: "#FF5722",
          captain: "Guman Singh",
          coach: "Gholamreza M.",
          players: [
            { jersey: "1", name: "Guman Singh", role: "Raider", isCaptain: true },
            { jersey: "2", name: "Jai Bhagwan", role: "Raider" },
            { jersey: "3", name: "Surinder Singh", role: "Defender" },
            { jersey: "4", name: "Rinku Sharma", role: "Defender" },
            { jersey: "5", name: "Visvanath V.", role: "All-Rounder" },
            { jersey: "6", name: "Mahender Singh", role: "Defender" },
            { jersey: "7", name: "Sombir Goswami", role: "Defender" }
          ],
          substitutes: [
            { jersey: "18", name: "Shivansh Thakur", role: "Defender" },
            { jersey: "20", name: "Heidarali Ekrami", role: "Raider" },
            { jersey: "22", name: "Pranay Rane", role: "Raider" }
          ]
        },
        {
          name: "Bengaluru Bulls",
          city: "Bengaluru",
          color: "#DC2626",
          captain: "Bharat Hooda",
          coach: "Randhir Singh",
          players: [
            { jersey: "1", name: "Bharat Hooda", role: "Raider", isCaptain: true },
            { jersey: "2", name: "Vikash Kandola", role: "Raider" },
            { jersey: "3", name: "Saurabh Nandal", role: "Defender" },
            { jersey: "4", name: "Aman Antil", role: "Defender" },
            { jersey: "5", name: "Neeraj Narwal", role: "All-Rounder" },
            { jersey: "6", name: "Yash Hooda", role: "Defender" },
            { jersey: "7", name: "Surjeet Singh", role: "Defender" }
          ],
          substitutes: [
            { jersey: "19", name: "Abhishek Singh", role: "Raider" },
            { jersey: "21", name: "Piotr Pamulak", role: "Raider" },
            { jersey: "23", name: "Ponparthiban S.", role: "Defender" }
          ]
        },
        {
          name: "Jaipur Panthers",
          city: "Jaipur",
          color: "#EC4899",
          captain: "Arjun Deshwal",
          coach: "Sanjeev Baliyan",
          players: [
            { jersey: "1", name: "Arjun Deshwal", role: "Raider", isCaptain: true },
            { jersey: "2", name: "Ajith Kumar", role: "Raider" },
            { jersey: "3", name: "Sunil Kumar", role: "Defender" },
            { jersey: "4", name: "Sahul Kumar", role: "Defender" },
            { jersey: "5", name: "Ankush Rathee", role: "Defender" },
            { jersey: "6", name: "Reza Mirbagheri", role: "Defender" },
            { jersey: "7", name: "Abhishek KS", role: "Defender" }
          ],
          substitutes: [
            { jersey: "20", name: "Bhavani Rajput", role: "Raider" },
            { jersey: "22", name: "Navneet", role: "Raider" },
            { jersey: "24", name: "Lucky Sharma", role: "Defender" }
          ]
        },
        {
          name: "Tamil Thalas",
          city: "Chennai",
          color: "#EAB308",
          captain: "Sagar Rathee",
          coach: "Ashan Kumar",
          players: [
            { jersey: "1", name: "Sagar Rathee", role: "Defender", isCaptain: true },
            { jersey: "2", name: "Narender Hoshiyar", role: "Raider" },
            { jersey: "3", name: "Ajinkya Pawar", role: "Raider" },
            { jersey: "4", name: "Sahil Gulia", role: "Defender" },
            { jersey: "5", name: "Mohit", role: "Defender" },
            { jersey: "6", name: "M. Abhishek", role: "Defender" },
            { jersey: "7", name: "Himanshu Singh", role: "All-Rounder" }
          ],
          substitutes: [
            { jersey: "19", name: "Jatin", role: "Raider" },
            { jersey: "21", name: "Amirhossein Bastami", role: "Defender" },
            { jersey: "23", name: "K. Abhimanyu", role: "Raider" }
          ]
        }
      ];
    }

    getDefaultStandings() {
      return [
        { rank: 1, name: "Patna Warriors", short: "PAT", played: 1, won: 1, lost: 0, tied: 0, scoreDiff: 7, points: 5, form: ["W"] },
        { rank: 2, name: "Mumbai Warriors", short: "MUM", played: 1, won: 1, lost: 0, tied: 0, scoreDiff: 7, points: 5, form: ["W"] },
        { rank: 3, name: "Bengaluru Bulls", short: "BLR", played: 0, won: 0, lost: 0, tied: 0, scoreDiff: 0, points: 0, form: [] },
        { rank: 4, name: "Jaipur Panthers", short: "JAI", played: 0, won: 0, lost: 0, tied: 0, scoreDiff: 0, points: 0, form: [] },
        { rank: 5, name: "Tamil Thalas", short: "TAM", played: 0, won: 0, lost: 0, tied: 0, scoreDiff: 0, points: 0, form: [] },
        { rank: 6, name: "Bengal Tigers", short: "BEN", played: 2, won: 0, lost: 2, tied: 0, scoreDiff: -14, points: 1, form: ["L", "L"] }
      ];
    }
  }

  // Instantiate and bind to window
  window.tournamentApp = new TournamentApp();
  document.addEventListener('DOMContentLoaded', () => {
    window.tournamentApp.init();
  });
})();
