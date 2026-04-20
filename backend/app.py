import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
from datetime import datetime, timedelta
import socket
import getpass


app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn_str = (
        r'DRIVER={ODBC Driver 18 for SQL Server};'
        r'SERVER=.\SQLEXPRESS;'
        r'DATABASE=parc_roulant_test2;'
        r'Trusted_Connection=yes;'
        r'TrustServerCertificate=yes;'
    )
    conn = pyodbc.connect(conn_str)
    return conn

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]
    s.close()
    return ip

def log_transaction(cursor, num_demande, matricule, action, ip_address, actual_creator=None):
    q = """
    INSERT INTO Journal (
        UTILISATEUR, TYPE_OPERATION, DATE, COMPTE_WIN, NOM_MACHINE,
        ADRESSE_IP, NOM_TABLE, CODE_PIECE, OBSERVATION, EXERCICE
    )
    VALUES (?, ?, GETDATE(), ?, ?, ?, 'Demandes', ?, ?, ?)
    """
    cursor.execute(q, (
        actual_creator or matricule,
        action,
        getpass.getuser(),
        socket.gethostname(),
        ip_address,
        num_demande,
        action,
        str(datetime.now().year)
    ))

@app.route('/api/login', methods=['POST'])
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

@app.route('/api/employees', methods=['GET'])
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

@app.route('/api/affaires_structures/<code_affaire>', methods=['GET'])
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
        return jsonify({
            "code_affaire": code_affaire,
            "num_osc": row.NUM_OSC,
            "design": row.DESIGN,
            "client": row.CLIENT,
            "date_debut": row.DATE_DEBUT.strftime("%Y-%m-%d") if row.DATE_DEBUT else None,
            "date_fin": row.DATE_Fin.strftime("%Y-%m-%d") if row.DATE_Fin else None,
            "cod_struct_h": row.COD_STRUCT_H,
            "initial": row.INITIAL,
            "intitule": row.INTITULE,
            "nature_structure": row.NATURE_STRUCTURE
        })
    return jsonify({"error": "Affaire not found"}), 404

@app.route('/api/equipements', methods=['GET'])
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

