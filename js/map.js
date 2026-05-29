// ═══════════════════════════════════════════════════════════
//  MAP VIEW  (Leaflet + CartoDB dark tiles)
// ═══════════════════════════════════════════════════════════
let _mapInstance  = null;
let _activeMarker = null;

function cityIcon(city, active) {
  return L.divIcon({
    className: '',
    html: `<div class="wcm-wrap${active ? ' active' : ''}"><div class="wcm-dot"></div><span class="wcm-label">${city}</span></div>`,
    iconAnchor: [6, 6],
    iconSize: [0, 0],
  });
}

function initMap() {
  if (_mapInstance) { _mapInstance.invalidateSize(); return; }

  // Group matches by city, attach GPS coords
  const cityData = {};
  ALL_MATCHES.forEach(m => {
    const city    = getCity(m.venue);
    const stadium = m.venue.split(',')[0].trim();
    const coords  = VENUE_COORDS[stadium];
    if (!coords) return;
    if (!cityData[city]) cityData[city] = { stadium, lat: coords.lat, lng: coords.lng, matches: [] };
    cityData[city].matches.push(m);
  });

  _mapInstance = L.map('wc-map', { zoomControl: true, attributionControl: true });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/" target="_blank">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 18,
  }).addTo(_mapInstance);

  const allLatLngs = Object.values(cityData).map(d => [d.lat, d.lng]);
  _mapInstance.fitBounds(L.latLngBounds(allLatLngs), { padding: [50, 60] });

  const sidebar        = document.getElementById('map-sidebar');
  const sidebarContent = document.getElementById('map-sidebar-content');

  function setActive(marker, city) {
    if (_activeMarker) {
      const el = _activeMarker.getElement();
      if (el) el.querySelector('.wcm-wrap').classList.remove('active');
    }
    const el = marker.getElement();
    if (el) el.querySelector('.wcm-wrap').classList.add('active');
    _activeMarker = marker;
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    if (_activeMarker) {
      const el = _activeMarker.getElement();
      if (el) el.querySelector('.wcm-wrap').classList.remove('active');
      _activeMarker = null;
    }
    setTimeout(() => _mapInstance.invalidateSize(), 280);
  }

  Object.entries(cityData).forEach(([city, data]) => {
    const { lat, lng, stadium, matches } = data;

    const marker = L.marker([lat, lng], { icon: cityIcon(city, false) }).addTo(_mapInstance);

    marker.on('click', () => {
      setActive(marker, city);

      const sortedMatches = [...matches].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
      const country = getCountry(matches[0].venue);

      const matchesHtml = sortedMatches.map(m => {
        const isGroup  = !!m.group;
        const accent   = isGroup ? GROUP_ACCENT[m.group] : ROUND_ACCENT[m.round];
        const label    = isGroup ? `Group ${m.group}` : (ROUND_LABEL[m.round] || m.round);
        const dispTime = isGroup ? toLocalTime(m.time, city) : m.time;
        const tz       = getLocalTZ(city);
        return `<div class="ms-match">
          <div class="ms-match-top">
            <span class="ms-pill" style="background:${accent}">${label}</span>
            <span class="ms-date">${fmtWeekday(m.dateISO)}, ${fmtDate(m.dateISO)}</span>
          </div>
          <div class="ms-teams">
            ${isGroup ? flagImg(m.home, 22, 15) : ''}<span>${m.home}</span>
            <span class="ms-vs">vs</span>
            ${isGroup ? flagImg(m.away, 22, 15) : ''}<span>${m.away}</span>
          </div>
          <div class="ms-time">${dispTime} ${tz}</div>
          <div class="ms-links">
            <a href="${getStubHubUrl(m)}" class="ms-btn ms-ticket" target="_blank" rel="noopener">🎫 Tickets</a>
            <a href="${getBookingUrl(m.venue, m.dateISO)}" class="ms-btn ms-hotel" target="_blank" rel="noopener">🏨 Hotel</a>
            <a href="#" class="ms-btn ms-flight" onclick="openFlightLink('${city}','${m.dateISO}');return false;">✈️ Flights</a>
          </div>
        </div>`;
      }).join('');

      sidebarContent.innerHTML = `
        <div class="ms-header">
          <div>
            <div class="ms-city">${city}</div>
            <div class="ms-stadium">${stadium} · ${country}</div>
          </div>
          <button class="ms-close" id="mapSidebarClose">&#x2715;</button>
        </div>
        <div class="ms-count">${matches.length} match${matches.length !== 1 ? 'es' : ''}</div>
        <div class="ms-matches">${matchesHtml}</div>
      `;

      document.getElementById('mapSidebarClose').addEventListener('click', closeSidebar);

      const wasOpen = sidebar.classList.contains('open');
      sidebar.classList.add('open');
      if (!wasOpen) setTimeout(() => _mapInstance.invalidateSize(), 280);
    });
  });
}

// Lazy-init when Map tab is first clicked
document.querySelectorAll('.tab-btn[data-tab="map"]').forEach(btn => {
  btn.addEventListener('click', () => setTimeout(initMap, 50));
});
