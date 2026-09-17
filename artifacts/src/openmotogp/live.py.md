# `src/openmotogp/live.py`

## Purpose
FastAPI application serving the live MotoGP timing screen. Connects to PulseLive live timing WebSocket feeds, broadcasts normalized JSON frames to connected browser clients, and serves circuit definitions and static assets.

## Key Endpoints
- **`GET /circuit/{circuit_id}`**:
  - Looks up circuit data in `CIRCUIT_REGISTRY` by ID (e.g. `102` for Misano, `105` for Aragón).
  - Supports fallback case-insensitive matching and shortname lookups.
  - Returns complete SVG path, viewBox, racing direction (`clockwise` / `anticlockwise`), background image URL, and timing sector markers.
- **`WS /ws/telemetry`**:
  - Live WebSocket connection streaming classification, gap intervals, tyre selections, and session metadata.
- **Static Mounts**:
  - `/static` -> Serves frontend CSS and JS scripts.
  - `/circuits` -> Serves high-resolution circuit underlay SVGs (`misano.svg`, `ara2-info.svg`).
