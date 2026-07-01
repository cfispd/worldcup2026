// ═══════════════════════════════════════════════════════════
//  HELPERS  —  pure utility functions
//  Depends on: data.js  (all constants must be loaded first)
// ═══════════════════════════════════════════════════════════

// ── Venue & team ─────────────────────────────────────────

function getCity(venue)    { return venue.split(', ').pop(); }
function getCountry(venue) { return CITY_COUNTRY[getCity(venue)] || ''; }

// UTC offset (hours to add) for each host city during summer 2026 (DST in effect)
const CITY_UTC_OFFSET = {
  'Mexico City': 5, 'Guadalajara': 5, 'Monterrey': 5,
  'Dallas': 5, 'Houston': 5, 'Kansas City': 5,
  'Los Angeles': 7, 'San Francisco': 7, 'Seattle': 7, 'Vancouver': 7,
};

function flagImg(team, w = 30, h = 20) {
  const code = FLAGS[team];
  if (!code) return `<span style="width:${w}px;display:inline-block"></span>`;
  return `<img src="https://flagcdn.com/w40/${code}.png" alt="${team}"
    style="width:${w}px;height:${h}px;object-fit:cover;border-radius:2px;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,.5)">`;
}

// ── Date & time ───────────────────────────────────────────

function fmtDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function fmtWeekday(iso) {
  const d = new Date(iso + 'T12:00:00');
  return WEEKDAYS[d.getDay()];
}

// Converts a match's local venue time + date to UTC.
function matchToUTC(dateISO, timeET, venue) {
  const m = timeET.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]), ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  const [y, mo, d] = dateISO.split('-').map(Number);
  const city = venue ? getCity(venue) : '';
  const offsetH = CITY_UTC_OFFSET[city] ?? 4; // default EDT = UTC-4
  return new Date(Date.UTC(y, mo - 1, d, h, min) + offsetH * 3600000);
}

// Returns the match kickoff date as YYYY-MM-DD in the user's local timezone.
function matchLocalDateISO(dateISO, timeET, venue) {
  const utc = matchToUTC(dateISO, timeET, venue);
  if (!utc) return dateISO;
  return utc.getFullYear() + '-' +
    String(utc.getMonth() + 1).padStart(2, '0') + '-' +
    String(utc.getDate()).padStart(2, '0');
}

// Formats a match time in the user's browser timezone (auto-detected).
function toUserLocalTime(timeET, dateISO, venue) {
  const utc = matchToUTC(dateISO, timeET, venue);
  if (!utc) return timeET;
  return utc.toLocaleTimeString(LANG === 'zh' ? 'zh-CN' : 'en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });
}

// Returns the appropriate watch/stream URL based on user's detected timezone.
function watchUrl() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (/^Asia\/(Shanghai|Chongqing|Harbin|Chungking)/.test(tz)) {
      return 'https://tv.cctv.com/live/cctv5/'; // CCTV5 — mainland China
    }
    if (tz === 'Asia/Hong_Kong' || tz === 'Asia/Macau') {
      return 'https://nowtv.now.com/';           // Now TV — HK/Macau
    }
    if (tz === 'Asia/Taipei') {
      return 'https://ctitv.com.tw/';            // CTi TV — Taiwan
    }
  } catch {}
  return 'https://live.yes2049.com/channels/cctv5'; // default
}

// Short timezone label for the user's browser timezone (e.g. "EDT", "GMT+8").
function userTzLabel() {
  try {
    const s = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' });
    return s.split(' ').pop();
  } catch { return ''; }
}

// Converts a group-stage ET time string to the venue's local time.
// Group stage times are stored in ET; CITY_TZ_OFFSET holds the offset per city.
function toLocalTime(timeStr, city) {
  const off = CITY_TZ_OFFSET[city];
  if (!off) return timeStr;
  const m = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return timeStr;
  let h = parseInt(m[1]);
  const min = m[2], ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  h += off;
  if (h < 0)  h += 24;
  if (h >= 24) h -= 24;
  return `${h % 12 || 12}:${min} ${h < 12 ? 'AM' : 'PM'}`;
}

