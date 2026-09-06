<div align="center">

# 🌌 github-constellation

### Turn your GitHub contributions into a living night sky.

**Stars for your coding days. · Glow for your streaks. · Color for your journey.**

<img src="https://raw.githubusercontent.com/m3hrab/github-constellation/main/docs/hero-dark.svg" alt="github-constellation preview" width="850" />

<br />

[![Marketplace](https://img.shields.io/badge/GitHub%20Action-github--constellation-181717?logo=github\&logoColor=white)](https://github.com/marketplace/actions/github-constellation)
[![GitHub stars](https://img.shields.io/github/stars/m3hrab/github-constellation?style=flat\&logo=github\&color=gold)](https://github.com/m3hrab/github-constellation/stargazers)
[![Latest release](https://img.shields.io/github/v/release/m3hrab/github-constellation?style=flat)](https://github.com/m3hrab/github-constellation/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<br />

**A beautiful, zero-runtime-dependency GitHub Action that transforms your contribution calendar into a generative constellation.**

</div>

---

## ✨ What is this?

Your GitHub contribution graph tells a story — but it looks like a spreadsheet.

**github-constellation** turns that same contribution history into a visual night sky.

Every contribution day becomes a star.
More commits make the star brighter and larger.
Streaks become glowing constellation lines.
Recent activity shifts the color toward the newest end of the gradient.
Big coding days gently pulse like they're still alive.

The result is a **self-updating SVG** you can embed directly into your GitHub profile README.

> **Your contribution history, visualized as a constellation.**

---

## 🌌 How it works

```text
GitHub Contributions
        │
        ▼
   GraphQL API
        │
        ▼
┌─────────────────────┐
│ github-constellation│
│      generator      │
└──────────┬──────────┘
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

Everything is generated ahead of time.

**No client-side API calls. No JavaScript on your profile. No runtime server.**

---

## ⭐ Features

### Contribution → Visual mapping

| GitHub data       | Constellation         |
| ----------------- | --------------------- |
| Contribution day  | ⭐ Star                |
| Commit count      | 📏 Star size          |
| Contribution date | 🎨 Color              |
| Consecutive days  | 〰️ Constellation line |
| High-activity day | 💫 Pulse / twinkle    |
| No contributions  | · Background dust     |

### Built for GitHub

* 🌗 **Dark + light SVGs** generated automatically
* 🎨 **Fully customizable gradients**
* 💫 **Animated twinkle effects** for high-activity days
* 〰️ **Smooth constellation curves** connecting streaks
* 📊 **Commit-aware star sizing**
* ⚙️ **Configurable through GitHub Action inputs**
* 🔄 **Automatically regenerates every day**
* 🧵 **Zero runtime dependencies**
* 🚀 **Works directly from a GitHub repository**
* 📦 **Produces static SVG output**
* 🔐 **No external database or hosted service required**

---

## 🚀 Quick Start

### 1. Create a GitHub token

Create a **classic Personal Access Token** with no scopes:

[Create a GitHub Personal Access Token](https://github.com/settings/tokens/new?utm_source=chatgpt.com)

Then add it to your repository:

**Settings → Secrets and variables → Actions → New repository secret**

Use:

```text
Name:  CONSTELLATION_TOKEN
Value: <your token>
```

> **Why a PAT?**
>
> The workflow needs to query GitHub's GraphQL API for contribution data.
> The repository-scoped `GITHUB_TOKEN` can be restrictive when querying
> contribution information outside the current repository.

---

### 2. Add the workflow

Create:

```text
.github/
└── workflows/
    └── constellation.yml
```

Then add:

```yaml
name: Update Constellation

on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  generate:
    name: Generate constellation
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate constellation
        uses: m3hrab/github-constellation@v1
        with:
          github_user: ${{ github.repository_owner }}
          github_token: ${{ secrets.CONSTELLATION_TOKEN }}

      - name: Commit generated SVGs
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          git add dist/

          if git diff --staged --quiet; then
            echo "No constellation changes."
          else
            git commit -m "chore: update constellation"
            git push
          fi
```

---

### 3. Add it to your profile README

```markdown
<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="dist/constellation-dark.svg"
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="dist/constellation-light.svg"
  />
  <img
    alt="My GitHub contribution constellation"
    src="dist/constellation-dark.svg"
  />
</picture>
```

Then run:

**Actions → Update Constellation → Run workflow**

That's it.

Your contribution constellation will regenerate automatically.

---

## 🎨 Customize your sky

You don't have to use the defaults.

For example:

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

### Available inputs

| Input                 | Required |   Default | Description                                 |
| --------------------- | :------: | --------: | ------------------------------------------- |
| `github_user`         |     ✅    |         — | GitHub username to visualize                |
| `github_token`        |     ✅    |         — | GitHub GraphQL API token                    |
| `commit_cap`          |     ❌    |      `20` | Maximum commit count used for star scaling  |
| `twinkle_min_commits` |     ❌    |      `10` | Minimum commits required for a pulsing star |
| `recent_color_dark`   |     ❌    | `#ffcf5c` | Recent-date gradient color for dark mode    |
| `old_color_dark`      |     ❌    | `#7c6fe0` | Old-date gradient color for dark mode       |
| `recent_color_light`  |     ❌    | `#c9820a` | Recent-date gradient color for light mode   |
| `old_color_light`     |     ❌    | `#463c94` | Old-date gradient color for light mode      |
| `output_dir`          |     ❌    |    `dist` | Generated SVG output directory              |
| `layout`              |     ❌    |    `full` | `full` or `minimal`                         |

### Layouts

**`full`**

Includes labels and the statistics caption.

**`minimal`**

Just the constellation — ideal for compact profile layouts.

---

## 🖼️ Gallery

### Dark sky

<img src="https://raw.githubusercontent.com/m3hrab/github-constellation/main/docs/hero-dark.svg" alt="Dark github-constellation example" width="850" />

### Light sky

<img src="https://raw.githubusercontent.com/m3hrab/github-constellation/main/docs/hero-light.svg" alt="Light github-constellation example" width="850" />

> Have a particularly beautiful constellation?
> Open a PR and add it to the gallery.

---

## 🧠 Design philosophy

github-constellation intentionally keeps the visualization simple.

It doesn't try to turn your GitHub history into a dashboard full of charts.

Instead, it answers one question:

> **What would my coding year look like if it were a night sky?**

That means every visual element has a purpose:

**Stars** represent consistency.
**Size** represents effort.
**Color** represents time.
**Lines** represent momentum.
**Glow** represents exceptional days.

The goal isn't more data.

**It's a more memorable way to see the data you already have.**

---

## ⚡ Performance & architecture

github-constellation is deliberately lightweight.

The generator uses only Node.js built-ins:

```text
fs
path
https
```

There are:

* ❌ No npm dependencies
* ❌ No database
* ❌ No hosted backend
* ❌ No client-side API requests
* ❌ No external runtime service

The workflow generates static SVG files and commits them to your repository.

Your profile simply displays those files.

```text
GitHub Actions
      │
      ▼
Generate SVG
      │
      ▼
Commit to repo
      │
      ▼
GitHub README
      │
      ▼
       ⭐
```

---

## 🔐 Security

The action only needs access to GitHub's GraphQL API to retrieve contribution information.

Your token should be stored as a **GitHub Actions secret**:

```text
CONSTELLATION_TOKEN
```

Never hard-code your token into:

* workflow files
* source code
* README files
* commits
* issues
* pull requests

For public contribution data, use the minimum permissions necessary.

---

## ❓ FAQ

### Does it support private contributions?

Yes, subject to what GitHub exposes through your authenticated contribution
data and your profile's private-contribution settings.

### Can I generate a constellation for another GitHub user?

The action accepts any `github_user` value for which the supplied token can
retrieve the required contribution data.

However, the project is primarily designed for representing **your own
GitHub profile**.

### Why not use `GITHUB_TOKEN`?

The built-in token is scoped to the repository running the workflow and may
not provide the access needed for contribution queries in every setup.

A classic PAT provides a more predictable authentication path for the
GraphQL request.

### Does the SVG require a server?

No.

The SVG is generated once and stored in your repository as a static file.

### Does the animation work on GitHub?

The generated SVG contains the animation itself, so the README only needs
to reference the resulting SVG.

### Can I run the generator locally?

Yes.

The generator is a regular Node.js script:

```bash
node src/generate-constellation.js
```

See [CONTRIBUTING.md](CONTRIBUTING.md#testing-locally) for development and
testing instructions.

---

## 🛠️ Development

Clone the repository:

```bash
git clone https://github.com/m3hrab/github-constellation.git
cd github-constellation
```

Run the generator:

```bash
node src/generate-constellation.js
```

Generated files will appear in:

```text
dist/
├── constellation-dark.svg
└── constellation-light.svg
```

---

## 🤝 Contributing

Ideas, bug reports, improvements, visual experiments, and gallery
submissions are welcome.

Before opening a pull request, please read:

* [CONTRIBUTING.md](CONTRIBUTING.md)
* [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

If you build something interesting with github-constellation, I'd love to
see it.

---

## 📄 License

Released under the **MIT License**.

See [LICENSE](LICENSE) for details.

---

## ⭐ Star History

<a href="https://star-history.com/m3hrab/github-constellation&Date">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://api.star-history.com/svg?repos=m3hrab/github-constellation&type=Date&theme=dark"
    />
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://api.star-history.com/svg?repos=m3hrab/github-constellation&type=Date"
    />
    <img
      alt="Star History Chart"
      src="https://api.star-history.com/svg?repos=m3hrab/github-constellation&type=Date"
      width="700"
    />
  </picture>
</a>

---

<div align="center">

### 🌌 Your commits are more than green squares.

**They're a story. Turn it into a constellation.**

<br />

Made with ⭐ by [m3hrab](https://github.com/m3hrab)

</div>
