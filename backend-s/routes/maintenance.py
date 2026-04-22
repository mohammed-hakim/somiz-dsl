from flask import Blueprint, request, jsonify
from db.connection import get_db_connection
from datetime import datetime

maintenance_bp = Blueprint('maintenance', __name__)

# Helper to safely parse string/datetime from SQLite
def format_date(d, fmt="%Y-%m-%d"):
    if not d: return None
    if isinstance(d, str): return d[:10] if fmt == "%Y-%m-%d" else d[:16]
    return d.strftime(fmt)

@maintenance_bp.route('/api/maintenance/types', methods=['GET'])
def get_maintenance_types():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT code, libelle, categorie, description FROM MaintenanceTypes ORDER BY categorie, libelle")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{"code": r[0], "libelle": r[1], "categorie": r[2], "description": r[3]} for r in rows])

@maintenance_bp.route('/api/maintenance/requests', methods=['GET'])
def get_maintenance_requests():
    status_filter = request.args.get("status")
    structure_filter = request.args.get("structure_filter")
    type_filter = request.args.get("type")
    categorie_filter = request.args.get("categorie")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    where_clauses = []
    params = []
    
    if status_filter:
        where_clauses.append("m.status = ?")
        params.append(status_filter)
    if structure_filter:
        where_clauses.append("m.demandeur_structure = ?")
        params.append(structure_filter)
    if type_filter:
        where_clauses.append("m.type_maintenance = ?")
        params.append(type_filter)
    if categorie_filter:
        where_clauses.append("mt.categorie = ?")
        params.append(categorie_filter)
    if date_from:
        where_clauses.append("m.date_debut >= ?")
        params.append(date_from)
    if date_to:
        where_clauses.append("m.date_fin <= ?")
        params.append(date_to)
    
    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    
    # FIX: Changed eq.[Code Prestation] to eq.Code_Prestation 
    # FIX: Changed eq.[Prestation] to eq.Prestation
    query = f"""
        SELECT m.id, m.code_prestation, eq.Prestation as equipement,
               m.type_maintenance, mt.libelle as type_libelle, mt.categorie,
               m.date_debut, m.date_fin, m.kilometrage_actuel,
               m.description, m.status,
               m.demandeur_matricule, rh.nom, rh.prenom, m.demandeur_structure,
               m.date_demande, m.validateur_matricule, m.date_validation
        FROM MaintenanceRequests m
        JOIN MaintenanceTypes mt ON m.type_maintenance = mt.code
        JOIN ListeEquipement eq ON m.code_prestation = eq."Code Prestation"
        LEFT JOIN RH rh ON m.demandeur_matricule = rh.matricule
        {where_sql}
        ORDER BY m.date_demande DESC
    """
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": r[0],
            "code_prestation": r[1],
            "equipement": r[2],
            "type_maintenance": r[3],
            "type_libelle": r[4],
            "categorie": r[5],
            "date_debut": format_date(r[6]),
            "date_fin": format_date(r[7]),
            "kilometrage_actuel": r[8],
            "description": r[9],
            "status": r[10],
            "demandeur_matricule": r[11],
            "demandeur_nom": f"{r[12]} {r[13]}" if r[12] and r[13] else r[11],
            "demandeur_structure": r[14],
            "date_demande": format_date(r[15], "%Y-%m-%d %H:%M"),
            "validateur_matricule": r[16],
            "date_validation": format_date(r[17], "%Y-%m-%d %H:%M")
        })
    
    return jsonify(results)

@maintenance_bp.route('/api/maintenance/requests', methods=['POST'])
def create_maintenance_request():
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO MaintenanceRequests 
        (code_prestation, type_maintenance, date_debut, date_fin, 
         kilometrage_actuel, description, demandeur_matricule, demandeur_structure)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get('code_prestation'),
        data.get('type_maintenance'),
        data.get('date_debut'),
        data.get('date_fin'),
        data.get('kilometrage_actuel') or None,
        data.get('description'),
        data.get('demandeur_matricule'),
        data.get('demandeur_structure')
    ))
    
    request_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Demande de maintenance créée", "id": request_id}), 201

