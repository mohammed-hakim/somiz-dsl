from flask import Blueprint, request, jsonify
from db.connection import get_db_connection
from utils.logger import log_transaction
from datetime import datetime

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/api/notifications', methods=['GET'])
def get_notifications():
    matricule = request.args.get("matricule")
    role = request.args.get("role")
    structure = request.args.get("structure")

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
    if role == 'agent':
        q += f" AND v.utilisateur = '{matricule}'"
    elif structure == 'DSL' and role == 'secretaire':
        # DSL secretaire see Validé, Approuvé, En Cours
        q += " AND v.Status IN ('Validé', 'Approuvé', 'En Cours')"
    elif structure == 'CPA' and role == 'secretaire':
        # CPA secretaire see Sous Traitance
        q += " AND v.Status IN ('Sous Traitance')"
    elif role == 'chef service':
        # Chef service - no notifications (same as secretaire of demandeur)
        pass
    elif role in ('chef departement', 'secretaire'):
        # Chef departement and secretaire of demandeur structure see their demandes
        q += f" AND v.demandeur_structure = '{structure}'"

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
    if role == 'agent':
        q_end += f" AND v.utilisateur = '{matricule}'"
    elif structure == 'DSL' and role == 'secretaire':
        q_end += " AND v.demandeur_structure = 'DSL'"
    elif structure == 'CPA' and role == 'secretaire':
        q_end += " AND v.demandeur_structure = 'CPA'"
    elif role == 'chef service':
        # Chef service - no notifications (same as secretaire of demandeur)
        pass
    elif role in ('chef departement', 'secretaire'):
        q_end += f" AND v.demandeur_structure = '{structure}'"
    
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

