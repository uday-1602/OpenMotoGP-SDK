from typing import List, Optional
from pydantic import BaseModel, Field

class Country(BaseModel):
    iso: str
    name: str

class Circuit(BaseModel):
    id: str
    name: str
    legacy_d: Optional[int] = None

class Season(BaseModel):
    id: str
    year: int
    current: bool

class Event(BaseModel):
    id: str = Field(alias="toad_api_uuid")
    short_name: str = Field(alias = "sponsored_name")
    country: Country
    circuit: Circuit
    date_start: str = Field(alias = "date_start")
    date_end: str = Field(alias = "date_end")

class Category(BaseModel):
    id: str
    name: str
    legacy_id: str

class SessionSummary(BaseModel):
    id: str
    type: str
    status: Optional[str] = None
    date_start: Optional[str] = None

class RiderInfo(BaseModel):
    id: str
    full_name: str
    legacy_id: Optional[int] = None
    country: Optional[Country] = None

class TeamInfo(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None

class ConstructorInfo(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None

class ClassificationEntry(BaseModel):
    position: Optional[int] = None
    rider: RiderInfo
    team: Optional[TeamInfo] = None
    constructor: Optional[ConstructorInfo] = None
    time: Optional[str] = None
    total_laps: Optional[int] = None
    top_speed: Optional[float] = None
    status: Optional[str] = None
    points: Optional[int] = None