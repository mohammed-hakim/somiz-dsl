from flask import Blueprint, request, jsonify, g
from db.connection import get_db_connection
from utils.logger import log_transaction
from datetime import datetime
from utils.auth_middleware import require_auth

demandes_bp = Blueprint('demandes', __name__)

@demandes_bp.route('/api/demandes', methods=['POST'])
@require_auth
def create_demande():
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 0. Check role from token instead of db fallback
    creator_matricule = g.user['matricule']
    if g.user['role'] == 'chef departement':
        return jsonify({"error": "Chef Departement cannot create Demandes directly. Only approve."}), 403

    # 1. Validation for Engine Availability (Moved to DSL step/frontend)
    requested_engins = data.get('engins', [])
            
    # 2. Generate num_demande
    year = str(datetime.now().year)[-2:]
    structure = data.get('structure', 'GEN')
    
    # Compteur séquentiel basé sur le nombre de demandes existantes
    cursor.execute("SELECT COUNT(*) FROM Demandes")
    count = cursor.fetchone()[0]
    next_num = count + 1
    
    num_demande = f"{structure}-{next_num}-{year}"
    utilisateur = creator_matricule
    actual_creator = creator_matricule
    demandeur_structure = g.user['structure']
    
    validateur_demandeur = data.get('validateur_demandeur')
    
    if validateur_demandeur:
        q = """
        INSERT INTO Demandes (
            num_demande, Code_Affaire, 
            Date_Debut_Prestation, Date_Fin_Prestation,
            description, Observation, utilisateur, Status,
            ref_ods_client, lieu_prestation,
            validateur_demandeur, date_validation_demandeur, demandeur_structure
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Validé', ?, ?, ?, datetime('now'), ?)
        """
        params = (
            num_demande,  
            data.get('code_affaire'), 
            data.get('date_debut'), 
            data.get('date_fin'), 
            data.get('description'), 
            data.get('observation'), 
            utilisateur,
            data.get('ref_ods_client'),
            data.get('lieu_prestation'),
            validateur_demandeur,
            demandeur_structure
        )
    else:
        q = """
        INSERT INTO Demandes (
            num_demande, Code_Affaire, 
            Date_Debut_Prestation, Date_Fin_Prestation,
            description, Observation, utilisateur, Status,
            ref_ods_client, lieu_prestation,
            demandeur_structure
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'En Attente', ?, ?, ?)
        """
        params = (
            num_demande,  
            data.get('code_affaire'), 
            data.get('date_debut'), 
            data.get('date_fin'), 
            data.get('description'), 
            data.get('observation'), 
            utilisateur,
            data.get('ref_ods_client'),
            data.get('lieu_prestation'),
            demandeur_structure
        )
        
    cursor.execute(q, params)
    
    for code in requested_engins:
        cursor.execute("INSERT INTO Demande_Engins (num_demande, Code_Prestation) VALUES (?, ?)", (num_demande, code))
        
    log_transaction(cursor, num_demande, utilisateur, "Création de la demande", request.remote_addr, actual_creator)
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Demande créée", "num_demande": num_demande}), 201

