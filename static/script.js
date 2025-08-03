var globalSessionCode;
var quillBriefing; // Quill instance for briefing
var quillConsent;  // Quill instance for consent form

// Initialize both Quill editors when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize briefing editor
    quillBriefing = new Quill('#quill-editor-briefing', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'header': [1, 2, 3, 4, 5, false] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                ['clean']
            ]
        },
        placeholder: 'Write your briefing here...',
        bounds: document.querySelector('#editor-container-briefing'),
        scrollingContainer: document.querySelector('#editor-container-briefing'),
        readOnly: false,
        strict: true,
        preserveWhitespace: true
    });

    // Initialize consent form editor
    quillConsent = new Quill('#quill-editor-consent', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'header': [1, 2, 3, 4, 5, false] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                ['clean']
            ]
        },
        placeholder: 'Write your consent form here...',
        bounds: document.querySelector('#editor-container-consent'),
        scrollingContainer: document.querySelector('#editor-container-consent'),
        readOnly: false,
        strict: true,
        preserveWhitespace: true
    });

    // Add other event listeners
    document.getElementById('createSessionBtn').addEventListener('click', sendValue);
    var checkBox = document.getElementById('display_skyscraper');
    var adCard = document.getElementById('adCard');

    checkBox.addEventListener('change', function() {
        adCard.style.display = this.checked ? 'block' : 'none';
    });

    // Add event listener for recruitment platform changes
    var recruitmentPlatform = document.getElementById('recruitment_platform');
    var urlParameterField = document.getElementById('url_parameter_name');

    recruitmentPlatform.addEventListener('change', function() {
        if (this.value === 'Prolific') {
            urlParameterField.value = 'PROLIFIC_PID';
        } else {
            urlParameterField.value = 'participant_id'; // Default for other platforms
        }
    });
});