@maintenance_bp.route('/api/maintenance/requests/<int:request_id>/valider', methods=['POST'])
def valider_maintenance_request(request_id):
    data = request.json
    matricule = data.get('matricule')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT status FROM MaintenanceRequests WHERE id = ?", (request_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Demande introuvable"}), 404
    if row[0] != 'EN_ATTENTE':
        conn.close()
        return jsonify({"error": f"Impossible de valider: statut actuel est '{row[0]}'"}), 400
    
    cursor.execute("""
        UPDATE MaintenanceRequests 
        SET status = 'VALIDE', validateur_matricule = ?, date_validation = datetime('now', 'localtime')
        WHERE id = ?
    """, (matricule, request_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Maintenance validée avec succès"})

@maintenance_bp.route('/api/maintenance/requests/<int:request_id>/rejeter', methods=['POST'])
def rejeter_maintenance_request(request_id):
    data = request.json
    matricule = data.get('matricule')
    motif = data.get('motif', '').strip()
    
    if not motif:
        return jsonify({"error": "Le motif de rejet est obligatoire"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT status FROM MaintenanceRequests WHERE id = ?", (request_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Demande introuvable"}), 404
    
    cursor.execute("""
        UPDATE MaintenanceRequests 
        SET status = 'REJETE', validateur_matricule = ?, date_validation = datetime('now', 'localtime'), motif_rejet = ?
        WHERE id = ?
    """, (matricule, motif, request_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Maintenance rejetée"})

@maintenance_bp.route('/api/maintenance/requests/<int:request_id>/terminer', methods=['POST'])
def terminer_maintenance_request(request_id):
    data = request.json
    matricule = data.get('matricule')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT status FROM MaintenanceRequests WHERE id = ?", (request_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Demande introuvable"}), 404
    if row[0] != 'VALIDE':
        conn.close()
        return jsonify({"error": f"Impossible de terminer: statut actuel est '{row[0]}'"}), 400
    
    cursor.execute("""
        UPDATE MaintenanceRequests 
        SET status = 'TERMINE', date_fin_reelle = datetime('now', 'localtime')
        WHERE id = ?
    """, (request_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Maintenance terminée avec succès"})

@maintenance_bp.route('/api/maintenance/rules', methods=['GET'])
def get_maintenance_rules():
    code_prestation = request.args.get('code_prestation')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # FIX: Changed eq.[Code Prestation] to eq.Code_Prestation 
    # FIX: Changed eq.[Prestation] to eq.Prestation
    if code_prestation:
        cursor.execute("""
            SELECT r.id, r.code_prestation, eq.Prestation, r.type_maintenance, mt.libelle, mt.categorie,
                   r.interval_km, r.interval_days, r.alert_before_km, r.alert_before_days, r.is_active
            FROM MaintenanceRules r
            JOIN ListeEquipement eq ON r.code_prestation = eq."Code Prestation"
            JOIN MaintenanceTypes mt ON r.type_maintenance = mt.code
            WHERE r.code_prestation = ? AND r.is_active = 1
            ORDER BY mt.categorie, mt.libelle
        """, (code_prestation,))
    else:
        cursor.execute("""
            SELECT r.id, r.code_prestation, eq.Prestation, r.type_maintenance, mt.libelle, mt.categorie,
                   r.interval_km, r.interval_days, r.alert_before_km, r.alert_before_days, r.is_active
            FROM MaintenanceRules r
            JOIN ListeEquipement eq ON r.code_prestation = eq."Code Prestation"
            JOIN MaintenanceTypes mt ON r.type_maintenance = mt.code
            WHERE r.is_active = 1
            ORDER BY eq.Prestation, mt.categorie, mt.libelle
        """)
    
    rows = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        "id": r[0],
        "code_prestation": r[1],
        "equipement": r[2],
        "type_maintenance": r[3],
        "type_libelle": r[4],
        "categorie": r[5],
        "interval_km": r[6],
        "interval_days": r[7],
        "alert_before_km": r[8],
        "alert_before_days": r[9],
        "is_active": r[10]
    } for r in rows])

@maintenance_bp.route('/api/maintenance/rules', methods=['POST'])
def create_maintenance_rule():
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO MaintenanceRules 
        (code_prestation, type_maintenance, interval_km, interval_days, 
         alert_before_km, alert_before_days)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data.get('code_prestation'),
        data.get('type_maintenance'),
        data.get('interval_km'),
        data.get('interval_days'),
        data.get('alert_before_km', 500),
        data.get('alert_before_days', 7)
    ))
    
    rule_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Règle de maintenance créée", "id": rule_id}), 201