@demandes_bp.route('/api/demandes/stats', methods=['GET'])
@require_auth
def get_demandes_stats():
    """Return aggregated counts by status — lightweight endpoint for dashboards."""
    matricule = g.user['matricule']
    role = g.user['role']
    structure = g.user['structure']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    from_clause = """
    FROM vue_demandes v
    """
    
    conditions = []
    params = []
    
    if structure == 'DSL':
        conditions.append("v.Status IN ('Validé', 'Approuvé', 'En Cours', 'Clôturé', 'Rejeté', 'Annulé', 'Sous Traitance')")
        conditions.append("v.date_validation_demandeur IS NOT NULL")
    elif structure == 'CPA':
        conditions.append("(v.Status = 'Sous Traitance' OR EXISTS (SELECT 1 FROM Journal j WHERE j.CODE_PIECE = v.num_demande AND j.TYPE_OPERATION LIKE '%CPA%'))")
        conditions.append("v.date_validation_demandeur IS NOT NULL")
    elif role == 'agent':
        conditions.append("v.utilisateur = ?")
        params.append(matricule)
    elif role == 'chef departement':
        conditions.append("v.demandeur_structure = ?")
        params.append(structure)
    elif role in ('chef service', 'secretaire'):
        conditions.append("v.demandeur_structure = ?")
        params.append(structure)
    
    period = request.args.get('period', 'max')
    
    if period == 'day':
        conditions.append("v.Date_Demande >= datetime('now', 'localtime', '-1 day')")
    elif period == 'week':
        conditions.append("v.Date_Demande >= datetime('now', 'localtime', '-7 days')")
    elif period == 'month':
        conditions.append("v.Date_Demande >= datetime('now', 'localtime', '-1 month')")
    elif period == 'year':
        conditions.append("v.Date_Demande >= datetime('now', 'localtime', '-1 year')")

    where_clause = ""
    if conditions:
        where_clause = " WHERE " + " AND ".join(conditions)
    
    # Get counts grouped by status
    q = "SELECT v.Status, COUNT(*) as cnt " + from_clause + where_clause + " GROUP BY v.Status"
    cursor.execute(q, params)
    rows = cursor.fetchall()
    
    # Get total
    q_total = "SELECT COUNT(*) " + from_clause + where_clause
    cursor.execute(q_total, params)
    total = cursor.fetchone()[0]
    
    conn.close()
    
    status_counts = {}
    for r in rows:
        status_counts[r[0]] = r[1]
    
    return jsonify({
        "total": total,
        "by_status": status_counts
    })

@demandes_bp.route('/api/demandes', methods=['GET'])
@require_auth
def get_demandes():
    matricule = g.user['matricule']
    role = g.user['role']
    structure = g.user['structure']
    
    # Filter params
    f_status = request.args.get("status")
    f_date_from = request.args.get("date_from")
    f_date_to = request.args.get("date_to")
    f_structure_search = request.args.get("structure_search")
    
    # Pagination params
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    per_page = min(per_page, 100)  # cap at 100
    offset = (page - 1) * per_page
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build the base FROM/WHERE clause (shared by count and data queries)
    from_clause = """
    FROM vue_demandes v
    LEFT JOIN RH rh ON v.utilisateur = rh.matricule
    """
    
    conditions = []
    params = []
    
    if structure == 'DSL':
        conditions.append("v.Status IN ('Validé', 'Approuvé', 'En Cours', 'Clôturé', 'Rejeté', 'Annulé', 'Sous Traitance')")
        conditions.append("v.date_validation_demandeur IS NOT NULL")
    elif structure == 'CPA':
        conditions.append("(v.Status = 'Sous Traitance' OR EXISTS (SELECT 1 FROM Journal j WHERE j.CODE_PIECE = v.num_demande AND j.TYPE_OPERATION LIKE '%CPA%'))")
        conditions.append("v.date_validation_demandeur IS NOT NULL")
    elif role == 'agent':
        conditions.append("v.utilisateur = ?")
        params.append(matricule)
    elif role == 'chef departement':
        conditions.append("v.demandeur_structure = ?")
        params.append(structure)
    elif role in ('chef service', 'secretaire'):
        conditions.append("v.demandeur_structure = ?")
        params.append(structure)
    
    if f_status:
        conditions.append("v.Status = ?")
        params.append(f_status)
    if f_date_from:
        conditions.append("v.Date_Debut_Prestation >= ?")
        params.append(f_date_from)
    if f_date_to:
        conditions.append("v.Date_Fin_Prestation <= ?")
        params.append(f_date_to)
    if f_structure_search:
        conditions.append("(v.Structure_Intitule LIKE ? OR v.Code_Structure LIKE ? OR v.Structure_Initial LIKE ? OR v.demandeur_structure LIKE ?)")
        search_term = f'%{f_structure_search}%'
        params.extend([search_term, search_term, search_term, search_term])
    
    where_clause = ""
    if conditions:
        where_clause = " WHERE " + " AND ".join(conditions)
    
    # Count total matching rows
    count_q = "SELECT COUNT(*) " + from_clause + where_clause
    cursor.execute(count_q, params)
    total = cursor.fetchone()[0]
    
    # Fetch paginated data
    data_q = """
    SELECT v.num_demande, v.Date_Demande, v.CLIENT, v.Status,
           v.Code_Structure, v.Structure_Initial, v.demandeur_structure,
           rh.nom, rh.prenom, v.Date_Debut_Prestation
    """ + from_clause + where_clause + " ORDER BY v.Date_Demande DESC LIMIT ? OFFSET ?"
    
    cursor.execute(data_q, params + [per_page, offset])
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        results.append({
            "num_demande": r[0],
            "date_demande": r[1][:16] if r[1] else "",
            "client": r[2] or "",
            "status": r[3],
            "code_structure": r[4] or "",
            "structure_initial": r[5] or "",
            "demandeur_structure": r[6] or "",
            "demandeur": f"{r[7]} {r[8]}" if r[7] else "",
            "date_debut_prestation": r[9][:10] if r[9] else ""
        })

    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    return jsonify({
        "data": results,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    })

