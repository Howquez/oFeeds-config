from flask import Flask, render_template, request, jsonify, Response, send_from_directory, redirect, url_for
import requests
import pandas as pd
from io import StringIO
import json
import os
import re
import numpy as np
from typing import Dict, Any, Tuple, Optional
from json import JSONEncoder

app = Flask(__name__)

# Custom JSON encoder to handle numpy types and NaN
class NumpyEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, np.floating)):
            if np.isnan(obj) if isinstance(obj, np.floating) else False:
                return None
            return int(obj) if isinstance(obj, np.integer) else float(obj)
        elif isinstance(obj, np.bool_):
            return bool(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

app.json_encoder = NumpyEncoder

# Constants moved to top and using environment variables
SERVER_URL = os.getenv('SERVER_URL', 'https://ibt-hsg.herokuapp.com')
REST_KEY = os.getenv('REST_KEY', 'Torstrasse25')  # Better to use environment variable


class APIError(Exception):
    """Custom exception for API-related errors"""

    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


def detect_delimiter(csv_content: str, user_delimiter: str = ';') -> str:
    """
    Auto-detect CSV delimiter by checking which delimiter produces
    the most consistent number of columns across rows.

    Args:
        csv_content: The CSV file content as a string
        user_delimiter: The user-selected delimiter (fallback)

    Returns:
        The detected delimiter
    """
    possible_delimiters = [';', ',', '\t', '|']
    lines = csv_content.strip().split('\n')[:10]  # Check first 10 lines

    if not lines:
        return user_delimiter

    delimiter_scores = {}

    for delim in possible_delimiters:
        try:
            # Count columns in each line
            col_counts = [len(line.split(delim)) for line in lines if line.strip()]

            if not col_counts:
                continue

            # Score: prefer delimiters that produce consistent column counts
            # and at least 2 columns
            if min(col_counts) >= 2:
                # Lower variance = higher score
                variance = max(col_counts) - min(col_counts)
                # More columns = slightly higher score (to prefer comma over semicolon in ambiguous cases)
                avg_cols = sum(col_counts) / len(col_counts)
                score = avg_cols - (variance * 0.5)
                delimiter_scores[delim] = score
        except Exception:
            continue

    if not delimiter_scores:
        return user_delimiter

    # Return the delimiter with the highest score
    detected = max(delimiter_scores, key=delimiter_scores.get)

    # If detected delimiter is different from user's choice, still try user's first
    # (in case user explicitly selected a different delimiter)
    if user_delimiter in delimiter_scores:
        # Give slight preference to user's choice if it's viable
        user_score = delimiter_scores.get(user_delimiter, 0)
        detected_score = delimiter_scores[detected]
        # Only override user choice if detected is significantly better
        if detected_score > user_score * 1.2:
            return detected
        return user_delimiter

    return detected


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


def is_url(s):
    """Check if a string is a valid URL"""
    return bool(re.match(r'^https?:\/\/', str(s)))


def read_feed(path: str, delim: str) -> pd.DataFrame:
    """
    Read CSV feed data from local path or remote URL.
    Adapted from oTree DICE app.
    """
    if re.match(r'^https?://\S+', path):
        if 'github' in path:
            tweets = pd.read_csv(path, sep=delim)
        elif 'drive.google.com' in path:
            file_id = path.split('/')[-2]
            download_url = f'https://drive.google.com/uc?id={file_id}'
            tweets = pd.read_csv(download_url, sep=delim)
        else:
            raise ValueError("Unrecognized URL format. Supported: GitHub, Google Drive")
    else:
        tweets = pd.read_csv(path, sep=delim)
    return tweets


def preprocessing(df: pd.DataFrame, config: Dict = None) -> pd.DataFrame:
    """
    Preprocess CSV data to match oTree DICE app formatting.
    Adapted from oTree DICE app __init__.py preprocessing function.
    """
    # Default config if not provided
    if config is None:
        config = {'condition_col': 'condition'}

    # Reformat date
    df['datetime'] = pd.to_datetime(df['datetime'], errors='coerce')
    mask = df['datetime'].isna()
    if mask.any():
        df.loc[mask, 'datetime'] = pd.to_datetime(
            df.loc[mask, 'datetime'],
            errors='coerce',
            format='%d.%m.%y %H:%M'
        )
    df['date'] = df['datetime'].dt.strftime('%d %b').str.replace(' ', '. ')
    df['date'] = df['date'].str.lstrip('0')
    df['formatted_datetime'] = df['datetime'].dt.strftime('%I:%M %p · %b %d, %Y')

    # Fill any NaN dates with empty string
    df['date'] = df['date'].fillna('')
    df['formatted_datetime'] = df['formatted_datetime'].fillna('')

    # Highlight hashtags, cashtags, mentions, etc.
    df['text'] = df['text'].str.replace(
        r'\B(\#[a-zA-Z0-9_]+\b)',
        r'<span class="text-primary">\g<0></span>',
        regex=True
    )
    df['text'] = df['text'].str.replace(
        r'\B(\$[a-zA-Z0-9_\.]+\b)',
        r'<span class="text-primary">\g<0></span>',
        regex=True
    )
    df['text'] = df['text'].str.replace(
        r'\B(\@[a-zA-Z0-9_]+\b)',
        r'<span class="text-primary">\g<0></span>',
        regex=True
    )
    # Add links
    df['text'] = df['text'].str.replace(
        r'(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])',
        r'<a class="text-primary">\g<0></a>',
        regex=True
    )

    # Make numeric information integers and fill NAs with 0
    df['replies'] = df['replies'].fillna(0).astype(int)
    df['reposts'] = df['reposts'].fillna(0).astype(int)
    df['likes'] = df['likes'].fillna(0).astype(int)

    # Handle media - ensure it's string type
    df['media'] = df['media'].fillna('').astype(str)
    df['media'] = df['media'].str.replace("'|,", '', regex=True)
    df['pic_available'] = np.where(df['media'].str.contains('http', na=False), True, False)

    # Create profile picture availability and icon
    df['profile_pic_available'] = df['user_image'].apply(is_url)
    df['icon'] = df['username'].str[:2].str.title()

    # Assign random color class from predefined list
    color_classes = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']
    df['color_class'] = np.random.choice(color_classes, size=len(df))

    # Clean user descriptions
    df['user_description'] = df['user_description'].str.replace("'", '')
    df['user_description'] = df['user_description'].str.replace('"', '')
    df['user_description'] = df['user_description'].fillna(' ')

    # Format follower counts - handle NaN values
    df['user_followers'] = df['user_followers'].fillna(0).astype(float)
    df['user_followers'] = df['user_followers'].map('{:,.0f}'.format).str.replace(',', '.')

    # Rename condition column if specified
    if (config and 'condition_col' in config and
            config['condition_col'] and
            config['condition_col'] in df.columns):
        df.rename(columns={config['condition_col']: 'condition'}, inplace=True)

    # Drop the datetime column since we have formatted_datetime
    if 'datetime' in df.columns:
        df = df.drop(columns=['datetime'])

    return df


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

        # Get the URL parameter name from the form, with fallback logic
        url_param = data.get('url_parameter_name', '').strip()

        # If no URL parameter is provided, use default based on recruitment platform
        if not url_param:
            recruitment_platform = data.get('recruitment_platform', '')
            if recruitment_platform == 'Prolific':
                url_param = 'PROLIFIC_PID'
            elif recruitment_platform == 'Connect':
                url_param = 'participant_label'
            elif recruitment_platform == 'Lab':
                url_param = 'participant_code'
            else:
                url_param = 'participant_code'  # Default for any other case

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
                'url_param': url_param,  # Use the customizable parameter name
                'survey_link': data.get('survey_url'),
                'dwell_threshold': data.get('dwell_threshold'),
                'search_term': data.get('search_term'),
                'sort_by': data.get('sort_by'),
                'condition_col': data.get('condition_col'),
                'briefing': data.get('briefing'),
                'consent_form': data.get('consent_form')
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


@app.route('/test_csv', methods=['POST'])
def test_csv():
    """Test CSV file and validate structure"""
    try:
        data = request.get_json()
        if not data or 'content_url' not in data:
            return jsonify({"error": "Missing content_url"}), 400

        content_url = data.get('content_url', '').strip()
        user_delimiter = data.get('delimiter', ';')

        if not content_url:
            return jsonify({"error": "Content URL cannot be empty"}), 400

        # Fetch CSV from URL
        try:
            response = requests.get(content_url, timeout=10)
            response.raise_for_status()
        except requests.Timeout:
            return jsonify({"error": "Request timed out. The CSV URL may be unreachable or too slow."}), 400
        except requests.ConnectionError:
            return jsonify({"error": "Cannot connect to the URL. Please check that the URL is correct and accessible."}), 400
        except requests.HTTPError as e:
            return jsonify({"error": f"HTTP Error {response.status_code}: The URL returned an error. Check the URL is correct."}), 400
        except requests.RequestException as e:
            return jsonify({"error": f"Failed to fetch CSV: {str(e)}"}), 400

        # Auto-detect delimiter
        detected_delimiter = detect_delimiter(response.text, user_delimiter)
        delimiter = detected_delimiter

        try:
            # Parse CSV without type inference to avoid issues
            csv_data = pd.read_csv(StringIO(response.text), delimiter=delimiter, dtype=str)
        except pd.errors.ParserError as e:
            return jsonify({
                "error": "Could not parse CSV with the detected or selected delimiter. Try a different delimiter or check the CSV format."
            }), 400
        except Exception as e:
            return jsonify({"error": f"Error parsing CSV: {str(e)}"}), 400

        # Validation checks
        warnings = []
        errors = []

        # Check required columns (columns that must exist, even if they can be empty)
        required_columns = ['doc_id', 'datetime', 'text', 'condition', 'sequence', 'media', 'alt_text',
                           'likes', 'reposts', 'replies', 'username', 'handle', 'user_description',
                           'user_image', 'user_followers', 'commented_post', 'sponsored', 'target']
        all_columns = list(csv_data.columns)
        missing_required = [col for col in required_columns if col not in all_columns]

        if missing_required:
            errors.append(f"Missing required columns: {', '.join(missing_required)}")

        # Validate datetime format (similar to oTree preprocessing)
        datetime_col = 'datetime'
        if datetime_col in csv_data.columns:
            datetime_series = pd.to_datetime(csv_data[datetime_col], errors='coerce')
            failed_dates = csv_data[datetime_series.isna()][datetime_col].unique()

            if len(failed_dates) > 0:
                # Try alternate format
                datetime_series_alt = pd.to_datetime(csv_data[datetime_col], errors='coerce', format='%d.%m.%y %H:%M')
                still_failed = csv_data[datetime_series_alt.isna()][datetime_col].unique()

                if len(still_failed) > 0:
                    warnings.append(f"Some datetime values could not be parsed. Found {len(still_failed)} unparseable dates. Ensure dates are in format 'YYYY-MM-DD HH:MM' or 'DD.MM.YY HH:MM'")

        # Check for rows with data
        total_rows = len(csv_data)
        if total_rows == 0:
            errors.append("CSV file is empty (no data rows)")

        # Prepare response
        response_data = {
            "success": len(errors) == 0,
            "total_rows": int(total_rows),
            "columns": all_columns,
            "num_columns": int(len(all_columns)),
            "delimiter": delimiter,
            "warnings": warnings,
            "errors": errors
        }

        # Add column info for display
        column_info = []
        for col in all_columns:
            non_empty = int(csv_data[col].notna().sum()) if col in csv_data.columns else 0
            empty = int(total_rows - non_empty)
            column_info.append({
                "name": col,
                "non_empty_rows": non_empty,
                "empty_rows": empty
            })
        response_data["column_info"] = column_info

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


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

@app.route('/preview_feed', methods=['POST'])
def preview_feed():
    """Generate a preview of the Twitter feed with preprocessed CSV data"""
    try:
        data = request.get_json()
        if not data or 'content_url' not in data:
            return jsonify({"error": "Missing content_url"}), 400

        content_url = data.get('content_url', '').strip()
        delimiter = data.get('delimiter', ';')
        condition_col = data.get('condition_col', 'condition')

        if not content_url:
            return jsonify({"error": "Content URL cannot be empty"}), 400

        # Fetch and read CSV
        try:
            response = requests.get(content_url, timeout=10)
            response.raise_for_status()
        except requests.Timeout:
            return jsonify({"error": "Request timed out. The CSV URL may be unreachable."}), 400
        except requests.HTTPError as e:
            return jsonify({"error": f"HTTP Error {response.status_code}: Cannot access URL"}), 400
        except requests.RequestException as e:
            return jsonify({"error": f"Failed to fetch CSV: {str(e)}"}), 400

        # Parse CSV
        try:
            csv_content = StringIO(response.text)
            df = pd.read_csv(csv_content, sep=delimiter)
        except Exception as e:
            return jsonify({"error": f"Failed to parse CSV: {str(e)}"}), 400

        # Check if dataframe is empty
        if len(df) == 0:
            return jsonify({"error": "CSV file is empty"}), 400

        # Preprocess the data
        try:
            config = {'condition_col': condition_col}
            processed_df = preprocessing(df, config)
        except Exception as e:
            return jsonify({"error": f"Error processing CSV data: {str(e)}"}), 400

        # Group by condition
        preview_data = {}
        if 'condition' in processed_df.columns:
            conditions = processed_df['condition'].unique()
            for condition in conditions:
                condition_df = processed_df[processed_df['condition'] == condition]
                # Limit to 20 items per condition
                condition_df = condition_df.head(20)
                # Convert to dict and clean NaN/NaT values
                records = condition_df.to_dict('records')
                clean_records = []
                for record in records:
                    clean_record = {}
                    for key, value in record.items():
                        # Handle pandas NaT, numpy NaN, and None
                        if pd.isna(value):
                            clean_record[key] = None
                        else:
                            clean_record[key] = value
                    clean_records.append(clean_record)
                preview_data[str(condition)] = clean_records
        else:
            # No condition column, use all data
            records = processed_df.head(20).to_dict('records')
            clean_records = []
            for record in records:
                clean_record = {}
                for key, value in record.items():
                    if pd.isna(value):
                        clean_record[key] = None
                    else:
                        clean_record[key] = value
                clean_records.append(clean_record)
            preview_data['default'] = clean_records

        return jsonify({
            "success": True,
            "preview_data": preview_data,
            "total_conditions": len(preview_data),
            "items_per_condition": {cond: len(items) for cond, items in preview_data.items()}
        })

    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


@app.route('/imprint')
def imprint():
    return render_template('imprint.html')


if __name__ == '__main__':
    app.run(debug=True)