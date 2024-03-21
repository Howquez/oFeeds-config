
var globalSessionCode;

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
    paragraph_1.textContent = 'You can visit your session: ';

    var paragraph_2 = document.createElement('p');
    paragraph_2.textContent = "1. Please write the session code ('" + data.code + "') or the URL (displayed above) down. They are unique to the session you just created and they are the only route for you to monitor the session's progress and to download your data, eventually.";

    var link = document.createElement('a');
    link.href = data.admin_url;
    link.textContent = data.admin_url;
    link.setAttribute('target', '_blank');

    alertDiv.appendChild(title);
    alertDiv.appendChild(paragraph_1);
    alertDiv.appendChild(subtitle);
    paragraph_1.appendChild(link);
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
    }

    // Show the completion code section if Prolific was chosen
    if (recruitment_platform === 'Prolific') {
        var completionAlertDiv = document.getElementById('completionAlertPlaceholder');
        completionAlertDiv.style.display = 'block';
    }
}

function sendValue() {
    console.log('sent');

    var createSessionBtn = document.getElementById('createSessionBtn');
    createSessionBtn.innerHTML = '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Loading...';
    createSessionBtn.disabled = true;

    let title = document.getElementById('title').value;
    let full_name = document.getElementById('name').value;
    let eMail = document.getElementById('eMail').value;
    let participant_number = document.getElementById('participant_number').value;
    let content_url = document.getElementById('content_url').value;
    let recruitment_platform = document.getElementById('recruitment_platform').value;
    let survey_url = document.getElementById('survey_url').value;
    let search_term = document.getElementById('search_term').value;
    let sort_by = document.getElementById('sort_by').value;
    let condition_col = document.getElementById('condition_col').value;
    let display_skyscraper = document.getElementById('display_skyscraper').checked;
    let html_briefing = document.getElementById('html_briefing').value;

    // Perform CSV validation before creating a session
    fetch('/validate_csv', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({content_url: content_url}),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            console.log(data.message);
            // Proceed with creating the session after successful validation
            fetch('/create_session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title,
                    full_name: full_name,
                    eMail: eMail,
                    participant_number: parseInt(participant_number),
                    content_url: content_url,
                    recruitment_platform: recruitment_platform,
                    survey_url: survey_url,
                    search_term: search_term,
                    sort_by: sort_by,
                    condition_col: condition_col,
                    display_skyscraper: display_skyscraper,
                    briefing: html_briefing
                }),
            })
            .then(response => response.json())
            .then(sessionData => {
                liveRecv(sessionData);
                createSessionBtn.style.display = 'none';
            })
            .catch(error => {
                console.error('Session Creation Error:', error);
            });
        } else if (data.error) {
            alert("Validation Error: " + data.error);
            createSessionBtn.innerHTML = 'Create Session';
            createSessionBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('CSV Validation Error:', error);
        alert("Validation request failed.");
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
            session_code: globalSessionCode // Include the stored session_code
        }),
    })
    .then(response => response.json())
    .then(data => {
        completionAlertDiv.innerHTML = 'Everything is set up now! Consider to print this page for documentation purposes.';
        completionAlertDiv.className = 'alert alert-success my-4';
        alertDiv.className = 'alert alert-success mt-4 mb-5 shadow';

        // Optionally add a print button or other response handling here
    })
    .catch(error => {
        console.error('Error submitting completion code:', error);
        completionAlertDiv.innerHTML = 'Error occurred: ' + error;
        completionAlertDiv.className = 'alert alert-danger my-4';
        alertDiv.className = 'alert alert-danger mt-4 mb-5 shadow';
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('createSessionBtn').addEventListener('click', sendValue);
    var checkBox = document.getElementById('display_skyscraper');
    var adCard = document.getElementById('adCard');

    checkBox.addEventListener('change', function () {
        adCard.style.display = this.checked ? 'block' : 'none';
    });
});


function retrieveSessionData(event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way
    const sessionCode = document.getElementById('sessionCodeInput').value;
    if (sessionCode) {
        // Call your Flask backend with the session code
        fetch(`/api/sessions/${sessionCode}`)
            .then(response => response.json())
            .then(data => {
                console.log(data); // Handle the response data
                // Display data or initiate download of data as needed
            })
            .catch(error => {
                console.error('Error:', error);
            });
    } else {
        alert('Please enter a session code.');
    }
}
