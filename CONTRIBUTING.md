# Contributing to github-constellation

Thanks for considering a contribution — this project gets better through
other people's night skies. 🌌

## Ways to contribute

- **Bug reports** — something rendered wrong, an input didn't behave as
  documented, the workflow failed.
- **Feature requests** — a new visual variant, a new tunable, a new theme.
- **Pull requests** — bug fixes, new features, docs improvements.
- **Gallery submissions** — if you use this on your profile README, open a PR
  adding a screenshot to the gallery section of the README. Seeing real
  night skies is half the fun.

## Opening an issue

- Search existing issues first to avoid duplicates.
- Use the **Bug report** or **Feature request** templates — they ask for the
  specific details (inputs used, expected vs. actual output) that make a fix
  fast.
- For rendering bugs, attach the generated SVG (or a screenshot) plus the
  `with:` block from your workflow.

## Opening a pull request

1. Fork the repo and create a branch from `main`.
2. Make your change. Keep the diff focused — separate refactors from feature
   changes where possible.
3. Test locally (see below) and make sure both the dark and light SVGs still
   generate without errors.
4. Update `README.md`'s inputs table if you added or changed an `action.yml`
   input.
5. Open the PR against `main` and fill in the PR template.

## Testing locally

The generator is a single dependency-free Node script — no `npm install`
required.

```bash
# Clone your fork
git clone https://github.com/<you>/github-constellation.git
cd github-constellation

# A classic PAT with no scopes is enough to read a public contribution
# calendar: https://github.com/settings/tokens
export GITHUB_TOKEN=ghp_yourtoken
export GITHUB_USER=octocat

node src/generate-constellation.js

# Output:
#   dist/constellation-dark.svg
#   dist/constellation-light.svg
open dist/constellation-dark.svg   # or just open the file in a browser
```

To test a specific input combination, set the matching env var before
running, e.g.:

```bash
COMMIT_CAP=10 TWINKLE_MIN_COMMITS=5 LAYOUT=minimal node src/generate-constellation.js
```

The env var names match the `action.yml` input names (uppercased) — see the
inputs table in `README.md` or the comment block at the top of
`src/generate-constellation.js` for the full list.

### Testing the composite action itself

The most reliable way to test `action.yml` changes end-to-end is to push a
branch and reference it from a scratch workflow/repo:

```yaml
- uses: <you>/github-constellation@your-branch-name
  with:
    github_user: octocat
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### About the self-showcase workflow

`.github/workflows/self-showcase.yml` is maintainer-only tooling — it runs
this repo's own action against the maintainer's real GitHub profile and
commits the result into `docs/`, which is what makes the hero image in
`README.md` a genuinely live render instead of a static placeholder. It
needs a `SHOWCASE_TOKEN` repository secret to run. Contributors don't need
this secret and can ignore this workflow entirely — it won't run on PRs
from forks.

## Branch naming

```
<type>/<short-description>
```

| Type        | Use for            | Example                         |
| ----------- | ------------------ | ------------------------------- |
| `feat/`     | new feature        | `feat/minimal-layout-option`    |
| `fix/`      | bug fix            | `fix/light-theme-color-parsing` |
| `docs/`     | docs only          | `docs/inputs-table-typo`        |
| `chore/`    | tooling, CI, deps  | `chore/bump-setup-node-v5`      |
| `refactor/` | no behavior change | `refactor/extract-svg-builder`  |

Lowercase, hyphens (not underscores), 2–5 words. Issue numbers go in the PR
description, not the branch name.

## Commit messages

This repo follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary, imperative mood, no trailing period>

<optional body — explain why, not what>

<optional footer, e.g. "Closes #14">
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`
**Scopes:** `generator`, `action`, `readme`, `workflows`, `templates`

```
feat(generator): add minimal layout mode

Strips month/day labels and stats caption for tighter embeds where
the full chrome doesn't fit.

Closes #14
```

Individual commits within a PR don't need to be perfect — they get
squashed — but the **PR title** must follow this format exactly; a CI
check enforces it (see below).

## Pull requests and merging

- PRs are **squash-merged only** — the PR title becomes the permanent
  commit message on `main`, so title it the same way you'd title a commit
  (see above). A CI check will block the merge if it doesn't match.
- Fill in the PR template's checklist honestly — it exists so a reviewer
  (including future-you) doesn't have to guess whether the generator was
  actually tested.
- Any change to `action.yml`, `src/generate-constellation.js`, or anything
  in `.github/workflows/` requires a PR, even for maintainers — no direct
  pushes to `main` for these paths, since a bad change here affects
  everyone's workflow runs, not just this repo.

## Style

- No new runtime dependencies for the generator — it should stay a plain
  Node script runnable with zero `npm install`. If a feature genuinely needs
  a dependency, discuss it in an issue first.
- Match the existing code style (the file has no linter config on purpose —
  just keep it readable).

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind.
