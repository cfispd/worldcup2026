// ═══════════════════════════════════════════════════════════
//  THEME TOGGLE
// ═══════════════════════════════════════════════════════════
(function initTheme() {
  const saved = localStorage.getItem('wc_theme') || 'day';
  updateThemeBtn(saved);
})();

function toggleTheme() {
  const isNight = document.body.classList.toggle('night');
  const theme = isNight ? 'night' : 'day';
  localStorage.setItem('wc_theme', theme);
  updateThemeBtn(theme);
}

function updateThemeBtn(theme) {
  const btn = document.getElementById('themeBtn');
  const label = document.getElementById('themeLabel');
  if (!btn) return;
  if (theme === 'night') {
    btn.querySelector('.theme-icon').textContent = '☀️';
    label.textContent = LANG === 'zh' ? '白天' : 'Day';
  } else {
    btn.querySelector('.theme-icon').textContent = '🌙';
    label.textContent = LANG === 'zh' ? '夜间' : 'Night';
  }
}

// ═══════════════════════════════════════════════════════════
//  LANGUAGE TOGGLE
// ═══════════════════════════════════════════════════════════
const TAB_LABELS = {
  groups:   ['Groups',   '小组赛'],
  schedule: ['Schedule', '赛程'],
  bracket:  ['Bracket',  '淘汰赛'],
  map:      ['Map',      '地图'],
};

function setLang(lang) {
  LANG = lang;
  localStorage.setItem('wc_lang', lang);

  // Toggle button state
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));

  // Tab labels
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    const lbl = btn.querySelector('.tab-label');
    if (lbl) lbl.textContent = TAB_LABELS[btn.dataset.tab]?.[lang === 'zh' ? 1 : 0] ?? lbl.textContent;
  });

  // Header subtitle
  document.getElementById('headerSubtitle').innerHTML = lang === 'zh'
    ? '加拿大 &nbsp;·&nbsp; 墨西哥 &nbsp;·&nbsp; 美国 &nbsp;&nbsp;|&nbsp;&nbsp; 48支球队 &nbsp;·&nbsp; 12个小组'
    : 'Canada &nbsp;·&nbsp; Mexico &nbsp;·&nbsp; United States &nbsp;&nbsp;|&nbsp;&nbsp; 48 Teams &nbsp;·&nbsp; 12 Groups';

  // Groups view: group titles, hint
  document.querySelectorAll('.group-title').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.textContent.trim();
    if (lang === 'zh') {
      const m = el.dataset.en.match(/Group ([A-L])/);
      el.textContent = m ? `${m[1]}组` : el.dataset.en;
    } else {
      el.textContent = el.dataset.en;
    }
  });
  const groupsHint = document.querySelector('#view-groups .hint');
  if (groupsHint) groupsHint.textContent = lang === 'zh'
    ? '点击小组卡片查看比赛时间表'
    : 'Click any group card to see the match schedule';

  // Re-render standings on all group cards
  document.querySelectorAll('.standings-mini[data-group]').forEach(el => {
    el.innerHTML = renderStandingsMini(computeStandings(el.dataset.group), el.dataset.group);
  });

  // Re-render dynamic views
  buildSchedule();
  buildBracket();
  if (typeof updateMapLang === 'function') updateMapLang();

  // Sync theme button label language
  const currentTheme = document.body.classList.contains('night') ? 'night' : 'day';
  updateThemeBtn(currentTheme);
}

// Init lang toggle buttons
document.getElementById('langToggle').addEventListener('click', e => {
  const btn = e.target.closest('.lang-btn');
  if (btn) setLang(btn.dataset.lang);
});

// Apply saved language on load
setLang(LANG);

// ═══════════════════════════════════════════════════════════
//  TAB SWITCHING
// ═══════════════════════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.tab).classList.add('active');
  });
});

