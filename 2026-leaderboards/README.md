# 2026 Leaderboards

Static React/Vite leaderboard deployed under `/2026-leaderboards/` on GitHub Pages.

The app reads completed World Cup matches from ESPN's scoreboard endpoint, calculates manager standings, and falls back to the seeded design data when the endpoint is unavailable. Manager/team configuration lives in `src/data/teams.ts`.

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run test:ui
```
