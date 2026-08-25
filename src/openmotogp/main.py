from openmotogp.core import OpenMotoGP
import pandas as pd

def main():
    print("Initializing OpenMotoGP SDK...")
    api = OpenMotoGP()
    
    print("Fetching 2024 MotoGP calendar...")
    try:
        schedule_df = api.get_schedule(year=2024)
        
        # Format pandas output so it doesn't truncate in the terminal
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', 1000)
        
        print("\n--- MotoGP Schedule ---")
        print(schedule_df.head())
        print("\nSuccess! The SDK is communicating with the MotoGP API.")
        
    except Exception as e:
        print(f"\nError: {e}")

if __name__ == "__main__":
    main()