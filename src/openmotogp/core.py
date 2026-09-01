import asyncio 
import pandas as pd
from .client import MotoGPClient

class OpenMotoGP:
    def __init__(self):
        self.client=MotoGPClient()

    def get_schedule(self, year: int) -> pd.DataFrame:
        """Returns the calendar schedule for a specific year as a DataFrame."""
        return asyncio.run(self.async_get_schedule(year))

    async def async_get_schedule(self, year: int) -> pd.DataFrame:
        seasons = await self.client.get_seasons()
        season_uuid = next((s.id for s in seasons if s.year == year), None)

        if not season_uuid:
            raise ValueError(f"Season {year} not found in MotoGP database.")

        events = await self.client.get_events(season_uuid)

        data = []
        for event in events:
            data.append({
                "Event ID": event.id,
                "Circuit": event.circuit.name,
                "Country": event.country.name,
                "Start Date": event.date_start,
                "End Date": event.date_end,
                "Title": event.short_name
            })

        return pd.DataFrame(data)

    def get_results(
        self,
        year: int,
        event_name: str,
        session_type: str = "Race",
        category: str = "MotoGP"
    ) -> pd.DataFrame:
        """
        Fetches classification results using human-readable names.
        
        Example:
            api.get_results(2024, "Qatar", session_type="Race", category="MotoGP")
        """
        return asyncio.run(self._async_get_results(year, event_name, session_type, category))

    async def _async_get_results(
        self,
        year: int,
        event_name: str,
        session_type: str,
        category: str
    ) -> pd.DataFrame:
        # 1. Resolve Season ID
        seasons = await self.client.get_seasons()
        season = next((s for s in seasons if s.year == year), None)
        if not season:
            raise ValueError(f"Season {year} not found.")

        # 2. Resolve Event ID via partial string match
        events = await self.client.get_events(season.id)
        matched_event = next(
            (e for e in events if event_name.lower() in e.short_name.lower() or event_name.lower() in e.circuit.name.lower()),
            None
        )
        if not matched_event:
            raise ValueError(f"No event matching '{event_name}' found for {year}.")

        # 3. Resolve Category ID (MotoGP, Moto2, Moto3)
        categories = await self.client.get_categories(season.id)
        matched_category = next(
            (c for c in categories if category.lower() in c.name.lower()),
            None
        )
        if not matched_category:
            raise ValueError(f"Category '{category}' not found.")

        # 4. Resolve Session ID
        sessions = await self.client.get_sessions(matched_event.id, matched_category.id)
        
        # Normalize session search term
        type_mapping = {
            "race": "RAC",
            "rac": "RAC",
            "sprint": "SPR",
            "spr": "SPR",
            "qualifying": "Q",
            "q": "Q",
            "fp1": "FP",
            "fp2": "FP",
            "practice": "PR"
        }
        target_code = type_mapping.get(session_type.lower(), session_type.upper())
        
        matched_session = next(
            (s for s in sessions if s.type == target_code),
            None
        )
        if not matched_session:
            available = [s.type for s in sessions]
            raise ValueError(f"Session '{session_type}' not found. Available sessions: {available}")

        # 5. Fetch Classification
        entries = await self.client.get_session_classification(matched_session.id)
        data = []
        for row in entries:
            data.append({
                "Position": row.position,
                "Rider": row.rider.full_name,
                "Team": row.team.name if row.team else None,
                "Constructor": row.constructor.name if row.constructor else None,
                "Time / Gap": row.time,
                "Laps": row.total_laps,
                "Top Speed (km/h)": row.top_speed,
                "Points": row.points,
                "Status": row.status
            })
        return pd.DataFrame(data)