#!/usr/bin/env python3
"""
FIFA World Cup 2026 — Score Updater Agent
Uses Claude + web_search to fetch live scores every 5 minutes.
Runs via GitHub Actions; writes results to js/scores.json.
"""

import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta
import anthropic

BRACKET_ONLY = "--bracket-only" in sys.argv

# ── Config ──────────────────────────────────────────────────
SCORES_FILE   = "js/scores.json"
DATA_JS_FILE  = "js/data.js"
PRE_MIN       = 5    # start checking 5 min before kickoff
POST_MIN      = 210  # stop checking 3.5 h after kickoff (covers extra time + penalties)

# Fetch throttle: first call at T+15 min, then once per hour
FETCH_DELAY_MIN    = 15   # don't call Claude until 15 min after kickoff
FETCH_INTERVAL_MIN = 55   # minimum gap between Claude calls per match (55 min → ~hourly)

# World Cup window — skip runs outside this range to save Actions minutes
WC_START = datetime(2026, 6, 11, tzinfo=timezone.utc)
WC_END   = datetime(2026, 7, 20, tzinfo=timezone.utc)

# ── Constants ───────────────────────────────────────────────
GROUPS = list("ABCDEFGHIJKL")


# ── Schedule parsing ─────────────────────────────────────────

def parse_schedule():
    """Extract ALL_MATCHES from js/data.js using regex."""
    with open(DATA_JS_FILE, encoding="utf-8") as f:
        content = f.read()

    # Grab the array body between const ALL_MATCHES = [ ... ];
    m = re.search(r"const ALL_MATCHES\s*=\s*\[([\s\S]*?)\];", content)
    if not m:
        raise RuntimeError("Could not find ALL_MATCHES in data.js")

    matches = []
    for obj in re.finditer(r"\{([^{}]+)\}", m.group(1)):
        raw = obj.group(1)
        row = {}
        for key in ("group", "round", "matchNum", "home", "away", "dateISO", "time", "venue"):
            val = re.search(rf"['\"]?{key}['\"]?\s*:\s*['\"]([^'\"]+)['\"]", raw)
            if val:
                row[key] = val.group(1)
        # skip incomplete rows (knockout placeholders without real teams)
        if "home" in row and "away" in row and "dateISO" in row and "time" in row:
            matches.append(row)
    return matches


def match_start_utc(m):
    """Return UTC datetime of a match's kickoff (EDT = UTC-4)."""
    tp = m["time"].strip()
    parts = tp.split()
    h, mi = map(int, parts[0].split(":"))
    if parts[1].upper() == "PM" and h != 12:
        h += 12
    elif parts[1].upper() == "AM" and h == 12:
        h = 0
    y, mo, d = map(int, m["dateISO"].split("-"))
    return datetime(y, mo, d, h, mi, tzinfo=timezone.utc) + timedelta(hours=4)


def active_matches(schedule, scores_db=None):
    """Return matches inside the live window, plus any still marked 'live' in scores_db."""
    now = datetime.now(timezone.utc)
    result = []
    in_window = set()
    for m in schedule:
        try:
            start = match_start_utc(m)
            diff = (now - start).total_seconds() / 60
            if -PRE_MIN <= diff <= POST_MIN:
                result.append(m)
                in_window.add(match_key(m))
        except Exception:
            pass
    # Also include any match still marked "live" in scores_db (keeps querying until confirmed finished)
    if scores_db:
        for m in schedule:
            key = match_key(m)
            if key not in in_window and scores_db.get(key, {}).get("status") == "live":
                result.append(m)
    return result


def match_key(m):
    return f"{m['dateISO']}|{m['home']}|{m['away']}"


def should_fetch_now(m, now, last_queried):
    """Return True if this match is due for a Claude fetch.

    Rules:
      - Skip if fewer than FETCH_DELAY_MIN minutes have elapsed since kickoff.
      - Fetch if this match has never been queried.
      - Fetch if at least FETCH_INTERVAL_MIN minutes have passed since last query.
    This produces a T+15, T+75, T+135 … schedule regardless of cron frequency.
    """
    try:
        elapsed = (now - match_start_utc(m)).total_seconds() / 60
    except Exception:
        return False

    if elapsed < FETCH_DELAY_MIN:
        return False   # too early — match just started

    key = match_key(m)
    last_str = last_queried.get(key)
    if last_str is None:
        return True    # never queried this match yet

    try:
        last_dt = datetime.fromisoformat(last_str)
        since_last = (now - last_dt).total_seconds() / 60
        return since_last >= FETCH_INTERVAL_MIN
    except Exception:
        return True    # unparseable timestamp — allow fetch


