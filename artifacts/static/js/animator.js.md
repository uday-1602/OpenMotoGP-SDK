# `static/js/animator.js`

## Purpose
60fps SVG rider dot animation engine incorporating dead-reckoning, true radius of curvature (`V ∝ √R`), reload persistence, and sub-second live telemetry synchronization.

## Key Features & Reload Fixes
- **Reload State Persistence (`sessionStorage`)**:
  - Automatically restores `leaderPhase` and timestamps from `sessionStorage` upon browser refresh.
  - Accounts for elapsed reload time (`Date.now() - savedTs`) so riders NEVER snap back to the start/finish line on page reload.
  - Periodically checkpoints phase state every 400ms.
- **Real-Time Telemetry Synchronization (`syncLiveState`)**:
  - Synchronizes with backend `live_sync` payload broadcasting the leader's actual lap completion timestamp and calculated track phase.
  - Dynamically updates lap duration from `leader_lap_sec` (~91s at Misano instead of hardcoded 107s).
  - Uses subtle drift correction to gently steer riders to the exact real-world timing position without visible teleports.
- **TV Broadcast Sync Delay Offset**:
  - Supports configurable broadcast delay (`± Sync`) to match live TV / OTT stream latency (e.g. 5–20s streaming lag).
  - Interactive UI buttons (`-5s`, `-1s`, `+1s`, `+5s`, `RST`) persisted across sessions in `localStorage`.
- **Direction & Physics**:
  - Traverses the track clockwise or anticlockwise based on circuit configuration.
  - 600-sample Look-Ahead Radius of Curvature LUT (`V ∝ √R`) with acceleration/braking passes.
