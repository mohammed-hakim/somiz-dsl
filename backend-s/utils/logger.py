from datetime import datetime


def log_transaction(cursor, num_demande, matricule, action, ip_address, actual_creator=None, compte_win=None, nom_machine=None, table_name='Demandes'):
    """
    Logs a transaction to the Journal table.
    
    compte_win and nom_machine should be sent by the client (frontend).
    If not provided, falls back to the matricule and 'WEB-CLIENT'.
    """
    q = """
    INSERT INTO Journal (
        UTILISATEUR, TYPE_OPERATION, DATE, COMPTE_WIN, NOM_MACHINE,
        ADRESSE_IP, NOM_TABLE, CODE_PIECE, OBSERVATION, EXERCICE
    )
    VALUES (?, ?, datetime('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?)
    """
    cursor.execute(q, (
        actual_creator or matricule,
        action,
        compte_win or matricule,
        nom_machine or 'WEB-CLIENT',
        ip_address,
        table_name,
        num_demande,
        action,
        str(datetime.now().year)
    ))