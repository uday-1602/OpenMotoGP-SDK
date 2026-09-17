# `pyproject.toml` Context & Technical Specification

> **File Path**: [`pyproject.toml`](file:///c:/Users/uday.salathia/OneDrive%20-%20Nihilent%20Limited/Documents/practice/OpenMotoGP-SDK/pyproject.toml)  
> **Type**: PEP 517/518/621 Build & Package Configuration  
> **Build Backend**: Hatchling (`hatchling.build`)

---

## 1. Overview
Defines the standard modern Python packaging configuration for `openmotogp`, including package metadata, Python runtime requirements (`>=3.11`), core dependencies, and optional feature dependency groups.

---

## 2. Dependency Groups

### Core Dependencies
```toml
dependencies = [
    "httpx>=0.28.0",
    "pydantic>=2.10.0",
    "pandas>=3.0.0",
    "pyarrow>=18.0.0",
]
```

### Optional Dependency Groups (`[project.optional-dependencies]`)
1. **`live`**: Required for live telemetry streaming and WebSocket server:
   - `websockets>=13.0`
   - `fastapi>=0.115.0`
   - `uvicorn>=0.30.0`
   - Install via: `pip install -e ".[live]"`
2. **`analysis`**: Required for telemetry visualization and PDF timing sheet parsing:
   - `pdfplumber>=0.11.0`
   - `matplotlib>=3.9.0`
   - `plotly>=5.24.0`
   - Install via: `pip install -e ".[analysis]"`

---

## 3. Build Configuration
```toml
[tool.hatch.build.targets.wheel]
packages = ["src/openmotogp"]
```
Maps the wheel package root directly to `src/openmotogp`.
