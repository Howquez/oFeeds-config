from flask import Flask, render_template, request, jsonify, Response
from pprint import pprint
import requests
import pandas as pd
from io import StringIO
import json

app = Flask(__name__)

# Constants for API calls
SERVER_URL = 'https://ibt-hsg.herokuapp.com'
REST_KEY = 'Torstrasse25'  # fill this with your actual REST key

@app.route('/')
def index():
    # This route serves the index.html template
    return render_template('index.html')

@app.route('/documentation')
def documentation():
    return render_template('documentation.html')

# Helper function to call the external API
def call_api(method, *path_parts, **params):
    path_parts = '/'.join(str(part) for part in path_parts)
    url = f'{SERVER_URL}/api/{path_parts}/'
    headers = {'otree-rest-key': REST_KEY}
    resp = method(url, json=params, headers=headers)
    if not resp.ok:
        msg = (
            f'Request to "{url}" failed '
            f'with status code {resp.status_code}: {resp.text}'
        )
        raise Exception(msg)
    return resp.json()

# Add the CSV validation logic here
def check_delimiter(content_url, expected_delimiter=';'):
    try:
        df = pd.read_csv(content_url, sep=expected_delimiter, engine='python')
        if df.shape[1] == 1:
            return False, None
        return True, df
    except Exception:
        return False, None

@app.route('/validate_csv', methods=['POST'])
def validate_csv():
    data = request.json
    content_url = data.get('content_url')
    expected_delimiter = ';'

    delimiter_ok, df = check_delimiter(content_url, expected_delimiter)
    if not delimiter_ok:
        return jsonify({"error": "CSV file seems to use a wrong delimiter. Expected ';'."}), 400

    try:
        required_columns = ['datetime', 'text', 'replies', 'reposts', 'likes', 'media', 'username']
        if not all(column in df.columns for column in required_columns):
            return jsonify({"error": "CSV file is missing one or more required columns."}), 400

        pd.to_datetime(df['datetime'])
        for column in ['replies', 'reposts', 'likes']:
            if not pd.api.types.is_numeric_dtype(df[column]):
                return jsonify({"error": f"Column '{column}' contains non-numeric values."}), 400

        return jsonify({"message": "CSV validation passed."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/create_session', methods=['POST'])
def create_session():
    # This route handles the API call based on form data
    data = request.json

    url_param = 'None'
    if data.get('recruitment_platform') == 'Prolific':
        url_param = 'PROLIFIC_PID'

    try:
        response = call_api(
            requests.post,
            'sessions',
            session_config_name='Twitter',
            num_participants=data.get('participant_number'),
            modified_session_config_fields=dict(
                title=data.get('title'),
                full_name=data.get('full_name'),
                eMail=data.get('eMail'),
                study_name=data.get('study_name'),
                channel_type=data.get('channel_type'),
                data_path=data.get('content_url'),
                topics=not data.get('display_skyscraper'),
                url_param=url_param,
                survey_link=data.get('survey_url'),
                search_term=data.get('search_term'),
                sort_by=data.get('sort_by'),
                condition_col=data.get('condition_col'),
                briefing=data.get('briefing')
            )
        )
        # print(response)
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/submit_completion_code', methods=['POST'])
def submit_completion_code():
    data = request.json
    print("Received data:", data)  # Print the received data

    completion_code = data.get('completion_code')
    session_code = data.get('session_code')

    try:
        # Use the call_api function to process the completion_code and session_code
        api_response = call_api(
            requests.post,
            'session_vars',
            session_code,
            vars=dict(completion_code=completion_code)
        )

        # Construct the response
        response = {
            "status": "success",
            "api_response": api_response,  # The response from the external API
            "completion_code": completion_code,
            "session_code": session_code
        }
        print("Response data:", response)  # Print the response data

        return jsonify(response)
    except Exception as e:
        error_response = {"error": str(e)}
        print("Error response:", error_response)  # Print the error response

        return jsonify(error_response), 500


@app.route('/api/sessions/<session_code>')
def get_session_data(session_code):
    try:
        data = call_api(requests.get, 'sessions', session_code)
        # You may need to process data here before sending it to the frontend
        # return jsonify(data)
        pprint(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/create_replication_package', methods=['POST'])
def create_replication_package():
    data = request.json
    csv_url = data['content_url']
    configurations = data.get('configurations', {})

    try:
        response = requests.get(csv_url)
        response.raise_for_status()
        csv_data = pd.read_csv(StringIO(response.text), delimiter=';')

        replication_package = {
            "configurations": configurations,
            "csv_data": csv_data.to_dict(orient='records')
        }

        package_json = json.dumps(replication_package, indent=4)

        download_filename = 'replication_package.json'
        response = Response(package_json, mimetype='application/json')
        response.headers['Content-Disposition'] = f'attachment; filename={download_filename}'

        return response
    except requests.RequestException as e:
        return jsonify({'status': 'error', 'message': 'Failed to fetch CSV data: ' + str(e)})
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'An error occurred: ' + str(e)})

if __name__ == '__main__':
    app.run(debug=True)