function getLocalTZ(city) {
  const off = CITY_TZ_OFFSET[city];
  return off === -3 ? 'PT' : off === -1 ? 'CT' : 'ET';
}

// Shifts an ISO date string by N days.
function dateOffset(iso, days) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// "2026-06-10" → "20260610"  (Trip.com date format)
function isoToTripDate(iso) { return iso.replace(/-/g, ''); }

// ── Locale-aware formatting  (reads LANG) ─────────────────

function fmtDateL(iso) {
  const d = new Date(iso + 'T12:00:00');
  if (LANG === 'zh') return `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function fmtWeekdayL(iso) {
  const d = new Date(iso + 'T12:00:00');
  return LANG === 'zh' ? `周${WEEKDAYS_ZH[d.getDay()]}` : WEEKDAYS[d.getDay()];
}

function tzL(tz) { return tz; } // timezone labels kept untranslated

// ── Language / i18n  (reads LANG + *_ZH tables) ──────────

// Resolve bracket placeholder → real team name, then translate.
// BRACKET_TEAMS: { "1st Group A": "Mexico", "3rd Grp A/B/C/D/F": "Czech Republic", ... }
// MATCH_WINNERS: { "73": "Mexico", "74": "Germany", ... }
function teamName(name) {
  // Resolve "1st/2nd/3rd Group X" and "W/L Match N" via live data
  let resolved = name;
  if (typeof BRACKET_TEAMS !== 'undefined' && BRACKET_TEAMS[name]) {
    resolved = BRACKET_TEAMS[name];
  } else if (typeof MATCH_WINNERS !== 'undefined') {
    const w = name.match(/^W Match (\d+)$/);
    const l = name.match(/^L Match (\d+)$/);
    if (w && MATCH_WINNERS[w[1]]) resolved = MATCH_WINNERS[w[1]];
    if (l && MATCH_WINNERS['L' + l[1]]) resolved = MATCH_WINNERS['L' + l[1]];
  }
  return LANG === 'zh' && TEAM_NAMES_ZH[resolved] ? TEAM_NAMES_ZH[resolved] : resolved;
}
function resolveTeamEn(name) {
  if (typeof BRACKET_TEAMS !== 'undefined' && BRACKET_TEAMS[name]) return BRACKET_TEAMS[name];
  if (typeof MATCH_WINNERS !== 'undefined') {
    const w = name.match(/^W Match (\d+)$/);
    const l = name.match(/^L Match (\d+)$/);
    if (w && MATCH_WINNERS[w[1]]) return MATCH_WINNERS[w[1]];
    if (l && MATCH_WINNERS['L' + l[1]]) return MATCH_WINNERS['L' + l[1]];
  }
  return name;
}
function cityName(city) {
  return LANG === 'zh' && CITY_NAMES_ZH[city] ? CITY_NAMES_ZH[city] : city;
}
function countryName(country) {
  return LANG === 'zh' && COUNTRY_NAMES_ZH[country] ? COUNTRY_NAMES_ZH[country] : country;
}
function roundL(round, group) {
  if (group) return LANG === 'zh' ? `${group}组` : `GROUP ${group}`;
  return LANG === 'zh' ? (ROUND_LABEL_ZH[round] || ROUND_LABEL[round]) : ROUND_LABEL[round];
}

// ── Ticket URL builders ───────────────────────────────────

function getTicketFrom(m) { return TICKET_FROM[m.round] || 75; }

function getStubHubUrl(m) {
  const key    = `${m.home}|${m.away}|${m.dateISO}`;
  const direct = STUBHUB_EVENT_URLS[key];
  if (direct) {
    if (STUBHUB_CAMREF === 'YOUR_CAMREF') return direct;
    return `https://prf.hn/click/camref:${STUBHUB_CAMREF}/destination:${encodeURIComponent(direct)}`;
  }
  const query     = m.group
    ? `${m.home} vs ${m.away} FIFA World Cup 2026`
    : `FIFA World Cup 2026 ${ROUND_LABEL[m.round] || m.round}`;
  const searchUrl = `https://www.stubhub.com/search/?q=${encodeURIComponent(query)}`;
  if (STUBHUB_CAMREF === 'YOUR_CAMREF') return searchUrl;
  return `https://prf.hn/click/camref:${STUBHUB_CAMREF}/destination:${encodeURIComponent(searchUrl)}`;
}

