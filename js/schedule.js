// ═══════════════════════════════════════════════════════════
//  SCHEDULE STATE
// ═══════════════════════════════════════════════════════════
let selectedCities = new Set();
let selectedDates  = new Set();

// ═══════════════════════════════════════════════════════════
//  FILTER LOGIC
// ═══════════════════════════════════════════════════════════
function applyFilter() {
  let anyVisible = false;

  // City filter on individual cards
  document.querySelectorAll('.sched-card').forEach(card => {
    const show = selectedCities.size === 0 || selectedCities.has(card.dataset.city);
    card.style.display = show ? '' : 'none';
  });

  // Date filter on day blocks + recount visible cards
  document.querySelectorAll('.schedule-day').forEach(day => {
    const iso = day.dataset.day;
    const dateOk = selectedDates.size === 0 || selectedDates.has(iso);
    const vis = dateOk ? [...day.querySelectorAll('.sched-card')].filter(c => c.style.display !== 'none') : [];
    const show = vis.length > 0;
    day.style.display = show ? '' : 'none';
    if (show) anyVisible = true;
    const cnt = document.getElementById('count-' + iso);
    if (cnt) cnt.textContent = vis.length + ' match' + (vis.length !== 1 ? 'es' : '');
  });

  // Stage-divider: hide if all following days are hidden
  document.querySelectorAll('.stage-divider').forEach(div => {
    let next = div.nextElementSibling;
    let hasVisible = false;
    while (next && !next.classList.contains('stage-divider')) {
      if (next.classList.contains('schedule-day') && next.style.display !== 'none') { hasVisible = true; break; }
      next = next.nextElementSibling;
    }
    div.style.display = hasVisible ? '' : 'none';
  });

  document.getElementById('noResults').style.display = anyVisible ? 'none' : '';
  updateCityTriggerLabel();
  updateCityTags();
  updateDateTriggerLabel();
  updateDateTags();
}

// ── City dropdown label & tags ────────────────────────────
function updateCityTriggerLabel() {
  const trigger = document.getElementById('dropdownTrigger');
  const label   = document.getElementById('dropdownLabel');
  if (!trigger) return;
  if (selectedCities.size === 0) {
    label.textContent = 'All Cities'; trigger.classList.remove('has-selection');
  } else {
    label.textContent = selectedCities.size === 1 ? [...selectedCities][0] : `${selectedCities.size} cities selected`;
    trigger.classList.add('has-selection');
  }
}

function updateCityTags() {
  const container = document.getElementById('selectedTags');
  if (!container) return;
  container.innerHTML = [...selectedCities].map(city => `
    <span class="selected-tag">${city}<span class="tag-remove" data-city="${city}">&#x2715;</span></span>
  `).join('');
}

// ── Date dropdown label & tags ────────────────────────────
function updateDateTriggerLabel() {
  const trigger = document.getElementById('dateDdTrigger');
  const label   = document.getElementById('dateDdLabel');
  if (!trigger) return;
  if (selectedDates.size === 0) {
    label.textContent = 'All Dates'; trigger.classList.remove('has-selection');
  } else if (selectedDates.size === 1) {
    const iso = [...selectedDates][0];
    label.textContent = `${fmtWeekday(iso)}, ${fmtDate(iso)}`; trigger.classList.add('has-selection');
  } else {
    label.textContent = `${selectedDates.size} dates selected`; trigger.classList.add('has-selection');
  }
}

function updateDateTags() {
  const container = document.getElementById('selectedDateTags');
  if (!container) return;
  container.innerHTML = [...selectedDates].sort().map(iso => `
    <span class="date-tag">${fmtWeekday(iso)}, ${fmtDate(iso)}<span class="tag-remove date-tag-remove" data-date="${iso}">&#x2715;</span></span>
  `).join('');
}

