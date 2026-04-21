from flask import Blueprint, request, jsonify
from db.connection import get_db_connection
from utils.logger import log_transaction
from datetime import datetime

auth_bp = Blueprint('auth', __name__)



@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.json
    matricule = data.get('matricule')
    password = data.get('password')

    if not matricule or not password:
        return jsonify({"error": "matricule and password required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT nom, prenom, NUM_CONT, structure, STRUC, role FROM RH WHERE matricule=? AND password=?", (matricule, password))
    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({
            "matricule": matricule,
            "nom": row.nom,
            "prenom": row.prenom,
            "role": row.role,
            "structure": row.structure,
            "struc_code": row.STRUC
        })
    return jsonify({"error": "Invalid credentials"}), 401