// ═══════════════════════════════════════════════════════════
//  GROUP MODAL
// ═══════════════════════════════════════════════════════════
const MATCHES_BY_GROUP = {};
ALL_MATCHES.filter(m => m.group).forEach(m => {
  (MATCHES_BY_GROUP[m.group] = MATCHES_BY_GROUP[m.group] || []).push(m);
});

// ── Standings rendering ────────────────────────────────────
const QUALIFY_CLASS  = ['sq1','sq2','sq3','sq4'];
const HOST_NATIONS   = new Set(['Mexico', 'United States', 'Canada']);

function renderStandingsMini(rows, groupKey) {
  const z = LANG === 'zh';
  const hdr = `<div class="sm-head">
    <span></span><span></span><span class="sm-stat-hd">${z?'胜':'W'}</span>
    <span class="sm-stat-hd">${z?'平':'D'}</span><span class="sm-stat-hd">${z?'负':'L'}</span>
    <span class="sm-pts-hd">${z?'积分':'Pts'}</span>
  </div>`;
  return hdr + rows.map((r, i) => {
    const fl   = FLAGS[r.team] ? `<img src="https://flagcdn.com/w40/${FLAGS[r.team]}.png" alt="" class="sm-flag">` : '';
    const nm   = z ? (TEAM_NAMES_ZH[r.team] || r.team) : r.team;
    const host = HOST_NATIONS.has(r.team) ? `<span class="sm-host">${z?'主办':'HOST'}</span>` : '';
    return `<div class="sm-row">
      <span class="sm-pos ${QUALIFY_CLASS[i]}">${i+1}</span>
      ${fl}<span class="sm-team-cell"><span class="sm-name">${nm}</span>${host}</span>
      <span class="sm-stat">${r.w}</span>
      <span class="sm-stat">${r.d}</span>
      <span class="sm-stat">${r.l}</span>
      <span class="sm-pts">${r.pts}</span>
    </div>`;
  }).join('');
}

