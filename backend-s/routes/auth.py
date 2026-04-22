import sqlite3
from flask import Blueprint, request, jsonify
from db.connection import get_db_connection

auth_bp = Blueprint('auth', __name__)



@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.json
    matricule = data.get('matricule')
    password = data.get('password')

    if not matricule or not password:
        return jsonify({"error": "matricule and password required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # SQLite uses '?' as the placeholder for parameters
        query = "SELECT nom, prenom, NUM_CONT, structure, STRUC, role FROM RH WHERE matricule=? AND password=?"
        cursor.execute(query, (matricule, password))
        row = cursor.fetchone()
        conn.close()

        if row:
            return jsonify({
                "matricule": matricule,
                "nom": row['nom'],
                "prenom": row['prenom'],
                "role": row['role'],
                "structure": row['structure'],
                "struc_code": row['STRUC']
            })
            
        return jsonify({"error": "Invalid credentials"}), 401
    
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500