# ── Claude score fetch ────────────────────────────────────────

def fetch_scores(matches):
    """Ask Claude to search the web for current scores."""
    lines = "\n".join(
        f"- {m['home']} vs {m['away']}  (date: {m['dateISO']}, key: \"{match_key(m)}\")"
        for m in matches
    )

    prompt = f"""Search the web for FIFA World Cup 2026 scores. Return ONLY valid JSON, no explanations.

Matches to look up:
{lines}

JSON rules (no exceptions):
- homeScore/awayScore: integer (0 is valid), null only if not started
- status: "live" | "finished" | "upcoming"
- minute: integer or null
- homeGoals: HOME team goals only, e.g. "17' Embolo; 45' Schar" — separate with semicolons (;) NOT commas — empty string if none
- awayGoals: AWAY team goals only, same format — empty string if none

Output ONLY this JSON, nothing else:
{{
  "<key>": {{
    "homeScore": <integer or null>,
    "awayScore": <integer or null>,
    "status": "live" | "finished" | "upcoming",
    "minute": <integer or null>,
    "homeGoals": "<string>",
    "awayGoals": "<string>"
  }}
}}
"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        tools=[{
            "type": "web_search_20250305",
            "name": "web_search",
            "max_uses": 2
        }],
        messages=[{"role": "user", "content": prompt}]
    )

    # Collect text blocks from the response
    text = "".join(
        block.text for block in response.content
        if hasattr(block, "text")
    )
    print(f"  Claude response preview: {text[:300]}")

    # Extract the first JSON object from the response
    json_match = re.search(r"\{[\s\S]*\}", text)
    if not json_match:
        print("⚠️  No JSON found in Claude response.")
        return {}

    try:
        return json.loads(json_match.group())
    except json.JSONDecodeError as e:
        print(f"⚠️  JSON parse error: {e}")
        print("Raw:", json_match.group()[:300])
        return {}


# ── Group standings & qualifier logic ───────────────────────

def group_matches(schedule, group):
    return [m for m in schedule if m.get("group") == group]

def group_done(schedule, scores, group):
    """True when all 6 matches in a group have a finished score."""
    for m in group_matches(schedule, group):
        s = scores.get(match_key(m), {})
        if s.get("status") != "finished":
            return False
    return True

def all_groups_done(schedule, scores):
    return all(group_done(schedule, scores, g) for g in GROUPS)

def compute_standings(schedule, scores, group):
    """Return list of dicts sorted by FIFA tie-break rules."""
    teams = {}
    for m in group_matches(schedule, group):
        for t in (m["home"], m["away"]):
            if t not in teams:
                teams[t] = dict(team=t, mp=0, w=0, d=0, l=0, gf=0, ga=0, pts=0)
        s = scores.get(match_key(m), {})
        hs, as_ = s.get("homeScore"), s.get("awayScore")
        if hs is None or as_ is None:
            continue
        h, a = teams[m["home"]], teams[m["away"]]
        h["mp"] += 1; a["mp"] += 1
        h["gf"] += hs; h["ga"] += as_
        a["gf"] += as_; a["ga"] += hs
        if hs > as_:
            h["w"] += 1; h["pts"] += 3; a["l"] += 1
        elif hs < as_:
            a["w"] += 1; a["pts"] += 3; h["l"] += 1
        else:
            h["d"] += 1; h["pts"] += 1; a["d"] += 1; a["pts"] += 1
    key = lambda t: (-t["pts"], -(t["gf"]-t["ga"]), -t["gf"])
    return sorted(teams.values(), key=key)


def compute_partial_bracket_teams(schedule, scores):
    """
    Pure-Python: determine 1st/2nd for every finished group.
    No Claude needed — just read group standings.
    Called daily at midnight so partially-done tournaments are handled correctly.
    """
    bracket = {}
    finished = [g for g in GROUPS if group_done(schedule, scores, g)]
    print(f"  Groups completed: {', '.join(finished) if finished else 'none'}")

    for g in finished:
        rows = compute_standings(schedule, scores, g)
        if len(rows) >= 2:
            bracket[f"1st Group {g}"] = rows[0]["team"]
            bracket[f"2nd Group {g}"] = rows[1]["team"]

    return bracket


def resolve_third_place_with_claude(schedule, scores):
    """
    Called only when ALL 12 groups are done.
    Ranks the 12 third-place teams, picks best 8, assigns to bracket slots via Claude.
    """
    third_lines = []
    for g in GROUPS:
        rows = compute_standings(schedule, scores, g)
        if len(rows) >= 3:
            r = rows[2]
            gd = r["gf"] - r["ga"]
            third_lines.append(
                f"Group {g}: {r['team']}  Pts:{r['pts']} GD:{gd:+d} GF:{r['gf']}"
            )

    r32 = [m for m in schedule if m.get("round") == "R32"]
    slots_3rd = sorted(set(
        s for m in r32
        for s in (m["home"], m["away"])
        if s.startswith("3rd")
    ))

    prompt = f"""FIFA World Cup 2026 — assign third-place teams to Round of 32 slots.

