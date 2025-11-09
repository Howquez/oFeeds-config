var globalSessionCode;
var quillBriefing; // Quill instance for briefing
var quillConsent;  // Quill instance for consent form

// Initialize both Quill editors when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

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

    // Enable/disable load button based on file selection
    const configFileInput = document.getElementById('configFileInput');
    const loadConfigBtn = document.getElementById('loadConfigBtn');

    if (configFileInput && loadConfigBtn) {
        configFileInput.addEventListener('change', function() {
            loadConfigBtn.disabled = !this.files.length;
        });
    }
});

// This function is called when the server sends back a response
function liveRecv(data) {
    console.log('receiving');

    // Store the session code from the response
    globalSessionCode = data.code;

    // Download config file automatically
    downloadConfigFile(data.code);

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

    // Add config file info
    var configInfo = document.createElement('div');
    configInfo.className = 'alert alert-light mt-3';
    configInfo.innerHTML = `
        <i class="bi bi-download"></i> 
        <strong>Configuration Downloaded:</strong> 
        Your study configuration has been automatically saved as 
        <code>${data.code}_dice_config.json</code>. 
        Keep this file to easily recreate your study settings later.
    `;

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
    alertDiv.appendChild(configInfo); // Add config info here
    alertDiv.appendChild(paragraph_1);
    alertDiv.appendChild(subtitle);
    paragraph_1.appendChild(urlDisplay);
    alertDiv.appendChild(paragraph_2);

    if (recruitment_platform !== 'Prolific' && data.session_wide_url) {
    // Get the URL parameter name that was used
    let urlParamName = document.getElementById('url_parameter_name').value || 'participant_id';

    var modifiedSessionWideUrl = data.session_wide_url +
                                 '/?participant_label={{PLACEHOLDER}}';

    var explanatoryText = document.createElement('p');
    explanatoryText.textContent = "2. Copy the following URL and provide it to your recruitment platform. Replace the placeholder with your platform's actual participant ID variable.";

    var inputGroup = document.createElement('div');
    inputGroup.className = 'input-group mb-3';

    var urlInput = document.createElement('input');
    urlInput.setAttribute('type', 'text');
    urlInput.className = 'form-control';
    urlInput.setAttribute('value', modifiedSessionWideUrl);
    urlInput.setAttribute('readonly', true);

    var copyButton = document.createElement('button');
    copyButton.className = 'btn btn-primary';
    copyButton.setAttribute('type', 'button');
    copyButton.textContent = 'Copy URL';
    copyButton.onclick = function() {
        urlInput.select();
        document.execCommand('copy');
    };

    inputGroup.appendChild(urlInput);
    inputGroup.appendChild(copyButton);

    alertDiv.appendChild(explanatoryText);
    alertDiv.appendChild(inputGroup);
}

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
        stepThreeTitle.textContent = '3. Prolific provides a completion code. Please enter (and submit) the completion code such that (only eligible) participants can confirm their participation at the end of your study.';

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

    createSessionBtn.innerHTML = '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Creating Session...';
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
    let url_parameter_name = document.getElementById('url_parameter_name').value;
    let survey_url = document.getElementById('survey_url').value;
    let dwell_threshold = document.getElementById('dwell_threshold').value;
    let search_term = document.getElementById('search_term').value;
    let sort_by = "sequence";
    let condition_col = "condition";
    let display_skyscraper = document.getElementById('display_skyscraper').checked;

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
            url_parameter_name: url_parameter_name,
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

        // Create and display improved error message
        displaySessionError(error.message || 'Error creating session');
    });
}

/**
 * Display a categorized error message with recovery guidance and GitHub support info
 */
