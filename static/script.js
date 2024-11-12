
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

    /*var link = document.createElement('a');
    link.href = data.admin_url;
    link.textContent = data.admin_url;
    link.setAttribute('target', '_blank');

    alertDiv.appendChild(title);
    alertDiv.appendChild(paragraph_1);
    alertDiv.appendChild(subtitle);
    paragraph_1.appendChild(link);
    alertDiv.appendChild(paragraph_2);*/

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

    function copySessionUrl() {
        var urlInput = document.getElementById('sessionUrl');
        urlInput.select();
        document.execCommand('copy');

        // Optional: Show a tooltip or some feedback that the URL was copied
        var copyButton = urlInput.nextElementSibling;
        var originalText = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="bi bi-check"></i> Copied!';
        setTimeout(function() {
            copyButton.innerHTML = originalText;
        }, 2000);
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
    }

    // Show the completion code section if Prolific was chosen
    if (recruitment_platform === 'Prolific') {
        // Show the completion code section
        var stepThreeTitle = document.createElement('p');
        stepThreeTitle.textContent = '3. Prolific provides a completion code. Please enter (and submit) the completion code such that (only eligible) respondents can confirm their participation at the end of your study.';

        // Create a Bootstrap input group
        var inputGroup2 = document.createElement('div');
        inputGroup2.className = 'input-group mb-3';

        // Include the input field for the completion code
        var completionCodeInput = document.createElement('input');
        completionCodeInput.type = 'text';
        completionCodeInput.className = 'form-control';
        completionCodeInput.id = 'completionCode';
        completionCodeInput.placeholder = 'Enter Completion Code';

        // Include the button to submit the completion code
        var submitCodeButton = document.createElement('button');
        submitCodeButton.className = 'btn btn-primary';
        submitCodeButton.textContent = 'Submit Code';
        submitCodeButton.onclick = function() { submitCompletionCode(); };

        // Append the input and button to the input group
        inputGroup2.appendChild(completionCodeInput);
        inputGroup2.appendChild(submitCodeButton);

        // Append the new elements to the alert div
        alertDiv.appendChild(stepThreeTitle);
        alertDiv.appendChild(inputGroup2);
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
    let study_name = document.getElementById('external_name').value;
    let channel_type = document.getElementById('channel_type').value;
    let participant_number = document.getElementById('participant_number').value;
    let delimiter = document.getElementById('delimiter').value;
    let content_url = document.getElementById('content_url').value;
    let recruitment_platform = document.getElementById('recruitment_platform').value;
    let survey_url = document.getElementById('survey_url').value;
    let dwell_threshold = document.getElementById('dwell_threshold').value;
    let search_term = document.getElementById('search_term').value;
    let sort_by = "sequence"; //document.getElementById('sort_by').value;
    let condition_col = "condition"; // document.getElementById('condition_col').value;
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
                    study_name: study_name,
                    channel_type: channel_type,
                    participant_number: parseInt(participant_number),
                    content_url: content_url,
                    delimiter: delimiter,
                    recruitment_platform: recruitment_platform,
                    survey_url: survey_url,
                    dwell_threshold: dwell_threshold,
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
        completionAlertDiv.innerHTML = 'Everything is set up now! Consider downloading the replication package (a .json file) for documentation purposes.';
        completionAlertDiv.className = 'alert alert-success my-4';
        alertDiv.className = 'alert alert-success mt-4 mb-5 shadow';

        // Add a line break before the button
        let lineBreak1 = document.createElement('br');
        let lineBreak2 = document.createElement('br');
        completionAlertDiv.appendChild(lineBreak1);
        completionAlertDiv.appendChild(lineBreak2);

        // Add the Create Replication Package button
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