// This function is called when the server sends back a response
function liveRecv(data) {
    console.log('receiving');

    // Store the session code from the response
    globalSessionCode = data.code;

    var alertDiv = document.getElementById('alertPlaceholder');
    let recruitment_platform = document.getElementById('recruitment_platform').value;

    // Update class and role of the div
    alertDiv.className = 'alert alert-primary mt-4 mb-5 shadow';
    alertDiv.setAttribute('role', 'alert');

    // Clear existing content
    alertDiv.innerHTML = '';

    var title = document.createElement('h4');
    title.textContent = 'Session ';
    title.className = 'card-title h2 mb-0';

    var subtitle = document.createElement('h5');
    subtitle.textContent = 'Next Steps:';

    var codeElement = document.createElement('code');
    codeElement.textContent = data.code;

    title.appendChild(codeElement);
    title.append(' created successfully!');

    var paragraph_1 = document.createElement('p');
    paragraph_1.textContent = 'You can visit your session here: ';

    var paragraph_2 = document.createElement('p');
    paragraph_2.textContent = "1. Please write the session code ('" + data.code + "') or the URL (displayed above) down. A session codes is unique to the session you just created and is the only route for you to monitor the session's progress and to download your data, eventually.";

    var urlDisplay = document.createElement('div');
    urlDisplay.className = 'input-group mb-3';

    var urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.className = 'form-control';
    urlInput.value = data.admin_url;
    urlInput.setAttribute('readonly', true);

    var viewButton = document.createElement('button');
    viewButton.className = 'btn btn-primary';
    viewButton.innerHTML = '<i class="bi bi-eye"></i> View Session';
    viewButton.onclick = function(e) {
        e.preventDefault();  // Prevent any default behavior
        e.stopPropagation(); // Stop event from bubbling up
        var modal = new bootstrap.Modal(document.getElementById('sessionModal'));
        document.getElementById('session-iframe').src = data.admin_url;
        modal.show();
    };

    urlDisplay.appendChild(urlInput);
    urlDisplay.appendChild(viewButton);

    alertDiv.appendChild(title);
    alertDiv.appendChild(paragraph_1);
    alertDiv.appendChild(subtitle);
    paragraph_1.appendChild(urlDisplay);
    alertDiv.appendChild(paragraph_2);

    if (recruitment_platform === 'Prolific' && data.session_wide_url) {
        var modifiedSessionWideUrl = data.session_wide_url +
                                     '/?participant_label={{%PROLIFIC_PID%}}' +
                                     '&prolific_study_id={{%STUDY_ID%}}' +
                                     '&prolific_session_id={{%SESSION_ID%}}';

        var explanatoryText = document.createElement('p');
        explanatoryText.textContent = "2. Copy the following URL and provide it to Prolific's study details. The structure of the URL ensures that Prolific IDs are tracked. This ensures that you can merge DICE- and Qualtrics data.";

        var inputGroup = document.createElement('div');
        inputGroup.className = 'input-group mb-3';

        var urlInput = document.createElement('input');
        urlInput.setAttribute('type', 'text');
        urlInput.className = 'form-control';
        urlInput.setAttribute('value', modifiedSessionWideUrl);
        urlInput.setAttribute('readonly', true);
        urlInput.setAttribute('aria-label', 'Modified URL');
        urlInput.setAttribute('aria-describedby', 'button-addon');

        var copyButton = document.createElement('button');
        copyButton.className = 'btn btn-primary';
        copyButton.setAttribute('type', 'button');
        copyButton.setAttribute('id', 'button-addon');
        copyButton.textContent = 'Copy URL';
        copyButton.onclick = function() {
            urlInput.select();
            document.execCommand('copy');
        };

        inputGroup.appendChild(urlInput);
        inputGroup.appendChild(copyButton);

        alertDiv.appendChild(explanatoryText);
        alertDiv.appendChild(inputGroup);

        // Show the completion code section
        var stepThreeTitle = document.createElement('p');
        stepThreeTitle.textContent = '3. Prolific provides a completion code. Please enter (and submit) the completion code such that (only eligible) respondents can confirm their participation at the end of your study.';

        var inputGroup2 = document.createElement('div');
        inputGroup2.className = 'input-group mb-3';

        var completionCodeInput = document.createElement('input');
        completionCodeInput.type = 'text';
        completionCodeInput.className = 'form-control';
        completionCodeInput.id = 'completionCode';
        completionCodeInput.placeholder = 'Enter Completion Code';

        var submitCodeButton = document.createElement('button');
        submitCodeButton.className = 'btn btn-primary';
        submitCodeButton.textContent = 'Submit Code';
        submitCodeButton.onclick = function() { submitCompletionCode(); };

        inputGroup2.appendChild(completionCodeInput);
        inputGroup2.appendChild(submitCodeButton);

        alertDiv.appendChild(stepThreeTitle);
        alertDiv.appendChild(inputGroup2);
    }
}

function sendValue() {
    console.log('sent');

    var createSessionBtn = document.getElementById('createSessionBtn');
    createSessionBtn.innerHTML = '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Loading...';
    createSessionBtn.disabled = true;

    // Clear any previous error messages
    let errorMessageElement = document.getElementById('errorMessage');
    if (errorMessageElement) {
        errorMessageElement.remove();
    }

    // Get the HTML content from both Quill editors
    let html_briefing = quillBriefing.getText().trim() === '' ? '' : quillBriefing.root.innerHTML;
    let html_consent = quillConsent.getText().trim() === '' ? '' : quillConsent.root.innerHTML;

    let title = document.getElementById('title').value;
    let full_name = document.getElementById('name').value;
    let eMail = document.getElementById('eMail').value;
    let study_name = document.getElementById('external_name').value;
    let channel_type = document.getElementById('channel_type').value;
    let participant_number = document.getElementById('participant_number').value;
    let delimiter = document.getElementById('delimiter').value;
    let content_url = document.getElementById('content_url').value;
    let recruitment_platform = document.getElementById('recruitment_platform').value;
    let url_parameter_name = document.getElementById('url_parameter_name').value; // NEW FIELD
    let survey_url = document.getElementById('survey_url').value;
    let dwell_threshold = document.getElementById('dwell_threshold').value;
    let search_term = document.getElementById('search_term').value;
    let sort_by = "sequence";
    let condition_col = "condition";
    let display_skyscraper = document.getElementById('display_skyscraper').checked;

    // Directly proceed with creating the session without validation
    fetch('/create_session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: title,
            full_name: full_name,
            eMail: eMail,
            study_name: study_name,
            channel_type: channel_type,
            participant_number: parseInt(participant_number),
            content_url: content_url,
            delimiter: delimiter,
            recruitment_platform: recruitment_platform,
            url_parameter_name: url_parameter_name, // NEW FIELD
            survey_url: survey_url,
            dwell_threshold: dwell_threshold,
            search_term: search_term,
            sort_by: sort_by,
            condition_col: condition_col,
            display_skyscraper: display_skyscraper,
            briefing: html_briefing,
            consent_form: html_consent
        }),
    })
    .then(response => {
        // Check if the response is successful
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.error || 'Unknown error occurred');
            });
        }
        return response.json();
    })
    .then(sessionData => {
        liveRecv(sessionData);
        createSessionBtn.style.display = 'none';
    })
    .catch(error => {
        console.error('Session Creation Error:', error);

        // Reset button state
        createSessionBtn.innerHTML = 'Create Session';
        createSessionBtn.disabled = false;

        // Create and display error message
        let errorDiv = document.createElement('div');
        errorDiv.id = 'errorMessage';
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.textContent = error.message || 'Error creating session';

        // Insert the error message before the button
        createSessionBtn.parentNode.insertBefore(errorDiv, createSessionBtn);

        // Scroll to the error message
        errorDiv.scrollIntoView({ behavior: 'smooth' });
    });
}

