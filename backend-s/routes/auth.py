import sqlite3
from flask import Blueprint, request, jsonify
from db.connection import get_db_connection

auth_bp = Blueprint('auth', __name__)



from werkzeug.security import check_password_hash
from utils.auth_middleware import generate_token

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT matricule, nom, prenom, NUM_CONT, structure, role, password FROM RH WHERE username=?"
        cursor.execute(query, (username,))
        row = cursor.fetchone()
        conn.close()

        if row:
            hashed_pwd = row['password']
            # Check the hashed password (or fallback to plain comparison just in case some mock passwords weren't hashed properly yet)
            if (hashed_pwd.startswith('scrypt:') and check_password_hash(hashed_pwd, password)) or (not hashed_pwd.startswith('scrypt:') and hashed_pwd == password):
                user_data = {
                    "matricule": row['matricule'],
                    "nom": row['nom'],
                    "prenom": row['prenom'],
                    "username": username,
                    "role": row['role'],
                    "structure": row['structure']
                }
                
                token = generate_token(user_data)
                
                return jsonify({
                    "token": token,
                    "user": user_data
                })
            
        return jsonify({"error": "Invalid credentials"}), 401
    
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500