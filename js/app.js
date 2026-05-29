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

  // Groups view: team names, group titles, HOST badge, hint
  document.querySelectorAll('.team-name').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.textContent.trim();
    el.textContent = lang === 'zh' ? (TEAM_NAMES_ZH[el.dataset.en] || el.dataset.en) : el.dataset.en;
  });
  document.querySelectorAll('.group-title').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.textContent.trim();
    if (lang === 'zh') {
      const m = el.dataset.en.match(/Group ([A-L])/);
      el.textContent = m ? `${m[1]}组` : el.dataset.en;
    } else {
      el.textContent = el.dataset.en;
    }
  });
  document.querySelectorAll('.host-badge').forEach(el => {
    el.textContent = lang === 'zh' ? '主办' : 'HOST';
  });
  const groupsHint = document.querySelector('#view-groups .hint');
  if (groupsHint) groupsHint.textContent = lang === 'zh'
    ? '点击小组卡片查看比赛时间表'
    : 'Click any group card to see the match schedule';

  // Re-render dynamic views
  buildSchedule();
  buildBracket();
  if (typeof updateMapLang === 'function') updateMapLang();
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

function openModal(groupKey) {
  const matches = MATCHES_BY_GROUP[groupKey];
  const accent  = GROUP_ACCENT[groupKey];

  document.getElementById('modalLetter').textContent      = groupKey;
  document.getElementById('modalLetter').style.background = accent;
  document.getElementById('modalLetter').style.color      = '#fff';
  document.getElementById('modalTitle').textContent    = LANG === 'zh' ? `${groupKey}组 – 比赛时间表` : `Group ${groupKey} – Match Schedule`;
  document.getElementById('modalSubtitle').textContent = LANG === 'zh' ? '6场比赛 · 循环赛 · 当地时间' : '6 matches · Round Robin · Local time';

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

document.querySelectorAll('.group-card').forEach(card =>
  card.addEventListener('click', () => openModal(card.dataset.group))
);
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
  tipHotel.href  = getBookingUrl(card.dataset.venue, dateISO);
  tipFlight.href = getFlightsUrl(getCity(card.dataset.venue));

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

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTicketTip(); });

// ═══════════════════════════════════════════════════════════
//  FLIGHT LINK HANDLER  (EN → SEA Seattle, ZH → PVG Shanghai)
// ═══════════════════════════════════════════════════════════
function openFlightLink(destCity, dateISO) {
  const isZH    = LANG === 'zh';
  const homeIata = isZH ? 'PVG' : 'SEA';
  const destIata = CITY_IATA[destCity];
  if (!destIata) return;
  const dep    = isoToTripDate(dateOffset(dateISO, isZH ? -2 : -1));
  const ret    = isoToTripDate(dateOffset(dateISO, +1));
  const domain = isZH ? 'hk.trip.com' : 'www.trip.com';
  const path   = `${homeIata}-to-${encodeURIComponent(destCity)}`;
  const url    = `https://${domain}/flights/${path}/tickets-${homeIata}-${destIata}?flighttype=D&dcity=${homeIata}&acity=${destIata}&ddate=${dep}&rdate=${ret}&${TRIP_AFFILIATE}`;
  window.open(url, '_blank', 'noopener');
}

// setLang() called above already triggers buildSchedule() + buildBracket()
