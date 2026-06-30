# 2026 Leaderboards

Static React/Vite leaderboard deployed under `/2026-leaderboards/` on GitHub Pages.

The app reads completed World Cup matches directly from ESPN's scoreboard endpoint and calculates manager standings in browser memory. It does not persist results or show fallback scores; an ESPN failure produces an explicit unavailable state. Only the manager/team assignments live in `src/data/teams.ts`.

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run test:ui
```
