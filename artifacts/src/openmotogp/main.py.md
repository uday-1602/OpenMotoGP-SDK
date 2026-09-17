# `src/openmotogp/main.py` Context & Technical Specification

> **File Path**: [`src/openmotogp/main.py`](file:///c:/Users/uday.salathia/OneDrive%20-%20Nihilent%20Limited/Documents/practice/OpenMotoGP-SDK/src/openmotogp/main.py)  
> **Type**: CLI Demo / Entry Script  
> **Role**: Demonstrates quick retrieval of race classifications using the high-level SDK interface

---

## 1. Overview
`main.py` is a lightweight demonstration and test script that verifies the SDK's ability to resolve historical or current race results with a single high-level function call without manually providing API UUIDs.

---

## 2. Code Structure & Execution

```python
import openmotogp as mgp
import pandas as pd

def main():
    api = mgp.OpenMotoGP()
    
    # 1-liner to fetch race results without dealing with UUIDs
    print("Fetching 2026 Aragon MotoGP Race Results...")
    results_df = api.get_results(
        year=2026,
        event_name="Aragon",
        session_type="Sprint",
        category="MotoGP"
    )

    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 1000)
    print("\n--- Race Results ---")
    print(results_df[['Position', 'Rider', 'Team', 'Time / Gap', 'Points']])

if __name__ == "__main__":
    main()
```

---

## 3. How to Run
```powershell
venv\Scripts\activate
python src/openmotogp/main.py
```

---

## 4. Code-Specific Backend Insights & Technical Notes (Rule 3)
1. **Pandas Display Formatting**: Configures `display.max_columns=None` and `display.width=1000` to prevent CLI truncation of tabular data.
2. **Execution Flow**: Triggers `OpenMotoGP.get_results()`, which in turn triggers multi-stage network calls via `asyncio.run()`.
