import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
from datetime import datetime
import socket
import getpass


app = Flask(__name__)
CORS(app)

def get_db_connection():
    # Attempt connecting to SQLEXPRESS using ODBC Driver 18
    # Using TrustServerCertificate=yes to bypass SSL strict verification 
    conn_str = (
        r'DRIVER={ODBC Driver 18 for SQL Server};'
        r'SERVER=.\SQLEXPRESS;'
        r'DATABASE=parc_roulant_test2;'
        r'Trusted_Connection=yes;'
        r'TrustServerCertificate=yes;'
    )
    conn = pyodbc.connect(conn_str)
    return conn

def log_transaction(cursor, demande_id, matricule, action, ip_address):
    print("hello we are testing : ",socket.gethostname())
    print("hello we are testing : ",getpass.getuser())
    q = """
    INSERT INTO Journaux (Id_Demande, Utilisateur_Matricule, Action, Nom_PC, Adresse_IP, Session_Windows)
    VALUES (?, ?, ?, ?, ?, ?)
    """
    cursor.execute(q, (demande_id, matricule, action, socket.gethostname(), ip_address, getpass.getuser()))

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
            SELECT d.Id FROM Demandes d
            JOIN Demande_Engins de ON d.Id = de.Id_Demande
            WHERE de.Code_Prestation = ? AND d.Status NOT IN ('Clôturé', 'Refusé')
        """, (code,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": f"L'engin (CODE: {code}) est déjà assigné dans une demande non clôturée."}), 400
            
    # 2. Validation for Ref ODS
    ref_ods = data.get('ref_ods_client')
    if ref_ods and ref_ods.strip():
        cursor.execute("SELECT Id FROM Demandes WHERE Ref_ODS_Client = ?", (ref_ods,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "La Référence ODS Client existe déjà dans la base."}), 400
            
    # Format N_DSL
    year = str(datetime.now().year)[-2:]
    structure = data.get('structure', 'GEN')
    
    cursor.execute("SELECT MAX(Id) FROM Demandes")
    max_id = cursor.fetchone()[0]
    next_id = (max_id or 0) + 1
    
    n_dsl = f"{structure}-{next_id}-{year}"
    utilisateur = data.get('creator_matricule')
    
    q = """
    INSERT INTO Demandes (
        N_DSL, Code_Structure, Code_Affaire, Client, Ref_ODS_Client, 
        Lieu_Prestation, Date_Debut_Prestation, Date_Fin_Prestation,
        Nature_Prestation, Observation, utilisateur, Status
    )
    OUTPUT INSERTED.Id
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'En Attente')
    """
    params = (
        n_dsl, 
        data.get('code_structure'), 
        data.get('code_affaire'), 
        data.get('client'), 
        data.get('ref_ods_client'),
        data.get('lieu_prestation'), 
        data.get('date_debut'), 
        data.get('date_fin'), 
        data.get('nature_prestation'), 
        data.get('observation'), 
        utilisateur
    )
    cursor.execute(q, params)
    demande_id = cursor.fetchone()[0]
    
    for code in requested_engins:
        cursor.execute("INSERT INTO Demande_Engins (Id_Demande, Code_Prestation) VALUES (?, ?)", (demande_id, code))
        
    log_transaction(cursor, demande_id, utilisateur, "Création de la demande", request.remote_addr)
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Demande créée", "n_dsl": n_dsl, "id": demande_id}), 201

@app.route('/api/demandes', methods=['GET'])
def get_demandes():
    # Roles filtering
    matricule = request.args.get("matricule")
    role = request.args.get("role")
    structure = request.args.get("structure")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    q = """
    SELECT d.Id, d.N_DSL, d.Date_Demande, d.Client, d.Status,
           rh.nom, rh.prenom
    FROM Demandes d
    LEFT JOIN RH rh ON d.utilisateur = rh.matricule
    """
    
    # Specific filtering Logic
    if structure == 'DSL' and role == 'chef departement':
        # DSL Chef sees ALL partially Validated requests or requests already in DSL process
        q += " WHERE d.Status IN ('Validé', 'Approuvé par DSL', 'Clôturé')"
    elif role == 'agent':
        q += f" WHERE d.utilisateur = '{matricule}'"
    elif role == 'chef departement' or role == 'secretaire':
        # See all in structure
        q += f" WHERE rh.structure = '{structure}'"
        
    q += " ORDER BY d.Date_Demande DESC"
    
    cursor.execute(q)
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        results.append({
            "id": r[0],
            "n_dsl": r[1],
            "date_demande": r[2].strftime("%Y-%m-%d %H:%M") if r[2] else "",
            "client": r[3],
            "status": r[4],
            "demandeur": f"{r.nom} {r.prenom}" if r.nom else ""
        })
        
    return jsonify(results)

@app.route('/api/demandes/<int:demande_id>', methods=['GET'])
def get_demande_detail(demande_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    q = """
    SELECT d.*, 
           dem_rh.nom as dem_nom, dem_rh.prenom as dem_prenom, dem_rh.role as dem_role
    FROM Demandes d
    LEFT JOIN RH dem_rh ON d.utilisateur = dem_rh.matricule
    WHERE d.Id = ?
    """
    cursor.execute(q, (demande_id,))
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
        WHERE de.Id_Demande = ?
    """, (demande_id,))
    engins = [{"code": r[0], "prestation": r[1]} for r in cursor.fetchall()]
    conn.close()
    
    d_dict['engins_detail'] = engins
    
    # Date formatting
    for key, val in d_dict.items():
        if isinstance(val, datetime):
            d_dict[key] = val.strftime("%Y-%m-%d %H:%M")
            
    return jsonify(d_dict)