function displaySessionError(errorMessage) {
    const createSessionBtn = document.getElementById('createSessionBtn');

    // Categorize the error
    let errorCategory = 'Session Creation Error';
    let recoverySteps = [];
    let errorId = 'session_creation_error';

    if (errorMessage.includes('CSV') || errorMessage.includes('csv')) {
        errorCategory = 'CSV Data Error';
        errorId = 'csv_data_error';
        recoverySteps = [
            'Check that your CSV URL is correct and accessible',
            'Verify the CSV file format and delimiter selection',
            'Use the "Test CSV" button to preview your data before trying again'
        ];
    } else if (errorMessage.includes('URL') || errorMessage.includes('url')) {
        errorCategory = 'Invalid URL';
        errorId = 'invalid_url_error';
        recoverySteps = [
            'Check that the URL starts with http:// or https://',
            'Verify the URL is accessible (not behind a firewall)',
            'Try testing the URL in your browser'
        ];
    } else if (errorMessage.includes('Participant') || errorMessage.includes('participant')) {
        errorCategory = 'Participant Configuration Error';
        errorId = 'participant_config_error';
        recoverySteps = [
            'Ensure the number of participants is between 1 and 400',
            'Check that the participant number is a valid number'
        ];
    } else if (errorMessage.includes('Email') || errorMessage.includes('email')) {
        errorCategory = 'Email Error';
        errorId = 'email_error';
        recoverySteps = [
            'Verify that your email address is in the correct format (e.g., name@example.com)',
            'Make sure there are no extra spaces in the email field'
        ];
    } else {
        recoverySteps = [
            'Review all form fields for errors',
            'Check the browser console for more details (press F12)',
            'Try refreshing the page and submitting again'
        ];
    }

    // Create error div with categorized information
    let errorDiv = document.createElement('div');
    errorDiv.id = 'errorMessage';
    errorDiv.className = 'alert alert-danger mt-4 shadow';
    errorDiv.setAttribute('role', 'alert');

    let titleElem = document.createElement('h5');
    titleElem.className = 'alert-heading';
    titleElem.innerHTML = '<i class="bi bi-exclamation-triangle"></i> ' + errorCategory;
    errorDiv.appendChild(titleElem);

    let messageElem = document.createElement('p');
    messageElem.className = 'mb-3';
    messageElem.textContent = errorMessage;
    errorDiv.appendChild(messageElem);

    if (recoverySteps.length > 0) {
        let stepsLabel = document.createElement('strong');
        stepsLabel.textContent = 'What to try:';
        errorDiv.appendChild(stepsLabel);

        let stepsList = document.createElement('ul');
        stepsList.className = 'mb-3 mt-2';
        recoverySteps.forEach(step => {
            let li = document.createElement('li');
            li.textContent = step;
            stepsList.appendChild(li);
        });
        errorDiv.appendChild(stepsList);
    }

    // Add GitHub support section
    let supportDiv = document.createElement('div');
    supportDiv.className = 'border-top pt-3 mt-3';

    let supportTitle = document.createElement('small');
    supportTitle.className = 'text-muted d-block mb-2';
    supportTitle.innerHTML = '<strong>Still having issues?</strong> Copy this info to <a href="https://github.com/Howquez/DICE/discussions" target="_blank">GitHub Discussions</a> and we\'ll help:';
    supportDiv.appendChild(supportTitle);

    // Create copyable error details
    let errorDetails = `Error ID: ${errorId}
Error Message: ${errorMessage}
Timestamp: ${new Date().toISOString()}`;

    let detailsBox = document.createElement('textarea');
    detailsBox.className = 'form-control form-control-sm font-monospace';
    detailsBox.rows = 4;
    detailsBox.value = errorDetails;
    detailsBox.readOnly = true;
    detailsBox.style.fontSize = '0.85rem';
    detailsBox.id = 'errorDetailsBox';
    supportDiv.appendChild(detailsBox);

    let copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-sm btn-outline-secondary mt-2';
    copyBtn.innerHTML = '<i class="bi bi-clipboard"></i> Copy Error Details';
    copyBtn.onclick = function() {
        const box = document.getElementById('errorDetailsBox');
        box.select();
        document.execCommand('copy');

        // Show feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="bi bi-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    };
    supportDiv.appendChild(copyBtn);

    errorDiv.appendChild(supportDiv);

    // Insert the error message after the button
    createSessionBtn.parentNode.insertBefore(errorDiv, createSessionBtn.nextSibling);

    // Scroll to the error message
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    errorDiv.focus();
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
        delimiter: delimiter, // Add delimiter to replication package
        session_code: globalSessionCode, // Add session code
        configurations: {
            session_code: globalSessionCode, // Also include in configurations for clarity
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
        // Use session code in filename, similar to config file
        a.download = `${globalSessionCode}_dice_replication.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error:', error));
}

// FUNCTIONS FOR CONFIG FILE MANAGEMENT

function generateConfigFile(sessionCode) {
    // Collect all form data
    const configData = {
        // Meta information
        session_code: sessionCode,
        created_date: new Date().toISOString(),
        dice_version: "1.0", // For future compatibility

        // Form data
        title: document.getElementById('title').value,
        full_name: document.getElementById('name').value,
        eMail: document.getElementById('eMail').value,
        study_name: document.getElementById('external_name').value,
        internal_name: document.getElementById('internal_name').value,

        // Recruitment
        recruitment_platform: document.getElementById('recruitment_platform').value,
        participant_number: parseInt(document.getElementById('participant_number').value),

        // Layout and content
        channel_type: document.getElementById('channel_type').value,
        content_url: document.getElementById('content_url').value,
        delimiter: document.getElementById('delimiter').value,
        search_term: document.getElementById('search_term').value,
        display_skyscraper: document.getElementById('display_skyscraper').checked,

        // Measurement
        survey_url: document.getElementById('survey_url').value,
        dwell_threshold: parseInt(document.getElementById('dwell_threshold').value),

        // Rich text content (Quill editors)
        briefing: quillBriefing.root.innerHTML,
        consent_form: quillConsent.root.innerHTML
    };

    return configData;
}

function downloadConfigFile(sessionCode) {
    try {
        const configData = generateConfigFile(sessionCode);

        // Convert to JSON string with pretty formatting
        const jsonString = JSON.stringify(configData, null, 2);

        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sessionCode}_dice_config.json`;

        // Trigger download
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log('Config file downloaded successfully');

    } catch (error) {
        console.error('Error generating config file:', error);
        // Don't block the main flow - just log the error
    }
}

// Enable/disable load button based on file selection
document.addEventListener('DOMContentLoaded', function() {
    // Add this to your existing DOMContentLoaded listener
    const configFileInput = document.getElementById('configFileInput');
    const loadConfigBtn = document.getElementById('loadConfigBtn');

    if (configFileInput && loadConfigBtn) {
        configFileInput.addEventListener('change', function() {
            loadConfigBtn.disabled = !this.files.length;
        });
    }
});

function loadConfigurationFile() {
    const fileInput = document.getElementById('configFileInput');
    const messageDiv = document.getElementById('configLoadMessage');

    if (!fileInput.files.length) {
        showConfigMessage('Please select a configuration file.', 'warning');
        return;
    }

    const file = fileInput.files[0];

    // Check file type
    if (!file.name.toLowerCase().endsWith('.json')) {
        showConfigMessage('Please select a valid JSON configuration file.', 'danger');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const configData = JSON.parse(e.target.result);
            populateFormFromConfig(configData);
            showConfigMessage(`Configuration loaded successfully! ${configData.session_code ? `(From session: ${configData.session_code})` : ''}`, 'success');

            // Clear the file input
            fileInput.value = '';
            document.getElementById('loadConfigBtn').disabled = true;

        } catch (error) {
            console.error('Error parsing config file:', error);
            showConfigMessage('Error reading configuration file. Please ensure it\'s a valid DICE config file.', 'danger');
        }
    };

    reader.onerror = function() {
        showConfigMessage('Error reading file. Please try again.', 'danger');
    };

    reader.readAsText(file);
}

