import asyncio
import pathlib
import time
from contextlib import asynccontextmanager
from typing import List, Optional

import httpx
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .circuit_maps import CIRCUIT_REGISTRY

# Resolve repo root: src/openmotogp/live.py → go up 3 levels
_REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
_STATIC_DIR = _REPO_ROOT / "static"


# ── Telemetry broadcaster ────────────────────────────────────────────────────

class TelemetryBroadcaster:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.live_timing_url = (
            "https://api.motogp.pulselive.com/motogp/v1/timing-gateway/livetiming-lite"
        )

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print("Client disconnected")

    async def broadcast(self, message: dict):
        dead = []
        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception:
                dead.append(conn)
        for c in dead:
            self.active_connections.remove(c)


broadcaster = TelemetryBroadcaster()


# ── Real-Time Lap Synchronization Tracker ─────────────────────────────────────

class LapTracker:
    def __init__(self):
        self.last_completed_lap: Optional[int] = None
        self.last_lap_time_sec: float = 91.0
        self.lap_start_ts: float = time.time()
        self.initialized: bool = False

    def update(self, payload: dict):
        riders = payload.get("rider", {})
        if not riders:
            return

        leader = None
        if isinstance(riders, dict):
            for r in riders.values():
                if str(r.get("pos")) == "1" or str(r.get("order")) == "1":
                    leader = r
                    break
            if not leader and len(riders) > 0:
                leader = list(riders.values())[0]
        elif isinstance(riders, list) and len(riders) > 0:
            leader = riders[0]

        if not leader:
            return

        last_lap_time_str = leader.get("last_lap_time")
        if last_lap_time_str:
            try:
                t = str(last_lap_time_str).strip().replace("'", ":")
                if ":" in t:
                    parts = t.split(":")
                    dur = float(parts[0]) * 60.0 + float(parts[1])
                    if 45.0 < dur < 180.0:
                        self.last_lap_time_sec = dur
            except Exception:
                pass

        completed_lap = leader.get("last_lap")
        now = time.time()

        if completed_lap is not None:
            try:
                lap_num = int(completed_lap)
                if self.last_completed_lap is not None and lap_num > self.last_completed_lap:
                    self.lap_start_ts = now
                    self.last_completed_lap = lap_num
                    print(f"[LapTracker] Leader completed lap {lap_num}. Target lap time: {self.last_lap_time_sec}s")
                elif not self.initialized:
                    self.last_completed_lap = lap_num
                    self.initialized = True
            except Exception:
                pass

    def get_sync_payload(self) -> dict:
        now = time.time()
        elapsed = now - self.lap_start_ts
        phase = (elapsed / self.last_lap_time_sec) % 1.0
        return {
            "leader_phase": round(phase, 4),
            "leader_lap_sec": round(self.last_lap_time_sec, 3),
            "server_ts": now,
        }


lap_tracker = LapTracker()


# ── Background polling task ──────────────────────────────────────────────────

async def fetch_live_timing():
    """Polls MotoGP live timing every 1.5 s and broadcasts to all WS clients."""
    async with httpx.AsyncClient() as client:
        while True:
            if broadcaster.active_connections:
                try:
                    response = await client.get(
                        broadcaster.live_timing_url,
                        headers={"Accept": "application/json"},
                    )
                    if response.status_code == 200:
                        data = response.json()
                        lap_tracker.update(data)
                        data["live_sync"] = lap_tracker.get_sync_payload()
                        await broadcaster.broadcast(data)
                except Exception as e:
                    print(f"[Poller] Error: {e}")
            await asyncio.sleep(1.5)


# ── App lifespan ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(fetch_live_timing())
    yield
    task.cancel()


# ── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(title="OpenMotoGP Live Telemetry", lifespan=lifespan)

# CORS: allow file:// origin so index.html can hit the API when opened directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Serve static/ (CSS, JS) — must be mounted BEFORE route definitions
app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")

# Serve circuits/ (SVG images)
_CIRCUITS_DIR = _REPO_ROOT / "circuits"
app.mount("/circuits", StaticFiles(directory=str(_CIRCUITS_DIR)), name="circuits")



# ── REST routes ──────────────────────────────────────────────────────────────

@app.get("/circuit/{circuit_id}")
async def get_circuit(circuit_id: str):
    """Returns SVG circuit map data for a given PulseLive circuit_id."""
    clean_id = circuit_id.strip()
    circuit = CIRCUIT_REGISTRY.get(clean_id)
    if not circuit:
        # Fallback: check case-insensitive keys or shortname matches
        for k, v in CIRCUIT_REGISTRY.items():
            if k.lower() == clean_id.lower() or v.get("shortname", "").lower() == clean_id.lower():
                circuit = v
                break
    if not circuit:
        available = list(CIRCUIT_REGISTRY.keys())
        return JSONResponse(
            status_code=404,
            content={
                "error": f"Circuit {circuit_id!r} not found in registry.",
                "available": available,
            },
        )
    return JSONResponse(content=circuit)


# ── WebSocket endpoint ───────────────────────────────────────────────────────

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    """Clients connect here to receive the live telemetry stream."""
    await broadcaster.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)


# ── Dev entry point ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"[OpenMotoGP] Serving from {_REPO_ROOT}")
    print("[OpenMotoGP] WebSocket → ws://localhost:8080/ws/telemetry")
    uvicorn.run(app, host="0.0.0.0", port=8080)