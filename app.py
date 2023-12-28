from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# Constants for API calls
SERVER_URL = 'https://ibt-hsg.herokuapp.com'
REST_KEY = ''  # fill this with your actual REST key

@app.route('/')
def index():
    # This route serves the index.html template
    return render_template('index.html')

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
            session_config_name='oTweet',
            num_participants=data.get('participant_number'),
            modified_session_config_fields=dict(
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
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
