
import sqlite3
import os

def init_database():
    """Initialize the database if it doesn't exist or is empty"""
    db_path = 'parc_roulant_test.db'
    
    # Check if database exists and has tables
    db_exists = os.path.exists(db_path)
    print(db_exists)
    if db_exists:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        conn.close()
        
        if len(tables) > 0:
            print(f"Database already initialized with {len(tables)} tables")
            return
    
    print("Initializing database...")
    conn = sqlite3.connect(db_path)

    base_dir = os.path.dirname(__file__)
    schema_path = os.path.join(base_dir, 'schema.sql')
    mock_path = os.path.join(base_dir, 'mock.sql')

    try:
        # --- Execute schema.sql ---
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        conn.executescript(schema_sql)
        print("Schema loaded")

        # --- Execute mock.sql ---
        if os.path.exists(mock_path):
            with open(mock_path, 'r', encoding='utf-8') as f:
                mock_sql = f.read()
            
            conn.executescript(mock_sql)
            print("Mock data loaded")
        else:
            print("mock.sql not found, skipping...")

        conn.commit()

        # Verify tables
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()

        print(f"Database initialized successfully with {len(tables)} tables!")

    except FileNotFoundError as e:
        print(f"Missing file: {e}")
    except Exception as e:
        print(f"Error initializing database: {e}")
    finally:
        try:
            from werkzeug.security import generate_password_hash
            cursor = conn.cursor()
            cursor.execute("SELECT matricule, password FROM RH")
            users = cursor.fetchall()
            for matricule, pwd in users:
                # Basic check so we don't rehash already hashed passwords (e.g. if script ran twice manually somehow)
                if not pwd.startswith('scrypt:'):
                    hashed = generate_password_hash(pwd)
                    cursor.execute("UPDATE RH SET password = ? WHERE matricule = ?", (hashed, matricule))
            conn.commit()
            print("Passwords hashed successfully.")
        except Exception as hash_error:
            print(f"Error hashing passwords: {hash_error}")
        
        conn.close()


if __name__ == '__main__':
    init_database()