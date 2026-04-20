import pyodbc

conn_str = (
    r'DRIVER={ODBC Driver 18 for SQL Server};'
    r'SERVER=.\SQLEXPRESS;'
    r'DATABASE=parc_roulant_test2;'
    r'Trusted_Connection=yes;'
    r'TrustServerCertificate=yes;'
)

print("Connecting to DB...")
try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Try adding date_cpa column
    try:
        cursor.execute("ALTER TABLE Demandes ADD date_cpa DATE NULL;")
        conn.commit()
        print("Successfully added date_cpa column to Demandes.")
    except Exception as e:
        print(f"Column might already exist or error occurred: {e}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"DB connection failed: {e}")
