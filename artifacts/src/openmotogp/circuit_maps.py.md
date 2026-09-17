# `src/openmotogp/circuit_maps.py`

## Purpose
Circuit metadata registry mapping PulseLive circuit IDs to their vector SVG path coordinates, viewBox configurations, background SVG underlay images, start/finish lines, pit lane coordinates, and racing directions.

## Registered Circuits
- **`105` / `aragon` / `ARA`**:
  - **Name**: MotorLand Aragón
  - **Direction**: `anticlockwise`
  - **Image Underlay**: `/circuits/ara2-info.svg`
  - **ViewBox**: `0 0 1080 1080`
- **`102` / `misano` / `MIS`**:
  - **Name**: Misano World Circuit Marco Simoncelli
  - **Direction**: `clockwise`
  - **Image Underlay**: `/circuits/misano.svg`
  - **ViewBox**: `0 0 1080 1080`
  - **Start/Finish**: `{"x1": 621.7, "y1": 585.7, "x2": 604.6, "y2": 546.9}`
  - **Path**: Full 1,203-character closed racing line path from `circuits/misano.svg`.
