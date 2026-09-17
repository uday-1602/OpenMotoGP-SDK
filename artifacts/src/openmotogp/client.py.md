# `src/openmotogp/client.py` Context & Technical Specification

> **File Path**: [`src/openmotogp/client.py`](file:///c:/Users/uday.salathia/OneDrive%20-%20Nihilent%20Limited/Documents/practice/OpenMotoGP-SDK/src/openmotogp/client.py)  
> **Type**: Python Async REST Client  
> **Role**: Low-level Asynchronous HTTP Client for the MotoGP PulseLive API

---

## 1. Overview
`client.py` defines `MotoGPClient`, the core async HTTP interface that communicates directly with the official MotoGP PulseLive REST API (`https://api.motogp.pulselive.com/motogp/v1`). It converts raw JSON responses into strongly-typed Pydantic domain models.

---

## 2. API Endpoints & Methods

### Base URL & Configuration
- **Base URL**: `https://api.motogp.pulselive.com/motogp/v1`
- **Default Headers**:
  ```python
  {
      "Accept": "application/json",
      "User-Agent": "openmotogp/0.1.0 (Python)"
  }
  ```

### Method Signatures

| Method | Endpoint | Parameters | Return Type | Description |
|---|---|---|---|---|
| `get_seasons()` | `/results/seasons` | None | `List[Season]` | Fetches all historical and current seasons |
| `get_events(season_uuid)` | `/results/events` | `seasonUuid: str` | `List[Event]` | Fetches all Grand Prix events (race weekends) for a season |
| `get_categories(season_uuid)` | `/results/categories` | `seasonUuid: str` | `List[Category]` | Fetches categories (MotoGP, Moto2, Moto3, MotoE) |
| `get_sessions(event_uuid, category_uuid)` | `/results/sessions` | `eventUuid: str`, `categoryUuid: str` | `List[SessionSummary]` | Fetches sessions (FP1, PR, Q1, Q2, SPR, RAC) for an event |
| `get_session_classification(session_uuid)` | `/results/session/{session_uuid}/classification` | `session_uuid: str` | `List[ClassificationEntry]` | Fetches complete classification, times, positions, and points |

---

## 3. Code-Specific Backend Insights & Technical Notes (Rule 3)
1. **Async Context Lifecycles**: Every method opens an independent `async with httpx.AsyncClient(headers=self.headers)` context. This guarantees connection cleanup but creates a new TLS handshake per request.
2. **Pydantic Deserialization**: Responses are validated and hydrated directly into Pydantic models (e.g. `[Season(**season) for season in response.json()]`).
3. **Response Status Handling**: Every method invokes `response.raise_for_status()`, raising `httpx.HTTPStatusError` on 4xx/5xx responses.
4. **Classification Key Resolution**: In `get_session_classification`, the API payload wraps the list in `{ "classification": [...] }`. The method safely reads `.get("classification", [])`.
