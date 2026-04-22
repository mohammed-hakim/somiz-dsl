from flask import Blueprint, jsonify
from db.connection import get_db_connection
from datetime import datetime

affaires_bp = Blueprint('affaires', __name__)

# Helper to safely parse string/datetime from SQLite
def format_date(d, fmt="%Y-%m-%d"):
    if not d: return None
    if isinstance(d, str): return d[:10]
    return d.strftime(fmt)

@affaires_bp.route('/api/affaires_structures/<code_affaire>', methods=['GET'])
def get_affaire_structure(code_affaire):
    if len(code_affaire) != 7:
        return jsonify({"error": "Invalid format. Exactly 7 characters required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        SELECT NUM_OSC, DESIGN, CLIENT, DATE_DEBUT, DATE_Fin, 
               COD_STRUCT_H, INITIAL, INTITULE, NATURE_STRUCTURE 
        FROM structures_affaires 
        WHERE Code_Affaire = ?
    """
    cursor.execute(query, (code_affaire,))
    row = cursor.fetchone()
    conn.close()

    if row:
        # standard sqlite3 returns tuples, so we must access via indices
        return jsonify({
            "code_affaire": code_affaire,
            "num_osc": row[0],
            "design": row[1],
            "client": row[2],
            "date_debut": format_date(row[3]),
            "date_fin": format_date(row[4]),
            "cod_struct_h": row[5],
            "initial": row[6],
            "intitule": row[7],
            "nature_structure": row[8]
        })
    return jsonify({"error": "Affaire not found"}), 404