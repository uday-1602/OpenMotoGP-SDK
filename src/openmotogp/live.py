import asyncio 
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List
import uvicorn

app = FastAPI(title="OpenMotoGP Live Telemetry")

class TelemetryBroadcaster:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.live_timing_url: "https://api.motogp.pulselive.com/motogp/v1/timing-gateway/livetiming-lite"

    async def connect(self, websocket: WebSocket):
        await websocket.Accept()
        self.active_connections.append(websocket)
        print(f"Client connected. Total clients: {len(active_connections)}")
    
    def disconnectL