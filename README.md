<div align="center">

# 🌌 github-constellation

**Turn your GitHub contribution history into a living night sky.**

Every day you code becomes a star. Streaks become glowing constellation
lines. Your biggest days pulse like they know it.

<img src="https://raw.githubusercontent.com/m3hrab/github-constellation/main/docs/hero-dark.svg" alt="github-constellation hero example" width="850" />

<sub>↑ Replace this with your own generated SVG — see <a href="#-quick-start">Quick Start</a> below.</sub>

<br /><br />

[![Marketplace](https://img.shields.io/badge/Marketplace-github--constellation-blue?logo=github)](https://github.com/marketplace/actions/github-constellation)
[![GitHub stars](https://img.shields.io/github/stars/your-username/github-constellation?style=flat&logo=github&color=gold)](https://github.com/your-username/github-constellation/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Latest release](https://img.shields.io/github/v/release/your-username/github-constellation)](https://github.com/your-username/github-constellation/releases)

</div>

---

## Why

GitHub's contribution graph is a grid of green squares. It's information —
but it isn't _beautiful_, and it doesn't tell you anything a spreadsheet
couldn't. **github-constellation** renders the exact same data as a
generative sky: stars for days, size for effort, color for time, and soft
glowing threads for the streaks that held your year together. Drop it in
your profile README and it becomes the thing people actually look at.

## ✨ Features

- **⭐ Stars = days.** Every contribution day is a star; empty days stay
  dim background dust.
- **📏 Size = commit count.** Bigger day, bigger star — scaled and capped so
  one huge day never flattens the rest of the sky.
- **🎨 Color = recency.** A gradient sweeps across your _entire year_, oldest
  to newest, so the color alone tells you when things happened.
- **〰️ Streaks = glowing curves.** Consecutive contribution days are
  connected with soft, blurred, smoothly-curved constellation lines — not
  spreadsheet connectors.
- **💫 Pulse on big days.** Days above a commit threshold twinkle and
  breathe with a slow independent glow halo.
- **🌗 Dark + light variants,** generated together, both fully recolorable.
- **🧵 Zero runtime dependencies.** The generator is one Node script using
  only `fs`, `path`, and `https` — no `npm install`, no supply chain to
  audit.
- **⚙️ Fully tunable** via action inputs: commit cap, twinkle threshold, all
  four gradient colors, output directory, layout.

## 🚀 Quick Start

Three steps: add a workflow file, add a token secret, push.

**1. Create a [classic Personal Access Token](https://github.com/settings/tokens/new)** —
no scopes needed, since it's only reading public contribution data — and add
it to your profile repository as a secret named `CONSTELLATION_TOKEN`
(_Settings → Secrets and variables → Actions → New repository secret_).

> Why not the default `GITHUB_TOKEN`? It's scoped to the current repo and
> isn't reliably able to query another user's GraphQL contribution data
> across all GitHub setups. A plain PAT avoids that entirely — see the
> [FAQ](#-faq).

**2. Add this workflow** at `.github/workflows/constellation.yml`:

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

      - uses: your-username/github-constellation@v1
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

**3. Embed it in your profile README:**

```markdown
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="dist/constellation-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="dist/constellation-light.svg">
  <img alt="My GitHub constellation" src="dist/constellation-dark.svg">
</picture>
```

Run the workflow once via **Actions → Update Constellation → Run workflow**,
and you're done. It'll keep itself up to date on the schedule from here on.

## 🔧 Inputs

| Input                 | Required | Default   | Description                                                               |
| --------------------- | :------: | --------- | ------------------------------------------------------------------------- |
| `github_user`         |    ✅    | —         | GitHub username whose contribution calendar to render.                    |
| `github_token`        |    ✅    | —         | Token with read access to the GitHub GraphQL API. See Quick Start above.  |
| `commit_cap`          |    ❌    | `20`      | Commit count at which star size/opacity growth is capped.                 |
| `twinkle_min_commits` |    ❌    | `10`      | Minimum commits/day required for that day's star to twinkle and pulse.    |
| `recent_color_dark`   |    ❌    | `#ffcf5c` | Hex color for the most-recent end of the gradient, dark theme.            |
| `old_color_dark`      |    ❌    | `#7c6fe0` | Hex color for the oldest end of the gradient, dark theme.                 |
| `recent_color_light`  |    ❌    | `#c9820a` | Hex color for the most-recent end of the gradient, light theme.           |
| `old_color_light`     |    ❌    | `#463c94` | Hex color for the oldest end of the gradient, light theme.                |
| `output_dir`          |    ❌    | `dist`    | Directory the generated SVGs are written to.                              |
| `layout`              |    ❌    | `full`    | `full` (labels + stats caption) or `minimal` (bare star grid, no chrome). |

**Outputs:** `dark_svg_path`, `light_svg_path` — absolute paths to the two
generated files, in case a later step in your workflow needs them.

## 🖼️ Gallery

> Using github-constellation on your profile? Open a PR adding your
> screenshot here — real skies are the best advertisement.

|                 |                 |                 |
| --------------- | --------------- | --------------- |
| _your sky here_ | _your sky here_ | _your sky here_ |

## ❓ FAQ

**Does this work for private contributions?**
Yes — the GraphQL `contributionsCollection` query returns the same data
shown on your public profile, including the "private contributions" count if
you've enabled _Include private contributions_ in your GitHub profile
settings, using whatever token you supply.

**Can I use this on someone else's profile, or an org?**
The action will render whatever `github_user` you give it, but you should
only render a sky for accounts you have permission to represent — this is
meant for your own profile README.

**Why does it need a Personal Access Token instead of the built-in
`GITHUB_TOKEN`?**
The built-in token is scoped narrowly to the repo running the workflow. A
classic PAT with no scopes reliably authenticates the GraphQL query for any
public contribution calendar and avoids permission edge cases across
personal, org, and Enterprise setups.

**Can I change the colors?**
Yes — all four gradient endpoints (`recent_color_dark`, `old_color_dark`,
`recent_color_light`, `old_color_light`) are inputs. See the table above.

**Will this slow down my profile page?**
No — the SVG is generated once per scheduled run and committed as a static
file. Your README just references a file in your repo; nothing runs
client-side except the CSS twinkle animation already baked into the SVG.

**Can I run this outside GitHub Actions?**
Yes — `src/generate-constellation.js` is a plain Node script. See
[CONTRIBUTING.md](CONTRIBUTING.md#testing-locally) for local usage.

## 🤝 Contributing

Bug reports, feature ideas, and gallery submissions are all welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md). Please be excellent to each other; see
the [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

[MIT](LICENSE) — do whatever you want with it.

## ⭐ Star History

<a href="https://star-history.com/#your-username/github-constellation&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=your-username/github-constellation&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=your-username/github-constellation&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=your-username/github-constellation&type=Date" width="700" />
  </picture>
</a>
