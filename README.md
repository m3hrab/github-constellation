<div align="center">

# 🌌 github-constellation

### Turn your GitHub contributions into a living night sky.

**Stars for your coding days · Glow for your streaks · Color for your journey**

<img src="https://raw.githubusercontent.com/m3hrab/github-constellation/main/docs/constellation-dark.svg" alt="github-constellation live preview — the maintainer's real contribution history" width="850" />

<sub>↑ This is a real render of the maintainer's own contributions, refreshed daily by <a href=".github/workflows/self-showcase.yml">this repo's own Action</a> — not a mockup.</sub>

<br /><br />

[![Marketplace](https://img.shields.io/badge/GitHub%20Action-github--constellation-181717?logo=github&logoColor=white)](https://github.com/marketplace/actions/github-constellation)
[![GitHub stars](https://img.shields.io/github/stars/m3hrab/github-constellation?style=flat&logo=github&color=gold)](https://github.com/m3hrab/github-constellation/stargazers)
[![Latest release](https://img.shields.io/github/v/release/m3hrab/github-constellation)](https://github.com/m3hrab/github-constellation/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**A zero-runtime-dependency GitHub Action that transforms your contribution
calendar into a generative constellation.**

</div>

---

### Contents

[What is this](#-what-is-this) · [How it works](#-how-it-works) ·
[Features](#-features) · [Quick Start](#-quick-start) ·
[Customize](#-customize-your-sky) · [Inputs](#-inputs) ·
[Gallery](#️-gallery) · [Design philosophy](#-design-philosophy) ·
[Architecture](#-performance--architecture) · [Security](#-security) ·
[FAQ](#-faq) · [Contributing](#-contributing) · [License](#-license)

---

## ✨ What is this?

Your GitHub contribution graph tells a story — but it looks like a
spreadsheet.

**github-constellation** turns that same contribution history into a night
sky. Every contribution day becomes a star. More commits make it brighter
and larger. Streaks become glowing constellation lines. Recent activity
shifts the color toward the newest end of the gradient. Your biggest days
gently pulse, like they're still alive.

The result is a **self-updating SVG** you embed directly in your GitHub
profile README.

> Your contribution history, visualized as a constellation.

## 🌠 How it works

```text
GitHub Contributions
        │
        ▼
   GraphQL API
        │
        ▼
┌──────────────────────┐
│ github-constellation  │
│      generator        │
└──────────┬────────────┘
           │
           ├── ⭐ Contribution days → Stars
           ├── 📏 Commit count      → Size
           ├── 🎨 Date              → Color
           ├── 〰️ Streaks           → Connections
           └── 💫 Big days          → Pulse
           │
           ▼
    Static SVG files
      │          │
      ▼          ▼
    Dark       Light
      │          │
      └────┬─────┘
           ▼
      GitHub README
```

Everything is generated ahead of time. **No client-side API calls, no
JavaScript on your profile, no runtime server** — just two static SVGs that
happen to have a CSS twinkle animation baked in.

## ⭐ Features

### Contribution → visual mapping

| GitHub data       | Constellation         |
| ----------------- | --------------------- |
| Contribution day  | ⭐ Star               |
| Commit count      | 📏 Star size          |
| Contribution date | 🎨 Color              |
| Consecutive days  | 〰️ Constellation line |
| High-activity day | 💫 Pulse / twinkle    |
| No contributions  | · Dim background dust |

### Built for GitHub

- 🌗 Dark **and** light SVGs, generated together
- 🎨 Fully customizable gradient colors for both themes
- 💫 Animated twinkle + breathing halo on standout days
- 〰️ Smooth Catmull-Rom curves connecting streaks, not straight connectors
- 📊 Commit-aware, capped star sizing (one huge day won't flatten the rest)
- ⚙️ Every tunable exposed as an action input
- 🔄 Regenerates on whatever schedule you set
- 🧵 **Zero runtime dependencies** — one Node script using only `fs`,
  `path`, and `https`
- 📦 Produces plain static SVG output
- 🔐 No external database, no hosted service, nothing to trust but your
  own repo

## 🚀 Quick Start

Three steps: add a token secret, add a workflow, push.

**1. Create a token.**
Generate a [classic Personal Access Token](https://github.com/settings/tokens/new)
— no scopes needed, since it only reads public contribution data — and add
it to your repository as a secret:

```text
Settings → Secrets and variables → Actions → New repository secret
Name:  CONSTELLATION_TOKEN
Value: <your token>
```

> **Why a PAT instead of the built-in `GITHUB_TOKEN`?** The built-in token
> is scoped narrowly to the repo running the workflow and isn't reliably
> able to query another user's GraphQL contribution data across every
> GitHub setup. A plain classic PAT sidesteps that entirely. See the
> [FAQ](#-faq) for more.

**2. Add the workflow.**
Create `.github/workflows/constellation.yml`:

```yaml
name: Update Constellation

on:
  schedule:
    - cron: "0 0 * * *" # once a day; tweak to taste
  workflow_dispatch: {}

permissions:
  contents: write

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate constellation
        uses: m3hrab/github-constellation@v1
        with:
          github_user: ${{ github.repository_owner }}
          github_token: ${{ secrets.CONSTELLATION_TOKEN }}

      - name: Commit and push if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add dist/
          git diff --staged --quiet || git commit -m "chore: update constellation"
          git push
```

**3. Embed it in your profile README.**

```markdown
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="dist/constellation-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="dist/constellation-light.svg">
  <img alt="My GitHub contribution constellation" src="dist/constellation-dark.svg">
</picture>
```

Trigger it once via **Actions → Update Constellation → Run workflow**, and
you're done — it stays current on the schedule from here on.

## 🎨 Customize your sky

You don't have to use the defaults:

```yaml
- name: Generate constellation
  uses: m3hrab/github-constellation@v1
  with:
    github_user: ${{ github.repository_owner }}
    github_token: ${{ secrets.CONSTELLATION_TOKEN }}
    commit_cap: 25
    twinkle_min_commits: 12
    recent_color_dark: "#ffd166"
    old_color_dark: "#6c63ff"
    recent_color_light: "#b86b00"
    old_color_light: "#4338ca"
    layout: "full"
```

## 🔧 Inputs

| Input                 | Required | Default   | Description                                                                             |
| --------------------- | :------: | --------- | --------------------------------------------------------------------------------------- |
| `github_user`         |    ✅    | —         | GitHub username whose contribution calendar to render.                                  |
| `github_token`        |    ✅    | —         | Token with read access to the GitHub GraphQL API. See Quick Start above.                |
| `commit_cap`          |    ❌    | `20`      | Commit count at which star size/opacity growth is capped.                               |
| `twinkle_min_commits` |    ❌    | `10`      | Minimum commits in a day required for that day's star to twinkle and pulse.             |
| `recent_color_dark`   |    ❌    | `#ffcf5c` | Hex color for the most-recent end of the gradient, dark theme.                          |
| `old_color_dark`      |    ❌    | `#7c6fe0` | Hex color for the oldest end of the gradient, dark theme.                               |
| `recent_color_light`  |    ❌    | `#c9820a` | Hex color for the most-recent end of the gradient, light theme.                         |
| `old_color_light`     |    ❌    | `#463c94` | Hex color for the oldest end of the gradient, light theme.                              |
| `output_dir`          |    ❌    | `dist`    | Directory the generated SVGs are written to.                                            |
| `layout`              |    ❌    | `full`    | `full` (month/weekday labels + stats caption) or `minimal` (bare star grid, no chrome). |

**Outputs:** `dark_svg_path` and `light_svg_path` — absolute paths to the
two generated files, for later steps in your workflow to reference.

### Layouts

**`full`** — includes month/weekday labels and the stats caption (total
contributions, longest streak, current streak, busiest month).

**`minimal`** — just the constellation, no chrome. Good for tight embeds
next to an avatar or in a compact profile layout.

## 🖼️ Gallery

Both themes below are the maintainer's real sky, live — see
[How it works](#-how-it-works) and the workflow linked under the hero image
at the top of this README.

<table>
<tr><td align="center"><b>Dark</b></td></tr>
<tr><td><img src="https://raw.githubusercontent.com/m3hrab/github-constellation/main/docs/constellation-dark.svg" alt="Dark theme constellation" width="820" /></td></tr>
<tr><td align="center"><b>Light</b></td></tr>
<tr><td><img src="https://raw.githubusercontent.com/m3hrab/github-constellation/main/docs/constellation-light.svg" alt="Light theme constellation" width="820" /></td></tr>
</table>

> Using github-constellation on your own profile? Open a PR adding a
> screenshot to this section — real skies are the best advertisement this
> project has.

## 🧠 Design philosophy

github-constellation intentionally keeps the visualization simple. It
doesn't try to turn your GitHub history into a dashboard full of charts —
it answers one question:

> **What would my coding year look like if it were a night sky?**

Every visual element has exactly one job: **stars** represent consistency,
**size** represents effort, **color** represents time, **lines** represent
momentum, **glow** represents exceptional days. The goal isn't more data —
it's a more memorable way to see the data you already have.

## ⚡ Performance & architecture

The generator uses only Node.js built-ins — `fs`, `path`, `https`. There's:

- ❌ No npm dependencies
- ❌ No database
- ❌ No hosted backend
- ❌ No client-side API requests at view-time
- ❌ Nothing running except a CSS animation already baked into the SVG

```text
GitHub Actions → Generate SVG → Commit to repo → GitHub README → ⭐
```

The workflow generates static files and commits them. Your profile just
displays those files — there's nothing to keep running, scale, or pay for.

## 🔐 Security

The action only needs read access to GitHub's GraphQL API to fetch
contribution data. Store your token as a repository secret
(`CONSTELLATION_TOKEN`) — never hard-code it into workflow files, source
code, commits, issues, or pull requests. A classic PAT with no scopes is
sufficient for public contribution data; don't grant it more than that.

## ❓ FAQ

**Does this work with private contributions?**
Yes. The GraphQL `contributionsCollection` query returns the same data
shown on your public profile — including private contributions, if you've
enabled _Include private contributions_ in your GitHub profile settings —
using whatever token you supply.

**Can I generate a constellation for someone else's profile, or an org's?**
The action accepts any `github_user` your token can read contribution data
for, but this is built for representing **your own** profile — only render
a sky for an account you have permission to represent.

**Why a PAT instead of the built-in `GITHUB_TOKEN`?**
The built-in token is scoped to the repo running the workflow and isn't
reliably able to query GraphQL contribution data for arbitrary accounts
across every GitHub setup (personal, organization, Enterprise). A classic
PAT provides a predictable authentication path for that request.

**Does the SVG require a server?**
No. It's generated once per scheduled run and stored as a static file. Your
README just references it.

**Does the animation actually work on GitHub?**
Yes — the twinkle and glow are CSS animations baked directly into the SVG
markup, so they play wherever the SVG itself renders, no extra script
needed.

**Can I run the generator locally, outside GitHub Actions?**
Yes — `src/generate-constellation.js` is a plain, dependency-free Node
script:

```bash
GITHUB_TOKEN=xxx GITHUB_USER=octocat node src/generate-constellation.js
```

See [CONTRIBUTING.md](CONTRIBUTING.md#testing-locally) for the full local
development workflow.

## 🤝 Contributing

Bug reports, feature ideas, and gallery submissions are all welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, commit conventions,
and how to test locally. Please be excellent to each other; see the
[Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

Released under the [MIT License](LICENSE) — do whatever you want with it.

## ⭐ Star History

<a href="https://star-history.com/#m3hrab/github-constellation&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=m3hrab/github-constellation&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=m3hrab/github-constellation&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=m3hrab/github-constellation&type=Date" width="700" />
  </picture>
</a>

---

<div align="center">

### Your commits are more than green squares. They're a story.

Made with ⭐ by [m3hrab](https://github.com/m3hrab)

</div>