// ═══════════════════════════════════════════════════════════
//  SCHEDULE CARD TEMPLATE
// ═══════════════════════════════════════════════════════════
function schedCardHtml(m) {
  const city     = getCity(m.venue);
  const isGroup  = !!m.group;
  const accent   = isGroup ? GROUP_ACCENT[m.group] : ROUND_ACCENT[m.round];
  const pill     = isGroup ? `GROUP ${m.group}` : ROUND_LABEL[m.round];
  const f1       = isGroup ? flagImg(m.home, 32, 21) : '';
  const f2       = isGroup ? flagImg(m.away, 32, 21) : '';
  const timeNote = isGroup ? 'ET' : 'local';
  const clockIcon = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  const pinIcon   = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

  return `
    <div class="sched-card" data-city="${city}">
      <div class="sched-top">
        <span class="group-pill" style="background:${accent}">${pill}</span>
        <span class="sched-time">${clockIcon}${m.time} ${timeNote}</span>
      </div>
      <div class="sched-teams">
        <div class="sched-team">${f1}<span>${m.home}</span></div>
        <span class="sched-vs">VS</span>
        <div class="sched-team right"><span>${m.away}</span>${f2}</div>
      </div>
      <div class="sched-venue">${pinIcon} ${m.venue}</div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
//  BUILD SCHEDULE VIEW
// ═══════════════════════════════════════════════════════════
function buildSchedule() {
  const byDate = {};
  ALL_MATCHES.forEach(m => (byDate[m.dateISO] = byDate[m.dateISO] || []).push(m));

  const sorted    = Object.keys(byDate).sort();
  const container = document.getElementById('view-schedule');

  // ── Date dropdown HTML ────────────────────────────────────
  const dateGroupsHtml = [
    { label: 'June 2026', isos: sorted.filter(d => d.startsWith('2026-06')) },
    { label: 'July 2026', isos: sorted.filter(d => d.startsWith('2026-07')) },
  ].filter(g => g.isos.length > 0).map(g => `
    <div class="dropdown-group">
      <div class="group-header-dd">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${g.label}
      </div>
      ${g.isos.map(iso => `
        <label class="city-option">
          <input type="checkbox" class="date-cb" value="${iso}">
          <span class="city-name">${fmtWeekday(iso)}, ${fmtDate(iso)}</span>
          <span class="city-count">${byDate[iso].length}</span>
        </label>
      `).join('')}
    </div>
  `).join('');

  // ── City dropdown HTML ────────────────────────────────────
  const cityGroupsHtml = CITY_GROUPS.map(g => `
    <div class="dropdown-group">
      <div class="group-header-dd">
        <img src="https://flagcdn.com/w40/${g.flag}.png" alt="${g.country}">
        ${g.country}
      </div>
      ${g.cities.map(city => `
        <label class="city-option">
          <input type="checkbox" class="city-cb" value="${city}">
          <span class="city-name">${city}</span>
          <span class="city-count">${CITY_COUNTS[city] || 0}</span>
        </label>
      `).join('')}
    </div>
  `).join('');

  // ── Day blocks HTML ───────────────────────────────────────
  let lastStage = null;
  const daysHtml = sorted.map(iso => {
    const matches   = byDate[iso];
    const stage     = matches[0].round ? 'knockout' : 'group';
    let divider = '';
    if (stage !== lastStage && stage === 'knockout') {
      divider = `
        <div class="stage-divider">
          <div class="stage-divider-line"></div>
          <div class="stage-divider-label">Knockout Stage</div>
          <div class="stage-divider-line"></div>
        </div>`;
    }
    lastStage = stage;
    return `${divider}
      <div class="schedule-day" data-day="${iso}">
        <div class="day-header">
          <div class="day-label">
            <div class="weekday">${fmtWeekday(iso)}</div>
            <div class="date-str">${fmtDate(iso)}</div>
          </div>
          <div class="day-divider"></div>
          <div class="day-count" id="count-${iso}"></div>
        </div>
        <div class="schedule-matches">${matches.map(schedCardHtml).join('')}</div>
      </div>`;
  }).join('');

  // ── Render ────────────────────────────────────────────────
  container.innerHTML = `
    <div class="filter-row">
      <span class="filter-label">Filter by City</span>
      <div class="dropdown-wrapper" id="dropdownWrapper">
        <button class="dropdown-trigger" id="dropdownTrigger">
          <span class="trigger-left">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span id="dropdownLabel">All Cities</span>
          </span>
          <svg class="chevron" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="dropdown-panel" id="dropdownPanel">
          <div class="dropdown-actions">
            <button class="dd-action" id="ddSelectAll">Select All</button>
            <button class="dd-action" id="ddClearAll">Clear All</button>
          </div>
          ${cityGroupsHtml}
        </div>
      </div>
      <span class="filter-label">Date</span>
      <div class="dropdown-wrapper" id="dateDdWrapper">
        <button class="dropdown-trigger" id="dateDdTrigger">
          <span class="trigger-left">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span id="dateDdLabel">All Dates</span>
          </span>
          <svg class="chevron" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="dropdown-panel" id="dateDdPanel">
          <div class="dropdown-actions">
            <button class="dd-action" id="dateDdSelectAll">Select All</button>
            <button class="dd-action" id="dateDdClearAll">Clear All</button>
          </div>
          ${dateGroupsHtml}
        </div>
      </div>
    </div>
    <div class="selected-tags" id="selectedTags"></div>
    <div class="selected-tags" id="selectedDateTags"></div>
    ${daysHtml}
    <div class="no-results" id="noResults" style="display:none">No matches found for the selected filters.</div>
  `;

  // ── Initial match counts ──────────────────────────────────
  document.querySelectorAll('.schedule-day').forEach(day => {
    const cnt = document.getElementById('count-' + day.dataset.day);
    const n   = day.querySelectorAll('.sched-card').length;
    if (cnt) cnt.textContent = n + ' match' + (n !== 1 ? 'es' : '');
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

  // ── Date dropdown events ──────────────────────────────────
  const dateTrigger = document.getElementById('dateDdTrigger');
  const datePanel   = document.getElementById('dateDdPanel');

  dateTrigger.addEventListener('click', e => {
    e.stopPropagation();
    const open = datePanel.classList.toggle('open');
    dateTrigger.classList.toggle('open', open);
  });
  document.addEventListener('click', e => {
    const w = document.getElementById('dateDdWrapper');
    if (w && !w.contains(e.target)) { datePanel.classList.remove('open'); dateTrigger.classList.remove('open'); }
  });
  document.getElementById('dateDdSelectAll').addEventListener('click', () => {
    container.querySelectorAll('.date-cb').forEach(cb => { cb.checked = true; selectedDates.add(cb.value); });
    applyFilter();
  });
  document.getElementById('dateDdClearAll').addEventListener('click', () => {
    container.querySelectorAll('.date-cb').forEach(cb => cb.checked = false);
    selectedDates.clear(); applyFilter();
  });
  document.getElementById('selectedDateTags').addEventListener('click', e => {
    const btn = e.target.closest('.date-tag-remove');
    if (!btn) return;
    const iso = btn.dataset.date;
    selectedDates.delete(iso);
    const cb = container.querySelector(`.date-cb[value="${iso}"]`);
    if (cb) cb.checked = false;
    applyFilter();
  });

  // ── Combined checkbox handler ─────────────────────────────
  container.addEventListener('change', e => {
    if (e.target.classList.contains('city-cb')) {
      e.target.checked ? selectedCities.add(e.target.value) : selectedCities.delete(e.target.value);
      applyFilter();
    } else if (e.target.classList.contains('date-cb')) {
      e.target.checked ? selectedDates.add(e.target.value) : selectedDates.delete(e.target.value);
      applyFilter();
    }
  });
}
