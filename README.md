# 🏁 OpenMotoGP-SDK

> **Next-generation Python SDK, live telemetry streaming engine, and spatial race dashboard for official MotoGP™ data.**

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MotoGP](https://img.shields.io/badge/MotoGP-2026%20Season-E50014.svg)](https://www.motogp.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Overview

**OpenMotoGP-SDK** is a high-performance Python toolkit and real-time visualization platform built for motorsport enthusiasts, telemetry engineers, and sim developers. It connects directly to live MotoGP™ timing gateways, normalizes complex timing packets into clean data structures, and powers a spatial 60fps live timing radar dashboard.

```
┌─────────────────────────────────┐
│     MotoGP™ Timing Gateway      │
│  (api.motogp.pulselive.com)     │
└────────────────┬────────────────┘
                 │ HTTP polling (every 1.5s)
                 ▼
┌────────────────────────────────────────────────────────┐
│               FastAPI Streaming Backend                │
│  • LapTracker: real-time lap phase & clock tracking    │
│  • Dynamic Circuit Registry (Misano #102, Aragón #105) │
│  • WebSocket Broadcaster (/ws/telemetry)               │
└────────────────┬───────────────────────────────────────┘
                 │ WebSocket JSON stream
                 ▼
┌────────────────────────────────────────────────────────┐
│            Spatial Frontend (index.html)               │
│  • 60fps Curvature Physics Engine (animator.js)        │
│  • Sub-Second Real-Time Live Sync & Reload Persistence │
│  • Broadcast Delay Calibrator (TV SYNC: ±s, T10, RST)  │
│  • Authentic 2026 Rider Numbers & Live Leaderboard     │
│  • Aerodynamic WebGL Canvas Shader (shader.js)         │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Features

### 1. 🏎️ Real-Time 60fps Circuit Radar
- Overlays dynamic glowing rider dots directly onto official vector SVG track layouts.
- **True Radius of Curvature Physics ($V \propto \sqrt{R}$)**: Computes local bend tightness across 600 sample points along the racing line. Riders brake before corners and power out on straights with look-ahead acceleration passes.
- Supports both **clockwise** (e.g. Misano) and **anticlockwise** (e.g. Aragón) racing directions.

### 2. ⏱️ Live Race Synchronization & Reload Persistence
- **Zero-Jump Reloads**: The animation phase is preserved across page refreshes via `sessionStorage` plus elapsed time compensation. Refreshing your browser will **never** reset riders back to the start/finish line.
- **Continuous Clock Locking**: Synchronizes seamlessly with the backend `live_sync` payload derived from the race leader's live timing loop crossings.
- **Dynamic Lap Speed**: Automatically calibrates lap duration to the track's real-time pace (~91s at Misano, ~107s at Aragón).

### 3. 📺 TV Broadcast Sync Calibrator (`TV SYNC`)
- Video streams (VideoPass, DAZN, TNT Sports, cable) introduce varying broadcast delays (5s to 30s).
- An interactive **TV SYNC** widget (`-5s`, `-1s`, `+1s`, `+5s`, `T10`, `RST`) lets you instantly shift the radar dots to match the exact corner you see on television.
- Instant **`T10`** button snaps dots directly to Turn 10 (Tramonto).
- Settings persist across sessions in `localStorage`.

### 4. 🔢 Authentic 2026 MotoGP Grid & Race Numbers
- High-precision, transparent 32-bit RGBA race number graphics for all 22 official MotoGP riders extracted directly from official artwork.
- Live classification table with gap intervals, tyre compound indicators (`Soft`, `Medium`, `Hard`), and team livery accent borders.
- Motorsport typography powered by Google Fonts (`Syncopate`, `Michroma`, `JetBrains Mono`).

---

## 📁 Repository Structure

```
OpenMotoGP-SDK/
├── circuits/                      # High-resolution SVG circuit track maps
│   ├── ara2-info.svg              # MotorLand Aragón underlay
│   └── misano.svg                 # Misano World Circuit Marco Simoncelli underlay
├── static/                        # Frontend assets
│   ├── css/
│   │   └── main.css               # Spatial glassmorphism, glowing borders & typography
│   ├── js/
│   │   ├── animator.js            # 60fps dead-reckoning physics & curvature engine
│   │   ├── circuit.js             # SVG track loader & coordinate normalizer
│   │   ├── leaderboard.js         # Live classification table & tyre badges
│   │   ├── shader.js              # WebGL fluid background shader
│   │   └── websocket.js           # WebSocket connection manager & lifecycle
│   └── numbers/                   # High-precision transparent rider number graphics
│       ├── num_5.png              # Johann Zarco (#5)
│       ├── num_10.png             # Luca Marini (#10)
│       ├── ...                    # All 22 official rider numbers
│       └── num_93.png             # Marc Marquez (#93)
├── src/
│   └── openmotogp/                # Core Python package
│       ├── __init__.py            # Package entry point
│       ├── circuit_maps.py        # Circuit registry, paths, directions & sectors
│       ├── client.py              # PulseLive HTTP timing gateway client
│       ├── core.py                # Session parsers & data normalization
│       ├── live.py                # FastAPI live telemetry server & WebSocket broadcaster
│       └── models.py              # Pydantic telemetry & classification models
├── artifacts/                     # Architectural documentation (.md files)
├── index.html                     # Live telemetry dashboard interface
├── pyproject.toml                 # Hatch packaging & dependency configuration
├── requirements.txt               # Pinned pip requirements
└── .gitignore                     # Git exclusion rules
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.11+** installed.
- Modern web browser (Chrome, Edge, Firefox, Brave, Safari).

### 2. Installation

Clone the repository and set up a virtual environment:

```bash
# Clone the repository
git clone https://github.com/your-username/OpenMotoGP-SDK.git
cd OpenMotoGP-SDK

# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Alternatively, install in editable mode:
```bash
pip install -e ".[live]"
```

### 3. Running the Live Telemetry Server

Start the FastAPI application on port **8080**:

```bash
# Windows / Linux / macOS
python -m uvicorn src.openmotogp.live:app --host 127.0.0.1 --port 8080
```

> **Note**: Avoid running with `--reload` on Windows to prevent background zombie process locks.

### 4. Open the Dashboard

Navigate to **[http://127.0.0.1:8080](http://127.0.0.1:8080)** in your browser.
- The dashboard will automatically connect to `ws://127.0.0.1:8080/ws/telemetry`.
- When live track action is active, telemetry, leaderboards, and circuit radar will populate immediately.

---

## 🏁 2026 MotoGP Grid Mapping

| # | Rider | Team | Bike | Liveries |
|:---:|:---|:---|:---|:---:|
| **93** | Marc Marquez | Ducati Lenovo Team | Ducati Desmosedici | Red |
| **63** | Francesco Bagnaia | Ducati Lenovo Team | Ducati Desmosedici | Red |
| **72** | Marco Bezzecchi | Aprilia Racing | Aprilia RS-GP | Black / Red |
| **89** | Jorge Martin | Aprilia Racing | Aprilia RS-GP | Black / Purple |
| **73** | Alex Marquez | BK8 Gresini Racing | Ducati Desmosedici | Light Blue |
| **54** | Fermin Aldeguer | BK8 Gresini Racing | Ducati Desmosedici | Light Blue |
| **37** | Pedro Acosta | Red Bull KTM Factory | KTM RC16 | Orange |
| **33** | Brad Binder | Red Bull KTM Factory | KTM RC16 | Orange |
| **12** | Maverick Viñales | Tech3 KTM Factory | KTM RC16 | Orange / Black |
| **23** | Enea Bastianini | Tech3 KTM Factory | KTM RC16 | Orange / Pink |
| **49** | Fabio Di Giannantonio | Pertamina Enduro VR46 | Ducati Desmosedici | Fluo Yellow |
| **21** | Franco Morbidelli | Pertamina Enduro VR46 | Ducati Desmosedici | Fluo Yellow |
| **25** | Raul Fernandez | Trackhouse Racing | Aprilia RS-GP | Blue / Yellow |
| **79** | Ai Ogura | Trackhouse Racing | Aprilia RS-GP | Blue / Yellow |
| **20** | Fabio Quartararo | Monster Energy Yamaha | Yamaha YZR-M1 | Blue |
| **42** | Alex Rins | Monster Energy Yamaha | Yamaha YZR-M1 | Blue |
| **7** | Toprak Razgatlioglu | Pramac Yamaha MotoGP | Yamaha YZR-M1 | Purple |
| **43** | Jack Miller | Pramac Yamaha MotoGP | Yamaha YZR-M1 | Purple |
| **10** | Luca Marini | Honda HRC Castrol | Honda RC213V | Red / Orange |
| **36** | Joan Mir | Honda HRC Castrol | Honda RC213V | Red / Orange |
| **5** | Johann Zarco | LCR Honda Castrol | Honda RC213V | Green / White |
| **11** | Diogo Moreira | LCR Honda Castrol | Honda RC213V | Green / White |

---

## 🗺️ Supported Circuits

| ID | Name | Code | Direction | Length | Turns |
|:---:|:---|:---:|:---:|:---:|:---:|
| **102** | Misano World Circuit Marco Simoncelli | `MIS` | Clockwise | 4,226 m | 16 |
| **105** | MotorLand Aragón | `ARA` | Anticlockwise | 5,077 m | 17 |

Circuits can be queried via REST:
```bash
curl http://127.0.0.1:8080/circuit/102
curl http://127.0.0.1:8080/circuit/misano
```

---

## 💻 Python SDK Usage

You can also use OpenMotoGP programmatically in your own Python scripts:

```python
import asyncio
from openmotogp.client import MotoGPClient

async def main():
    async with MotoGPClient() as client:
        # Fetch current live timing snapshot
        telemetry = await client.get_live_timing()
        
        event = telemetry.get("head", {}).get("event_tv_name")
        print(f"Current Event: {event}")
        
        riders = telemetry.get("rider", {})
        for rider_id, r in list(riders.items())[:5]:
            print(f"P{r.get('pos')} #{r.get('rider_number')} {r.get('rider_shortname')} - Gap: {r.get('gap_first')}")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 🛡️ License & Disclaimer

- **License**: Distributed under the [MIT License](LICENSE).
- **Disclaimer**: This project is an unofficial open-source telemetry SDK and dashboard for educational, analytical, and community use. MotoGP™, Grand Prix, and related trademarks belong to Dorna Sports S.L. and Fédération Internationale de Motocyclisme (FIM).