@app.route('/api/demandes', methods=['POST'])
def create_demande():
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 0. Check role
    cursor.execute("SELECT role FROM RH WHERE matricule = ?", (data.get('creator_matricule'),))
    creator_row = cursor.fetchone()
    if creator_row and creator_row[0] == 'chef departement':
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
    utilisateur = data.get('creator_matricule')
    actual_creator = data.get('actual_creator_matricule')
    demandeur_structure = data.get('demandeur_structure')
    
    validateur_demandeur = data.get('validateur_demandeur')
    
    if validateur_demandeur:
        q = """
        INSERT INTO Demandes (
            num_demande, Code_Affaire, 
            Date_Debut_Prestation, Date_Fin_Prestation,
            [description], Observation, utilisateur, Status,
            ref_ods_client, lieu_prestation,
            validateur_demandeur, date_validation_demandeur, demandeur_structure
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Validé', ?, ?, ?, GETDATE(), ?)
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
            [description], Observation, utilisateur, Status,
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

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    matricule = request.args.get("matricule")
    role = request.args.get("role")
    structure = request.args.get("structure")

    # Notifications are only for DSL and CPA
    if structure not in ('DSL', 'CPA'):
        return jsonify([])

    conn = get_db_connection()
    cursor = conn.cursor()

    q = """
    SELECT v.num_demande, v.Date_Debut_Prestation, v.CLIENT, v.Status,
           v.Structure_Initial, rh.nom, rh.prenom
    FROM vue_demandes v
    LEFT JOIN RH rh ON v.utilisateur = rh.matricule
    WHERE v.Date_Debut_Prestation IS NOT NULL
      AND v.Status NOT IN ('Clôturé', 'Rejeté', 'Annulé')
      AND CAST(v.Date_Debut_Prestation AS DATE) BETWEEN CAST(GETDATE() AS DATE) AND CAST(DATEADD(DAY, 3, GETDATE()) AS DATE)
    """

    # Role-based visibility
    if structure == 'DSL' and role in ('chef service', 'secretaire'):
        q += " AND v.Status IN ('Validé', 'Approuvé', 'En Cours')"
    elif structure == 'CPA' and role in ('chef service', 'secretaire'):
        q += " AND v.Status IN ('Sous Traitance')"
    elif role == 'agent':
        q += f" AND v.utilisateur = '{matricule}'"
    elif role in ('chef departement', 'chef service', 'secretaire'):
        q += f" AND rh.structure = '{structure}'"

    q += " ORDER BY v.Date_Debut_Prestation ASC"

    cursor.execute(q)
    rows = cursor.fetchall()

    today = datetime.now().date()
    results = []
    for r in rows:
        date_debut = r[1]
        if date_debut:
            days_remaining = (date_debut.date() - today).days if hasattr(date_debut, 'date') else 0
        else:
            days_remaining = 0
        results.append({
            "num_demande": r[0],
            "date_debut": date_debut.strftime("%Y-%m-%d") if date_debut else "",
            "days_remaining": max(days_remaining, 0),
            "client": r[2] or "",
            "status": r[3],
            "structure_initial": r[4] or "",
            "demandeur": f"{r[5]} {r[6]}" if r[5] else "",
            "type": "upcoming"  # Notification type: upcoming demande
        })

    # Add "end of service" notifications - 48h before Date_Fin_Prestation
    # For demandes that are "En Cours" and ending within 48 hours
    q_end = """
    SELECT v.num_demande, v.Date_Fin_Prestation, v.CLIENT, v.Status,
           v.Structure_Initial, rh.nom, rh.prenom
    FROM vue_demandes v
    LEFT JOIN RH rh ON v.utilisateur = rh.matricule
    WHERE v.Date_Fin_Prestation IS NOT NULL
      AND v.Status = 'En Cours'
      AND CAST(v.Date_Fin_Prestation AS DATE) BETWEEN CAST(GETDATE() AS DATE) AND CAST(DATEADD(HOUR, 48, GETDATE()) AS DATE)
    """
    
    # Role-based visibility for end notifications
    if structure == 'DSL' and role in ('chef service', 'secretaire'):
        q_end += " AND v.demandeur_structure = 'DSL'"
    elif structure == 'CPA' and role in ('chef service', 'secretaire'):
        q_end += " AND v.demandeur_structure = 'CPA'"
    elif role == 'agent':
        q_end += f" AND v.utilisateur = '{matricule}'"
    elif role in ('chef departement', 'chef service', 'secretaire'):
        q_end += f" AND rh.structure = '{structure}'"
    
    q_end += " ORDER BY v.Date_Fin_Prestation ASC"
    
    cursor.execute(q_end)
    rows_end = cursor.fetchall()
    
    for r in rows_end:
        date_fin = r[1]
        if date_fin:
            hours_remaining = (date_fin - datetime.now()).total_seconds() / 3600 if hasattr(date_fin, 'hour') else 48
        else:
            hours_remaining = 48
        results.append({
            "num_demande": r[0],
            "date_fin": date_fin.strftime("%Y-%m-%d %H:%M") if date_fin else "",
            "hours_remaining": max(int(hours_remaining), 0),
            "client": r[2] or "",
            "status": r[3],
            "structure_initial": r[4] or "",
            "demandeur": f"{r[5]} {r[6]}" if r[5] else "",
            "type": "ending"  # Notification type: ending soon
        })
    
    conn.close()

    return jsonify(results)

@app.route('/api/demandes', methods=['GET'])
def get_demandes():
    matricule = request.args.get("matricule")
    role = request.args.get("role")
    structure = request.args.get("structure")
    
    # Filter params
    f_status = request.args.get("status")
    f_date_from = request.args.get("date_from")
    f_date_to = request.args.get("date_to")
    f_structure_search = request.args.get("structure_search")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # On utilise la vue pour récupérer client et structure
    q = """
    SELECT v.num_demande, v.Date_Demande, v.CLIENT, v.Status,
           v.Code_Structure, v.Structure_Initial, v.demandeur_structure,
           rh.nom, rh.prenom, v.Date_Debut_Prestation
    FROM vue_demandes v
    LEFT JOIN RH rh ON v.utilisateur = rh.matricule
    """
    
    conditions = []
    params = []
    
    if structure == 'DSL':
        conditions.append("v.Status IN ('Validé', 'Approuvé', 'En Cours', 'Clôturé', 'Rejeté', 'Annulé', 'Sous Traitance')")
        conditions.append("v.date_validation_demandeur IS NOT NULL")
    elif structure == 'CPA':
        # CPA sees: 1) Sous Traitance demandes, OR 2) Demandes they processed (via journal)
        conditions.append("(v.Status = 'Sous Traitance' OR EXISTS (SELECT 1 FROM Journal j WHERE j.CODE_PIECE = v.num_demande AND j.UTILISATEUR = ? AND j.TYPE_OPERATION LIKE '%CPA%'))")
        params.append(matricule)
        conditions.append("v.date_validation_demandeur IS NOT NULL")
    elif role == 'agent':
        conditions.append("v.utilisateur = ?")
        params.append(matricule)
    elif role in ('chef departement', 'chef service', 'secretaire'):
        conditions.append("rh.structure = ?")
        params.append(structure)
    
    # Apply optional filters
    if f_status:
        conditions.append("v.Status = ?")
        params.append(f_status)
    if f_date_from:
        conditions.append("v.Date_Demande >= ?")
        params.append(f_date_from)
    if f_date_to:
        conditions.append("v.Date_Demande <= ?")
        params.append(f_date_to + ' 23:59:59')
    if f_structure_search:
        conditions.append("(v.Structure_Intitule LIKE ? OR v.Code_Structure LIKE ? OR v.Structure_Initial LIKE ? OR v.demandeur_structure LIKE ?)")
        search_term = f'%{f_structure_search}%'
        params.extend([search_term, search_term, search_term, search_term])
    
    if conditions:
        q += " WHERE " + " AND ".join(conditions)
        
    q += " ORDER BY v.Date_Demande DESC"
    
    cursor.execute(q, params)
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        results.append({
            "num_demande": r[0],
            "date_demande": r[1].strftime("%Y-%m-%d %H:%M") if r[1] else "",
            "client": r[2] or "",
            "status": r[3],
            "code_structure": r[4] or "",
            "structure_initial": r[5] or "",
            "demandeur_structure": r[6] or "",
            "demandeur": f"{r[7]} {r[8]}" if r[7] else "",
            "date_debut_prestation": r[9].strftime("%Y-%m-%d") if r[9] else ""
        })
        
    return jsonify(results)

@app.route('/api/demandes/<num_demande>', methods=['GET'])
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
        SELECT eq.[Code Prestation], eq.Prestation 
        FROM Demande_Engins de
        JOIN ListeEquipement eq ON de.Code_Prestation = eq.[Code Prestation]
        WHERE de.num_demande = ?
    """, (num_demande,))
    engins = [{"code": r[0], "prestation": r[1]} for r in cursor.fetchall()]
    
    d_dict['engins_detail'] = engins
    
    # Get annulation info from journal if status is Annulé
    if d_dict.get('Status') == 'Annulé':
        cursor.execute("""
            SELECT TOP 1 j.UTILISATEUR, j.DATE, j.OBSERVATION,
                   rh.nom, rh.prenom, rh.structure
            FROM Journal j
            LEFT JOIN RH rh ON j.UTILISATEUR = rh.matricule
            WHERE j.NOM_TABLE = 'Demandes' AND j.CODE_PIECE = ? AND j.TYPE_OPERATION LIKE '%Annulation%'
            ORDER BY j.DATE DESC
        """, (num_demande,))
        annul_row = cursor.fetchone()
        if annul_row:
            d_dict['annulation_info'] = {
                'matricule': annul_row[0],
                'date': annul_row[1].strftime("%Y-%m-%d %H:%M") if annul_row[1] else None,
                'motif': annul_row[2],
                'nom': annul_row[3],
                'prenom': annul_row[4],
                'structure': annul_row[5]
            }
    
    conn.close()
    
    # Date formatting
    for key, val in d_dict.items():
        if isinstance(val, datetime):
            d_dict[key] = val.strftime("%Y-%m-%d %H:%M")
            
    return jsonify(d_dict)

