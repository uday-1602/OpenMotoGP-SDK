# `src/openmotogp/core.py` Context & Technical Specification

> **File Path**: [`src/openmotogp/core.py`](file:///c:/Users/uday.salathia/OneDrive%20-%20Nihilent%20Limited/Documents/practice/OpenMotoGP-SDK/src/openmotogp/core.py)  
> **Type**: High-level SDK Interface  
> **Role**: User-friendly Python API with Pandas DataFrame outputs and name-resolution logic

---

## 1. Overview
`core.py` provides the main `OpenMotoGP` class. It sits on top of `MotoGPClient` and converts complex UUID-based API queries into intuitive, human-readable method calls (e.g. `api.get_results(2024, "Qatar", session_type="Race")`), returning clean `pandas.DataFrame` structures for analysis.

---

## 2. Class & Method Breakdown

### Class `OpenMotoGP`
Instantiates an internal `self.client = MotoGPClient()`.

#### Methods:
1. **`get_schedule(year: int) -> pd.DataFrame`**:
   - Synchronous wrapper executing `async_get_schedule` via `asyncio.run()`.
   - Returns DataFrame with columns: `["Event ID", "Circuit", "Country", "Start Date", "End Date", "Title"]`.

2. **`async_get_schedule(year: int) -> pd.DataFrame`**:
   - Fetches all seasons, matches `season.year == year` to find `season_uuid`.
   - Raises `ValueError` if season year is not found.
   - Fetches events for the season and constructs tabular calendar data.

3. **`get_results(year: int, event_name: str, session_type: str = "Race", category: str = "MotoGP") -> pd.DataFrame`**:
   - Synchronous wrapper calling `_async_get_results`.

4. **`_async_get_results(...) -> pd.DataFrame`** — The Resolution Pipeline:
   - **Step 1 (Season)**: Resolves `year` to `season.id`.
   - **Step 2 (Event)**: Performs fuzzy/substring matching on `event.short_name` or `event.circuit.name` (e.g. `"Aragon"` or `"Qatar"`).
   - **Step 3 (Category)**: Resolves category name (`"MotoGP"`, `"Moto2"`, `"Moto3"`).
   - **Step 4 (Session Code Mapping)**: Normalizes human names to PulseLive session codes:
     - `"race"` / `"rac"` ➔ `"RAC"`
     - `"sprint"` / `"spr"` ➔ `"SPR"`
     - `"qualifying"` / `"q"` ➔ `"Q"`
     - `"fp1"` / `"fp2"` ➔ `"FP"`
     - `"practice"` ➔ `"PR"`
   - **Step 5 (Classification Fetch & Tabulation)**: Fetches classification entries and builds a structured DataFrame with:
     - `Position`, `Rider`, `Team`, `Constructor`, `Time / Gap`, `Laps`, `Top Speed (km/h)`, `Points`, `Status`.

---

## 3. Code-Specific Backend Insights & Technical Notes (Rule 3)
1. **Name-to-UUID Fuzzy Resolution**: Eliminates the need for users to know internal PulseLive UUIDs by doing multi-stage lookup cascades (Season ➔ Event ➔ Category ➔ Session ➔ Classification).
2. **Synchronous Bridge**: Uses `asyncio.run(...)` inside `get_schedule()` and `get_results()`. Note: Calling synchronous methods inside an active event loop (e.g. inside a FastAPI endpoint or Jupyter cell with async loop) can raise `RuntimeError: asyncio.run() cannot be called from a running event loop`. Use the async versions in async contexts.
3. **Dataframe Output**: Returns native `pandas.DataFrame` objects, ready for export (`.to_csv()`, `.to_parquet()`) or analysis (`matplotlib`, `seaborn`).
