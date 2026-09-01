import asyncio 
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
from typing import List
import uvicorn

app = FastAPI(title="OpenMotoGP Live Telemetry")

class TelemetryBroadcaster:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.live_timing_url = "https://api.motogp.pulselive.com/motogp/v1/timing-gateway/livetiming-lite"

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Client connected. Total clients: {len(self.active_connections)}")
    
    def disconnect(self, websocket:WebSocket):
        self.active_connections.remove(websocket)
        print("Client disconnected")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

broadcaster = TelemetryBroadcaster()

async def fetch_live_timing():
    """Background task that polls MotoGP live timing and broadcasts changes."""

    async with httpx.AsyncClient() as client:
        while True:
                if broadcaster.active_connections:
                    try:
                        response = await client.get(
                            broadcaster.live_timing_url,
                            headers = {"Accept": "application/json"}
                        )

                        if response.status_code == 200:
                            data = response.json()
                            await broadcaster.broadcast(data)

                    except Exception as e:
                        print(f"Error fetching the live timing: {e}")

                await asyncio.sleep(1.5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    polling_task = asyncio.create_task(fetch_live_timing())
    yield
    polling_task.cancel()   

app = FastAPI(title="OpenMotoGP Live Telemetry", lifespan=lifespan)

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    """Clients connect here to receive the live data stream."""
    await broadcaster.connect(websocket)
    try:
        while True:
            #connection kept open to wait for client messages
            await websocket.receive_text()

    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)


if __name__ == "__main>__":
    print("Starting OpenMotoGP Live Telemetry Server on ws://localhost:8000/ws/telemetry")
    uvicorn.run(app, host="0.0.0.0", port=8000)