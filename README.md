# 🌱 Git Flowers — Commit Garden

[![Live demo](https://img.shields.io/badge/demo-live-6b46c1)](https://malenitaa.github.io/git-flowers/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Turns a GitHub user's real commit history into a **pixel garden that
grows over time**. Each week of the year becomes a plot with a plant
whose stage — seed, sprout, stem, flower — depends on that week's real
activity, and long streaks make plants bloom even on lighter weeks.

## Try it

### 👉 [malenitaa.github.io/git-flowers](https://malenitaa.github.io/git-flowers/?user=torvalds)

Type any public GitHub username, or add `?user=someone` to the URL to
share a specific one.

## FAQ

**Does it need my GitHub login?**
No, it only reads public commit history — no account, no token.

**Does it store any of my data?**
No. It caches the response in your own browser for a short while so
switching years or refreshing doesn't re-fetch, and nothing else.

**Is it free?**
Yes, no ads, no hidden cost.

## Host your own copy

No coding required — see [`INSTALL.md`](./INSTALL.md) for a
step-by-step, no-terminal guide (fork it and turn on GitHub Pages, free).

## For developers

No build step — any static server works:

```bash
git clone https://github.com/malenitaa/git-flowers.git
cd git-flowers
python3 -m http.server 8000
```

Open `http://localhost:8000?user=YOUR_USERNAME`.

## Enjoyed it?

If this was useful and you'd like to support the project:

- [Cafecito](https://cafecito.app/rezamalena)
- [Ko-fi](https://ko-fi.com/malenitaa)

## License

MIT — see [LICENSE](LICENSE).
