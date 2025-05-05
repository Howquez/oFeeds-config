from flask import Flask, render_template, request, jsonify, Response, send_from_directory, redirect, url_for
import requests
import pandas as pd
from io import StringIO
import json
import os
from typing import Dict, Any, Tuple, Optional

app = Flask(__name__)

# Constants moved to top and using environment variables
SERVER_URL = os.getenv('SERVER_URL', 'https://ibt-hsg.herokuapp.com')
REST_KEY = os.getenv('REST_KEY', 'Torstrasse25')  # Better to use environment variable


class APIError(Exception):
    """Custom exception for API-related errors"""

    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


def call_api(method: str, *path_parts: str, **params: Any) -> Dict:
    """Enhanced API call function with better error handling"""
    try:
        path = '/'.join(str(part) for part in path_parts)
        url = f'{SERVER_URL}/api/{path}/'
        headers = {'otree-rest-key': REST_KEY}

        response = requests.request(method, url, json=params, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        status_code = e.response.status_code if hasattr(e, 'response') else 500
        raise APIError(f'Request to "{url}" failed: {str(e)}', status_code)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/docs/', defaults={'filename': 'index.html'})
@app.route('/docs/<path:filename>')
def serve_docs(filename):
    try:
        return send_from_directory('templates/docs', filename)
    except FileNotFoundError:
        return redirect(url_for('serve_docs', filename='index.html'))


@app.route('/create_session', methods=['POST'])
def create_session():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Participant Number Validation (max of 400)
        participant_number = data.get('participant_number')
        if participant_number is None or not isinstance(participant_number,
                                                        int) or participant_number < 1 or participant_number > 400:
            return jsonify({"error": "Participant number must be between 1 and 400"}), 400

        url_param = 'PROLIFIC_PID' if data.get('recruitment_platform') == 'Prolific' else 'None'

        response = call_api(
            'POST',
            'sessions',
            session_config_name='Twitter',
            num_participants=data.get('participant_number'),
            modified_session_config_fields={
                'title': data.get('title'),
                'full_name': data.get('full_name'),
                'eMail': data.get('eMail'),
                'study_name': data.get('study_name'),
                'channel_type': data.get('channel_type'),
                'data_path': data.get('content_url'),
                'delimiter': data.get('delimiter'),
                'topics': not data.get('display_skyscraper'),
                'url_param': url_param,
                'survey_link': data.get('survey_url'),
                'dwell_threshold': data.get('dwell_threshold'),
                'search_term': data.get('search_term'),
                'sort_by': data.get('sort_by'),
                'condition_col': data.get('condition_col'),
                'briefing': data.get('briefing')
            }
        )
        return jsonify(response)
    except APIError as e:
        return jsonify({"error": str(e)}), e.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/submit_completion_code', methods=['POST'])
def submit_completion_code():
    try:
        data = request.get_json()
        if not data or not all(k in data for k in ['completion_code', 'session_code']):
            return jsonify({"error": "Missing required fields"}), 400

        response = call_api(
            'POST',
            'session_vars',
            data['session_code'],
            vars=dict(completion_code=data['completion_code'])
        )

        return jsonify({
            "status": "success",
            "api_response": response,
            "completion_code": data['completion_code'],
            "session_code": data['session_code']
        })
    except APIError as e:
        return jsonify({"error": str(e)}), e.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/sessions/<session_code>')
def get_session_data(session_code):
    try:
        data = call_api('GET', 'sessions', session_code)
        return jsonify(data)
    except APIError as e:
        return jsonify({"error": str(e)}), e.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/create_replication_package', methods=['POST'])
def create_replication_package():
    try:
        data = request.get_json()
        if not data or 'content_url' not in data:
            return jsonify({"error": "Missing required fields"}), 400

        response = requests.get(data['content_url'])
        response.raise_for_status()

        csv_data = pd.read_csv(StringIO(response.text), delimiter=data.get('delimiter', ';'))

        package_json = json.dumps({
            "configurations": data.get('configurations', {}),
            "csv_data": csv_data.to_dict(orient='records')
        }, indent=4)

        response = Response(
            package_json,
            mimetype='application/json',
            headers={'Content-Disposition': 'attachment; filename=replication_package.json'}
        )
        return response
    except requests.RequestException as e:
        return jsonify({'error': f'Failed to fetch CSV data: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True)