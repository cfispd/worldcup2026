// ═══════════════════════════════════════════════════════════
//  BUILD BRACKET VIEW
// ═══════════════════════════════════════════════════════════
function buildBracket() {
  const BASE    = 100;  // px per R32 slot (controls vertical spacing)
  const CARD_H  = 95;   // card height — tall enough for header + 2 teams + venue
  const CARD_W  = 215;  // card width — wide enough for long qualifier labels
  const COL_GAP = 36;   // gap between columns (space for connector lines)
  const COL_STP = CARD_W + COL_GAP;
  const TOTAL_H = 16 * BASE;  // 1600 px
  const PAD_TOP = 44;         // room for round labels

  const ROUND_COL   = { R32:0, R16:1, QF:2, SF:3, Final:4 };
  const ROUND_NAMES_EN = { R32:'Round of 32', R16:'Round of 16', QF:'Quarter-Finals', SF:'Semi-Finals', Final:'⚽ Final' };
  const ROUND_NAMES_ZH = { R32:'32强', R16:'16强', QF:'四分之一决赛', SF:'半决赛', Final:'⚽ 决赛' };
  const ROUND_NAMES = LANG === 'zh' ? ROUND_NAMES_ZH : ROUND_NAMES_EN;
  const LINE_CLR    = '#2a3a60';

  function colX(round)    { return ROUND_COL[round] * COL_STP; }
  function centerY(row)   { return (row + 0.5) * BASE; }
  function cardTop(row)   { return centerY(row) - CARD_H / 2; }

  // ── Lookup tables ─────────────────────────────────────────
  const nodeById = {};
  BRACKET_NODES.forEach(n => nodeById[n.id] = n);

  const timeById = {};
  ALL_MATCHES.forEach(m => { if (m.matchNum) timeById[m.matchNum] = m.time; });

  // feedMap: targetId → [src1, src2]
  const feedMap = {};
  BRACKET_NODES.forEach(n => {
    if (n.feeds) (feedMap[n.feeds] = feedMap[n.feeds] || []).push(n);
  });

  // ── SVG connector lines ───────────────────────────────────
  let svgLines = '';
  Object.entries(feedMap).forEach(([tid, srcs]) => {
    const target = nodeById[parseInt(tid)];
    if (!target || srcs.length !== 2) return;
    const [s1, s2] = srcs.sort((a, b) => a.row - b.row);
    const srcRight = colX(s1.round) + CARD_W;
    const midX     = srcRight + COL_GAP / 2;
    const tgtLeft  = colX(target.round);
    const cy1      = centerY(s1.row);
    const cy2      = centerY(s2.row);
    const ctY      = centerY(target.row);
    svgLines += `
      <line x1="${srcRight}" y1="${cy1}" x2="${midX}"    y2="${cy1}"  stroke="${LINE_CLR}" stroke-width="1.5"/>
      <line x1="${srcRight}" y1="${cy2}" x2="${midX}"    y2="${cy2}"  stroke="${LINE_CLR}" stroke-width="1.5"/>
      <line x1="${midX}"    y1="${cy1}"  x2="${midX}"    y2="${cy2}"  stroke="${LINE_CLR}" stroke-width="1.5"/>
      <line x1="${midX}"    y1="${ctY}"  x2="${tgtLeft}" y2="${ctY}"  stroke="${LINE_CLR}" stroke-width="1.5"/>`;
  });

  // ── Round column labels ───────────────────────────────────
  let cardsHtml = '';
  Object.entries(ROUND_NAMES).forEach(([r, label]) => {
    const color = ROUND_ACCENT[r] || '#546e7a';
    cardsHtml += `
      <div class="br-round-label" style="left:${colX(r)}px;top:-${PAD_TOP - 8}px;width:${CARD_W}px;color:${color}">
        ${label}
      </div>`;
  });

  // ── Match cards ───────────────────────────────────────────
  BRACKET_NODES.filter(n => n.round !== '3rd').forEach(n => {
    const ac      = ROUND_ACCENT[n.round];
    const isFinal = n.round === 'Final';
    const venuePin = `<svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    cardsHtml += `
      <div class="br-card ${isFinal ? 'br-final-card' : ''}" data-ticket-from="${TICKET_FROM[n.round] || 75}" data-ticket-url="${getStubHubUrl(n)}" data-venue="${n.venue}" data-date="${n.date}" style="left:${colX(n.round)}px;top:${cardTop(n.row)}px;width:${CARD_W}px;height:${CARD_H}px;">
        <div class="br-card-header" style="background:${ac}18;border-top:2px solid ${ac};">
          <span class="br-match-id" style="color:${ac}">M${n.id}</span>
          <span class="br-match-date">${n.date}${timeById[n.id] ? ' · ' + timeById[n.id] : ''}</span>
        </div>
        <div class="br-card-teams">
          <div class="br-team">${teamName(n.home)}</div>
          <div class="br-team">${teamName(n.away)}</div>
        </div>
        <div class="br-venue">${venuePin} ${n.venue}</div>
      </div>`;
  });

  // ── 3rd place card ────────────────────────────────────────
  const n3     = BRACKET_NODES.find(n => n.round === '3rd');
  const thirdX = colX('SF');
  const thirdY = TOTAL_H + 40;
  const venuePin = `<svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  cardsHtml += `
    <div style="position:absolute;left:${thirdX}px;top:${thirdY - 22}px;color:#546e7a;font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
      3rd Place Play-off · ${n3.date}${timeById[n3.id] ? ' · ' + timeById[n3.id] : ''}
    </div>
    <div class="br-card" data-ticket-from="${TICKET_FROM['3rd']}" data-ticket-url="${getStubHubUrl(n3)}" data-venue="${n3.venue}" data-date="${n3.date}" style="left:${thirdX}px;top:${thirdY}px;width:${CARD_W * 2 + COL_GAP}px;height:${CARD_H}px;">
      <div class="br-card-header" style="background:#37474f20;border-top:2px solid #546e7a;">
        <span class="br-match-id" style="color:#78909c">M103 · 3RD PLACE</span>
        <span class="br-match-date">${n3.date}${timeById[n3.id] ? ' · ' + timeById[n3.id] : ''}</span>
      </div>
      <div class="br-card-teams" style="display:flex;gap:12px;align-items:center;padding:6px 10px 4px;">
        <div class="br-team" style="flex:1">${teamName(n3.home)}</div>
        <span style="font-size:.65rem;color:#546e7a;font-weight:700;">VS</span>
        <div class="br-team" style="flex:1;text-align:right">${teamName(n3.away)}</div>
      </div>
      <div class="br-venue">${venuePin} ${n3.venue}</div>
    </div>`;

  // ── Inject HTML ───────────────────────────────────────────
  const totalW    = 5 * COL_STP - COL_GAP + CARD_W;
  const totalSvgH = TOTAL_H + 160;

  document.getElementById('view-bracket').innerHTML = `
    <p class="hint">⏰ ${LANG === 'zh' ? '所有时间均为当地时间' : 'All times shown are local venue time'}</p>
    <div class="bracket-outer">
      <div class="bracket-wrap" style="width:${totalW}px;height:${TOTAL_H + 160}px;margin-top:${PAD_TOP}px;">
        <svg style="position:absolute;top:0;left:0;width:${totalW}px;height:${totalSvgH}px;overflow:visible;pointer-events:none;">
          ${svgLines}
        </svg>
        ${cardsHtml}
      </div>
    </div>`;
}
