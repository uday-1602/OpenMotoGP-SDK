import httpx
from typing import List
from .models import Season, Event, Category, SessionSummary, ClassificationEntry

BASE_URL = "https://api.motogp.pulselive.com/motogp/v1"

class MotoGPClient:
    def __init__(self):
        self.headers = {
            "Accept": "application/json",
            "User-Agent": "openmotogp/0.1.0 (Python)"
        }
    
    async def get_seasons(self) -> List[Season]:
        """Fetch all available historical and current seasons."""
        async with httpx.AsyncClient(headers=self.headers) as client:
            response = await client.get(f"{BASE_URL}/results/seasons")
            response.raise_for_status()
            return [Season(**season) for season in response.json()]

    async def get_events(self, season_uuid: str) -> List[Event]:
        """Fetch all race weekends for a specific season."""
        async with httpx.AsyncClient(headers=self.headers) as client:
            response = await client.get(
                f"{BASE_URL}/results/events",
                params={"seasonUuid": season_uuid}
            )
            response.raise_for_status()
            return [Event(**event) for event in response.json()]
            
    async def get_categories(self, season_uuid: str) -> List[Category]:
        """Fetch categories (MotoGP, Moto2, Moto3) for a given season."""
        async with httpx.AsyncClient(headers=self.headers) as client:
            response = await client.get(
                f"{BASE_URL}/results/categories",
                params={"seasonUuid": season_uuid}
            )
            response.raise_for_status()
            return [Category(**cat) for cat in response.json()]

    async def get_sessions(self, event_uuid: str, category_uuid: str) -> List[SessionSummary]:
        """Fetch all sessions (FP1, Q1, Q2, Race) for an event and category."""
        async with httpx.AsyncClient(headers=self.headers) as client:
            response = await client.get(
                f"{BASE_URL}/results/sessions",
                params={"eventUuid": event_uuid, "categoryUuid": category_uuid}
            )
            response.raise_for_status()
            return [SessionSummary(**s) for s in response.json()]

    async def get_session_classification(self, session_uuid: str) -> List[ClassificationEntry]:
        """Fetch full classification results for a specific session."""
        async with httpx.AsyncClient(headers=self.headers) as client:
            response = await client.get(
                f"{BASE_URL}/results/session/{session_uuid}/classification"
            )
            response.raise_for_status()
            data = response.json()
            classification_data = data.get("classification", [])
            return [ClassificationEntry(**entry) for entry in classification_data]