function populateFormFromConfig(config) {
    try {
        // Basic form fields - only populate if the value exists in config
        const fieldMappings = {
            'title': 'title',
            'name': 'full_name',
            'eMail': 'eMail',
            'external_name': 'study_name',
            'internal_name': 'internal_name',
            'recruitment_platform': 'recruitment_platform',
            'participant_number': 'participant_number',
            'channel_type': 'channel_type',
            'content_url': 'content_url',
            'delimiter': 'delimiter',
            'search_term': 'search_term',
            'survey_url': 'survey_url',
            'dwell_threshold': 'dwell_threshold'
        };

        // Populate basic fields
        Object.entries(fieldMappings).forEach(([elementId, configKey]) => {
            const element = document.getElementById(elementId);
            if (element && config[configKey] !== undefined) {
                if (element.type === 'checkbox') {
                    element.checked = config[configKey];
                } else {
                    element.value = config[configKey];
                }
            }
        });

        // Handle checkbox separately
        const skyscraperCheckbox = document.getElementById('display_skyscraper');
        if (skyscraperCheckbox && config.display_skyscraper !== undefined) {
            skyscraperCheckbox.checked = config.display_skyscraper;
            // Trigger the change event to show/hide the ad card
            skyscraperCheckbox.dispatchEvent(new Event('change'));
        }

        // Populate Quill editors
        if (config.briefing && quillBriefing) {
            quillBriefing.root.innerHTML = config.briefing;
        }

        if (config.consent_form && quillConsent) {
            quillConsent.root.innerHTML = config.consent_form;
        }

    } catch (error) {
        console.error('Error populating form:', error);
        showConfigMessage('Error applying configuration. Some fields may not have been loaded.', 'warning');
    }
}

function showConfigMessage(message, type) {
    const messageDiv = document.getElementById('configLoadMessage');
    if (!messageDiv) return;

    messageDiv.style.display = 'block';
    messageDiv.className = `alert alert-${type} mb-0`;
    messageDiv.innerHTML = `
        <i class="bi bi-${getMessageIcon(type)}"></i> ${message}
        <button type="button" class="btn-close float-end" onclick="hideConfigMessage()"></button>
    `;

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(hideConfigMessage, 5000);
    }
}

function hideConfigMessage() {
    const messageDiv = document.getElementById('configLoadMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

function getMessageIcon(type) {
    const icons = {
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'danger': 'x-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}