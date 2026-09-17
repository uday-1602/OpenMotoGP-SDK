# `requirements.txt` Context & Technical Specification

> **File Path**: [`requirements.txt`](file:///c:/Users/uday.salathia/OneDrive%20-%20Nihilent%20Limited/Documents/practice/OpenMotoGP-SDK/requirements.txt)  
> **Type**: Flat pip requirements manifest  
> **Role**: Rapid environment bootstrapping

---

## 1. Overview
Lists pinned/minimum dependencies for fast installation without installing the package in editable mode.

---

## 2. Package List
```
httpx>=0.28.1
pydantic>=2.13.0
pandas>=3.0.0
pyarrow>=18.0.0
fastapi
uvicorn
```

## 3. Installation
```powershell
pip install -r requirements.txt
```
