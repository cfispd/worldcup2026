// ═══════════════════════════════════════════════════════════
//  MAP VIEW  (Leaflet + CartoDB dark tiles)
// ═══════════════════════════════════════════════════════════
let _mapInstance  = null;
let _activeMarker = null;
let _markers      = {}; // city → marker (for lang updates)
let _cityData     = {}; // city → data (for re-rendering sidebar)

function cityIcon(city, active) {
  const label = cityName(city);
  return L.divIcon({
    className: '',
    html: `<div class="wcm-wrap${active ? ' active' : ''}"><div class="wcm-dot"></div><span class="wcm-label">${label}</span></div>`,
    iconAnchor: [6, 6],
    iconSize: [0, 0],
  });
}

function buildSidebarMatch(city, m) {
  const isGroup  = !!m.group;
  const accent   = isGroup ? GROUP_ACCENT[m.group] : ROUND_ACCENT[m.round];
  const label    = roundL(m.round, isGroup ? m.group : null);
  const dispTime = toUserLocalTime(m.time, m.dateISO);
  const tz       = userTzLabel();
  const ticketLabel = LANG === 'zh' ? '购票' : 'Tickets';
  const hotelLabel  = LANG === 'zh' ? '酒店' : 'Hotel';
  const flightLabel = LANG === 'zh' ? '机票' : 'Flights';
  return `<div class="ms-match">
    <div class="ms-match-top">
      <span class="ms-pill" style="background:${accent}">${label}</span>
      <span class="ms-date">${fmtWeekdayL(m.dateISO)}, ${fmtDateL(m.dateISO)}</span>
    </div>
    <div class="ms-teams">
      ${isGroup ? flagImg(m.home, 22, 15) : ''}<span>${teamName(m.home)}</span>
      <span class="ms-vs">vs</span>
      ${isGroup ? flagImg(m.away, 22, 15) : ''}<span>${teamName(m.away)}</span>
    </div>
    <div class="ms-time">${dispTime} ${tz}</div>
    <div class="ms-links">
      <a href="${getStubHubUrl(m)}" class="ms-btn ms-ticket" target="_blank" rel="noopener">🎫 ${ticketLabel}</a>
      <a href="${getBookingUrl(m.venue, m.dateISO)}" class="ms-btn ms-hotel" target="_blank" rel="noopener">🏨 ${hotelLabel}</a>
      <a href="#" class="ms-btn ms-flight" onclick="openFlightLink('${city}','${m.dateISO}');return false;">✈️ ${flightLabel}</a>
    </div>
  </div>`;
}

function openSidebar(city) {
  const data           = _cityData[city];
  const sidebar        = document.getElementById('map-sidebar');
  const sidebarContent = document.getElementById('map-sidebar-content');
  const country        = countryName(getCountry(data.matches[0].venue));
  const sortedMatches  = [...data.matches].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const matchesLabel   = LANG === 'zh'
    ? `${data.matches.length}场比赛`
    : `${data.matches.length} match${data.matches.length !== 1 ? 'es' : ''}`;

  sidebarContent.innerHTML = `
    <div class="ms-header">
      <div>
        <div class="ms-city">${cityName(city)}</div>
        <div class="ms-stadium">${data.stadium} · ${country}</div>
      </div>
      <button class="ms-close" id="mapSidebarClose">&#x2715;</button>
    </div>
    <div class="ms-count">${matchesLabel}</div>
    <div class="ms-matches">${sortedMatches.map(m => buildSidebarMatch(city, m)).join('')}</div>
  `;
  document.getElementById('mapSidebarClose').addEventListener('click', closeSidebar);

  const wasOpen = sidebar.classList.contains('open');
  sidebar.classList.add('open');
  if (!wasOpen) setTimeout(() => _mapInstance.invalidateSize(), 280);
}

function closeSidebar() {
  document.getElementById('map-sidebar').classList.remove('open');
  if (_activeMarker) {
    const el = _activeMarker.getElement();
    if (el) el.querySelector('.wcm-wrap').classList.remove('active');
    _activeMarker = null;
  }
  setTimeout(() => _mapInstance.invalidateSize(), 280);
}

// Called from setLang() to refresh marker labels without re-initialising the map
function updateMapLang() {
  if (!_mapInstance) return;
  Object.entries(_markers).forEach(([city, marker]) => {
    const isActive = marker === _activeMarker;
    marker.setIcon(cityIcon(city, isActive));
  });
  // Refresh sidebar if open
  const activeCity = Object.keys(_markers).find(c => _markers[c] === _activeMarker);
  if (activeCity) openSidebar(activeCity);
}

function initMap() {
  if (_mapInstance) { _mapInstance.invalidateSize(); return; }

  ALL_MATCHES.forEach(m => {
    const city    = getCity(m.venue);
    const stadium = m.venue.split(',')[0].trim();
    const coords  = VENUE_COORDS[stadium];
    if (!coords) return;
    if (!_cityData[city]) _cityData[city] = { stadium, lat: coords.lat, lng: coords.lng, matches: [] };
    _cityData[city].matches.push(m);
  });

  _mapInstance = L.map('wc-map', { zoomControl: true, attributionControl: true });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/" target="_blank">CARTO</a>',
    subdomains: 'abcd', maxZoom: 18,
  }).addTo(_mapInstance);

  const allLatLngs = Object.values(_cityData).map(d => [d.lat, d.lng]);
  _mapInstance.fitBounds(L.latLngBounds(allLatLngs), { padding: [50, 60] });

  Object.keys(_cityData).forEach(city => {
    const { lat, lng } = _cityData[city];
    const marker = L.marker([lat, lng], { icon: cityIcon(city, false) }).addTo(_mapInstance);
    _markers[city] = marker;

    marker.on('click', () => {
      if (_activeMarker) {
        const el = _activeMarker.getElement();
        if (el) el.querySelector('.wcm-wrap').classList.remove('active');
      }
      const el = marker.getElement();
      if (el) el.querySelector('.wcm-wrap').classList.add('active');
      _activeMarker = marker;
      openSidebar(city);
    });
  });
}

document.querySelectorAll('.tab-btn[data-tab="map"]').forEach(btn => {
  btn.addEventListener('click', () => setTimeout(initMap, 50));
});
