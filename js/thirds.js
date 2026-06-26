// ═══════════════════════════════════════════════════════════
//  THIRD-PLACE STANDINGS  —  floating panel on the Groups tab
//  Depends on: data.js, helpers.js (computeStandings, FLAGS, TEAM_NAMES_ZH)
// ═══════════════════════════════════════════════════════════

const THIRDS_QUALIFY = 8;   // top-8 advance to knockout

function computeThirdPlaceRankings() {
  const thirds = [];
  'ABCDEFGHIJKL'.split('').forEach(g => {
    const standings = computeStandings(g);
    if (standings.length < 3) return;
    const t = standings[2];
    thirds.push({
      group: g,
      team:  t.team,
      mp:    t.mp,
      pts:   t.pts,
      gd:    t.gf - t.ga,
      gf:    t.gf,
      done:  t.mp >= 3,
    });
  });
  return thirds.sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team)
  );
}

function buildThirdsPanel() {
  const z       = LANG === 'zh';
  const thirds  = computeThirdPlaceRankings();
  const content = document.getElementById('thirds-content');
  if (!content) return;

  if (!thirds.length) {
    content.innerHTML = `<p class="thirds-empty">${z ? '小组赛开始后显示' : 'Available once group matches begin'}</p>`;
    return;
  }

  const doneCount    = thirds.filter(t => t.done).length;
  const presentGrps  = new Set(thirds.map(t => t.group));
  const allGroups    = 'ABCDEFGHIJKL'.split('');

  let rows = '';

  thirds.forEach((t, i) => {
    const rank      = i + 1;
    const qualifies = rank <= THIRDS_QUALIFY;
    const isCutoff  = rank === THIRDS_QUALIFY;

    const fl   = FLAGS[t.team]
      ? `<img src="https://flagcdn.com/w40/${FLAGS[t.team]}.png" class="thirds-flag" alt="">`
      : '';
    const name = z ? (TEAM_NAMES_ZH[t.team] || t.team) : t.team;
    const gdStr = t.mp > 0 ? (t.gd > 0 ? `+${t.gd}` : String(t.gd)) : '–';
    const ptsStr = t.mp > 0 ? t.pts : '–';

    let statusHtml;
    if (t.done)        statusHtml = `<span class="t3-done">✓</span>`;
    else if (t.mp > 0) statusHtml = `<span class="t3-partial">${t.mp}/3</span>`;
    else               statusHtml = `<span class="t3-none">–</span>`;

    const ac = GROUP_ACCENT[t.group] || '#546e7a';
    const grpBadge = `<span class="t3-grp-badge" style="background:${ac}22;color:${ac}">${z ? `${t.group}组` : `G${t.group}`}</span>`;

    rows += `<tr class="${qualifies ? 't3-qualify' : 't3-out'}${isCutoff ? ' t3-cutoff' : ''}">
      <td class="t3c-rank">${rank}</td>
      <td class="t3c-team"><div class="t3c-team-in">${fl}<span>${name}</span></div></td>
      <td class="t3c-grp">${grpBadge}</td>
      <td class="t3c-pts">${ptsStr}</td>
      <td class="t3c-gd">${gdStr}</td>
      <td class="t3c-status">${statusHtml}</td>
    </tr>`;
  });

  // Placeholder rows for groups not yet started
  allGroups.filter(g => !presentGrps.has(g)).forEach(g => {
    rows += `<tr class="t3-empty-row">
      <td class="t3c-rank">–</td>
      <td colspan="2" class="t3c-team">${z ? `${g}组（未开赛）` : `Group ${g} (not started)`}</td>
      <td class="t3c-pts">–</td><td class="t3c-gd">–</td><td class="t3c-status">–</td>
    </tr>`;
  });

  const titleEl = document.getElementById('thirds-panel-title');
  if (titleEl) titleEl.textContent = z ? '第三名排名' : 'Third-Place Standings';

  content.innerHTML = `
    <div class="t3-meta">
      <span class="t3-meta-legend"><span class="t3-q-dot"></span>${z ? '绿色：当前可晋级淘汰赛（前8）' : 'Green: currently qualify (top 8)'}</span>
      <span class="t3-meta-done">${z ? `${doneCount}/12 组完赛` : `${doneCount}/12 groups done`}</span>
    </div>
    <div class="t3-table-wrap">
      <table class="t3-table">
        <thead><tr>
          <th>#</th>
          <th>${z ? '球队' : 'Team'}</th>
          <th>${z ? '小组' : 'Grp'}</th>
          <th>${z ? '积分' : 'Pts'}</th>
          <th title="${z ? '净胜球' : 'Goal Difference'}">${z ? '净胜' : 'GD'}</th>
          <th title="${z ? '3场比赛是否踢完' : 'All 3 matches played?'}">${z ? '完赛' : 'Done'}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function openThirdsPanel() {
  const panel   = document.getElementById('thirds-panel');
  const overlay = document.getElementById('thirds-overlay');
  if (!panel) return;
  buildThirdsPanel();
  panel.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeThirdsPanel() {
  const panel   = document.getElementById('thirds-panel');
  const overlay = document.getElementById('thirds-overlay');
  if (!panel) return;
  panel.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
