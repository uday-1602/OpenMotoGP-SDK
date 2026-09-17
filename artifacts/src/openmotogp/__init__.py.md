# `src/openmotogp/__init__.py` Context & Technical Specification

> **File Path**: [`src/openmotogp/__init__.py`](file:///c:/Users/uday.salathia/OneDrive%20-%20Nihilent%20Limited/Documents/practice/OpenMotoGP-SDK/src/openmotogp/__init__.py)  
> **Type**: Python Package Init  
> **Role**: Module export surface and package version metadata

---

## 1. Overview
`__init__.py` defines the public export boundary for the `openmotogp` Python SDK package.

---

## 2. Exported Symbols
```python
from .core import OpenMotoGP
from .client import MotoGPClient

__version__ = "0.1.0"
__all__ = ["OpenMotoGP", "MotoGPClient"]
```

- **`OpenMotoGP`**: The primary user-facing class for synchronous/async pandas DataFrame operations.
- **`MotoGPClient`**: The low-level async HTTP client for direct Pydantic model operations.
- **`__version__`**: `"0.1.0"`.
