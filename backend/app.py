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
            WHERE de.Code_Prestation = ? AND d.Status NOT IN ('Clôturé', 'Refusé')
        """, (code,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": f"L'engin (CODE: {code}) est déjà assigné dans une demande non clôturée."}), 400
            
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
        [description], Observation, utilisateur, Status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'En Attente')
    """
    params = (
        num_demande,  
        data.get('code_affaire'), 
        data.get('date_debut'), 
        data.get('date_fin'), 
        data.get('description'), 
        data.get('observation'), 
        utilisateur
    )
    cursor.execute(q, params)
    
    for code in requested_engins:
        cursor.execute("INSERT INTO Demande_Engins (num_demande, Code_Prestation) VALUES (?, ?)", (num_demande, code))
        
    log_transaction(cursor, num_demande, utilisateur, "Création de la demande", request.remote_addr)
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Demande créée", "num_demande": num_demande}), 201

@app.route('/api/demandes', methods=['GET'])
def get_demandes():
    matricule = request.args.get("matricule")
    role = request.args.get("role")
    structure = request.args.get("structure")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # On utilise la vue pour récupérer client et structure
    q = """
    SELECT v.num_demande, v.Date_Demande, v.CLIENT, v.Status,
           v.Code_Structure, v.Structure_Initial,
           rh.nom, rh.prenom
    FROM vue_demandes v
    LEFT JOIN RH rh ON v.utilisateur = rh.matricule
    """
    
    if structure == 'DSL' and role == 'chef departement':
        q += " WHERE v.Status IN ('Validé', 'Approuvé par DSL', 'Clôturé')"
    elif role == 'agent':
        q += f" WHERE v.utilisateur = '{matricule}'"
    elif role == 'chef departement' or role == 'secretaire':
        q += f" WHERE rh.structure = '{structure}'"
        
    q += " ORDER BY v.Date_Demande DESC"
    
    cursor.execute(q)
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
            "demandeur": f"{r[6]} {r[7]}" if r[6] else ""
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
    cursor.execute("""
        UPDATE Demandes 
        SET Status = 'Validé', 
            date_validation_demandeur = GETDATE()
        WHERE num_demande = ?
    """, (num_demande,))
    log_transaction(cursor, num_demande, matricule, "Validation (Chef Département)", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Validé avec succès"})

@app.route('/api/demandes/<num_demande>/dsl_validate', methods=['POST'])
def dsl_valider_demande(num_demande):
    data = request.json
    matricule = data.get('matricule')
    ot_ods = data.get('ot_ods', '')
    fournisseur = data.get('fournisseur', '')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if ot_ods and ot_ods.strip():
        cursor.execute("SELECT num_demande FROM Demandes WHERE OT_ODS = ? AND num_demande != ?", (ot_ods, num_demande))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "La Référence OT_ODS existe déjà dans la base."}), 400
            
    cursor.execute("""
        UPDATE Demandes 
        SET Status = 'Approuvé par DSL', 
            date_validation_prestataire = GETDATE(),
            OT_ODS = ?,
            Fournisseur = ?
        WHERE num_demande = ?
    """, (ot_ods, fournisseur, num_demande))
    log_transaction(cursor, num_demande, matricule, "Validation Structure DSL", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Enregistré au DSL avec succès"})

@app.route('/api/demandes/<num_demande>/cloturer', methods=['POST'])
def cloturer_demande(num_demande):
    data = request.json
    matricule = data.get('matricule') if (data and 'matricule' in data) else 'System'
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Demandes SET Status = 'Clôturé' WHERE num_demande = ?", (num_demande,))
    log_transaction(cursor, num_demande, matricule, "Clôture de la demande", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Clôturé avec succès"})

@app.route('/api/demandes/<num_demande>/refuser', methods=['POST'])
def refuser_demande(num_demande):
    data = request.json
    matricule = data.get('matricule') if (data and 'matricule' in data) else 'System'
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Demandes SET Status = 'Refusé' WHERE num_demande = ?", (num_demande,))
    log_transaction(cursor, num_demande, matricule, "Refus de la demande", request.remote_addr)
    conn.commit()
    conn.close()
    return jsonify({"message": "Demande Refusée"})

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
