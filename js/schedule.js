// ═══════════════════════════════════════════════════════════
//  SCHEDULE STATE
// ═══════════════════════════════════════════════════════════
let selectedCities = new Set();
let selectedDates  = new Set();
let selectedTeams  = new Set();

// ═══════════════════════════════════════════════════════════
//  FILTER LOGIC
// ═══════════════════════════════════════════════════════════
function applyFilter() {
  let anyVisible = false;

  document.querySelectorAll('.sched-card').forEach(card => {
    const cityOk = selectedCities.size === 0 || selectedCities.has(card.dataset.city);
    const teamOk = selectedTeams.size === 0 || selectedTeams.has(card.dataset.home) || selectedTeams.has(card.dataset.away);
    card.style.display = (cityOk && teamOk) ? '' : 'none';
  });

  document.querySelectorAll('.schedule-day').forEach(day => {
    const iso    = day.dataset.day;
    const dateOk = selectedDates.size === 0 || selectedDates.has(iso);
    const vis    = dateOk ? [...day.querySelectorAll('.sched-card')].filter(c => c.style.display !== 'none') : [];
    const show   = vis.length > 0;
    day.style.display = show ? '' : 'none';
    if (show) anyVisible = true;
    const cnt = document.getElementById('count-' + iso);
    if (cnt) cnt.textContent = vis.length + (LANG === 'zh' ? '场比赛' : ' match' + (vis.length !== 1 ? 'es' : ''));
  });

  document.querySelectorAll('.stage-divider').forEach(div => {
    let next = div.nextElementSibling, hasVisible = false;
    while (next && !next.classList.contains('stage-divider')) {
      if (next.classList.contains('schedule-day') && next.style.display !== 'none') { hasVisible = true; break; }
      next = next.nextElementSibling;
    }
    div.style.display = hasVisible ? '' : 'none';
  });

  document.getElementById('noResults').style.display = anyVisible ? 'none' : '';
  updateCityTriggerLabel();
  updateCityTags();
  updateCalTriggerLabel();
  updateDateTags();
  updateTeamTriggerLabel();
  updateTeamTags();
}

// ── City dropdown label & tags ────────────────────────────
function updateCityTriggerLabel() {
  const trigger = document.getElementById('dropdownTrigger');
  const label   = document.getElementById('dropdownLabel');
  if (!trigger) return;
  if (selectedCities.size === 0) {
    label.textContent = LANG === 'zh' ? '全部城市' : 'All Cities';
    trigger.classList.remove('has-selection');
  } else {
    label.textContent = selectedCities.size === 1
      ? cityName([...selectedCities][0])
      : (LANG === 'zh' ? `已选 ${selectedCities.size} 个城市` : `${selectedCities.size} cities selected`);
    trigger.classList.add('has-selection');
  }
}

function updateCityTags() {
  const container = document.getElementById('selectedTags');
  if (!container) return;
  container.innerHTML = [...selectedCities].map(city => `
    <span class="selected-tag">${cityName(city)}<span class="tag-remove" data-city="${city}">&#x2715;</span></span>
  `).join('');
}

// ── Team dropdown label & tags ────────────────────────────
function updateTeamTriggerLabel() {
  const trigger = document.getElementById('teamDropdownTrigger');
  const label   = document.getElementById('teamDropdownLabel');
  if (!trigger || !label) return;
  if (selectedTeams.size === 0) {
    label.textContent = LANG === 'zh' ? '全部球队' : 'All Teams';
    trigger.classList.remove('has-selection');
  } else {
    label.textContent = selectedTeams.size === 1
      ? (LANG === 'zh' ? (TEAM_NAMES_ZH[[...selectedTeams][0]] || [...selectedTeams][0]) : [...selectedTeams][0])
      : (LANG === 'zh' ? `已选 ${selectedTeams.size} 支球队` : `${selectedTeams.size} teams selected`);
    trigger.classList.add('has-selection');
  }
}

function updateTeamTags() {
  const container = document.getElementById('selectedTeamTags');
  if (!container) return;
  container.innerHTML = [...selectedTeams].map(t => {
    const name = LANG === 'zh' ? (TEAM_NAMES_ZH[t] || t) : t;
    const fl   = FLAGS[t] ? `<img src="https://flagcdn.com/w40/${FLAGS[t]}.png" style="width:16px;height:11px;object-fit:cover;border-radius:1px;margin-right:4px;vertical-align:middle" alt="">` : '';
    return `<span class="selected-tag">${fl}${name}<span class="tag-remove team-tag-remove" data-team="${t}">&#x2715;</span></span>`;
  }).join('');
}