@demandes_bp.route('/api/demandes/<num_demande>', methods=['GET'])
@require_auth
def get_demande_detail(num_demande):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # On utilise la vue pour inclure client et structure
    q = """
    SELECT v.*, d.date_cpa,
           rh.nom as dem_nom, rh.prenom as dem_prenom, rh.role as dem_role,
           rh_vd.nom as val_dem_nom, rh_vd.prenom as val_dem_prenom,
           rh_dsl.nom as val_dsl_nom, rh_dsl.prenom as val_dsl_prenom
    FROM vue_demandes v
    JOIN Demandes d ON v.num_demande = d.num_demande
    LEFT JOIN RH rh ON v.utilisateur = rh.matricule
    LEFT JOIN RH rh_vd ON v.validateur_demandeur = rh_vd.matricule
    LEFT JOIN RH rh_dsl ON v.validateur_dsl = rh_dsl.matricule
    WHERE v.num_demande = ?
    """
    cursor.execute(q, (num_demande,))
    columns = [column[0] for column in cursor.description]
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return jsonify({"error": "Not found"}), 404
        
    d_dict = dict(zip(columns, row))
    
    # Get engins
    cursor.execute("""
        SELECT eq."Code Prestation", eq.Prestation 
        FROM Demande_Engins de
        JOIN ListeEquipement eq ON de.Code_Prestation = eq."Code Prestation"
        WHERE de.num_demande = ?
    """, (num_demande,))
    engins = [{"code": r[0], "prestation": r[1]} for r in cursor.fetchall()]
    
    d_dict['engins_detail'] = engins
    
    # Get annulation info from journal if status is Annulé
    if d_dict.get('Status') == 'Annulé':
        cursor.execute("""
            SELECT j.UTILISATEUR, j.DATE, j.OBSERVATION,
                   rh.nom, rh.prenom, rh.structure
            FROM Journal j
            LEFT JOIN RH rh ON j.UTILISATEUR = rh.matricule
            WHERE j.NOM_TABLE = 'Demandes' AND j.CODE_PIECE = ? AND j.TYPE_OPERATION LIKE '%Annulation%'
            ORDER BY j.DATE DESC
            LIMIT 1
        """, (num_demande,))
        annul_row = cursor.fetchone()
        if annul_row:
            d_dict['annulation_info'] = {
                'matricule': annul_row[0],
                'date': annul_row[1][:16] if annul_row[1] else None,  # SQLite text format
                'motif': annul_row[2],
                'nom': annul_row[3],
                'prenom': annul_row[4],
                'structure': annul_row[5]
            }
    
    conn.close()
    
    # Date formatting - SQLite stores dates as text, so minimal formatting needed
    for key, val in d_dict.items():
        if val and isinstance(val, str) and 'date' in key.lower():
            # Already in text format, just truncate if needed
            if len(val) > 16:
                d_dict[key] = val[:16]
            
    return jsonify(d_dict)

