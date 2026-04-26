import jwt
from functools import wraps
from flask import request, jsonify, g
import os
import datetime

SECRET_KEY = os.environ.get('SECRET_KEY', 'somiz_logistics_secret_key_2026_change_please')
ALGORITHM = "HS256"

def generate_token(user_data):
    """
    Generates a JWT token valid for 7 days.
    """
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow(),
        'user': user_data
    }
    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return jsonify({}), 200

        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
            
        if not token:
            print("[AUTH ERROR] Missing Token. Headers:", request.headers)
            return jsonify({'error': 'Token is missing. Please log in.'}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            g.user = data['user']  # stores user dictionary in flask global
        except jwt.ExpiredSignatureError:
            print("[AUTH ERROR] Expired Token")
            return jsonify({'error': 'Token has expired. Please log in again.'}), 401
        except jwt.InvalidTokenError as e:
            print("[AUTH ERROR] Invalid Token:", str(e))
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401
        except Exception as e:
            print("[AUTH ERROR] Unexpected internal error:", str(e))
            return jsonify({'error': 'Authentication internal error.'}), 401

        return f(*args, **kwargs)
    return decorated

def require_role(roles):
    """
    roles: list of allowed roles e.g. ['chef departement', 'chef service']
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not getattr(g, 'user', None):
                return jsonify({'error': 'Authentication required.'}), 401
            
            user_role = g.user.get('role')
            if user_role not in roles:
                return jsonify({'error': f'Unauthorized. requires one of: {", ".join(roles)}'}), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator
