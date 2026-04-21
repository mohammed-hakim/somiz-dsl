import pyodbc


def get_db_connection():
    conn_str = (
        r'DRIVER={ODBC Driver 18 for SQL Server};'
        r'SERVER=.\SQLEXPRESS;'
        r'DATABASE=parc_roulant_test6;'
        r'Trusted_Connection=yes;'
        r'TrustServerCertificate=yes;'
    )
    conn = pyodbc.connect(conn_str)
    return conn