// ── Calendar trigger label & date tags ───────────────────
function updateCalTriggerLabel() {
  const trigger = document.getElementById('calTrigger');
  const label   = document.getElementById('calTriggerLabel');
  if (!trigger) return;
  if (selectedDates.size === 0) {
    label.textContent = LANG === 'zh' ? '全部日期' : 'All Dates';
    trigger.classList.remove('has-selection');
  } else if (selectedDates.size === 1) {
    const iso = [...selectedDates][0];
    label.textContent = `${fmtWeekdayL(iso)}, ${fmtDateL(iso)}`;
    trigger.classList.add('has-selection');
  } else {
    label.textContent = LANG === 'zh' ? `已选 ${selectedDates.size} 个日期` : `${selectedDates.size} dates selected`;
    trigger.classList.add('has-selection');
  }
}

function updateDateTags() {
  const container = document.getElementById('selectedDateTags');
  if (!container) return;
  container.innerHTML = [...selectedDates].sort().map(iso => `
    <span class="date-tag">${fmtWeekdayL(iso)}, ${fmtDateL(iso)}<span class="tag-remove date-tag-remove" data-date="${iso}">&#x2715;</span></span>
  `).join('');
}

// ═══════════════════════════════════════════════════════════
//  SCHEDULE CARD TEMPLATE
// ═══════════════════════════════════════════════════════════
function schedCardHtml(m) {
  const city      = getCity(m.venue);
  const country   = getCountry(m.venue);
  const stadium   = m.venue.split(',')[0].trim();
  const isGroup   = !!m.group;
  const accent    = isGroup ? GROUP_ACCENT[m.group] : ROUND_ACCENT[m.round];
  const pill      = roundL(m.round, isGroup ? m.group : null);
  const f1        = isGroup ? flagImg(m.home, 32, 21) : '';
  const f2        = isGroup ? flagImg(m.away, 32, 21) : '';
  const localTime = toUserLocalTime(m.time, m.dateISO);
  const tz        = userTzLabel();
  const clockIcon = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  const pinIcon   = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

  return `
    <div class="sched-card" data-city="${city}" data-home="${m.home}" data-away="${m.away}">
      <div class="sched-top">
        <span class="group-pill" style="background:${accent}">${pill}</span>
        <span class="sched-time">${clockIcon}${localTime} ${tz}</span>
      </div>
      <div class="sched-teams">
        <div class="sched-team">${f1}<span>${teamName(m.home)}</span></div>
        <span class="sched-vs">VS</span>
        <div class="sched-team right"><span>${teamName(m.away)}</span>${f2}</div>
      </div>
      <div class="sched-venue">${pinIcon} <span class="venue-stadium">${stadium}</span><span class="venue-sep"> · </span><span class="venue-city">${cityName(city)}, ${countryName(country)}</span></div>
      <div class="card-links">
        <a href="${getStubHubUrl(m)}" class="card-link-btn card-ticket-btn" target="_blank" rel="noopener">🎫 ${LANG === 'zh' ? '购票' : 'Tickets'}</a>
        <a href="${getBookingUrl(m.venue, m.dateISO)}" class="card-link-btn card-hotel-btn" target="_blank" rel="noopener">🏨 ${LANG === 'zh' ? '酒店' : 'Hotel'}</a>
        <a href="#" class="card-link-btn card-flight-btn" onclick="openFlightLink('${city}','${m.dateISO}');return false;">✈️ ${LANG === 'zh' ? '机票' : 'Flights'}</a>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
//  BUILD SCHEDULE VIEW
// ═══════════════════════════════════════════════════════════
function buildSchedule() {
  selectedCities = new Set();
  selectedDates  = new Set();
  selectedTeams  = new Set();

  const byDate = {};
  ALL_MATCHES.forEach(m => (byDate[m.dateISO] = byDate[m.dateISO] || []).push(m));

  const sorted    = Object.keys(byDate).sort();
  const container = document.getElementById('view-schedule');

  // ── City dropdown ─────────────────────────────────────────
  const cityGroupsHtml = CITY_GROUPS.map(g => `
    <div class="dropdown-group">
      <div class="group-header-dd">
        <img src="https://flagcdn.com/w40/${g.flag}.png" alt="${g.country}">
        ${countryName(g.country)}
      </div>
      ${g.cities.map(city => `
        <label class="city-option">
          <input type="checkbox" class="city-cb" value="${city}">
          <span class="city-name">${cityName(city)}</span>
          <span class="city-count">${CITY_COUNTS[city] || 0}</span>
        </label>
      `).join('')}
    </div>
  `).join('');

  // ── Calendar ──────────────────────────────────────────────
  const matchDateSet = new Set(sorted);

  function calMonth(mo) {
    const first = new Date(2026, mo - 1, 1).getDay();
    const days  = new Date(2026, mo, 0).getDate();
    const title = LANG === 'zh' ? `2026年${mo}月` : `${ ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'][mo] } 2026`;
    const dowHtml = LANG === 'zh'
      ? '<span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>'
      : '<span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>';
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<div class="cal-cell"></div>';
    for (let d = 1; d <= days; d++) {
      const iso = `2026-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (matchDateSet.has(iso)) {
        const cnt = (byDate[iso] || []).length;
        cells += `<div class="cal-cell cal-match" data-iso="${iso}"><span class="cal-num">${d}</span><span class="cal-cnt">${cnt}</span></div>`;
      } else {
        cells += `<div class="cal-cell"><span class="cal-num">${d}</span></div>`;
      }
    }
    return `<div class="cal-block">
      <div class="cal-month-title">${title}</div>
      <div class="cal-dow">${dowHtml}</div>
      <div class="cal-cells">${cells}</div>
    </div>`;
  }

  const calHint = LANG === 'zh' ? '点击日期筛选 · 再次点击取消' : 'Click a date to filter · click again to deselect';
  const calPanelHtml = `<div class="cal-panel" id="calPanel">
    <div class="cal-top-row">
      <span style="font-size:.72rem;color:#546e7a">${calHint}</span>
      <button class="cal-clear-btn" id="calClearBtn">${LANG === 'zh' ? '清除' : 'Clear'}</button>
    </div>
    <div class="cal-months">${calMonth(6)}${calMonth(7)}</div>
  </div>`;

  // ── Day blocks ────────────────────────────────────────────
  let lastStage = null;
  const daysHtml = sorted.map(iso => {
    const matches = byDate[iso];
    const stage   = matches[0].round ? 'knockout' : 'group';
    let divider = '';
    if (stage !== lastStage && stage === 'knockout') {
      divider = `
        <div class="stage-divider">
          <div class="stage-divider-line"></div>
          <div class="stage-divider-label">${LANG === 'zh' ? '淘汰赛阶段' : 'Knockout Stage'}</div>
          <div class="stage-divider-line"></div>
        </div>`;
    }
    lastStage = stage;
    const n = matches.length;
    const countStr = LANG === 'zh' ? `${n}场比赛` : `${n} match${n !== 1 ? 'es' : ''}`;
    return `${divider}
      <div class="schedule-day" data-day="${iso}">
        <div class="day-header">
          <div class="day-label">
            <div class="weekday">${fmtWeekdayL(iso)}</div>
            <div class="date-str">${fmtDateL(iso)}</div>
          </div>
          <div class="day-divider"></div>
          <div class="day-count" id="count-${iso}">${countStr}</div>
        </div>
        <div class="schedule-matches">${matches.map(schedCardHtml).join('')}</div>
      </div>`;
  }).join('');

  const filterCityLabel = LANG === 'zh' ? '按城市筛选' : 'Filter by City';
  const filterDateLabel = LANG === 'zh' ? '日期' : 'Date';
  const filterTeamLabel = LANG === 'zh' ? '球队' : 'Team';
  const allCitiesLabel  = LANG === 'zh' ? '全部城市' : 'All Cities';
  const allDatesLabel   = LANG === 'zh' ? '全部日期' : 'All Dates';
  const allTeamsLabel   = LANG === 'zh' ? '全部球队' : 'All Teams';
  const selectAllLabel  = LANG === 'zh' ? '全选' : 'Select All';
  const clearAllLabel   = LANG === 'zh' ? '清除全部' : 'Clear All';
  const noResultsText   = LANG === 'zh' ? '没有符合条件的比赛。' : 'No matches found for the selected filters.';

  const teamList = [...new Set(
    ALL_MATCHES.flatMap(m => [m.home, m.away])
      .filter(t => !/^(1st|2nd|3rd|W |L )/.test(t))
  )].sort((a, b) => {
    const na = LANG === 'zh' ? (TEAM_NAMES_ZH[a] || a) : a;
    const nb = LANG === 'zh' ? (TEAM_NAMES_ZH[b] || b) : b;
    return na.localeCompare(nb);
  });
  const teamCheckboxHtml = teamList.map(t => {
    const name = LANG === 'zh' ? (TEAM_NAMES_ZH[t] || t) : t;
    const fl   = FLAGS[t] ? `<img src="https://flagcdn.com/w40/${FLAGS[t]}.png" class="team-option-flag" alt="">` : '';
    return `<label class="city-option">
      <input type="checkbox" class="team-cb" value="${t}">
      ${fl}<span class="city-name">${name}</span>
    </label>`;
  }).join('');

  container.innerHTML = `
    <div class="filter-row">
      <span class="filter-label">${filterCityLabel}</span>
      <div class="dropdown-wrapper" id="dropdownWrapper">
        <button class="dropdown-trigger" id="dropdownTrigger">
          <span class="trigger-left">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span id="dropdownLabel">${allCitiesLabel}</span>
          </span>
          <svg class="chevron" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="dropdown-panel" id="dropdownPanel">
          <div class="dropdown-actions">
            <button class="dd-action" id="ddSelectAll">${selectAllLabel}</button>
            <button class="dd-action" id="ddClearAll">${clearAllLabel}</button>
          </div>
          ${cityGroupsHtml}
        </div>
      </div>
      <span class="filter-label">${filterDateLabel}</span>
      <div class="dropdown-wrapper" id="calTriggerWrapper">
        <button class="dropdown-trigger" id="calTrigger">
          <span class="trigger-left">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span id="calTriggerLabel">${allDatesLabel}</span>
          </span>
          <svg class="chevron" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
    </div>
    <div class="selected-tags" id="selectedTags"></div>
    ${calPanelHtml}
    <div class="selected-tags" id="selectedDateTags"></div>
    <div class="filter-row">
      <span class="filter-label">${filterTeamLabel}</span>
      <div class="dropdown-wrapper" id="teamDropdownWrapper">
        <button class="dropdown-trigger" id="teamDropdownTrigger">
          <span class="trigger-left">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            <span id="teamDropdownLabel">${allTeamsLabel}</span>
          </span>
          <svg class="chevron" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="dropdown-panel team-dropdown-panel" id="teamDropdownPanel">
          <div class="dropdown-actions">
            <button class="dd-action" id="teamDdSelectAll">${selectAllLabel}</button>
            <button class="dd-action" id="teamDdClearAll">${clearAllLabel}</button>
          </div>
          ${teamCheckboxHtml}
        </div>
      </div>
    </div>
    <div class="selected-tags" id="selectedTeamTags"></div>
    ${daysHtml}
    <div class="no-results" id="noResults" style="display:none">${noResultsText}</div>
  `;

  // ── Initial match counts ──────────────────────────────────
  document.querySelectorAll('.schedule-day').forEach(day => {
    const cnt = document.getElementById('count-' + day.dataset.day);
    const n   = day.querySelectorAll('.sched-card').length;
    if (cnt) cnt.textContent = LANG === 'zh' ? `${n}场比赛` : `${n} match${n !== 1 ? 'es' : ''}`;
  });

  // ── City dropdown events ──────────────────────────────────
  const cityTrigger = document.getElementById('dropdownTrigger');
  const cityPanel   = document.getElementById('dropdownPanel');

  cityTrigger.addEventListener('click', e => {
    e.stopPropagation();
    const open = cityPanel.classList.toggle('open');
    cityTrigger.classList.toggle('open', open);
  });
  document.addEventListener('click', e => {
    const w = document.getElementById('dropdownWrapper');
    if (w && !w.contains(e.target)) { cityPanel.classList.remove('open'); cityTrigger.classList.remove('open'); }
  });
  document.getElementById('ddSelectAll').addEventListener('click', () => {
    container.querySelectorAll('.city-cb').forEach(cb => { cb.checked = true; selectedCities.add(cb.value); });
    applyFilter();
  });
  document.getElementById('ddClearAll').addEventListener('click', () => {
    container.querySelectorAll('.city-cb').forEach(cb => cb.checked = false);
    selectedCities.clear(); applyFilter();
  });
  document.getElementById('selectedTags').addEventListener('click', e => {
    const btn = e.target.closest('.tag-remove');
    if (!btn) return;
    const city = btn.dataset.city;
    selectedCities.delete(city);
    const cb = container.querySelector(`.city-cb[value="${CSS.escape(city)}"]`);
    if (cb) cb.checked = false;
    applyFilter();
  });
  container.addEventListener('change', e => {
    if (e.target.classList.contains('city-cb')) {
      e.target.checked ? selectedCities.add(e.target.value) : selectedCities.delete(e.target.value);
      applyFilter();
    }
  });

  // ── Calendar toggle ───────────────────────────────────────
  const calTrigger = document.getElementById('calTrigger');
  const calPanel   = document.getElementById('calPanel');

  calTrigger.addEventListener('click', e => {
    e.stopPropagation();
    const open = calPanel.classList.toggle('open');
    calTrigger.classList.toggle('open', open);
  });
  document.addEventListener('click', e => {
    const w = document.getElementById('calTriggerWrapper');
    if (w && !w.contains(e.target) && !calPanel.contains(e.target)) {
      calPanel.classList.remove('open');
      calTrigger.classList.remove('open');
    }
  });

  // ── Calendar cell clicks ──────────────────────────────────
  calPanel.addEventListener('click', e => {
    if (e.target.closest('#calClearBtn')) {
      selectedDates.clear();
      calPanel.querySelectorAll('.cal-selected').forEach(c => c.classList.remove('cal-selected'));
      applyFilter();
      return;
    }
    const cell = e.target.closest('.cal-match');
    if (!cell) return;
    const iso = cell.dataset.iso;
    if (selectedDates.has(iso)) {
      selectedDates.delete(iso);
      cell.classList.remove('cal-selected');
    } else {
      selectedDates.add(iso);
      cell.classList.add('cal-selected');
    }
    applyFilter();
  });

  document.getElementById('selectedDateTags').addEventListener('click', e => {
    const btn = e.target.closest('.date-tag-remove');
    if (!btn) return;
    const iso = btn.dataset.date;
    selectedDates.delete(iso);
    const cell = calPanel.querySelector(`.cal-match[data-iso="${iso}"]`);
    if (cell) cell.classList.remove('cal-selected');
    applyFilter();
  });

  // ── Team dropdown ─────────────────────────────────────────
  const teamTrigger = document.getElementById('teamDropdownTrigger');
  const teamPanel   = document.getElementById('teamDropdownPanel');

  teamTrigger.addEventListener('click', e => {
    e.stopPropagation();
    const open = teamPanel.classList.toggle('open');
    teamTrigger.classList.toggle('open', open);
  });
  document.addEventListener('click', e => {
    const w = document.getElementById('teamDropdownWrapper');
    if (w && !w.contains(e.target)) { teamPanel.classList.remove('open'); teamTrigger.classList.remove('open'); }
  });
  document.getElementById('teamDdSelectAll').addEventListener('click', () => {
    container.querySelectorAll('.team-cb').forEach(cb => { cb.checked = true; selectedTeams.add(cb.value); });
    applyFilter();
  });
  document.getElementById('teamDdClearAll').addEventListener('click', () => {
    container.querySelectorAll('.team-cb').forEach(cb => cb.checked = false);
    selectedTeams.clear(); applyFilter();
  });
  container.addEventListener('change', e => {
    if (e.target.classList.contains('team-cb')) {
      e.target.checked ? selectedTeams.add(e.target.value) : selectedTeams.delete(e.target.value);
      applyFilter();
    }
  });
  document.getElementById('selectedTeamTags').addEventListener('click', e => {
    const btn = e.target.closest('.team-tag-remove');
    if (!btn) return;
    const team = btn.dataset.team;
    selectedTeams.delete(team);
    const cb = container.querySelector(`.team-cb[value="${CSS.escape(team)}"]`);
    if (cb) cb.checked = false;
    applyFilter();
  });
}
