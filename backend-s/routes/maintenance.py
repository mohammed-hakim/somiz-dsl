from utils.date import format_date
from flask import Blueprint, request, jsonify, g
from db.connection import get_db_connection
from utils.auth_middleware import require_auth
from utils.logger import log_transaction

maintenance_bp = Blueprint('maintenance', __name__)

def _client_info():
    """Extract client machine info from request headers set by the frontend."""
    return {
        'compte_win': request.headers.get('X-Client-Win-Account', ''),
        'nom_machine': request.headers.get('X-Client-Machine', '')
    }




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
        log_transaction(cursor, request_id, g.user['matricule'], "Création demande maintenance", request.remote_addr, table_name='MaintenanceRequests', **_client_info())
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
        
        log_transaction(cursor, request_id, matricule, "Validation demande maintenance", request.remote_addr, table_name='MaintenanceRequests', **_client_info())
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
        
        log_transaction(cursor, request_id, matricule, f"Rejet demande maintenance - Motif: {motif}", request.remote_addr, table_name='MaintenanceRequests', **_client_info())
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
        
        log_transaction(cursor, request_id, matricule, "Clôture (TERMINER) maintenance", request.remote_addr, table_name='MaintenanceRequests', **_client_info())
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
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    search = request.args.get('search', '').strip()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    base_query = """
        FROM MaintenanceRules r
        JOIN ListeEquipement eq ON r.code_prestation = eq."Code Prestation"
        JOIN MaintenanceTypes mt ON r.type_maintenance = mt.code
        WHERE r.is_active = 1
    """
    
    params = []
    
    if search:
        base_query += ' AND (r.code_prestation LIKE ? OR eq.Prestation LIKE ?)'
        params.extend([f'%{search}%', f'%{search}%'])
        
    # Get total count
    count_query = f"SELECT COUNT(*) {base_query}"
    cursor.execute(count_query, params)
    total = cursor.fetchone()[0]
    total_pages = (total + per_page - 1) // per_page
    
    # Get paginated data
    data_query = f"""
        SELECT r.id, r.code_prestation, eq.Prestation, r.type_maintenance, mt.libelle, mt.categorie,
               r.interval_km, r.interval_days, r.alert_before_km, r.alert_before_days, r.is_active
        {base_query}
        ORDER BY r.code_prestation, mt.categorie, mt.libelle
        LIMIT ? OFFSET ?
    """
    params.extend([per_page, (page - 1) * per_page])
    cursor.execute(data_query, params)
    
    rows = cursor.fetchall()
    conn.close()
    
    data = [{
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
    } for r in rows]
    
    return jsonify({
        "data": data,
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": total_pages
    })

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
        log_transaction(cursor, rule_id, g.user['matricule'], "Création règle maintenance", request.remote_addr, table_name='MaintenanceRules', **_client_info())
        conn.commit()
        return jsonify({"message": "Règle de maintenance créée", "id": rule_id}), 201
    except Exception as e:
        conn.rollback()
        print(f"Transaction failed: {e}")
        return jsonify({"error": "Erreur interne du serveur lors de la création de la règle."}), 500
    finally:
        conn.close()


# ============================================================
# MAINTENANCE ALERTS ENGINE
# ============================================================

from datetime import datetime, timedelta

