from datetime import datetime
import socket
import getpass

def log_transaction(cursor, num_demande, matricule, action, ip_address, actual_creator=None):
    q = """
    INSERT INTO Journal (
        UTILISATEUR, TYPE_OPERATION, DATE, COMPTE_WIN, NOM_MACHINE,
        ADRESSE_IP, NOM_TABLE, CODE_PIECE, OBSERVATION, EXERCICE
    )
    VALUES (?, ?, datetime('now', 'localtime'), ?, ?, ?, 'Demandes', ?, ?, ?)
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