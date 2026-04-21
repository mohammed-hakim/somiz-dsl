from flask import Blueprint, request, jsonify
from db.connection import get_db_connection
from utils.logger import log_transaction
from datetime import datetime

equipements_bp = Blueprint('equipements', __name__)

@equipements_bp.route('/api/equipements', methods=['GET'])
def get_equipements():
    search = request.args.get('search', '')
    conn = get_db_connection()
    cursor = conn.cursor()
    if search:
        cursor.execute("SELECT [Code Prestation], [Prestation] FROM ListeEquipement WHERE Prestation LIKE ?", (f'%{search}%',))
    else:
        cursor.execute("SELECT [Code Prestation], [Prestation] FROM ListeEquipement")
    rows = cursor.fetchall()
    conn.close()
    
    return jsonify([
        {"code": r[0], "prestation": r[1]}
        for r in rows
    ])


@equipements_bp.route('/api/equipements/<code_prestation>/availability', methods=['GET'])
def check_equipment_availability(code_prestation):
    """Check if equipment is available (not in maintenance) for a date range"""
    date_debut = request.args.get('date_debut')
    date_fin = request.args.get('date_fin')
    exclude_request_id = request.args.get('exclude_request_id')
    
    if not date_debut or not date_fin:
        return jsonify({"error": "date_debut and date_fin are required"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check for overlapping maintenance periods
    query = """
        SELECT id, date_debut, date_fin, status 
        FROM MaintenanceRequests 
        WHERE code_prestation = ? 
        AND status IN ('VALIDE', 'EN_ATTENTE')
        AND (
            (date_debut <= ? AND date_fin >= ?) OR
            (date_debut <= ? AND date_fin >= ?) OR
            (date_debut >= ? AND date_fin <= ?)
        )
    """
    params = [code_prestation, date_fin, date_debut, date_fin, date_debut, date_debut, date_fin]
    
    if exclude_request_id:
        query += " AND id != ?"
        params.append(exclude_request_id)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    is_available = len(rows) == 0
    
    return jsonify({
        "available": is_available,
        "conflicts": [{"id": r[0], "date_debut": r[1], "date_fin": r[2], "status": r[3]} for r in rows] if rows else []
    })
