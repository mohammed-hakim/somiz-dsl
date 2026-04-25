import sqlite3
from flask import Blueprint, request, jsonify
from db.connection import get_db_connection
from utils.auth_middleware import require_auth

equipements_bp = Blueprint('equipements', __name__)

@equipements_bp.route('/api/equipements', methods=['GET'])
@require_auth
def get_equipements():
    search = request.args.get('search', '')
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if search:
        # SQLite uses '?' and standard LIKE syntax
        cursor.execute('SELECT "Code Prestation", "Prestation" FROM ListeEquipement WHERE "Prestation" LIKE ?', (f'%{search}%',))
    else:
        cursor.execute('SELECT "Code Prestation", "Prestation" FROM ListeEquipement')
    
    rows = cursor.fetchall()
    conn.close()
    
    return jsonify([
        {"code": r[0], "prestation": r[1]}
        for r in rows
    ])


@equipements_bp.route('/api/equipements/<code_prestation>/availability', methods=['GET'])
@require_auth
def check_equipment_availability(code_prestation):
    date_debut = request.args.get('date_debut')
    date_fin = request.args.get('date_fin')
    exclude_request_id = request.args.get('exclude_request_id')
    
    if not date_debut or not date_fin:
        return jsonify({"error": "date_debut and date_fin are required"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # SQLite date comparison works best with ISO strings (YYYY-MM-DD)
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
        "conflicts": [
            {"id": r["id"], "date_debut": r["date_debut"], "date_fin": r["date_fin"], "status": r["status"]} 
            for r in rows
        ] if rows else []
    })

@equipements_bp.route('/api/equipements/status', methods=['GET'])
@require_auth
def get_equipements_status():
    """Returns all equipements with their current status computed for the current day."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT e."Code Prestation", e."Prestation",
            (SELECT d.num_demande 
             FROM Demande_Engins de 
             JOIN Demandes d ON de.num_demande = d.num_demande 
             WHERE de.Code_Prestation = e."Code Prestation" 
             AND d.Status IN ('Validé', 'Approuvé', 'En Cours', 'Sous Traitance') 
             AND date("now", "localtime") BETWEEN d.Date_Debut_Prestation AND d.Date_Fin_Prestation
             LIMIT 1) as demande_id,
             
            (SELECT m.id 
             FROM MaintenanceRequests m
             WHERE m.code_prestation = e."Code Prestation"
             AND m.status IN ('VALIDE', 'EN_COURS')
             AND date("now", "localtime") BETWEEN m.date_debut AND m.date_fin
             LIMIT 1) as maintenance_id
             
        FROM ListeEquipement e
        ORDER BY e."Prestation"
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        code = r[0]
        prestation = r[1]
        demande_id = r[2]
        maintenance_id = r[3]
        
        status = 'DISPONIBLE'
        current_ref = None
        if maintenance_id:
            status = 'EN_MAINTENANCE'
            current_ref = maintenance_id
        elif demande_id:
            status = 'EN_PRESTATION'
            current_ref = demande_id
            
        result.append({
            "code": code,
            "prestation": prestation,
            "status": status,
            "current_ref": current_ref
        })
        
    return jsonify(result)

@equipements_bp.route('/api/equipements/<path:code_prestation>/details', methods=['GET'])
@require_auth
def get_equipment_details(code_prestation):
    # Some codes have slashes or spaces, flask route path handles it
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT "Prestation" FROM ListeEquipement WHERE "Code Prestation" = ?', (code_prestation,))
    eq_row = cursor.fetchone()
    if not eq_row:
        conn.close()
        return jsonify({"error": "Equipement non trouvé"}), 404
        
    # Get all related demandes
    cursor.execute("""
        SELECT d.num_demande, d.Date_Demande, d.Date_Debut_Prestation, d.Date_Fin_Prestation, d.Status, d.lieu_prestation, d.demandeur_structure, d.utilisateur
        FROM Demande_Engins de
        JOIN Demandes d ON de.num_demande = d.num_demande
        WHERE de.Code_Prestation = ?
        ORDER BY d.Date_Debut_Prestation DESC
    """, (code_prestation,))
    demandes_rows = cursor.fetchall()
    
    # Get all maintenance
    cursor.execute("""
        SELECT m.id, m.type_maintenance, m.date_debut, m.date_fin, m.status, m.description
        FROM MaintenanceRequests m
        WHERE m.code_prestation = ?
        ORDER BY m.date_debut DESC
    """, (code_prestation,))
    maintenance_rows = cursor.fetchall()
    
    conn.close()
    
    demandes = []
    for d in demandes_rows:
        demandes.append({
            "num_demande": d[0],
            "date_demande": d[1],
            "date_debut": d[2],
            "date_fin": d[3],
            "status": d[4],
            "lieu": d[5],
            "structure": d[6],
            "utilisateur": d[7]
        })
        
    maintenances = []
    for m in maintenance_rows:
        maintenances.append({
            "id": m[0],
            "type_maintenance": m[1],
            "date_debut": m[2],
            "date_fin": m[3],
            "status": m[4],
            "description": m[5]
        })
        
    return jsonify({
        "code": code_prestation,
        "prestation": eq_row[0],
        "history_demandes": demandes,
        "history_maintenances": maintenances
    })