function renderStandingsFull(rows) {
  const z = LANG === 'zh';
  const ths = `<th>#</th><th class="st-th-team">${z?'球队':'Team'}</th>
    <th title="${z?'场次':'Played'}">MP</th>
    <th title="${z?'胜':'Win'}">W</th>
    <th title="${z?'平':'Draw'}">D</th>
    <th title="${z?'负':'Loss'}">L</th>
    <th title="${z?'进球':'Goals For'}">GF</th>
    <th title="${z?'失球':'Goals Against'}">GA</th>
    <th title="${z?'净胜球':'Goal Diff'}">GD</th>
    <th title="${z?'积分':'Points'}">${z?'积分':'Pts'}</th>`;
  const trs = rows.map((r, i) => {
    const fl   = FLAGS[r.team] ? `<img src="https://flagcdn.com/w40/${FLAGS[r.team]}.png" alt="" class="st-flag">` : '';
    const nm   = z ? (TEAM_NAMES_ZH[r.team] || r.team) : r.team;
    const host = HOST_NATIONS.has(r.team) ? `<span class="st-host">${z?'主办':'HOST'}</span>` : '';
    const gd   = r.gf - r.ga;
    return `<tr class="${QUALIFY_CLASS[i]}">
      <td class="st-pos">${i+1}</td>
      <td class="st-td-team"><div class="st-team-inner">${fl}<span>${nm}</span>${host}</div></td>
      <td>${r.mp}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
      <td>${r.gf}</td><td>${r.ga}</td>
      <td class="st-gd">${gd > 0 ? '+'+gd : gd}</td>
      <td class="st-pts">${r.pts}</td>
    </tr>`;
  }).join('');
  return `<table class="st-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function openModal(groupKey) {
  const matches = MATCHES_BY_GROUP[groupKey];
  const accent  = GROUP_ACCENT[groupKey];

  document.getElementById('modalLetter').textContent      = groupKey;
  document.getElementById('modalLetter').style.background = accent;
  document.getElementById('modalLetter').style.color      = '#fff';
  document.getElementById('modalTitle').textContent    = LANG === 'zh' ? `${groupKey}组` : `Group ${groupKey}`;
  document.getElementById('modalSubtitle').textContent = LANG === 'zh' ? '4支球队 · 循环赛' : '4 teams · Round Robin';
  document.getElementById('standingsTitle').textContent    = LANG === 'zh' ? '积分榜' : 'Standings';
  document.getElementById('matchScheduleH3').textContent  = LANG === 'zh' ? '赛程（当地时间）' : 'Match Schedule (local time)';

  const standings = computeStandings(groupKey);
  document.getElementById('standingsTable').innerHTML = renderStandingsFull(standings);

  const calIcon = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const clkIcon = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  const pinIcon = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

  document.getElementById('matchList').innerHTML = matches.map(m => `
    <div class="match-card">
      <div class="match-teams">
        <div class="match-team">${flagImg(m.home)}<span>${teamName(m.home)}</span></div>
        <span class="match-vs">VS</span>
        <div class="match-team right"><span>${teamName(m.away)}</span>${flagImg(m.away)}</div>
      </div>
      <div class="match-meta">
        <span class="meta-item">${calIcon} ${fmtDateL(m.dateISO)}, 2026</span>
        <span class="meta-item">${clkIcon} ${toLocalTime(m.time, getCity(m.venue))} ${tzL(getLocalTZ(getCity(m.venue)))}</span>
        <span class="meta-item">${pinIcon} <span class="venue-stadium">${m.venue.split(',')[0].trim()}</span><span class="venue-sep"> · </span><span class="venue-city">${cityName(getCity(m.venue))}, ${countryName(getCountry(m.venue))}</span></span>
      </div>
      <div class="card-links">
        <a href="${getStubHubUrl(m)}" class="card-link-btn card-ticket-btn" target="_blank" rel="noopener">🎫 ${LANG === 'zh' ? '购票' : 'Tickets'}</a>
        <a href="${getBookingUrl(m.venue, m.dateISO)}" class="card-link-btn card-hotel-btn" target="_blank" rel="noopener">🏨 ${LANG === 'zh' ? '酒店' : 'Hotel'}</a>
        <a href="#" class="card-link-btn card-flight-btn" onclick="openFlightLink('${getCity(m.venue)}','${m.dateISO}');return false;">✈️ ${LANG === 'zh' ? '机票' : 'Flights'}</a>
      </div>
    </div>
  `).join('');

  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.group-card').forEach(card => {
  card.addEventListener('click', () => openModal(card.dataset.group));

  // Inject mini standings table above card footer
  const g  = card.dataset.group;
  const el = document.createElement('div');
  el.className = 'standings-mini';
  el.dataset.group = g;
  card.insertBefore(el, card.querySelector('.card-footer'));
  el.innerHTML = renderStandingsMini(computeStandings(g), g);
});
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('overlay')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ═══════════════════════════════════════════════════════════
//  FLOATING TOOLTIP  (bracket only)
// ═══════════════════════════════════════════════════════════
const ticketTip  = document.getElementById('ticket-tip');
const tipAmount  = document.getElementById('tip-amount');
const tipLink    = document.getElementById('tip-link');
const tipHotel   = document.getElementById('tip-hotel');
const tipFlight  = document.getElementById('tip-flight');
let   activeCard = null;

function bracketDateToISO(dateStr) {
  const M = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08'};
  const [mon, day] = dateStr.split(' ');
  return `2026-${M[mon]}-${day.padStart(2,'0')}`;
}

function openTicketTip(card) {
  tipAmount.textContent = '$' + card.dataset.ticketFrom;
  tipLink.href   = card.dataset.ticketUrl || '#';
  const dateISO  = bracketDateToISO(card.dataset.date);
  tipHotel.href           = getBookingUrl(card.dataset.venue, dateISO);
  tipFlight.dataset.dest  = getCity(card.dataset.venue);
  tipFlight.dataset.date  = dateISO;

  const rect = card.getBoundingClientRect();
  const TW = 290, TH = 150;
  let x = rect.left;
  let y = rect.top - TH - 10;
  if (y < 8)                          y = rect.bottom + 10;
  if (x + TW > window.innerWidth - 8) x = window.innerWidth - TW - 8;
  if (x < 8)                          x = 8;
  ticketTip.style.left = x + 'px';
  ticketTip.style.top  = y + 'px';
  ticketTip.classList.add('visible');
  activeCard = card;
}

function closeTicketTip() {
  ticketTip.classList.remove('visible');
  activeCard = null;
}

document.addEventListener('click', e => {
  const card = e.target.closest('.br-card');
  if (card) {
    e.stopPropagation();
    if (activeCard === card) { closeTicketTip(); return; }
    openTicketTip(card);
  } else if (!ticketTip.contains(e.target)) {
    closeTicketTip();
  }
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeTicketTip(); closeFlight(); } });

// ═══════════════════════════════════════════════════════════
//  FLIGHT PICKER
// ═══════════════════════════════════════════════════════════
const DEP_AIRPORTS = [
  { region: 'China', regionZh: '中国', entries: [
    { city: 'Shanghai',   iata: 'PVG', label: 'Shanghai Pudong (PVG)',  labelZh: '上海浦东 (PVG)' },
    { city: 'Beijing',    iata: 'PEK', label: 'Beijing Capital (PEK)',  labelZh: '北京首都 (PEK)' },
    { city: 'Guangzhou',  iata: 'CAN', label: 'Guangzhou (CAN)',        labelZh: '广州白云 (CAN)' },
    { city: 'Shenzhen',   iata: 'SZX', label: 'Shenzhen (SZX)',         labelZh: '深圳宝安 (SZX)' },
    { city: 'Chengdu',    iata: 'CTU', label: 'Chengdu Tianfu (CTU)',   labelZh: '成都天府 (CTU)' },
    { city: 'Hangzhou',   iata: 'HGH', label: 'Hangzhou (HGH)',         labelZh: '杭州萧山 (HGH)' },
    { city: 'Chongqing',  iata: 'CKG', label: 'Chongqing (CKG)',        labelZh: '重庆江北 (CKG)' },
    { city: "Xi'an",      iata: 'XIY', label: "Xi'an (XIY)",            labelZh: '西安咸阳 (XIY)' },
    { city: 'Wuhan',      iata: 'WUH', label: 'Wuhan (WUH)',            labelZh: '武汉天河 (WUH)' },
    { city: 'Kunming',    iata: 'KMG', label: 'Kunming (KMG)',          labelZh: '昆明长水 (KMG)' },
  ]},
  { region: 'North America', regionZh: '北美', entries: [
    { city: 'New York',    iata: 'JFK', label: 'New York JFK (JFK)' },
    { city: 'Los Angeles', iata: 'LAX', label: 'Los Angeles (LAX)' },
    { city: 'Chicago',     iata: 'ORD', label: "Chicago O'Hare (ORD)" },
    { city: 'Seattle',     iata: 'SEA', label: 'Seattle (SEA)' },
    { city: 'San Francisco', iata: 'SFO', label: 'San Francisco (SFO)' },
    { city: 'Miami',       iata: 'MIA', label: 'Miami (MIA)' },
    { city: 'Dallas',      iata: 'DFW', label: 'Dallas (DFW)' },
    { city: 'Houston',     iata: 'IAH', label: 'Houston (IAH)' },
    { city: 'Atlanta',     iata: 'ATL', label: 'Atlanta (ATL)' },
    { city: 'Boston',      iata: 'BOS', label: 'Boston (BOS)' },
    { city: 'Toronto',     iata: 'YYZ', label: 'Toronto (YYZ)' },
    { city: 'Vancouver',   iata: 'YVR', label: 'Vancouver (YVR)' },
    { city: 'Montreal',    iata: 'YUL', label: 'Montreal (YUL)' },
    { city: 'Mexico City', iata: 'MEX', label: 'Mexico City (MEX)' },
  ]},
  { region: 'Europe', regionZh: '欧洲', entries: [
    { city: 'London',     iata: 'LHR', label: 'London Heathrow (LHR)' },
    { city: 'Paris',      iata: 'CDG', label: 'Paris CDG (CDG)' },
    { city: 'Frankfurt',  iata: 'FRA', label: 'Frankfurt (FRA)' },
    { city: 'Amsterdam',  iata: 'AMS', label: 'Amsterdam (AMS)' },
    { city: 'Madrid',     iata: 'MAD', label: 'Madrid (MAD)' },
    { city: 'Barcelona',  iata: 'BCN', label: 'Barcelona (BCN)' },
    { city: 'Rome',       iata: 'FCO', label: 'Rome Fiumicino (FCO)' },
    { city: 'Istanbul',   iata: 'IST', label: 'Istanbul (IST)' },
    { city: 'Zurich',     iata: 'ZRH', label: 'Zurich (ZRH)' },
    { city: 'Munich',     iata: 'MUC', label: 'Munich (MUC)' },
  ]},
  { region: 'Asia-Pacific', regionZh: '亚太', entries: [
    { city: 'Tokyo',         iata: 'NRT', label: 'Tokyo Narita (NRT)' },
    { city: 'Seoul',         iata: 'ICN', label: 'Seoul Incheon (ICN)' },
    { city: 'Hong Kong',     iata: 'HKG', label: 'Hong Kong (HKG)' },
    { city: 'Singapore',     iata: 'SIN', label: 'Singapore (SIN)' },
    { city: 'Bangkok',       iata: 'BKK', label: 'Bangkok (BKK)' },
    { city: 'Sydney',        iata: 'SYD', label: 'Sydney (SYD)' },
    { city: 'Taipei',        iata: 'TPE', label: 'Taipei (TPE)' },
    { city: 'Kuala Lumpur',  iata: 'KUL', label: 'Kuala Lumpur (KUL)' },
    { city: 'Delhi',         iata: 'DEL', label: 'Delhi (DEL)' },
    { city: 'Mumbai',        iata: 'BOM', label: 'Mumbai (BOM)' },
  ]},
  { region: 'Middle East & Africa', regionZh: '中东/非洲', entries: [
    { city: 'Dubai',         iata: 'DXB', label: 'Dubai (DXB)' },
    { city: 'Doha',          iata: 'DOH', label: 'Doha (DOH)' },
    { city: 'Abu Dhabi',     iata: 'AUH', label: 'Abu Dhabi (AUH)' },
    { city: 'Riyadh',        iata: 'RUH', label: 'Riyadh (RUH)' },
    { city: 'Cairo',         iata: 'CAI', label: 'Cairo (CAI)' },
    { city: 'Johannesburg',  iata: 'JNB', label: 'Johannesburg (JNB)' },
  ]},
  { region: 'Latin America', regionZh: '拉美', entries: [
    { city: 'São Paulo',     iata: 'GRU', label: 'São Paulo (GRU)' },
    { city: 'Buenos Aires',  iata: 'EZE', label: 'Buenos Aires (EZE)' },
    { city: 'Bogotá',        iata: 'BOG', label: 'Bogotá (BOG)' },
    { city: 'Lima',          iata: 'LIM', label: 'Lima (LIM)' },
  ]},
];

const ASIA_IATAS = new Set(['PVG','PEK','CAN','SZX','CTU','HGH','WUH','XIY','CKG','KMG',
                             'NRT','ICN','HKG','SIN','BKK','SYD','TPE','KUL','BOM','DEL']);
const CN_IATAS   = new Set(['PVG','PEK','CAN','SZX','CTU','HGH','WUH','XIY','CKG','KMG']);

let _fpDestCity = '';
let _fpDateISO  = '';

function openFlightLink(destCity, dateISO) {
  openFlightPicker(destCity, dateISO);
}

function openFlightPicker(destCity, dateISO) {
  _fpDestCity = destCity;
  _fpDateISO  = dateISO;
  const isZh  = LANG === 'zh';

  document.getElementById('fpTitle').textContent      = isZh ? '选择出发城市' : 'Book Flights';
  document.getElementById('fpSub').textContent        = isZh ? '选择您的出发机场' : 'Choose your departure airport';
  document.getElementById('fpDestLabel').textContent  = isZh ? '目的地' : 'Flying to';
  document.getElementById('fpDestCity').textContent   = destCity;
  document.getElementById('fpDepLabel').textContent   = isZh ? '出发城市' : 'Departure City';
  document.getElementById('fpRememberLabel').textContent = isZh ? '记住我的出发城市' : 'Remember my departure city';
  document.getElementById('fpGoBtn').textContent      = isZh ? '🔍 搜索机票' : '🔍 Search Flights';

  buildDepSelect(isZh);

  const savedIata = localStorage.getItem('wc_dep_iata');
  if (savedIata) {
    document.getElementById('fpDepSelect').value = savedIata;
    document.getElementById('fpRemember').checked = true;
  }

  document.getElementById('flightPickerOverlay').classList.add('open');
}

function buildDepSelect(isZh) {
  const sel = document.getElementById('fpDepSelect');
  sel.innerHTML = '';
  const def = document.createElement('option');
  def.value = ''; def.disabled = true; def.selected = true;
  def.textContent = isZh ? '— 请选择出发城市 —' : '— Select departure city —';
  sel.appendChild(def);

  DEP_AIRPORTS.forEach(region => {
    const grp = document.createElement('optgroup');
    grp.label = isZh ? region.regionZh : region.region;
    region.entries.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.iata;
      opt.textContent = isZh ? (e.labelZh || e.label) : e.label;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  });
}

function closeFlight() {
  document.getElementById('flightPickerOverlay').classList.remove('open');
}

function doFlightSearch() {
  const sel     = document.getElementById('fpDepSelect');
  const depIata = sel.value;
  if (!depIata) {
    sel.style.borderColor = '#ef4444';
    sel.focus();
    setTimeout(() => sel.style.borderColor = '', 1800);
    return;
  }

  if (document.getElementById('fpRemember').checked) {
    localStorage.setItem('wc_dep_iata', depIata);
  } else {
    localStorage.removeItem('wc_dep_iata');
  }

  const destIata = CITY_IATA[_fpDestCity];
  if (!destIata) {
    window.open(`https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(_fpDestCity)}`, '_blank', 'noopener');
    closeFlight();
    return;
  }

  const domain     = CN_IATAS.has(depIata) ? 'hk.trip.com' : 'www.trip.com';
  const daysBefore = ASIA_IATAS.has(depIata) ? 2 : 1;
  const dep        = isoToTripDate(dateOffset(_fpDateISO, -daysBefore));
  const ret        = isoToTripDate(dateOffset(_fpDateISO, +1));
  const url        = `https://${domain}/flights/${depIata}-to-${encodeURIComponent(_fpDestCity)}/tickets-${depIata}-${destIata}?flighttype=D&dcity=${depIata}&acity=${destIata}&ddate=${dep}&rdate=${ret}&${TRIP_AFFILIATE}`;
  window.open(url, '_blank', 'noopener');
  closeFlight();
}

// Close on overlay click or Escape
document.getElementById('flightPickerOverlay').addEventListener('click', e => {
  if (e.target.id === 'flightPickerOverlay') closeFlight();
});
document.getElementById('flightPickerClose').addEventListener('click', closeFlight);

// setLang() called above already triggers buildSchedule() + buildBracket()
