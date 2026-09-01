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