All 12 third-place teams:
{chr(10).join(third_lines)}

The 8 bracket slots are:
{chr(10).join('  ' + s for s in slots_3rd)}

Rules:
1. Rank the 12 third-place teams: Points → Goal Difference → Goals Scored.
2. The best 8 qualify.
3. Assign each qualifier to the correct slot (each slot lists eligible groups).

Return ONLY a JSON object mapping slot → team name, no other text:
{{
  "3rd Grp A/B/C/D/F": "<team>",
  ...
}}"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )
    text = "".join(b.text for b in response.content if hasattr(b, "text"))
    jm = re.search(r"\{[\s\S]*\}", text)
    if jm:
        try:
            return json.loads(jm.group())
        except json.JSONDecodeError:
            pass
    print("⚠️  Could not parse third-place bracket from Claude.")
    return {}


# ── Knockout score tracking ───────────────────────────────────

def active_knockout_matches(schedule, scores, bracket_teams):
    """Return knockout matches with real teams that are in the active window."""
    now = datetime.now(timezone.utc)
    result = []
    for m in schedule:
        if m.get("group"):   # skip group stage
            continue
        # Only process if both teams are resolved (not placeholders)
        home = bracket_teams.get(m["home"], m["home"])
        away = bracket_teams.get(m["away"], m["away"])
        if home.startswith(("1st", "2nd", "3rd", "W ", "L ")):
            continue   # not yet resolved
        try:
            start = match_start_utc(m)
            diff = (now - start).total_seconds() / 60
            if -PRE_MIN <= diff <= POST_MIN:
                # create a resolved copy for the fetch call
                resolved = dict(m)
                resolved["home"] = home
                resolved["away"] = away
                result.append(resolved)
        except Exception:
            pass
    return result


# ── Scores file I/O ──────────────────────────────────────────

def load_scores():
    try:
        with open(SCORES_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"updated": None, "matches": {}}