// ── Hotel URL builder ─────────────────────────────────────

function getBookingUrl(venue, dateISO) {
  const stadium  = venue.split(',')[0].trim();
  const checkout = dateOffset(dateISO, 1);
  const base     = `checkin=${dateISO}&checkout=${checkout}&group_adults=2`;
  const lang     = LANG === 'zh' ? '&lang=zh-cn' : '';
  const coords   = VENUE_COORDS[stadium];
  if (coords) {
    return `https://www.booking.com/searchresults.html?latitude=${coords.lat}&longitude=${coords.lng}&ss=${encodeURIComponent(stadium)}&${base}${lang}`;
  }
  const city = venue.split(',').pop().trim().replace(/\/.*$/, '');
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&${base}${lang}`;
}

// ── Group standings calculator ────────────────────────────
// Reads homeScore / awayScore from match objects (undefined = not played yet).
// Returns array sorted by FIFA tie-break rules: Pts → GD → GF → name.
function computeStandings(groupKey) {
  const matches = ALL_MATCHES.filter(m => m.group === groupKey);
  const teams   = {};

  matches.forEach(m => {
    if (!teams[m.home]) teams[m.home] = { team:m.home, mp:0, w:0, d:0, l:0, gf:0, ga:0, pts:0 };
    if (!teams[m.away]) teams[m.away] = { team:m.away, mp:0, w:0, d:0, l:0, gf:0, ga:0, pts:0 };
  });

  matches.forEach(m => {
    if (typeof m.homeScore !== 'number') return;
    const h = teams[m.home], a = teams[m.away];
    h.mp++; h.gf += m.homeScore; h.ga += m.awayScore;
    a.mp++; a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore)      { h.w++; h.pts += 3; a.l++; }
    else if (m.homeScore < m.awayScore) { a.w++; a.pts += 3; h.l++; }
    else                                { h.d++; h.pts++;    a.d++; a.pts++; }
  });

  const seed = GROUP_SEED_ORDER[groupKey] || [];
  return Object.values(teams).sort((a, b) =>
    b.pts       - a.pts       ||
    (b.gf-b.ga) - (a.gf-a.ga)||
    b.gf        - a.gf        ||
    seed.indexOf(a.team) - seed.indexOf(b.team)
  );
}

// ── Flight URL builder (destination-only fallback) ────────
// Full round-trip Trip.com logic with departure city lives in app.js → openFlightLink()

function getFlightsUrl(city, dateISO) {
  const iata = CITY_IATA[city];
  if (!iata) {
    const q = `round trip flights to ${city.replace(/\/.*$/, '').trim()}`;
    return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
  }
  if (!dateISO) {
    return `https://www.trip.com/flights/to-${encodeURIComponent(city)}/tickets-${iata}?flighttype=D&acity=${iata}&${TRIP_AFFILIATE}`;
  }
  const dep = isoToTripDate(dateOffset(dateISO, -1));
  const ret = isoToTripDate(dateOffset(dateISO, +1));
  return `https://www.trip.com/flights/to-${encodeURIComponent(city)}/tickets-${iata}?flighttype=D&acity=${iata}&ddate=${dep}&rdate=${ret}&${TRIP_AFFILIATE}`;
}