function submitCompletionCode() {
    var alertDiv = document.getElementById('alertPlaceholder');
    var completionCode = document.getElementById('completionCode').value;
    var completionAlertDiv = document.getElementById('completionAlertPlaceholder');

    fetch('/submit_completion_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            completion_code: completionCode,
            session_code: globalSessionCode
        }),
    })
    .then(response => response.json())
    .then(data => {
        completionAlertDiv.innerHTML = 'Everything is set up now! Consider downloading the replication package (a .json file) for documentation purposes.';
        completionAlertDiv.className = 'alert alert-success my-4';
        alertDiv.className = 'alert alert-success mt-4 mb-5 shadow';

        let lineBreak1 = document.createElement('br');
        let lineBreak2 = document.createElement('br');
        completionAlertDiv.appendChild(lineBreak1);
        completionAlertDiv.appendChild(lineBreak2);

        let replicationButton = document.createElement('button');
        replicationButton.id = 'createReplicationPackageBtn';
        replicationButton.type = 'button';
        replicationButton.className = 'btn btn-success';
        replicationButton.textContent = 'Create Replication Package';
        replicationButton.setAttribute('onclick', 'createReplicationPackage();');

        completionAlertDiv.appendChild(replicationButton);
    })
    .catch(error => {
        console.error('Error submitting completion code:', error);
        completionAlertDiv.innerHTML = 'Error occurred: ' + error;
        completionAlertDiv.className = 'alert alert-danger my-4';
        alertDiv.className = 'alert alert-danger mt-4 mb-5 shadow';
    });
}

function retrieveSessionData(event) {
    event.preventDefault();
    const sessionCode = document.getElementById('sessionCodeInput').value;
    if (sessionCode) {
        fetch(`/api/sessions/${sessionCode}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    } else {
        alert('Please enter a session code.');
    }
}

function createReplicationPackage() {
    let contentUrl = document.getElementById('content_url').value;
    let delimiter = document.getElementById('delimiter').value;
    let eMail = document.getElementById('eMail').value;
    let study_name = document.getElementById('external_name').value;
    let recruitmentPlatform = document.getElementById('recruitment_platform').value;
    let participantNumber = document.getElementById('participant_number').value;
    let surveyUrl = document.getElementById('survey_url').value;
    let dwellThreshold = document.getElementById('dwell_threshold').value;
    let searchTerm = document.getElementById('search_term').value;

    let data = {
        content_url: contentUrl,
        configurations: {
            email: eMail,
            study_name: study_name,
            date_time: new Date(),
            recruitmentPlatform: recruitmentPlatform,
            participantNumber: participantNumber,
            surveyUrl: surveyUrl,
            dwellThreshold: dwellThreshold,
            searchTerm: searchTerm
        }
    };

    fetch('/create_replication_package', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'replication_package.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error:', error));
}