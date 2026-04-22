from flask import Flask
from flask_cors import CORS
from db.init_db import init_database

from routes.auth import auth_bp
from routes.employees import employees_bp
from routes.affaires import affaires_bp
from routes.demandes import demandes_bp
from routes.maintenance import maintenance_bp
from routes.equipements import equipements_bp
from routes.notifications import notifications_bp



app = Flask(__name__)
CORS(app)


init_database()


app.register_blueprint(auth_bp)
app.register_blueprint(employees_bp)
app.register_blueprint(affaires_bp)
app.register_blueprint(demandes_bp)
app.register_blueprint(maintenance_bp)
app.register_blueprint(equipements_bp)
app.register_blueprint(notifications_bp)


@app.route('/api/test', methods=['GET'])
def testing():
    return {"message": "Testing route is working!"}

if __name__ == "__main__":
    app.run(debug=True, port=8080)