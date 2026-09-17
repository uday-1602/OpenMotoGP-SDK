# `index.html` Context & Technical Specification

> **File Path**: [`index.html`](file:///c:/Users/uday.salathia/OneDrive%20-%20Nihilent%20Limited/Documents/practice/OpenMotoGP-SDK/index.html)  
> **Type**: Single-Page Application (HTML5 / TailwindCSS / WebGL / Vanilla JavaScript)  
> **Role**: Live MotoGP Telemetry Dashboard and WebSocket consumer

---

## 1. Overview & Purpose
`index.html` is the frontend visual dashboard for live MotoGP telemetry. It displays:
- **Floating Top Bar**: Live status indicator (pulsing dot) and event/lap metadata (`head.event_tv_name`, `head.category`).
- **Left Column**: Leaderboard table (`#leaderboard-table`) displaying real-time rider positions, race numbers, names, gaps, and tyre compound badges.
- **Center Stage**: Interactive SVG track map with real-time rider positioning dots and aerodynamic WebGL canvas background shader.
- **Circuit Header Bar**: Circuit name, LIVE session badge, and the interactive **TV SYNC Control Widget**:
  - `[ -5s ] [ -1s ] 0.0s [ +1s ] [ +5s ] [ T10 ] [ RST ]`
  - Allows adjusting broadcast streaming latency by shifting dots forward/backward in real time.
  - Quick **T10** button to snap dots directly to Turn 10.
- **Environmental Telemetry**: Track temperature and Humidity telemetry.
