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

def log_transaction(cursor, num_demande, matricule, action, ip_address):
    q = """
    INSERT INTO Journal (
        UTILISATEUR, TYPE_OPERATION, DATE, COMPTE_WIN, NOM_MACHINE,
        ADRESSE_IP, NOM_TABLE, CODE_PIECE, OBSERVATION, EXERCICE
    )
    VALUES (?, ?, GETDATE(), ?, ?, ?, 'Demandes', ?, ?, ?)
    """
    cursor.execute(q, (
        matricule,
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
    if not structure:
        return jsonify({"error": "structure is required"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT matricule, nom, prenom, role FROM RH WHERE structure = ? AND role != 'chef departement'", (structure,))
    rows = cursor.fetchall()
    conn.close()
    
    return jsonify([
        {"matricule": r.matricule, "nom": r.nom, "prenom": r.prenom, "role": r.role}
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

    # 1. Validation for Engine Availability
    requested_engins = data.get('engins', [])
    for code in requested_engins:
        cursor.execute("""
            SELECT d.num_demande FROM Demandes d
            JOIN Demande_Engins de ON d.num_demande = de.num_demande
            WHERE de.Code_Prestation = ? AND d.Status NOT IN ('Clôturé', 'Rejeté', 'Annulé')
        """, (code,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": f"L'engin (CODE: {code}) est déjà assigné dans une demande non clôturé."}), 400
            
    # 2. Generate num_demande
    year = str(datetime.now().year)[-2:]
    structure = data.get('structure', 'GEN')
    
    # Compteur séquentiel basé sur le nombre de demandes existantes
    cursor.execute("SELECT COUNT(*) FROM Demandes")
    count = cursor.fetchone()[0]
    next_num = count + 1
    
    num_demande = f"{structure}-{next_num}-{year}"
    utilisateur = data.get('creator_matricule')
    
    q = """
    INSERT INTO Demandes (
        num_demande, Code_Affaire, 
        Date_Debut_Prestation, Date_Fin_Prestation,
        [description], Observation, utilisateur, Status,
        ref_ods_client, lieu_prestation
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'En Attente', ?, ?)
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
        data.get('lieu_prestation')
    )
    cursor.execute(q, params)
    
    for code in requested_engins:
        cursor.execute("INSERT INTO Demande_Engins (num_demande, Code_Prestation) VALUES (?, ?)", (num_demande, code))
        
    log_transaction(cursor, num_demande, utilisateur, "Création de la demande", request.remote_addr)
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Demande créée", "num_demande": num_demande}), 201

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    matricule = request.args.get("matricule")
    role = request.args.get("role")
    structure = request.args.get("structure")

    # Notifications are only for DSL
    if structure != 'DSL':
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
    if structure == 'DSL' and role == 'chef departement':
        q += " AND v.Status IN ('Validé', 'Approuvé', 'En Cours')"
    elif role == 'agent':
        q += f" AND v.utilisateur = '{matricule}'"
    elif role in ('chef departement', 'secretaire'):
        q += f" AND rh.structure = '{structure}'"

    q += " ORDER BY v.Date_Debut_Prestation ASC"

    cursor.execute(q)
    rows = cursor.fetchall()
    conn.close()

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
            "demandeur": f"{r[5]} {r[6]}" if r[5] else ""
        })

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
    f_client = request.args.get("client")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # On utilise la vue pour récupérer client et structure
    q = """
    SELECT v.num_demande, v.Date_Demande, v.CLIENT, v.Status,
           v.Code_Structure, v.Structure_Initial,
           rh.nom, rh.prenom, v.Date_Debut_Prestation
    FROM vue_demandes v
    LEFT JOIN RH rh ON v.utilisateur = rh.matricule
    """
    
    conditions = []
    params = []
    
    if structure == 'DSL':
        conditions.append("v.Status IN ('Validé', 'Approuvé', 'En Cours', 'Clôturé', 'Rejeté', 'Annulé')")
        conditions.append("v.date_validation_demandeur IS NOT NULL")
    elif role == 'agent':
        conditions.append("v.utilisateur = ?")
        params.append(matricule)
    elif role == 'chef departement' or role == 'secretaire':
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
    if f_client:
        conditions.append("v.CLIENT LIKE ?")
        params.append(f'%{f_client}%')
    
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
            "demandeur": f"{r[6]} {r[7]}" if r[6] else "",
            "date_debut_prestation": r[8].strftime("%Y-%m-%d") if r[8] else ""
        })
        
    return jsonify(results)

@app.route('/api/demandes/<num_demande>', methods=['GET'])
def get_demande_detail(num_demande):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # On utilise la vue pour inclure client et structure
    q = """
    SELECT v.*, 
           rh.nom as dem_nom, rh.prenom as dem_prenom, rh.role as dem_role
    FROM vue_demandes v
    LEFT JOIN RH rh ON v.utilisateur = rh.matricule
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
    conn.close()
    
    d_dict['engins_detail'] = engins
    
    # Date formatting
    for key, val in d_dict.items():
        if isinstance(val, datetime):
            d_dict[key] = val.strftime("%Y-%m-%d %H:%M")
            
    return jsonify(d_dict)

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
    
    cursor.execute("""
        UPDATE Demandes 
        SET Status = 'Validé', 
            date_validation_demandeur = GETDATE()
        WHERE num_demande = ?
    """, (num_demande,))
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
    ot_ods = data.get('ot_ods', '').strip()
    fournisseur = data.get('fournisseur', '').strip()
    
    if not ot_ods or not fournisseur:
        return jsonify({"error": "LT/ODS et Fournisseur sont obligatoires pour valider."}), 400

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
        return jsonify({"error": f"Impossible d'approuver: statut actuel est '{row[0]}'"}), 400
    
    if ot_ods and ot_ods.strip():
        cursor.execute("SELECT num_demande FROM Demandes WHERE OT_ODS = ? AND num_demande != ?", (ot_ods, num_demande))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "La Référence OT_ODS existe déjà dans la base."}), 400
            
    cursor.execute("""
        UPDATE Demandes 
        SET Status = 'Approuvé', 
            date_validation_prestataire = GETDATE(),
            OT_ODS = ?,
            Fournisseur = ?
        WHERE num_demande = ?
    """, (ot_ods, fournisseur, num_demande))
    log_transaction(cursor, num_demande, matricule, "Approbation (Chef Département DSL)", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Approuvé avec succès"})

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






@app.route('/api/err', methods=['GET'])
def fix_err():

    conn = get_db_connection()
    cursor = conn.cursor()

    # Fix Demandes
    demandes_fixes = [
        ('Clôturé',       'Tubes et raccords pour montage échafaudage chantier DRIZ phase 1.',            'Terminé sans réserve.',                'DEM-2026-0021'),
        ('Rejeté',        'Matériels échafaudage complets pour maintenance trimestrielle.',               'Rejeté : budget insuffisant sur affaire.','DEM-2026-0035'),
        ('Validé',        'Location marteau piqueur et camion grue 10T pour chantier DRIZ.',             None,                                   'DEM-2026-0038'),
        ('Validé Demandeur','Colliers à angle droit et colliers pivotants pour réfection structure.',    'Livraison souhaitée avant 8h.',         'DEM-2026-0040'),
        ('En Attente',     'Besoin de tubes échafaudage et colliers pour travaux de maintenance façade nord.', None,                              'DEM-2026-0041'),
        ('Validé Demandeur','Fourniture matériels échafaudage pour intervention sur site NAFTAL.',       'Urgence niveau 2',                     'DEM-2026-0042'),
        ('En Attente',     'Location camion grue 10T pour déplacement équipements lourds.',              None,                                   'DEM-2026-0043'),
    ]

    for status, description, observation, num_demande in demandes_fixes:
        cursor.execute("""
            UPDATE Demandes 
            SET Status = ?, description = ?, Observation = ?
            WHERE num_demande = ?
        """, (status, description, observation, num_demande))
        print(f"Updated {num_demande} -> {status}")

    # Fix Journal
    journal_fixes = [
        (None,               'Connexion réussie',                               4),
        (None,               'Connexion réussie',                               5),
        (None,               'Connexion réussie',                               6),
        (None,               'Nouvelle demande créée',                          7),
        (None,               'Nouvelle demande créée',                          8),
        ('En Attente',       'Statut mis à jour : Validé Demandeur',           9),
        ('En Attente',       'Statut mis à jour : Validé Demandeur',           10),
        ('Validé Demandeur','Statut mis à jour : Validé - OT-2026-0112 émis', 11),
        ('Validé Demandeur','Statut mis à jour : En Cours - ODS-2026-0088 émis',12),
        ('Validé Demandeur','Demande rejeté : budget insuffisant',            13),
        ('En Cours',         'Statut mis à jour : Clôturé',                    14),
        (None,               'Déconnexion normale',                             15),
        (None,               'Déconnexion normale',                             16),
    ]

    for ancienne_valeur, observation, num_ordre in journal_fixes:
        cursor.execute("""
            UPDATE Journal 
            SET ANCIENNE_VALEUR = ?, OBSERVATION = ?
            WHERE NUM_ORDRE = ?
        """, (ancienne_valeur, observation, num_ordre))
        print(f"Updated Journal row {num_ordre}")

    conn.commit()
    cursor.close()
    conn.close()
    print("Done.")

if __name__ == '__main__':
    app.run(debug=True, port=5000)
