import sqlite3
from flask import Blueprint, request, jsonify
from db.connection import get_db_connection

employees_bp = Blueprint('employees', __name__)

@employees_bp.route('/api/employees', methods=['GET'])
def get_employees():
    structure = request.args.get('structure')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Base query
    query = "SELECT matricule, nom, prenom, role, structure FROM RH WHERE 1=1"
    params = []
    

    # Dynamic filtering
    if structure:
        query += " AND structure = ?"
        params.append(structure.upper())
        
    cursor.execute(query, params)
    rows = cursor.fetchall()

    conn.close()
    
    # Map the rows to a list of dictionaries for JSON output
    return jsonify([
        {
            "matricule": r["matricule"], 
            "nom": r["nom"], 
            "prenom": r["prenom"], 
            "role": r["role"], 
            "structure": r["structure"]
        } for r in rows
    ])