from utils.date import format_date
from flask import Blueprint, request, jsonify, g
from db.connection import get_db_connection
from utils.auth_middleware import require_auth

maintenance_bp = Blueprint('maintenance', __name__)



@maintenance_bp.route('/api/maintenance/types', methods=['GET'])
def get_maintenance_types():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT code, libelle, categorie, description FROM MaintenanceTypes ORDER BY categorie, libelle")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{"code": r[0], "libelle": r[1], "categorie": r[2], "description": r[3]} for r in rows])

@maintenance_bp.route('/api/maintenance/stats', methods=['GET'])
@require_auth
def get_maintenance_stats():
    """Return aggregated counts by status and categorie — lightweight endpoint for dashboards."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    period = request.args.get('period', 'max')
    where_clause = ""
    if period == 'day':
        where_clause = " WHERE m.date_demande >= datetime('now', 'localtime', '-1 day')"
    elif period == 'week':
        where_clause = " WHERE m.date_demande >= datetime('now', 'localtime', '-7 days')"
    elif period == 'month':
        where_clause = " WHERE m.date_demande >= datetime('now', 'localtime', '-1 month')"
    elif period == 'year':
        where_clause = " WHERE m.date_demande >= datetime('now', 'localtime', '-1 year')"
        
    # Counts by status
    cursor.execute(f"""
        SELECT m.status, COUNT(*) as cnt
        FROM MaintenanceRequests m
        {where_clause}
        GROUP BY m.status
    """)
    status_rows = cursor.fetchall()
    
    # Counts by categorie
    cursor.execute(f"""
        SELECT mt.categorie, COUNT(*) as cnt
        FROM MaintenanceRequests m
        JOIN MaintenanceTypes mt ON m.type_maintenance = mt.code
        {where_clause}
        GROUP BY mt.categorie
    """)
    cat_rows = cursor.fetchall()
    
    # Total
    cursor.execute(f"SELECT COUNT(*) FROM MaintenanceRequests m {where_clause}")
    total = cursor.fetchone()[0]
    
    conn.close()
    
    by_status = {}
    for r in status_rows:
        by_status[r[0]] = r[1]
    
    by_categorie = {}
    for r in cat_rows:
        by_categorie[r[0]] = r[1]
    
    return jsonify({
        "total": total,
        "by_status": by_status,
        "by_categorie": by_categorie
    })

@maintenance_bp.route('/api/maintenance/requests', methods=['GET'])
@require_auth
def get_maintenance_requests():
    status_filter = request.args.get("status")
    structure_filter = request.args.get("structure_filter")
    type_filter = request.args.get("type")
    categorie_filter = request.args.get("categorie")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    
    # Pagination params
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    per_page = min(per_page, 100)
    offset = (page - 1) * per_page
    
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
    
    from_clause = """
        FROM MaintenanceRequests m
        JOIN MaintenanceTypes mt ON m.type_maintenance = mt.code
        JOIN ListeEquipement eq ON m.code_prestation = eq."Code Prestation"
        LEFT JOIN RH rh ON m.demandeur_matricule = rh.matricule
    """
    
    # Count total
    count_q = "SELECT COUNT(*) " + from_clause + where_sql
    cursor.execute(count_q, params)
    total = cursor.fetchone()[0]
    
    # Fetch paginated data
    query = f"""
        SELECT m.id, m.code_prestation, eq.Prestation as equipement,
               m.type_maintenance, mt.libelle as type_libelle, mt.categorie,
               m.date_debut, m.date_fin, m.kilometrage_actuel,
               m.description, m.status,
               m.demandeur_matricule, rh.nom, rh.prenom, m.demandeur_structure,
               m.date_demande, m.validateur_matricule, m.date_validation
        {from_clause}
        {where_sql}
        ORDER BY m.date_demande DESC
        LIMIT ? OFFSET ?
    """
    
    cursor.execute(query, params + [per_page, offset])
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
    
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    return jsonify({
        "data": results,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    })

@maintenance_bp.route('/api/maintenance/requests', methods=['POST'])
@require_auth
def create_maintenance_request():
    data = request.json
    
    conn = get_db_connection()
    try:
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
            g.user['matricule'],
            g.user['structure']
        ))
        
        request_id = cursor.lastrowid
        conn.commit()
        return jsonify({"message": "Demande de maintenance créée", "id": request_id}), 201
    except Exception as e:
        conn.rollback()
        print(f"Transaction failed: {e}")
        return jsonify({"error": "Erreur interne du serveur lors de la création de la demande de maintenance."}), 500
    finally:
        conn.close()

@maintenance_bp.route('/api/maintenance/requests/<int:request_id>/valider', methods=['POST'])
@require_auth
def valider_maintenance_request(request_id):
    matricule = g.user['matricule']
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute("SELECT status FROM MaintenanceRequests WHERE id = ?", (request_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Demande introuvable"}), 404
        if row[0] != 'EN_ATTENTE':
            return jsonify({"error": f"Impossible de valider: statut actuel est '{row[0]}'"}), 400
        
        cursor.execute("""
            UPDATE MaintenanceRequests 
            SET status = 'VALIDE', validateur_matricule = ?, date_validation = datetime('now', 'localtime')
            WHERE id = ?
        """, (matricule, request_id))
        
        conn.commit()
        return jsonify({"message": "Maintenance validée avec succès"})
    except Exception as e:
        conn.rollback()
        print(f"Transaction failed: {e}")
        return jsonify({"error": "Erreur interne du serveur lors de la validation."}), 500
    finally:
        conn.close()

@maintenance_bp.route('/api/maintenance/requests/<int:request_id>/rejeter', methods=['POST'])
@require_auth
def rejeter_maintenance_request(request_id):
    data = request.json
    matricule = g.user['matricule']
    motif = data.get('motif', '').strip()
    
    if not motif:
        return jsonify({"error": "Le motif de rejet est obligatoire"}), 400
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute("SELECT status FROM MaintenanceRequests WHERE id = ?", (request_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Demande introuvable"}), 404
        
        cursor.execute("""
            UPDATE MaintenanceRequests 
            SET status = 'REJETE', validateur_matricule = ?, date_validation = datetime('now', 'localtime'), motif_rejet = ?
            WHERE id = ?
        """, (matricule, motif, request_id))
        
        conn.commit()
        return jsonify({"message": "Maintenance rejetée"})
    except Exception as e:
        conn.rollback()
        print(f"Transaction failed: {e}")
        return jsonify({"error": "Erreur interne du serveur lors du rejet."}), 500
    finally:
        conn.close()

@maintenance_bp.route('/api/maintenance/requests/<int:request_id>/terminer', methods=['POST'])
@require_auth
def terminer_maintenance_request(request_id):
    matricule = g.user['matricule']
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute("SELECT status FROM MaintenanceRequests WHERE id = ?", (request_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Demande introuvable"}), 404
        if row[0] != 'VALIDE':
            return jsonify({"error": f"Impossible de terminer: statut actuel est '{row[0]}'"}), 400
        
        cursor.execute("""
            UPDATE MaintenanceRequests 
            SET status = 'TERMINE', date_fin_reelle = datetime('now', 'localtime')
            WHERE id = ?
        """, (request_id,))
        
        conn.commit()
        return jsonify({"message": "Maintenance terminée avec succès"})
    except Exception as e:
        conn.rollback()
        print(f"Transaction failed: {e}")
        return jsonify({"error": "Erreur interne du serveur lors de la clôture."}), 500
    finally:
        conn.close()

@maintenance_bp.route('/api/maintenance/rules', methods=['GET'])
@require_auth
def get_maintenance_rules():
    code_prestation = request.args.get('code_prestation')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    
    
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
@require_auth
def create_maintenance_rule():
    data = request.json
    
    conn = get_db_connection()
    try:
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
        return jsonify({"message": "Règle de maintenance créée", "id": rule_id}), 201
    except Exception as e:
        conn.rollback()
        print(f"Transaction failed: {e}")
        return jsonify({"error": "Erreur interne du serveur lors de la création de la règle."}), 500
    finally:
        conn.close()