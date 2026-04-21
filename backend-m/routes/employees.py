from flask import Blueprint, request, jsonify
from db.connection import get_db_connection
from utils.logger import log_transaction
from datetime import datetime

employees_bp = Blueprint('employees', __name__)


@employees_bp.route('/api/employees', methods=['GET'])
def get_employees():
    structure = request.args.get('structure')
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT matricule, nom, prenom, role, structure FROM RH WHERE 1=1"
    params = []
    
    if structure:
        query += " AND structure = ?"
        params.append(structure)
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return jsonify([
        {"matricule": r.matricule, "nom": r.nom, "prenom": r.prenom, "role": r.role, "structure": getattr(r, 'structure', '')}
        for r in rows
    ])