@demandes_bp.route('/api/demandes/<num_demande>/engins_availability', methods=['GET'])
def get_demande_engins_availability(num_demande):
    """Check availability of requested engins including maintenance periods"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get the demande dates
    cursor.execute("SELECT Date_Debut_Prestation, Date_Fin_Prestation FROM Demandes WHERE num_demande = ?", (num_demande,))
    date_row = cursor.fetchone()
    if not date_row:
        conn.close()
        return jsonify({"error": "Demande introuvable"}), 404
    
    demande_date_debut = date_row[0]
    demande_date_fin = date_row[1] or date_row[0]
    
    cursor.execute("""
        SELECT Code_Prestation FROM Demande_Engins WHERE num_demande = ?
    """, (num_demande,))
    requested_engins = [r[0] for r in cursor.fetchall()]
    
    availability = {}
    for code in requested_engins:
        # Check if already assigned to another active demande (must be Approuvé or En Cours)
        cursor.execute("""
            SELECT d.num_demande FROM Demandes d
            JOIN Demande_Engins de ON d.num_demande = de.num_demande
            WHERE de.Code_Prestation = ? 
            AND d.num_demande != ?
            AND d.Status IN ('Approuvé', 'En Cours')
        """, (code, num_demande))
        assigned_row = cursor.fetchone()
        
        # Check if in maintenance during the demande period
        cursor.execute("""
            SELECT id, date_debut, date_fin, status 
            FROM MaintenanceRequests 
            WHERE code_prestation = ? 
            AND status IN ('VALIDE', 'EN_ATTENTE')
            AND (
                (date_debut <= ? AND date_fin >= ?) OR
                (date_debut <= ? AND date_fin >= ?) OR
                (date_debut >= ? AND date_fin <= ?)
            )
        """, (code, demande_date_fin, demande_date_debut, demande_date_fin, demande_date_debut, 
              demande_date_debut, demande_date_fin))
        maintenance_row = cursor.fetchone()
        
        # Available if not assigned and not in maintenance
        availability[code] = False if (assigned_row or maintenance_row) else True
        
    conn.close()
    return jsonify(availability)

@demandes_bp.route('/api/demandes/<num_demande>/engins', methods=['PUT'])
@require_auth
def update_demande_engins(num_demande):
    """Update engins for an existing demande (DSL only)"""
    data = request.json
    engins = data.get('engins', [])
    matricule = g.user['matricule']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if demande exists and belongs to DSL
    cursor.execute("SELECT Status, demandeur_structure FROM Demandes WHERE num_demande = ?", (num_demande,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Demande introuvable"}), 404
    
    status, demandeur_structure = row
    
    # Only allow editing if status is En Attente or Validé
    if status not in ('En Attente', 'Validé'):
        conn.close()
        return jsonify({"error": f"Impossible de modifier: statut actuel est '{status}'"}), 400
    
    # Delete existing engins
    cursor.execute("DELETE FROM Demande_Engins WHERE num_demande = ?", (num_demande,))
    
    # Insert new engins
    for code in engins:
        cursor.execute("INSERT INTO Demande_Engins (num_demande, Code_Prestation) VALUES (?, ?)", (num_demande, code))
    
    log_transaction(cursor, num_demande, matricule, "Modification des engins", request.remote_addr)
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Engins mis à jour avec succès"})

@demandes_bp.route('/api/demandes/<num_demande>/valider', methods=['POST'])
@require_auth
def valider_demande(num_demande):
    matricule = g.user['matricule']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Vérifier que la demande est bien "En Attente"
    cursor.execute("SELECT Status FROM Demandes WHERE num_demande = ?", (num_demande,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Demande introuvable"}), 404
    if row[0] != 'En Attente':
        conn.close()
        return jsonify({"error": f"Impossible de valider: statut actuel est '{row[0]}'"}), 400
    
    q = """
    UPDATE Demandes
    SET Status = 'Validé', date_validation_demandeur = datetime('now'), validateur_demandeur = ?
    WHERE num_demande = ? AND Status = 'En Attente'
    """
    cursor.execute(q, (matricule, num_demande))
    log_transaction(cursor, num_demande, matricule, "Validation (Chef Département Demandeur)", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Validé avec succès"})

@demandes_bp.route('/api/demandes/<num_demande>/rejeter', methods=['POST'])
@require_auth
def rejeter_demande(num_demande):
    data = request.json
    matricule = g.user['matricule']
    motif = data.get('motif', '').strip()
    
    if not motif:
        return jsonify({"error": "Le motif de rejet est obligatoire."}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Vérifier le statut actuel
    cursor.execute("SELECT Status FROM Demandes WHERE num_demande = ?", (num_demande,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Demande introuvable"}), 404
    if row[0] in ('Clôturé', 'Rejeté', 'Annulé'):
        conn.close()
        return jsonify({"error": f"Impossible de rejeter: statut actuel est '{row[0]}'"}), 400
    
    cursor.execute("""
        UPDATE Demandes 
        SET Status = 'Rejeté',
            motif_rejet = ?
        WHERE num_demande = ?
    """, (motif, num_demande))
    log_transaction(cursor, num_demande, matricule, f"Rejet de la demande - Motif: {motif}", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Demande rejetée"})

@demandes_bp.route('/api/demandes/<num_demande>/dsl_validate', methods=['POST'])
@require_auth
def dsl_valider_demande(num_demande):
    data = request.json
    matricule = g.user['matricule']
    action = data.get('action', 'approuver')
    assigned_engins = data.get('assigned_engins', [])
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Vérifier que la demande est bien "Validé"
    cursor.execute("SELECT Status FROM Demandes WHERE num_demande = ?", (num_demande,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Demande introuvable"}), 404
    if row[0] != 'Validé':
        conn.close()
        return jsonify({"error": f"Impossible d'approuver/transférer: statut actuel est '{row[0]}'"}), 400
    
    if action == 'nd':
        q = """
        UPDATE Demandes
        SET Status = 'Sous Traitance', validateur_dsl = ?
        WHERE num_demande = ? AND Status = 'Validé'
        """
        cursor.execute(q, (matricule, num_demande))
        log_transaction(cursor, num_demande, matricule, "Passage en Sous Traitance (ND)", request.remote_addr)
        conn.commit()
        conn.close()
        return jsonify({"message": "Passé en Sous Traitance avec succès"})

    ot = data.get('ot', '').strip()
    
    if not ot:
        return jsonify({"error": "OT est obligatoire pour approuver."}), 400

    if ot:
        cursor.execute("SELECT num_demande FROM Demandes WHERE OT_ODS = ? AND num_demande != ?", (ot, num_demande))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "La Référence OT existe déjà dans la base."}), 400
            
    q = """
    UPDATE Demandes
    SET Status = 'Approuvé', date_validation_prestataire = datetime('now'), OT_ODS = ?, validateur_dsl = ?
    WHERE num_demande = ? AND Status = 'Validé'
    """
    cursor.execute(q, (ot, matricule, num_demande))
    
    if assigned_engins is not None:
        cursor.execute("DELETE FROM Demande_Engins WHERE num_demande = ?", (num_demande,))
        for code in assigned_engins:
            cursor.execute("INSERT INTO Demande_Engins (num_demande, Code_Prestation) VALUES (?, ?)", (num_demande, code))

    log_transaction(cursor, num_demande, matricule, "Approbation (Service DSL)", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Approuvé avec succès"})

@demandes_bp.route('/api/demandes/<num_demande>/cpa_validate', methods=['POST'])
@require_auth
def cpa_valider_demande(num_demande):
    data = request.json
    matricule = g.user['matricule']
    ods = data.get('ods', '').strip()
    date_cpa = data.get('date_cpa', '').strip()
    fournisseur = data.get('fournisseur', '').strip()
    
    if not ods or not fournisseur or not date_cpa:
        return jsonify({"error": "ODS, Date et Fournisseur sont obligatoires pour valider en CPA."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Vérifier que la demande est bien "Sous Traitance"
    cursor.execute("SELECT Status FROM Demandes WHERE num_demande = ?", (num_demande,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Demande introuvable"}), 404
    if row[0] != 'Sous Traitance':
        conn.close()
        return jsonify({"error": f"Impossible d'approuver: statut actuel est '{row[0]}'"}), 400
        
    if ods:
        cursor.execute("SELECT num_demande FROM Demandes WHERE OT_ODS = ? AND num_demande != ?", (ods, num_demande))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "La Référence ODS existe déjà dans la base."}), 400
            
    q = """
    UPDATE Demandes
    SET Status = 'Approuvé', date_validation_prestataire = datetime('now'), OT_ODS = ?, date_cpa = ?, Fournisseur = ?
    WHERE num_demande = ? AND Status = 'Sous Traitance'
    """
    cursor.execute(q, (ods, date_cpa, fournisseur, num_demande))
    log_transaction(cursor, num_demande, matricule, "Approbation Sous-Traitance (CPA)", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Approuvé par CPA avec succès"})

@demandes_bp.route('/api/demandes/<num_demande>/en_cours', methods=['POST'])
@require_auth
def en_cours_demande(num_demande):
    matricule = g.user['matricule']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Vérifier que la demande est bien "Approuvé"
    cursor.execute("SELECT Status FROM Demandes WHERE num_demande = ?", (num_demande,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Demande introuvable"}), 404
    if row[0] != 'Approuvé':
        conn.close()
        return jsonify({"error": f"Impossible de démarrer: statut actuel est '{row[0]}'"}), 400
    
    cursor.execute("UPDATE Demandes SET Status = 'En Cours' WHERE num_demande = ?", (num_demande,))
    log_transaction(cursor, num_demande, matricule, "Mise en cours de la demande", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Demande en cours"})

@demandes_bp.route('/api/demandes/<num_demande>/cloturer', methods=['POST'])
@require_auth
def cloturer_demande(num_demande):
    matricule = g.user['matricule']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Vérifier que la demande est bien "En Cours"
    cursor.execute("SELECT Status FROM Demandes WHERE num_demande = ?", (num_demande,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Demande introuvable"}), 404
    if row[0] != 'En Cours':
        conn.close()
        return jsonify({"error": f"Impossible de clôturer: la demande doit être 'En Cours' (statut actuel: '{row[0]}')"}), 400
    
    cursor.execute("UPDATE Demandes SET Status = 'Clôturé' WHERE num_demande = ?", (num_demande,))
    log_transaction(cursor, num_demande, matricule, "Clôture de la demande", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Clôturé avec succès"})

@demandes_bp.route('/api/demandes/<num_demande>/annuler', methods=['POST'])
@require_auth
def annuler_demande(num_demande):
    data = request.json
    matricule = g.user['matricule']
    motif = data.get('motif', '').strip()
    
    if not motif:
        return jsonify({"error": "Le motif d'annulation est obligatoire."}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Vérifier le statut actuel
    cursor.execute("SELECT Status FROM Demandes WHERE num_demande = ?", (num_demande,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Demande introuvable"}), 404
    if row[0] in ('Clôturé', 'Rejeté', 'Annulé'):
        conn.close()
        return jsonify({"error": f"Impossible d'annuler: statut actuel est '{row[0]}'"}), 400
    
    cursor.execute("""
        UPDATE Demandes 
        SET Status = 'Annulé',
            motif_rejet = ?
        WHERE num_demande = ?
    """, (motif, num_demande))
    log_transaction(cursor, num_demande, matricule, f"Annulation de la demande - Motif: {motif}", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Demande annulée"})

@demandes_bp.route('/api/demandes/<num_demande>/journaux', methods=['GET'])
@require_auth
def get_demande_journaux(num_demande):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT j.TYPE_OPERATION, j.DATE, j.NOM_MACHINE, j.ADRESSE_IP, 
               j.COMPTE_WIN, j.UTILISATEUR, j.OBSERVATION,
               rh.nom, rh.prenom
        FROM Journal j
        LEFT JOIN RH rh ON j.UTILISATEUR = rh.matricule
        WHERE j.NOM_TABLE = 'Demandes' AND j.CODE_PIECE = ?
        ORDER BY j.DATE DESC
    """, (num_demande,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        "action": r[0],
        "date_action": r[1][:19] if r[1] else "",  # SQLite text format
        "nom_pc": r[2],
        "adresse_ip": r[3],
        "session_windows": r[4],
        "matricule": r[5],
        "observation": r[6],
        "utilisateur": f"{r[7]} {r[8]}" if r[7] else r[5] or "Système"
    } for r in rows])