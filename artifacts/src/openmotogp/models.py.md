# `src/openmotogp/models.py` Context & Technical Specification

> **File Path**: [`src/openmotogp/models.py`](file:///c:/Users/uday.salathia/OneDrive%20-%20Nihilent%20Limited/Documents/practice/OpenMotoGP-SDK/src/openmotogp/models.py)  
> **Type**: Pydantic Domain Schema Models (Pydantic v2)  
> **Role**: Type definitions, aliases, and validation for PulseLive REST API entities

---

## 1. Overview
`models.py` defines the Pydantic data schemas representing the official MotoGP PulseLive API entities. It ensures runtime validation, type safety, and automatic field aliasing between external JSON payloads and internal Python conventions.

---

## 2. Model Definitions

### `Country`
- `iso: str`: 2-letter ISO country code (e.g. `"ES"`, `"IT"`).
- `name: str`: Country name (e.g. `"Spain"`).

### `Circuit`
- `id: str`: Circuit UUID.
- `name: str`: Circuit name (e.g. `"MotorLand Aragón"`, `"Chang International Circuit"`).
- `legacy_d: Optional[int] = None`: Historical integer ID.

### `Season`
- `id: str`: Season UUID.
- `year: int`: Calendar year (e.g. `2024`, `2026`).
- `current: bool`: Flag indicating if season is active.

### `Event`
- `id: str`: Event UUID.
- `toad_api_uuid: Optional[str] = None`: TOAD API identifier.
- `short_name: str = Field(alias="sponsored_name")`: Maps `sponsored_name` in JSON to `short_name`.
- `country: Country`: Nested country model.
- `circuit: Circuit`: Nested circuit model.
- `date_start: str`: Event commencement ISO date string.
- `date_end: str`: Event conclusion ISO date string.

### `Category`
- `id: str`: Category UUID.
- `name: str`: Class name (`"MotoGP"`, `"Moto2"`, `"Moto3"`, `"MotoE"`).
- `legacy_id: Optional[int] = None`: Historical class ID.

### `SessionSummary`
- `id: str`: Session UUID.
- `type: str`: Session code (`"RAC"`, `"SPR"`, `"Q1"`, `"Q2"`, `"PR"`, `"FP1"`).
- `status: Optional[str] = None`: Session completion status.
- `date_start: Optional[str] = None`: Scheduled start timestamp.

### `RiderInfo`
- `id: str`: Rider UUID.
- `full_name: str`: Complete name (e.g. `"Jorge Martin"`, `"Francesco Bagnaia"`, `"Marc Marquez"`).
- `legacy_id: Optional[int] = None`: The rider's racing number (e.g. `89`, `1`, `93`).
- `country: Optional[Country] = None`: Rider nationality.

### `TeamInfo` & `ConstructorInfo`
- `id: Optional[str] = None`
- `name: Optional[str] = None` (e.g. `"Prima Pramac Racing"`, `"Ducati Lenovo Team"`, `"Ducati"`, `"KTM"`)

### `ClassificationEntry`
- `position: Optional[int] = None`: Finished / current rank.
- `rider: RiderInfo`: Rider information.
- `team: Optional[TeamInfo] = None`: Team association.
- `constructor: Optional[ConstructorInfo] = None`: Manufacturer.
- `time: Optional[str] = None`: Finished time or gap (e.g. `"40:55.234"`, `"+0.342"`).
- `total_laps: Optional[int] = None`: Number of completed laps.
- `top_speed: Optional[float] = None`: Top speed in km/h.
- `status: Optional[str] = None`: Status indicator (`"Finished"`, `"DNF"`, `"DNS"`).
- `points: Optional[int] = None`: Championship points awarded.

---

## 3. Code-Specific Backend Insights & Technical Notes (Rule 3)
1. **Field Aliasing**: `Event` uses `Field(alias="sponsored_name")` to translate PulseLive's JSON naming to clean Python attribute access (`event.short_name`).
2. **Rider Number Extraction**: Note that `RiderInfo.legacy_id` represents the actual racing bike number (`89` for Martin, `93` for Marquez).
3. **Pydantic v2 Compatibility**: Models use standard Pydantic v2 `BaseModel` and `Field`.