@app.route('/api/demandes/<int:demande_id>/valider', methods=['POST'])
def valider_demande(demande_id):
    # Chef departement (local structure) validation
    data = request.json
    matricule = data.get('matricule')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE Demandes 
        SET Status = 'Validé', 
            date_validation_demandeur = GETDATE()
        WHERE Id = ?
    """, (demande_id,))
    log_transaction(cursor, demande_id, matricule, "Validation ISI (Chef Département)", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Validé avec succès"})

@app.route('/api/demandes/<int:demande_id>/dsl_validate', methods=['POST'])
def dsl_valider_demande(demande_id):
    # DSL Chef validation (fills OT_ODS and fournisseur)
    data = request.json
    matricule = data.get('matricule')
    ot_ods = data.get('ot_ods', '')
    fournisseur = data.get('fournisseur', '')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if ot_ods and ot_ods.strip():
        cursor.execute("SELECT Id FROM Demandes WHERE OT_ODS = ? AND Id != ?", (ot_ods, demande_id))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "La Référence OT_ODS existe déjà dans la base."}), 400
            
    cursor.execute("""
        UPDATE Demandes 
        SET Status = 'Approuvé par DSL', 
            Enregistre_A_DSL = 1, 
            date_validation_prestataire = GETDATE(),
            OT_ODS = ?,
            Fournisseur = ?
        WHERE Id = ?
    """, (ot_ods, fournisseur, demande_id))
    log_transaction(cursor, demande_id, matricule, "Validation Structure DSL", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Enregistré au DSL avec succès"})

@app.route('/api/demandes/<int:demande_id>/cloturer', methods=['POST'])
def cloturer_demande(demande_id):
    data = request.json
    matricule = data.get('matricule') if (data and 'matricule' in data) else 'System'
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Demandes SET Status = 'Clôturé' WHERE Id = ?", (demande_id,))
    log_transaction(cursor, demande_id, matricule, "Clôture de la demande", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Clôturé avec succès"})

@app.route('/api/demandes/<int:demande_id>/refuser', methods=['POST'])
def refuser_demande(demande_id):
    data = request.json
    matricule = data.get('matricule') if (data and 'matricule' in data) else 'System'
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Demandes SET Status = 'Refusé' WHERE Id = ?", (demande_id,))
    log_transaction(cursor, demande_id, matricule, "Refus de la demande", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Demande Refusée"})

@app.route('/api/demandes/<int:demande_id>/journaux', methods=['GET'])
def get_demande_journaux(demande_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT j.Action, j.Date_Action, j.Nom_PC, j.Adresse_IP, j.Session_Windows, rh.nom, rh.prenom
        FROM Journaux j
        LEFT JOIN RH rh ON j.Utilisateur_Matricule = rh.matricule
        WHERE j.Id_Demande = ?
        ORDER BY j.Date_Action DESC
    """, (demande_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        "action": r.Action,
        "date_action": r.Date_Action.strftime("%Y-%m-%d %H:%M:%S") if r.Date_Action else "",
        "nom_pc": r.Nom_PC,
        "session_windows": r.Session_Windows,
        "adresse_ip": r.Adresse_IP,
        "session_windows": r.Session_Windows,
        "utilisateur": f"{r.nom} {r.prenom}" if r.nom else "Système"
    } for r in rows])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