@app.route('/api/demandes/<num_demande>/engins_availability', methods=['GET'])
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
        # Check if already assigned to another active demande
        cursor.execute("""
            SELECT d.num_demande FROM Demandes d
            JOIN Demande_Engins de ON d.num_demande = de.num_demande
            WHERE de.Code_Prestation = ? 
            AND d.num_demande != ?
            AND d.Status NOT IN ('Clôturé', 'Rejeté', 'Annulé')
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

@app.route('/api/demandes/<num_demande>/engins', methods=['PUT'])
def update_demande_engins(num_demande):
    """Update engins for an existing demande (DSL only)"""
    data = request.json
    engins = data.get('engins', [])
    matricule = data.get('matricule')
    
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

@app.route('/api/demandes/<num_demande>/valider', methods=['POST'])
def valider_demande(num_demande):
    data = request.json
    matricule = data.get('matricule')
    
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
    SET Status = 'Validé', date_validation_demandeur = GETDATE(), validateur_demandeur = ?
    WHERE num_demande = ? AND Status = 'En Attente'
    """
    cursor.execute(q, (matricule, num_demande))
    log_transaction(cursor, num_demande, matricule, "Validation (Chef Département Demandeur)", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Validé avec succès"})

@app.route('/api/demandes/<num_demande>/rejeter', methods=['POST'])
def rejeter_demande(num_demande):
    data = request.json
    matricule = data.get('matricule')
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

@app.route('/api/demandes/<num_demande>/dsl_validate', methods=['POST'])
def dsl_valider_demande(num_demande):
    data = request.json
    matricule = data.get('matricule')
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
    SET Status = 'Approuvé', date_validation_prestataire = GETDATE(), OT_ODS = ?, validateur_dsl = ?
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

@app.route('/api/demandes/<num_demande>/cpa_validate', methods=['POST'])
def cpa_valider_demande(num_demande):
    data = request.json
    matricule = data.get('matricule')
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
    SET Status = 'Approuvé', date_validation_prestataire = GETDATE(), OT_ODS = ?, date_cpa = ?, Fournisseur = ?
    WHERE num_demande = ? AND Status = 'Sous Traitance'
    """
    cursor.execute(q, (ods, date_cpa, fournisseur, num_demande))
    log_transaction(cursor, num_demande, matricule, "Approbation Sous-Traitance (CPA)", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Approuvé par CPA avec succès"})

@app.route('/api/demandes/<num_demande>/en_cours', methods=['POST'])
def en_cours_demande(num_demande):
    data = request.json
    matricule = data.get('matricule') if (data and 'matricule' in data) else 'System'
    
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

@app.route('/api/demandes/<num_demande>/cloturer', methods=['POST'])
def cloturer_demande(num_demande):
    data = request.json
    matricule = data.get('matricule') if (data and 'matricule' in data) else 'System'
    
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

@app.route('/api/demandes/<num_demande>/annuler', methods=['POST'])
def annuler_demande(num_demande):
    data = request.json
    matricule = data.get('matricule')
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

# ============================================================================
# MAINTENANCE REQUESTS API (DSL -> MVE Workflow)
# ============================================================================

@app.route('/api/maintenance/types', methods=['GET'])
def get_maintenance_types():
    """Get all maintenance types"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT code, libelle, categorie, description FROM MaintenanceTypes ORDER BY categorie, libelle")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{"code": r[0], "libelle": r[1], "categorie": r[2], "description": r[3]} for r in rows])

