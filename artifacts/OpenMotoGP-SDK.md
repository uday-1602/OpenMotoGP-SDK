# OpenMotoGP-SDK — Complete System Context & Developer Guide

> **Role**: MotoGP Telemetry Specialist & Top-Tier Software Developer  
> **Repository Root**: `OpenMotoGP-SDK/`  
> **Purpose**: Standalone, machine-portable context documentation.

---

## 1. Directory Structure

```
OpenMotoGP-SDK/
├── artifacts/                           # Documentation mirror for portable context
│   ├── README.md                        # Artifacts index
│   ├── index.html.md                    # Frontend UI & WebSocket client doc
│   ├── pyproject.toml.md                # Build system & dependency group doc
│   ├── requirements.txt.md              # Flat pip requirements doc
│   ├── README.md.md                     # Base project README context
│   ├── .gitignore.md                    # Git ignore rule doc
│   ├── OpenMotoGP-SDK.md                # Full system architecture guide (this file)
│   └── src/
│       └── openmotogp/
│           ├── __init__.py.md           # Package initialization & exports doc
│           ├── client.py.md             # Low-level async MotoGP REST client doc
│           ├── core.py.md               # High-level synchronous & async wrapper doc
│           ├── live.py.md               # FastAPI WebSocket live telemetry gateway doc
│           ├── main.py.md               # CLI demo execution script doc
│           └── models.py.md             # Pydantic data schemas doc
├── index.html                           # Live dashboard frontend (WebSocket consumer)
├── pyproject.toml                       # Package build & dependency metadata
├── requirements.txt                     # Flat dependency manifest
├── README.md                            # Project overview
├── .gitignore                           # Git ignore rules
└── src/
    └── openmotogp/
        ├── __init__.py                  # Module exports
        ├── client.py                    # PulseLive API HTTP client (httpx)
        ├── core.py                      # Pandas data engine & name-resolver
        ├── live.py                      # FastAPI + WebSocket live relay server
        ├── main.py                      # CLI test script
        └── models.py                    # Pydantic v2 schemas
```

---

## 2. End-to-End System Architecture

```
┌────────────────────────────────────────────────────────┐
│ https://api.motogp.pulselive.com/motogp/v1/            │
│ timing-gateway/livetiming-lite                         │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP GET (Async poll every 1.5s via httpx)
                            ▼
               ┌────────────────────────┐
               │   live.py (FastAPI)    │
               │  TelemetryBroadcaster  │
               └────────────┬───────────┘
                            │ WebSocket Broadcast (JSON)
                            ▼
              ┌──────────────────────────┐
              │  Browser (index.html)    │
              │ ws://127.0.0.1:8000/ws/… │
              └──────────────────────────┘
```

---

## 3. Key Components & Responsibilities

### Frontend (`index.html`)
- Connects to `ws://127.0.0.1:8000/ws/telemetry`.
- Parses incoming telemetry and normalizes schemas using `extractEntries()`.
- Updates `#leaderboard-table tbody` dynamically (POS, #, RIDER, GAP, TYRES).
- Manages auto-reconnect backoff (3s) and updates the visual status dot (🟡 connecting, 🟢 live, 🔴 disconnected).
- Renders WebGL background shader (aerodynamic airflow in MotoGP Red `#e50014`).

### Backend Relay (`src/openmotogp/live.py`)
- FastAPI application running with Uvicorn.
- Background task `fetch_live_timing()` polls PulseLive gateway every 1.5s when clients are connected.
- Manages client connection registry via `TelemetryBroadcaster`.
- Serves WebSocket stream at `/ws/telemetry`.

### SDK Core (`src/openmotogp/client.py` & `src/openmotogp/core.py`)
- `client.py`: Async client wrapping REST endpoints (`/results/seasons`, `/results/events`, `/results/categories`, `/results/sessions`, `/results/session/{id}/classification`).
- `core.py`: Synchronous and async user-facing `OpenMotoGP` class. Implements name-to-UUID resolution and returns formatted `pandas.DataFrame` tables.

### Data Models (`src/openmotogp/models.py`)
- Pydantic v2 domain schemas (`Country`, `Circuit`, `Season`, `Event`, `Category`, `SessionSummary`, `RiderInfo`, `ClassificationEntry`).

---

## 4. How to Run

```powershell
# 1. Activate venv
venv\Scripts\activate

# 2. Run live telemetry gateway
python -m uvicorn src.openmotogp.live:app --host 127.0.0.1 --port 8000 --reload

# 3. Run historical CLI demo
python src/openmotogp/main.py

# 4. Open frontend
# Open index.html in any browser
```
