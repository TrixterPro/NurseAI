import os
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from waitress import serve
import dotenv
from API_key_manager import get_api_key

dotenv.load_dotenv()


env_data = dotenv.dotenv_values(".env")

API_AUTH_KEY = env_data['SECRET_API_AUTH_KEY']
GOOGLE_API_KEY = get_api_key()

if not API_AUTH_KEY:
    print("Error: SECRET_API_AUTH_KEY not found in .env file. Please create a .env file and add it.")
    exit()

if not GOOGLE_API_KEY:
    print("Error: GOOGLE_API_KEY not found in .env file. Please create a .env file and add it.")
    exit()

try:
    from AI import get_health_recommendation
except ImportError:
    print("Error: Could not import 'get_health_recommendation' from 'AI.py'.")
    print("Please ensure 'AI.py' exists and contains the required function.")
    exit()


app = Flask(__name__)
CORS(app)


def require_api_key(f):
    """Decorator to protect routes with the API Authentication Token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"error": "Authorization header is missing"}), 401

        try:
            auth_type, api_key = auth_header.split()
            if auth_type.lower() != 'bearer' or api_key != API_AUTH_KEY:
                return jsonify({"error": "Invalid API Authentication Token or scheme"}), 401
        except ValueError:
            return jsonify({"error": "Invalid Authorization header format. Expected 'Bearer <token>'"}), 401

        return f(*args, **kwargs)
    return decorated


@app.route('/aiapi', methods=['POST'])
@require_api_key
def triage_handler():
    """
    Handles incoming triage requests.
    Expects a JSON payload with 'symptoms'.
    The Google API key is handled internally by the server.
    """
    data = request.json
    symptoms = data.get('symptoms')

    if not symptoms:
        return jsonify({"error": "Missing 'symptoms' in request body"}), 400

    response_text = get_health_recommendation(symptoms, GOOGLE_API_KEY)

    return jsonify({"response": response_text})


if __name__ == '__main__':
    host = '0.0.0.0'
    port = 5001

    print("\n" + "="*50)
    print("Starting Healthcare Triage API Server")
    print("="*50)
    print(f"Server Backend: Waitress (Production)")
    print(f"Authentication: Bearer Token Required")
    print(f"Listening for requests on: http://{host}:{port}")
    print("Press CTRL+C to shut down the server.")
    print("-"*50)

    serve(app, host=host, port=port)