def save_scores(data):
    os.makedirs(os.path.dirname(SCORES_FILE), exist_ok=True)
    with open(SCORES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ── Main ─────────────────────────────────────────────────────

def main():
    now = datetime.now(timezone.utc)
    print(f"[{now.isoformat()}] Score updater starting… (mode: {'bracket' if BRACKET_ONLY else 'scores'})")

    if not (WC_START <= now <= WC_END):
        print("Outside World Cup window. Nothing to do.")
        return

    global client
    client = anthropic.Anthropic()

    schedule = parse_schedule()
    existing = load_scores()
    scores_db = existing.get("matches", {})
    old_snapshot = json.dumps(scores_db, sort_keys=True)  # capture before any modifications

    # ══════════════════════════════════════════════════════════
    # BRACKET-ONLY MODE  (daily midnight run)
    # Computes 1st/2nd for finished groups; third-place once all done
    # ══════════════════════════════════════════════════════════
    if BRACKET_ONLY:
        print("Computing bracket team assignments…")
        new_bracket = compute_partial_bracket_teams(schedule, scores_db)

        # Add third-place slots when ALL groups are finished
        if all_groups_done(schedule, scores_db):
            print("  All groups done — resolving third-place slots via Claude…")
            third = resolve_third_place_with_claude(schedule, scores_db)
            new_bracket.update(third)
            print(f"  → {len(third)} third-place slot(s) resolved.")

        # Merge (preserve already-resolved entries)
        prev = existing.get("bracket_teams", {})
        prev.update(new_bracket)
        existing["bracket_teams"] = prev
        existing["updated"] = now.isoformat()
        save_scores(existing)
        print(f"✅ bracket_teams updated — {len(prev)} total slot(s).")
        return

    # ══════════════════════════════════════════════════════════
    # SCORE MODE  (throttled: T+15 first call, then hourly)
    # ══════════════════════════════════════════════════════════
    bracket_teams = existing.get("bracket_teams", {})
    last_queried  = existing.get("last_queried", {})

    # ── A. Group stage scores ─────────────────────────────────
    live_group = active_matches(schedule, scores_db)
    has_pending = False
    if live_group:
        pending = [m for m in live_group
                   if scores_db.get(match_key(m), {}).get("status") != "finished"
                   and should_fetch_now(m, now, last_queried)]
        skipped = len(live_group) - len(pending) - sum(
            1 for m in live_group
            if scores_db.get(match_key(m), {}).get("status") == "finished"
        )
        if skipped:
            print(f"  ⏳ {skipped} group match(es) not yet due for update (T+{FETCH_DELAY_MIN} min / {FETCH_INTERVAL_MIN} min interval).")
        if not pending:
            print("No group matches due for a Claude query right now.")
        else:
            has_pending = True
            print(f"Querying Claude for {len(pending)} group match(es)…")
            new_scores = fetch_scores(pending)
            for m in pending:
                key = match_key(m)
                last_queried[key] = now.isoformat()   # record query time
                score = new_scores.get(key)
                if not score:
                    continue
                # Guard: don't trust "finished" if < 95 min since kickoff
                if score.get("status") == "finished":
                    elapsed = (now - match_start_utc(m)).total_seconds() / 60
                    if elapsed < 95:
                        print(f"  ⚠️  Ignoring premature 'finished' for {key} ({elapsed:.0f} min elapsed)")
                        score["status"] = "live"
                if score.get("homeScore") is not None or key not in scores_db:
                    scores_db[key] = score
            print(f"  → {len(new_scores)} result(s).")
    else:
        print("No group matches in active window.")

    # ── B. Knockout stage scores ──────────────────────────────
    live_ko = active_knockout_matches(schedule, scores_db, bracket_teams)
    if live_ko:
        pending_ko = [m for m in live_ko
                      if scores_db.get(match_key(m), {}).get("status") != "finished"
                      and should_fetch_now(m, now, last_queried)]
        if not pending_ko:
            print("No knockout matches due for a Claude query right now.")
        else:
            has_pending = True
            print(f"Querying Claude for {len(pending_ko)} knockout match(es)…")
            ko_scores = fetch_scores(pending_ko)
            for m in pending_ko:
                key = match_key(m)
                last_queried[key] = now.isoformat()   # record query time
                score = ko_scores.get(key)
                if not score:
                    continue
                if score.get("status") == "finished":
                    elapsed = (now - match_start_utc(m)).total_seconds() / 60
                    if elapsed < 95:
                        print(f"  ⚠️  Ignoring premature 'finished' for {key} ({elapsed:.0f} min elapsed)")
                        score["status"] = "live"
                if score.get("homeScore") is not None or key not in scores_db:
                    scores_db[key] = score
            print(f"  → {len(ko_scores)} result(s).")
    else:
        print("No knockout matches in active window.")

    # ── C. Recompute bracket 1st/2nd (pure Python, no API) ──────
    new_bracket = compute_partial_bracket_teams(schedule, scores_db)
    prev_bracket = existing.get("bracket_teams", {})
    bracket_changed = any(prev_bracket.get(k) != v for k, v in new_bracket.items())
    if bracket_changed:
        prev_bracket.update(new_bracket)
        existing["bracket_teams"] = prev_bracket
        print(f"  → bracket_teams updated: {list(new_bracket.keys())}")

    # ── D. Save (scores, bracket, or last_queried changed) ───────
    new_snapshot = json.dumps(scores_db, sort_keys=True)
    queried_changed = last_queried != existing.get("last_queried", {})
    if new_snapshot != old_snapshot or bracket_changed or queried_changed:
        existing["matches"]      = scores_db
        existing["last_queried"] = last_queried
        existing["updated"]      = now.isoformat()
        save_scores(existing)
        print("✅ scores.json updated.")
    else:
        print("ℹ️  No changes — skipping write.")

    # Exit 0 = active matches still in progress (workflow should loop)
    # Exit 1 = no active matches (workflow can stop until next hourly check)
    if not has_pending:
        sys.exit(1)


if __name__ == "__main__":
    main()
