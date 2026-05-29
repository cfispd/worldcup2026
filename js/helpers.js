// ═══════════════════════════════════════════════════════════
//  HELPERS  —  pure utility functions
//  Depends on: data.js  (all constants must be loaded first)
// ═══════════════════════════════════════════════════════════

// ── Venue & team ─────────────────────────────────────────

function getCity(venue)    { return venue.split(', ').pop(); }
function getCountry(venue) { return CITY_COUNTRY[getCity(venue)] || ''; }

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

function teamName(name) {
  return LANG === 'zh' && TEAM_NAMES_ZH[name] ? TEAM_NAMES_ZH[name] : name;
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