@app.route('/api/maintenance/requests', methods=['GET'])
def get_maintenance_requests():
    """Get maintenance requests with optional filters"""
    # Filters
    status_filter = request.args.get("status")
    structure_filter = request.args.get("structure_filter")
    type_filter = request.args.get("type")
    categorie_filter = request.args.get("categorie")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build query with filters
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
    
    query = f"""
        SELECT m.id, m.code_prestation, eq.Prestation as equipement,
               m.type_maintenance, mt.libelle as type_libelle, mt.categorie,
               m.date_debut, m.date_fin, m.kilometrage_actuel,
               m.description, m.status,
               m.demandeur_matricule, rh.nom, rh.prenom, m.demandeur_structure,
               m.date_demande, m.validateur_matricule, m.date_validation
        FROM MaintenanceRequests m
        JOIN MaintenanceTypes mt ON m.type_maintenance = mt.code
        JOIN ListeEquipement eq ON m.code_prestation = eq.[Code Prestation]
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
            "date_debut": r[6].strftime("%Y-%m-%d") if r[6] else None,
            "date_fin": r[7].strftime("%Y-%m-%d") if r[7] else None,
            "kilometrage_actuel": r[8],
            "description": r[9],
            "status": r[10],
            "demandeur_matricule": r[11],
            "demandeur_nom": r[12] + " " + r[13] if r[12] and r[13] else r[11],
            "demandeur_structure": r[14],
            "date_demande": r[15].strftime("%Y-%m-%d %H:%M") if r[15] else None,
            "validateur_matricule": r[16],
            "date_validation": r[17].strftime("%Y-%m-%d %H:%M") if r[17] else None
        })
    
    return jsonify(results)

@app.route('/api/maintenance/requests', methods=['POST'])
def create_maintenance_request():
    """DSL creates a maintenance request for MVE"""
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
    
    cursor.execute("SELECT @@IDENTITY")
    request_id = cursor.fetchone()[0]
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Demande de maintenance créée", "id": request_id}), 201

@app.route('/api/maintenance/requests/<int:request_id>/valider', methods=['POST'])
def valider_maintenance_request(request_id):
    """MVE validates a maintenance request"""
    data = request.json
    matricule = data.get('matricule')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if request exists and is pending
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
        SET status = 'VALIDE', validateur_matricule = ?, date_validation = GETDATE()
        WHERE id = ?
    """, (matricule, request_id))
    
    # Log maintenance validation (without demande reference)
    # Could create a separate maintenance audit log table if needed
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Maintenance validée avec succès"})

