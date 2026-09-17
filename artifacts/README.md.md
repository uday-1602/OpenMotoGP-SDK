# `README.md` Context & Technical Specification

> **File Path**: [`README.md`](file:///c:/Users/uday.salathia/OneDrive%20-%20Nihilent%20Limited/Documents/practice/OpenMotoGP-SDK/README.md)  
> **Type**: Markdown Project Documentation  
> **Role**: Main repository documentation and GitHub landing page

---

## 1. Overview
The primary documentation file for the OpenMotoGP-SDK repository. Covers:
- Architectural overview with ASCII pipeline diagram (PulseLive → FastAPI Streaming Backend → WebSocket → 60fps Spatial Frontend).
- Core features: 60fps SVG circuit radar with Radius of Curvature physics ($V \propto \sqrt{R}$), live telemetry lap tracking & reload persistence, broadcast delay calibration (`TV SYNC: ±s, T10, RST`), and authentic 2026 MotoGP rider number graphics.
- Repository structure breakdown.
- Installation, dependency setup, and server execution guidelines.
- 2026 Grid mapping for all 22 official riders and 11 teams.
- Supported circuits registry (`Misano #102`, `Aragón #105`).
- Python SDK programmatic usage examples.
- MIT license and trademark disclaimer.
