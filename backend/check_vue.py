import pyodbc

conn_str = (
    r'DRIVER={ODBC Driver 18 for SQL Server};'
    r'SERVER=.\SQLEXPRESS;'
    r'DATABASE=parc_roulant_test2;'
    r'Trusted_Connection=yes;'
    r'TrustServerCertificate=yes;'
)

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    cursor.execute("SELECT TOP 1 * FROM vue_demandes")
    cols = [column[0] for column in cursor.description]
    print(cols)
    if 'date_cpa' not in [c.lower() for c in cols]:
        print("Need to also get date_cpa from Demandes.")
    else:
        print("date_cpa is in vue_demandes")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