@app.route('/api/maintenance/requests/<int:request_id>/rejeter', methods=['POST'])
def rejeter_maintenance_request(request_id):
    """MVE rejects a maintenance request"""
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
        SET status = 'REJETE', validateur_matricule = ?, date_validation = GETDATE(), motif_rejet = ?
        WHERE id = ?
    """, (matricule, motif, request_id))
    
    # Log maintenance rejection (without demande reference)
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Maintenance rejetée"})

@app.route('/api/maintenance/requests/<int:request_id>/terminer', methods=['POST'])
def terminer_maintenance_request(request_id):
    """Mark maintenance as completed"""
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
        SET status = 'TERMINE', date_fin_reelle = GETDATE()
        WHERE id = ?
    """, (request_id,))
    
    # Log maintenance completion (without demande reference)
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Maintenance terminée avec succès"})

@app.route('/api/equipements/<code_prestation>/availability', methods=['GET'])
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

# ============================================================================
# MAINTENANCE RULES API (Preventive Scheduling)
# ============================================================================

@app.route('/api/maintenance/rules', methods=['GET'])
def get_maintenance_rules():
    """Get maintenance rules for equipment"""
    code_prestation = request.args.get('code_prestation')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if code_prestation:
        cursor.execute("""
            SELECT r.id, r.code_prestation, eq.Prestation, r.type_maintenance, mt.libelle, mt.categorie,
                   r.interval_km, r.interval_days, r.alert_before_km, r.alert_before_days, r.is_active
            FROM MaintenanceRules r
            JOIN ListeEquipement eq ON r.code_prestation = eq.[Code Prestation]
            JOIN MaintenanceTypes mt ON r.type_maintenance = mt.code
            WHERE r.code_prestation = ? AND r.is_active = 1
            ORDER BY mt.categorie, mt.libelle
        """, (code_prestation,))
    else:
        cursor.execute("""
            SELECT r.id, r.code_prestation, eq.Prestation, r.type_maintenance, mt.libelle, mt.categorie,
                   r.interval_km, r.interval_days, r.alert_before_km, r.alert_before_days, r.is_active
            FROM MaintenanceRules r
            JOIN ListeEquipement eq ON r.code_prestation = eq.[Code Prestation]
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

@app.route('/api/maintenance/rules', methods=['POST'])
def create_maintenance_rule():
    """Create a maintenance rule for preventive scheduling"""
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
    
    cursor.execute("SELECT @@IDENTITY")
    rule_id = cursor.fetchone()[0]
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Règle de maintenance créée", "id": rule_id}), 201

@app.route('/api/equipements/<code_prestation>/maintenance-alerts', methods=['GET'])
def get_equipment_maintenance_alerts(code_prestation):
    """Get upcoming maintenance alerts for equipment based on rules"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get current kilometrage
    cursor.execute("""
        SELECT TOP 1 kilometrage FROM EquipmentKilometrage 
        WHERE code_prestation = ? 
        ORDER BY date_enregistrement DESC
    """, (code_prestation,))
    row = cursor.fetchone()
    current_km = row[0] if row else 0
    
    # Get active rules with last done info
    cursor.execute("""
        SELECT r.id, r.type_maintenance, mt.libelle, mt.categorie,
               r.interval_km, r.interval_days, r.alert_before_km, r.alert_before_days,
               l.last_done_km, l.last_done_date,
               DATEDIFF(DAY, l.last_done_date, GETDATE()) as days_since
        FROM MaintenanceRules r
        JOIN MaintenanceTypes mt ON r.type_maintenance = mt.code
        LEFT JOIN EquipmentMaintenanceLog l ON r.code_prestation = l.code_prestation 
                                            AND r.type_maintenance = l.type_maintenance
        WHERE r.code_prestation = ? AND r.is_active = 1
    """, (code_prestation,))
    
    rules = cursor.fetchall()
    alerts = []
    
    for r in rules:
        interval_km = r[4] or 0
        interval_days = r[5] or 0
        alert_before_km = r[6] or 500
        alert_before_days = r[7] or 7
        last_done_km = r[8] or 0
        last_done_date = r[9]
        days_since = r[10] or 0
        
        km_progress = current_km - last_done_km if interval_km > 0 else 0
        km_remaining = interval_km - km_progress if interval_km > 0 else None
        days_remaining = interval_days - days_since if interval_days > 0 else None
        
        is_due = False
        if interval_km > 0 and km_remaining is not None and km_remaining <= alert_before_km:
            is_due = True
        if interval_days > 0 and days_remaining is not None and days_remaining <= alert_before_days:
            is_due = True
            
        if is_due:
            alerts.append({
                "rule_id": r[0],
                "type_maintenance": r[1],
                "type_libelle": r[2],
                "categorie": r[3],
                "current_km": current_km,
                "last_done_km": last_done_km,
                "km_remaining": km_remaining,
                "days_since": days_since,
                "days_remaining": days_remaining,
                "urgent": (km_remaining is not None and km_remaining <= 0) or (days_remaining is not None and days_remaining <= 0)
            })
    
    conn.close()
    return jsonify(alerts)

@app.route('/api/demandes/<num_demande>/journaux', methods=['GET'])
def get_demande_journaux(num_demande):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT j.TYPE_OPERATION, j.[DATE], j.NOM_MACHINE, j.ADRESSE_IP, 
               j.COMPTE_WIN, j.UTILISATEUR, j.OBSERVATION,
               rh.nom, rh.prenom
        FROM Journal j
        LEFT JOIN RH rh ON j.UTILISATEUR = rh.matricule
        WHERE j.NOM_TABLE = 'Demandes' AND j.CODE_PIECE = ?
        ORDER BY j.[DATE] DESC
    """, (num_demande,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        "action": r[0],
        "date_action": r[1].strftime("%Y-%m-%d %H:%M:%S") if r[1] else "",
        "nom_pc": r[2],
        "adresse_ip": r[3],
        "session_windows": r[4],
        "matricule": r[5],
        "observation": r[6],
        "utilisateur": f"{r[7]} {r[8]}" if r[7] else r[5] or "Système"
    } for r in rows])






# @app.route('/api/err', methods=['GET'])
# def fix_err():

#     conn = get_db_connection()
#     cursor = conn.cursor()

#     # Fix Demandes
#     demandes_fixes = [
#         ('Clôturé',       'Tubes et raccords pour montage échafaudage chantier DRIZ phase 1.',            'Terminé sans réserve.',                'DEM-2026-0021'),
#         ('Rejeté',        'Matériels échafaudage complets pour maintenance trimestrielle.',               'Rejeté : budget insuffisant sur affaire.','DEM-2026-0035'),
#         ('Validé',        'Location marteau piqueur et camion grue 10T pour chantier DRIZ.',             None,                                   'DEM-2026-0038'),
#         ('Validé Demandeur','Colliers à angle droit et colliers pivotants pour réfection structure.',    'Livraison souhaitée avant 8h.',         'DEM-2026-0040'),
#         ('En Attente',     'Besoin de tubes échafaudage et colliers pour travaux de maintenance façade nord.', None,                              'DEM-2026-0041'),
#         ('Validé Demandeur','Fourniture matériels échafaudage pour intervention sur site NAFTAL.',       'Urgence niveau 2',                     'DEM-2026-0042'),
#         ('En Attente',     'Location camion grue 10T pour déplacement équipements lourds.',              None,                                   'DEM-2026-0043'),
#     ]

#     for status, description, observation, num_demande in demandes_fixes:
#         cursor.execute("""
#             UPDATE Demandes 
#             SET Status = ?, description = ?, Observation = ?
#             WHERE num_demande = ?
#         """, (status, description, observation, num_demande))
#         print(f"Updated {num_demande} -> {status}")

#     # Fix Journal
#     journal_fixes = [
#         (None,               'Connexion réussie',                               4),
#         (None,               'Connexion réussie',                               5),
#         (None,               'Connexion réussie',                               6),
#         (None,               'Nouvelle demande créée',                          7),
#         (None,               'Nouvelle demande créée',                          8),
#         ('En Attente',       'Statut mis à jour : Validé Demandeur',           9),
#         ('En Attente',       'Statut mis à jour : Validé Demandeur',           10),
#         ('Validé Demandeur','Statut mis à jour : Validé - OT-2026-0112 émis', 11),
#         ('Validé Demandeur','Statut mis à jour : En Cours - ODS-2026-0088 émis',12),
#         ('Validé Demandeur','Demande rejeté : budget insuffisant',            13),
#         ('En Cours',         'Statut mis à jour : Clôturé',                    14),
#         (None,               'Déconnexion normale',                             15),
#         (None,               'Déconnexion normale',                             16),
#     ]

#     for ancienne_valeur, observation, num_ordre in journal_fixes:
#         cursor.execute("""
#             UPDATE Journal 
#             SET ANCIENNE_VALEUR = ?, OBSERVATION = ?
#             WHERE NUM_ORDRE = ?
#         """, (ancienne_valeur, observation, num_ordre))
#         print(f"Updated Journal row {num_ordre}")

#     conn.commit()
#     cursor.close()
#     conn.close()
#     print("Done.")

if __name__ == '__main__':
    app.run(debug=True, port=5000)
