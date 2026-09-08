/**
 * github-constellation — SVG generator
 *
 * Renders a GitHub user's contribution history as a generative constellation:
 *   - stars     = days
 *   - size      = commit count (absolute, capped, decoupled from color)
 *   - color     = recency gradient across the full year (old -> recent)
 *   - lines     = smooth glowing Catmull-Rom curves through commit streaks
 *   - pulse     = twinkle + breathing halo reserved for standout high-commit days
 *
 * Every tunable is read from environment variables so this script can run
 * unmodified both as a GitHub Action (via action.yml -> env:) and locally
 * from the command line.
 *
 * Required env vars:
 *   GITHUB_USER    GitHub login whose public contribution calendar to render
 *   GITHUB_TOKEN   A token with read access to the GraphQL API (a plain
 *                  classic PAT with no scopes works for public contributions)
 *
 * Optional env vars (all have sane defaults, see DEFAULTS below):
 *   COMMIT_CAP            int    cap used for star size/opacity scaling
 *   TWINKLE_MIN_COMMITS   int    commits/day required to twinkle+pulse
 *   RECENT_COLOR_DARK     hex    "recent" end of the gradient, dark theme
 *   OLD_COLOR_DARK        hex    "old" end of the gradient, dark theme
 *   RECENT_COLOR_LIGHT    hex    "recent" end of the gradient, light theme
 *   OLD_COLOR_LIGHT       hex    "old" end of the gradient, light theme
 *   OUTPUT_DIR            path   where the SVGs are written (default "dist")
 *   LAYOUT                str   "full" (default, labels+caption) or
 *                                "minimal" (bare grid, no labels/caption —
 *                                good for tight embeds / avatars-adjacent use)
 *
 * Usage (local):
 *   GITHUB_TOKEN=xxx GITHUB_USER=octocat node src/generate-constellation.js
 * Outputs:
 *   <OUTPUT_DIR>/constellation-dark.svg
 *   <OUTPUT_DIR>/constellation-light.svg
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// ---------------------------------------------------------------------------
// Config: env vars with defaults. Centralized here so action.yml and this
// script can never drift out of sync — every input maps 1:1 to a key below.
// ---------------------------------------------------------------------------

const DEFAULTS = {
  COMMIT_CAP: 20,
  TWINKLE_MIN_COMMITS: 10,
  RECENT_COLOR_DARK: "#ffcf5c",
  OLD_COLOR_DARK: "#7c6fe0",
  RECENT_COLOR_LIGHT: "#c9820a",
  OLD_COLOR_LIGHT: "#463c94",
  OUTPUT_DIR: "dist",
  LAYOUT: "full",
};

function envInt(name) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return DEFAULTS[name];
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) {
    console.warn(
      `[github-constellation] ${name}="${raw}" is not a valid integer, using default ${DEFAULTS[name]}`,
    );
    return DEFAULTS[name];
  }
  return n;
}

function envHex(name) {
  const raw = process.env[name];
  if (!raw) return DEFAULTS[name];
  if (!/^#?[0-9a-fA-F]{6}$/.test(raw)) {
    console.warn(
      `[github-constellation] ${name}="${raw}" is not a valid hex color, using default ${DEFAULTS[name]}`,
    );
    return DEFAULTS[name];
  }
  return raw.startsWith("#") ? raw : `#${raw}`;
}

function envStr(name) {
  const raw = process.env[name];
  return raw === undefined || raw === "" ? DEFAULTS[name] : raw;
}

const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const COMMIT_CAP = envInt("COMMIT_CAP");
const TWINKLE_MIN_COMMITS = envInt("TWINKLE_MIN_COMMITS");
const OUTPUT_DIR = envStr("OUTPUT_DIR");
const LAYOUT = envStr("LAYOUT") === "minimal" ? "minimal" : "full";

const THEMES = {
  dark: {
    bg: "#0d1117",
    starDim: "#262b38",
    textColor: "#b9c0cc",
    recentColor: envHex("RECENT_COLOR_DARK"),
    oldColor: envHex("OLD_COLOR_DARK"),
  },
  light: {
    bg: "#ffffff",
    starDim: "#e3e5ea",
    textColor: "#3f3f46",
    recentColor: envHex("RECENT_COLOR_LIGHT"),
    oldColor: envHex("OLD_COLOR_LIGHT"),
  },
};

if (!GITHUB_USER) {
  console.error("[github-constellation] Missing GITHUB_USER env var");
  process.exit(1);
}
if (!GITHUB_TOKEN) {
  console.error("[github-constellation] Missing GITHUB_TOKEN env var");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// GitHub GraphQL
// ---------------------------------------------------------------------------

const query = `
query($userName: String!) {
  user(login: $userName) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
`;

function graphqlRequest(query, variables) {
  const data = JSON.stringify({ query, variables });
  const options = {
    hostname: "api.github.com",
    path: "/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${GITHUB_TOKEN}`,
      "User-Agent": "github-constellation",
      "Content-Length": Buffer.byteLength(data),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`GitHub API responded ${res.statusCode}: ${body}`));
          return;
        }
        try {
          const parsed = JSON.parse(body);
          if (parsed.errors) {
            reject(new Error(JSON.stringify(parsed.errors)));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return function () {
    h = (h * 9301 + 49297) % 233280;
    return h / 233280;
  };
}

function lerpColor(a, b, t) {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bch = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bch})`;
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function parseRgbString(s) {
  const m = s.match(/rgb\((\d+),(\d+),(\d+)\)/);
  if (!m) return { r: 128, g: 128, b: 128 };
  return { r: +m[1], g: +m[2], b: +m[3] };
}

function blendRgbStrings(a, b) {
  const pa = parseRgbString(a);
  const pb = parseRgbString(b);
  return `rgb(${Math.round((pa.r + pb.r) / 2)},${Math.round(
    (pa.g + pb.g) / 2,
  )},${Math.round((pa.b + pb.b) / 2)})`;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Row index (0=Sun..6=Sat, matching GitHub's contributionDays order) ->
// short label. Only Mon/Wed/Fri are labeled, GitHub-style.
const DAY_LABELS = { 1: "Mon", 3: "Wed", 5: "Fri" };

function formatMonthYear(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function computeStats(sortedDays) {
  let longest = 0;
  let running = 0;
  let current = 0;

  for (const d of sortedDays) {
    if (d.count > 0) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  for (let i = sortedDays.length - 1; i >= 0; i--) {
    if (sortedDays[i].count > 0) {
      current += 1;
    } else {
      break;
    }
  }

  const monthTotals = new Map();
  for (const d of sortedDays) {
    const dt = new Date(d.date);
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    const entry = monthTotals.get(key) || { total: 0, date: dt };
    entry.total += d.count;
    monthTotals.set(key, entry);
  }

  let mostActiveMonth = null;
  let mostActiveTotal = -1;
  for (const { total, date } of monthTotals.values()) {
    if (total > mostActiveTotal) {
      mostActiveTotal = total;
      mostActiveMonth = date;
    }
  }

  return { longest, current, mostActiveMonth, mostActiveTotal };
}

// ---------------------------------------------------------------------------
// SVG construction
// ---------------------------------------------------------------------------

function buildSvg(weeks, theme, layout) {
  const { bg, starDim, textColor, recentColor, oldColor } = theme;
  const isMinimal = layout === "minimal";

  const cellSize = 12;
  const paddingLeft = isMinimal ? 12 : 34;
  const paddingRight = isMinimal ? 12 : 20;
  const paddingY = isMinimal ? 12 : 26;
  const monthLabelHeight = isMinimal ? 0 : 18;
  const captionHeight = isMinimal ? 0 : 42;
  const width = weeks.length * cellSize + paddingLeft + paddingRight;
  const height = monthLabelHeight + 7 * cellSize + paddingY * 2 + captionHeight;

  const allDays = [];
  weeks.forEach((week, wi) => {
    week.contributionDays.forEach((day, di) => {
      allDays.push({
        date: day.date,
        count: day.contributionCount,
        col: wi,
        row: di,
      });
    });
  });

  const totalDays = allDays.length;

  // Size and opacity are driven purely by the ABSOLUTE commit count for
  // that day (not scaled relative to this dataset's max), so a 3-commit
  // day always looks like a 3-commit day. Growth is capped at COMMIT_CAP
  // so a single outlier day doesn't flatten every other day's contrast.
  function starRadius(count) {
    if (count === 0) return 0.6;
    const capped = Math.min(count, COMMIT_CAP);
    const scale = Math.pow(capped / COMMIT_CAP, 0.7);
    return 1.0 + scale * 4.6;
  }

  function starOpacity(count) {
    if (count === 0) return 0.15;
    const capped = Math.min(count, COMMIT_CAP);
    const scale = Math.pow(capped / COMMIT_CAP, 0.6);
    return 0.5 + scale * 0.5;
  }

  // Recency-based color spans the FULL year: index 0 (oldest) -> oldColor,
  // last index (most recent) -> recentColor. Zero-count days stay dim/neutral.
  function starColor(day, index) {
    if (day.count === 0) return starDim;
    const t = totalDays > 1 ? index / (totalDays - 1) : 1;
    return lerpColor(oldColor, recentColor, t);
  }

  function jitteredPos(day) {
    const rnd = seededRandom(day.date);
    const jx = (rnd() - 0.5) * cellSize * 0.85;
    const jy = (rnd() - 0.5) * cellSize * 0.85;
    const x = paddingLeft + day.col * cellSize + cellSize / 2 + jx;
    const y =
      monthLabelHeight + paddingY + day.row * cellSize + cellSize / 2 + jy;
    return { x, y };
  }

  const positions = new Map();
  const colors = new Map();
  allDays.forEach((d, i) => {
    positions.set(d.date, jitteredPos(d));
    colors.set(d.date, starColor(d, i));
  });

  const sortedDays = [...allDays].sort((a, b) => (a.date < b.date ? -1 : 1));

  // Group consecutive active days (gap <= 1 day) into streaks, then draw
  // each streak as ONE continuous Catmull-Rom spline through all its points.
  const streaks = [];
  let currentStreak = [];
  for (let i = 0; i < sortedDays.length; i++) {
    const d = sortedDays[i];
    if (d.count > 0) {
      if (currentStreak.length > 0) {
        const prev = currentStreak[currentStreak.length - 1];
        const gapDays =
          (new Date(d.date) - new Date(prev.date)) / (1000 * 60 * 60 * 24);
        if (gapDays > 1) {
          if (currentStreak.length > 1) streaks.push(currentStreak);
          currentStreak = [];
        }
      }
      currentStreak.push(d);
    } else {
      if (currentStreak.length > 1) streaks.push(currentStreak);
      currentStreak = [];
    }
  }
  if (currentStreak.length > 1) streaks.push(currentStreak);

  const curves = [];
  streaks.forEach((streak) => {
    const pts = streak.map((d) => positions.get(d.date));
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      const strokeColor = blendRgbStrings(
        colors.get(streak[i].date),
        colors.get(streak[i + 1].date),
      );
      curves.push({
        d: `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} C ${cp1x.toFixed(
          2,
        )} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(
          2,
        )}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
        color: strokeColor,
      });
    }
  });

  const stats = computeStats(sortedDays);
  const totalContributions = allDays.reduce((s, d) => s + d.count, 0);

  let monthLabelsSvg = "";
  if (!isMinimal) {
    // GitHub's contribution calendar almost always starts on a partial
    // week, which can flag a "month change" one column after the very
    // first label — e.g. a week starting Dec 30 gets labeled "Dec", then
    // the next week (Jan 5) immediately gets labeled "Jan" just 12px to
    // its right. Two 3-letter labels can't fit in 12px, so they render on
    // top of each other. Enforce a minimum pixel gap between labels and
    // simply skip any month change that's too close to the previous one —
    // it'll still get labeled correctly whenever the *next* month change
    // occurs with enough room.
    const monthLabels = [];
    let lastMonth = null;
    let lastLabelX = -Infinity;
    const minLabelGap = cellSize * 3; // ~3 weeks of clearance per label

    weeks.forEach((week, wi) => {
      const firstDay = week.contributionDays[0];
      if (!firstDay) return;
      const month = new Date(firstDay.date).getMonth();
      if (month === lastMonth) return;

      const x = paddingLeft + wi * cellSize;
      lastMonth = month; // always advance, even if we skip rendering this one
      if (x - lastLabelX < minLabelGap) return;

      monthLabels.push({ label: MONTH_NAMES[month], x });
      lastLabelX = x;
    });

    monthLabels.forEach((m) => {
      monthLabelsSvg += `<text x="${m.x.toFixed(
        2,
      )}" y="${monthLabelHeight}" font-family="Fira Code, monospace" font-size="9" fill="${textColor}" opacity="0.5">${m.label}</text>`;
    });
  }

  let dayLabelsSvg = "";
  if (!isMinimal) {
    Object.entries(DAY_LABELS).forEach(([row, label]) => {
      const y =
        monthLabelHeight + paddingY + Number(row) * cellSize + cellSize / 2 + 3;
      dayLabelsSvg += `<text x="${(paddingLeft - 8).toFixed(2)}" y="${y.toFixed(
        2,
      )}" text-anchor="end" font-family="Fira Code, monospace" font-size="9" fill="${textColor}" opacity="0.5">${label}</text>`;
    });
  }

  let glowLinesSvg = "";
  let crispLinesSvg = "";
  curves.forEach((c) => {
    glowLinesSvg += `<path d="${c.d}" fill="none" stroke="${c.color}" stroke-width="1.6" opacity="0.28" stroke-linecap="round" filter="url(#streak-glow)" />`;
    crispLinesSvg += `<path d="${c.d}" fill="none" stroke="${c.color}" stroke-width="0.4" opacity="0.6" stroke-linecap="round" />`;
  });

  // Stars: dim/static first (background layer), then bright/animated
  // (foreground layer) so twinkle glows aren't occluded by static dots.
  let dimStarsSvg = "";
  let brightStarsSvg = "";

  allDays.forEach((d) => {
    const pos = positions.get(d.date);
    const r = starRadius(d.count);
    const o = starOpacity(d.count);
    const fill = colors.get(d.date);
    const isBright = d.count > TWINKLE_MIN_COMMITS;

    const title = `<title>${d.date}: ${d.count} contribution${
      d.count === 1 ? "" : "s"
    }</title>`;

    if (isBright) {
      const delay = (seededRandom(d.date + "-delay")() * 4).toFixed(2);
      const duration = (2.6 + seededRandom(d.date + "-dur")() * 1.4).toFixed(2);
      const haloDelay = (seededRandom(d.date + "-halo-delay")() * 3).toFixed(2);
      const haloDuration = (
        3.2 +
        seededRandom(d.date + "-halo-dur")() * 1.6
      ).toFixed(2);

      brightStarsSvg += `<circle class="tw-halo" style="--ho:${(
        o * 0.18
      ).toFixed(
        2,
      )};animation-delay:${haloDelay}s;animation-duration:${haloDuration}s" cx="${pos.x.toFixed(
        2,
      )}" cy="${pos.y.toFixed(2)}" r="${(r * 2.4).toFixed(
        2,
      )}" fill="${fill}" opacity="${(o * 0.18).toFixed(2)}" />`;

      brightStarsSvg += `<circle class="tw" style="--o:${o.toFixed(
        2,
      )};animation-delay:${delay}s;animation-duration:${duration}s" cx="${pos.x.toFixed(
        2,
      )}" cy="${pos.y.toFixed(2)}" r="${r.toFixed(
        2,
      )}" fill="${fill}" opacity="${o.toFixed(2)}">${title}</circle>`;
    } else {
      dimStarsSvg += `<circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(
        2,
      )}" r="${r.toFixed(2)}" fill="${fill}" opacity="${o.toFixed(
        2,
      )}">${title}</circle>`;
    }
  });

  let captionSvg = "";
  if (!isMinimal) {
    const captionLine1 = `${totalContributions.toLocaleString()} contributions mapped as stars`;
    const mostActiveLabel = stats.mostActiveMonth
      ? formatMonthYear(stats.mostActiveMonth)
      : "—";
    const captionLine2 = `Longest streak ${stats.longest}d  ·  Current streak ${stats.current}d  ·  Busiest month ${mostActiveLabel}`;
    captionSvg = `
  <text x="${width / 2}" y="${height - 26}" text-anchor="middle" font-family="Fira Code, monospace" font-size="10" fill="${textColor}" opacity="0.65">${captionLine1}</text>
  <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-family="Fira Code, monospace" font-size="9" fill="${textColor}" opacity="0.5">${captionLine2}</text>`;
  }

  const summary = `GitHub contribution constellation: ${totalContributions} contributions, longest streak ${stats.longest} days`;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${summary}">
  <title>${summary}</title>
  <defs>
    <filter id="streak-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <style>
    @keyframes tw {
      0%, 100% { opacity: var(--o, 1); transform: scale(1); }
      50% { opacity: calc(var(--o, 1) * 0.45); transform: scale(1.3); }
    }
    @keyframes tw-halo {
      0%, 100% { opacity: var(--ho, 0.15); transform: scale(1); }
      50% { opacity: calc(var(--ho, 0.15) * 2.1); transform: scale(1.15); }
    }
    .tw {
      transform-box: fill-box;
      transform-origin: center;
      animation-name: tw;
      animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
      animation-iteration-count: infinite;
    }
    .tw-halo {
      transform-box: fill-box;
      transform-origin: center;
      animation-name: tw-halo;
      animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
      animation-iteration-count: infinite;
    }
  </style>
  <rect x="0" y="0" width="${width}" height="${height}" fill="${bg}" />
  <g>${monthLabelsSvg}</g>
  <g>${dayLabelsSvg}</g>
  <g>${glowLinesSvg}</g>
  <g>${crispLinesSvg}</g>
  <g>${dimStarsSvg}</g>
  <g>${brightStarsSvg}</g>${captionSvg}
</svg>`;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  console.log(
    `[github-constellation] Fetching contributions for "${GITHUB_USER}"...`,
  );
  const result = await graphqlRequest(query, { userName: GITHUB_USER });

  if (!result.data || !result.data.user) {
    throw new Error(
      `GitHub API returned no user data for "${GITHUB_USER}". Check the username and that the token has access.`,
    );
  }

  const weeks =
    result.data.user.contributionsCollection.contributionCalendar.weeks;

  const darkSvg = buildSvg(weeks, THEMES.dark, LAYOUT);
  const lightSvg = buildSvg(weeks, THEMES.light, LAYOUT);

  const outDir = path.isAbsolute(OUTPUT_DIR)
    ? OUTPUT_DIR
    : path.join(process.cwd(), OUTPUT_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const darkPath = path.join(outDir, "constellation-dark.svg");
  const lightPath = path.join(outDir, "constellation-light.svg");

  fs.writeFileSync(darkPath, darkSvg);
  fs.writeFileSync(lightPath, lightSvg);

  console.log(`[github-constellation] Wrote ${darkPath}`);
  console.log(`[github-constellation] Wrote ${lightPath}`);

  // Expose paths for the composite action's later steps (e.g. commit step)
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `dark_svg_path=${darkPath}\nlight_svg_path=${lightPath}\n`,
    );
  }
}

main().catch((err) => {
  console.error("[github-constellation] Failed:", err.message || err);
  process.exit(1);
});