@maintenance_bp.route('/api/maintenance/alerts', methods=['GET'])
@require_auth
def get_maintenance_alerts():
    """
    For each active rule, find the last TERMINE maintenance of that type+equipment.
    Compare against the rule interval to compute next_due_date / next_due_km.
    Return alerts sorted by urgency.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all active rules with equipment info
    cursor.execute("""
        SELECT r.id, r.code_prestation, eq.Prestation, r.type_maintenance, mt.libelle, mt.categorie,
               r.interval_km, r.interval_days, r.alert_before_km, r.alert_before_days,
               r.created_at
        FROM MaintenanceRules r
        JOIN ListeEquipement eq ON r.code_prestation = eq."Code Prestation"
        JOIN MaintenanceTypes mt ON r.type_maintenance = mt.code
        WHERE r.is_active = 1
        ORDER BY r.code_prestation
    """)
    rules = cursor.fetchall()
    
    today = datetime.now()
    alerts = []
    
    for rule in rules:
        rule_id = rule[0]
        code = rule[1]
        equipement = rule[2]
        type_code = rule[3]
        type_libelle = rule[4]
        categorie = rule[5]
        interval_km = rule[6]
        interval_days = rule[7]
        alert_before_km = rule[8]
        alert_before_days = rule[9]
        rule_created = rule[10]
        
        # Find the last completed maintenance for this equipment+type
        cursor.execute("""
            SELECT date_fin_reelle, kilometrage_actuel
            FROM MaintenanceRequests
            WHERE code_prestation = ? AND type_maintenance = ? AND status = 'TERMINE'
            ORDER BY date_fin_reelle DESC
            LIMIT 1
        """, (code, type_code))
        last = cursor.fetchone()
        
        # Check if there's already a pending/active maintenance for this combo
        cursor.execute("""
            SELECT id FROM MaintenanceRequests
            WHERE code_prestation = ? AND type_maintenance = ?
            AND status IN ('EN_ATTENTE', 'VALIDE', 'EN_COURS')
            LIMIT 1
        """, (code, type_code))
        pending = cursor.fetchone()
        
        alert_entry = {
            "rule_id": rule_id,
            "code_prestation": code,
            "equipement": equipement,
            "type_maintenance": type_code,
            "type_libelle": type_libelle,
            "categorie": categorie,
            "has_pending": pending is not None,
            "time_alert": None,
            "km_alert": None,
            "urgency": "OK"  # OK, WARNING, CRITICAL, OVERDUE
        }
        
        # ===== TIME-BASED EVALUATION =====
        if interval_days:
            if last and last[0]:
                try:
                    last_date = datetime.fromisoformat(last[0].split('.')[0])
                except (ValueError, AttributeError):
                    last_date = datetime.fromisoformat(rule_created.split('.')[0]) if rule_created else today
            else:
                # No past maintenance — use rule creation date as baseline
                last_date = datetime.fromisoformat(rule_created.split('.')[0]) if rule_created else today
            
            next_due = last_date + timedelta(days=interval_days)
            days_remaining = (next_due - today).days
            alert_threshold = alert_before_days or 0
            
            time_urgency = "OK"
            if days_remaining < 0:
                time_urgency = "OVERDUE"
            elif days_remaining <= alert_threshold:
                time_urgency = "CRITICAL"
            elif days_remaining <= alert_threshold * 2:
                time_urgency = "WARNING"
            
            alert_entry["time_alert"] = {
                "last_date": last_date.strftime("%Y-%m-%d") if last_date else None,
                "next_due": next_due.strftime("%Y-%m-%d"),
                "days_remaining": days_remaining,
                "interval_days": interval_days,
                "alert_threshold": alert_threshold,
                "urgency": time_urgency
            }
        
        # ===== KM-BASED EVALUATION =====
        if interval_km:
            # Get current km from EquipementKm table
            cursor.execute("SELECT current_km FROM EquipementKm WHERE code_prestation = ?", (code,))
            km_row = cursor.fetchone()
            current_km = km_row[0] if km_row else None
            
            last_km = last[1] if last else None
            
            if current_km is not None and last_km is not None:
                km_since_last = current_km - last_km
                km_remaining = interval_km - km_since_last
                km_threshold = alert_before_km or 0
                
                km_urgency = "OK"
                if km_remaining < 0:
                    km_urgency = "OVERDUE"
                elif km_remaining <= km_threshold:
                    km_urgency = "CRITICAL"
                elif km_remaining <= km_threshold * 2:
                    km_urgency = "WARNING"
                    
                alert_entry["km_alert"] = {
                    "last_km": last_km,
                    "current_km": current_km,
                    "next_due_km": last_km + interval_km,
                    "km_remaining": km_remaining,
                    "interval_km": interval_km,
                    "alert_threshold": km_threshold,
                    "urgency": km_urgency
                }
            elif current_km is not None and last_km is None:
                # No previous maintenance km baseline — show as needing attention
                alert_entry["km_alert"] = {
                    "last_km": None,
                    "current_km": current_km,
                    "next_due_km": None,
                    "km_remaining": None,
                    "interval_km": interval_km,
                    "alert_threshold": alert_before_km or 0,
                    "urgency": "WARNING",
                    "note": "Aucune maintenance passée enregistrée pour établir une base km."
                }
            else:
                alert_entry["km_alert"] = {
                    "last_km": last_km,
                    "current_km": None,
                    "next_due_km": None,
                    "km_remaining": None,
                    "interval_km": interval_km,
                    "alert_threshold": alert_before_km or 0,
                    "urgency": "UNKNOWN",
                    "note": "Kilométrage actuel non renseigné."
                }
        
        # Compute overall urgency (worst of time + km)
        urgency_order = {"OVERDUE": 4, "CRITICAL": 3, "WARNING": 2, "UNKNOWN": 1, "OK": 0}
        time_u = alert_entry["time_alert"]["urgency"] if alert_entry["time_alert"] else "OK"
        km_u = alert_entry["km_alert"]["urgency"] if alert_entry["km_alert"] else "OK"
        overall = max(time_u, km_u, key=lambda x: urgency_order.get(x, 0))
        alert_entry["urgency"] = overall
        
        alerts.append(alert_entry)
    
    conn.close()
    
    # Sort: OVERDUE first, then CRITICAL, WARNING, UNKNOWN, OK
    alerts.sort(key=lambda a: urgency_order.get(a["urgency"], 0), reverse=True)
    
    # Count by urgency for the summary
    summary = {
        "overdue": sum(1 for a in alerts if a["urgency"] == "OVERDUE"),
        "critical": sum(1 for a in alerts if a["urgency"] == "CRITICAL"),
        "warning": sum(1 for a in alerts if a["urgency"] == "WARNING"),
        "ok": sum(1 for a in alerts if a["urgency"] in ("OK", "UNKNOWN")),
        "total": len(alerts)
    }
    
    return jsonify({
        "summary": summary,
        "alerts": alerts
    })


# ============================================================
# EQUIPMENT KM TRACKING
# ============================================================

@maintenance_bp.route('/api/equipements/<path:code_prestation>/km', methods=['GET'])
@require_auth
def get_equipment_km(code_prestation):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT current_km, updated_at, updated_by FROM EquipementKm WHERE code_prestation = ?", (code_prestation,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return jsonify({"code_prestation": code_prestation, "current_km": row[0], "updated_at": row[1], "updated_by": row[2]})
    return jsonify({"code_prestation": code_prestation, "current_km": None, "updated_at": None, "updated_by": None})


@maintenance_bp.route('/api/equipements/<path:code_prestation>/km', methods=['PUT'])
@require_auth
def update_equipment_km(code_prestation):
    data = request.json
    new_km = data.get('current_km')
    
    if new_km is None:
        return jsonify({"error": "current_km est obligatoire"}), 400
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO EquipementKm (code_prestation, current_km, updated_by)
            VALUES (?, ?, ?)
            ON CONFLICT(code_prestation) DO UPDATE SET
                current_km = excluded.current_km,
                updated_at = datetime('now', 'localtime'),
                updated_by = excluded.updated_by
        """, (code_prestation, int(new_km), g.user['matricule']))
        conn.commit()
        return jsonify({"message": "Kilométrage mis à jour", "current_km": int(new_km)})
    except Exception as e:
        conn.rollback()
        print(f"Transaction failed: {e}")
        return jsonify({"error": "Erreur lors de la mise à jour du kilométrage."}), 500
    finally:
        conn.close()