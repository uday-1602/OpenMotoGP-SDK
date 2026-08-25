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

    def get_classification(self, session_uuid: str) -> pd.DataFrame:
        """Returns session classification results as a formatted DataFrame."""
        return asyncio.run(self._async_get_classification(session_uuid))

    async def _async_get_classification(self, session_uuid: str) -> pd.DataFrame:
        entries = await self.client.get_session_classification(session_uuid)
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