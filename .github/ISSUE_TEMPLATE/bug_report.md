---
name: Bug report
about: Something didn't render or behave the way it should
title: "[Bug] "
labels: bug
assignees: ""
---

**What happened?**
A clear description of the bug.

**What did you expect?**
What you expected to see instead.

**Workflow config**
The `with:` block you used, with the token secret name (not the value):

```yaml
uses: your-username/github-constellation@v1
with:
  github_user: ""
  github_token: ${{ secrets.CONSTELLATION_TOKEN }}
  # ...any other inputs you set
```

**Output**
If applicable, attach the generated SVG, a screenshot, or the failing
workflow run's logs/URL.

**Environment**
- Action version/tag used: `@v1` / `@v1.2.3` / commit SHA
- Running via GitHub-hosted runner or self-hosted?

**Additional context**
Anything else that might help track this down.
