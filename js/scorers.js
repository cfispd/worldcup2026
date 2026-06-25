// ═══════════════════════════════════════════════════════════
//  SCORERS  —  parse goal data from ALL_MATCHES & render top scorers
//  Depends on: data.js, helpers.js  (loaded first)
// ═══════════════════════════════════════════════════════════

const SCORERS_INITIAL = 8;

function parseTopScorers() {
  const scorers = {};

  ALL_MATCHES.forEach(m => {
    if (m.matchStatus !== 'finished') return;

    [[m.homeGoals, m.home], [m.awayGoals, m.away]].forEach(([goalsStr, team]) => {
      if (!goalsStr) return;
      goalsStr.split(';').forEach(entry => {
        const goal = entry.trim();
        if (!goal) return;
        if (/\bOG\b/.test(goal)) return;  // skip own goals

        const name = goal
          .replace(/^[\d+']+\s*/, '')           // strip minute prefix: "45+5' " or "6' "
          .replace(/\s*\([Pp](?:en)?\)\s*/, '') // strip (P) / (Pen)
          .trim();
        if (!name) return;

        const key = `${name}|${team}`;
        if (!scorers[key]) scorers[key] = { name, team, goals: 0 };
        scorers[key].goals++;
      });
    });
  });

  // Merge single-word names into matching full names from same team
  // e.g., "Haaland|Norway" → absorbs into "Erling Haaland|Norway"
  Object.keys(scorers).forEach(key => {
    const s = scorers[key];
    if (s.name.indexOf(' ') !== -1) return; // only process single-word names
    const lastName = s.name;
    const fullKey = Object.keys(scorers).find(k => {
      if (k === key) return false;
      const other = scorers[k];
      return other.team === s.team && other.name.endsWith(' ' + lastName);
    });
    if (fullKey) {
      scorers[fullKey].goals += s.goals;
      delete scorers[key];
    }
  });

  return Object.values(scorers)
    .filter(s => s.goals > 0)
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
}

function scorersShowAll(btn) {
  document.querySelectorAll('#view-scorers .sc-hidden').forEach(el => el.classList.remove('sc-hidden'));
  btn.style.display = 'none';
}

function buildScorers() {
  const view = document.getElementById('view-scorers');
  if (!view) return;

  const scorers = parseTopScorers();
  const z = LANG === 'zh';

  if (!scorers.length) {
    view.innerHTML = `<p class="hint">${z ? '赛事开始后将显示射手榜' : 'Top scorers will appear once match goal data is available'}</p>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  let rank = 1;
  const rows = scorers.map((s, i) => {
    if (i > 0 && s.goals < scorers[i - 1].goals) rank = i + 1;
    const fl = FLAGS[s.team]
      ? `<img src="https://flagcdn.com/w40/${FLAGS[s.team]}.png" alt="${s.team}" class="sc-flag">`
      : '';
    const teamLabel = z ? (TEAM_NAMES_ZH[s.team] || s.team) : s.team;
    const rankCell  = rank <= 3 ? medals[rank - 1] : rank;
    const hidden    = i >= SCORERS_INITIAL ? ' sc-hidden' : '';
    return `<tr class="${rank <= 3 ? 'sc-row-medal' : ''}${hidden}">
      <td class="sc-rank">${rankCell}</td>
      <td class="sc-name">${s.name}</td>
      <td class="sc-team-cell"><div class="sc-team-inner">${fl}<span>${teamLabel}</span></div></td>
      <td class="sc-goals">${s.goals}</td>
    </tr>`;
  }).join('');

  const hasMore = scorers.length > SCORERS_INITIAL;
  const seeMoreBtn = hasMore
    ? `<button class="sc-see-more" onclick="scorersShowAll(this)">${z ? `查看全部 ${scorers.length} 名 ↓` : `See All ${scorers.length} Scorers ↓`}</button>`
    : '';

  view.innerHTML = `
    <div class="scorers-wrap">
      <h2 class="scorers-title">⚽ ${z ? '射手榜' : 'Top Scorers'}</h2>
      <div class="scorers-table-wrap">
        <table class="sc-table">
          <thead><tr>
            <th class="sc-th-rank">#</th>
            <th class="sc-th-name">${z ? '球员' : 'Player'}</th>
            <th class="sc-th-team">${z ? '国家' : 'Country'}</th>
            <th class="sc-th-goals">${z ? '进球' : 'Goals'}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${seeMoreBtn}
      <p class="scorers-note">${z
        ? '* 进球数据来自比赛记录，未记录进球者的场次不计入统计'
        : '* Parsed from match goal records; matches without scorer data are excluded'
      }</p>
    </div>`;
}
