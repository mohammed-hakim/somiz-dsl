import sqlite3
import os

def init_database():
    """Initialize the database if it doesn't exist or is empty"""
    db_path = 'parc_roulant_test.db'
    
    # Check if database exists and has tables
    db_exists = os.path.exists(db_path)
    
    if db_exists:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        # Check if database has tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        conn.close()
        
        if len(tables) > 0:
            print(f"Database already initialized with {len(tables)} tables")
            return
    
    # Database is empty or doesn't exist - initialize it
    print("Initializing database...")
    conn = sqlite3.connect(db_path)
    
    # Read and execute the SQL file
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    
    try:
        with open(schema_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        # Execute the entire script
        conn.executescript(sql_script)
        conn.commit()
        
        # Verify tables were created
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        
        print(f"Database initialized successfully with {len(tables)} tables!")
        
    except FileNotFoundError:
        print(f"Error: schema.sql not found at {schema_path}")
        print("  Please ensure db/schema.sql exists")
    except Exception as e:
        print(f"Error initializing database: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    init_database()