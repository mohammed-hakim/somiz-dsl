from flask import Blueprint, request, jsonify
from db.connection import get_db_connection
from utils.logger import log_transaction
from datetime import datetime

notifications_bp = Blueprint('notifications', __name__)

# Helper function to ensure SQLite string dates are parsed to Python datetime objects
def parse_date(date_val):
    if not date_val:
        return None
    if isinstance(date_val, str):
        try:
            # Handles 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'
            return datetime.fromisoformat(date_val.split('.')[0])
        except ValueError:
            return None
    return date_val

@notifications_bp.route('/api/notifications', methods=['GET'])
def get_notifications():
    matricule = request.args.get("matricule")
    role = request.args.get("role")
    structure = request.args.get("structure")

    conn = get_db_connection()
    cursor = conn.cursor()

    # ==========================================
    # 1. UPCOMING DEMANDES
    # ==========================================
    q = """
    SELECT v.num_demande, v.Date_Debut_Prestation, v.CLIENT, v.Status,
           v.Structure_Initial, rh.nom, rh.prenom
    FROM vue_demandes v
    LEFT JOIN RH rh ON v.utilisateur = rh.matricule
    WHERE v.Date_Debut_Prestation IS NOT NULL
      AND v.Status NOT IN ('Clôturé', 'Rejeté', 'Annulé')
      AND date(v.Date_Debut_Prestation) BETWEEN date('now') AND date('now', '+3 days')
    """
    
    # Use parameters to prevent SQL injection
    params = []

    # Role-based visibility
    if role == 'agent':
        q += " AND v.utilisateur = ?"
        params.append(matricule)
    elif structure == 'DSL' and role == 'secretaire':
        q += " AND v.Status IN ('Validé', 'Approuvé', 'En Cours')"
    elif structure == 'CPA' and role == 'secretaire':
        q += " AND v.Status IN ('Sous Traitance')"
    elif role == 'chef service':
        pass
    elif role in ('chef departement', 'secretaire'):
        q += " AND v.demandeur_structure = ?"
        params.append(structure)

    q += " ORDER BY v.Date_Debut_Prestation ASC"

    cursor.execute(q, params)
    rows = cursor.fetchall()

    today = datetime.now().date()
    results = []
    
    for r in rows:
        date_debut = parse_date(r[1])
        
        if date_debut:
            d_date = date_debut.date() if hasattr(date_debut, 'date') else date_debut
            days_remaining = (d_date - today).days
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
            "type": "upcoming" 
        })

    # ==========================================
    # 2. ENDING DEMANDES (En Cours, ending in 48h)
    # ==========================================
    # In SQLite, '+48 hours' cast to DATE is exactly '+2 days'
    q_end = """
    SELECT v.num_demande, v.Date_Fin_Prestation, v.CLIENT, v.Status,
           v.Structure_Initial, rh.nom, rh.prenom
    FROM vue_demandes v
    LEFT JOIN RH rh ON v.utilisateur = rh.matricule
    WHERE v.Date_Fin_Prestation IS NOT NULL
      AND v.Status = 'En Cours'
      AND date(v.Date_Fin_Prestation) BETWEEN date('now') AND date('now', '+2 days')
    """
    
    params_end = []
    
    # Role-based visibility for end notifications
    if role == 'agent':
        q_end += " AND v.utilisateur = ?"
        params_end.append(matricule)
    elif structure == 'DSL' and role == 'secretaire':
        q_end += " AND v.demandeur_structure = 'DSL'"
    elif structure == 'CPA' and role == 'secretaire':
        q_end += " AND v.demandeur_structure = 'CPA'"
    elif role == 'chef service':
        pass
    elif role in ('chef departement', 'secretaire'):
        q_end += " AND v.demandeur_structure = ?"
        params_end.append(structure)
    
    q_end += " ORDER BY v.Date_Fin_Prestation ASC"
    
    cursor.execute(q_end, params_end)
    rows_end = cursor.fetchall()
    
    now = datetime.now()
    for r in rows_end:
        date_fin = parse_date(r[1])
        
        if date_fin:
            # If date_fin doesn't have a time (just a date object), assume midnight
            if not hasattr(date_fin, 'hour'):
                date_fin = datetime.combine(date_fin, datetime.min.time())
            hours_remaining = (date_fin - now).total_seconds() / 3600
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
            "type": "ending"
        })
    
    conn.close()

    return jsonify(results)