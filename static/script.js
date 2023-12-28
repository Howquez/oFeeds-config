
// This function is called when the server sends back a response
function liveRecv(data) {
    console.log('receiving');
    var alertDiv = document.getElementById('alertPlaceholder');

    // Update class and role of the div
    alertDiv.className = 'alert alert-success mt-4 mb-5';
    alertDiv.setAttribute('role', 'alert');

    // Clear existing content
    alertDiv.innerHTML = '';

    // Create a title element (e.g., h4)
    var title = document.createElement('h4');
    title.textContent = 'Session created successfully!';

    // Create a paragraph element for the text
    var paragraph = document.createElement('p');
    paragraph.textContent = 'You can visit your session here: ';

    // Create an anchor (a) element for the hyperlink
    var link = document.createElement('a');
    link.href = data.admin_url;
    link.textContent = data.admin_url;
    link.setAttribute('target', '_blank'); // Open in new tab

    // Append the title and paragraph to the div
    alertDiv.appendChild(title);
    alertDiv.appendChild(paragraph);

    // Append the anchor element (link) to the paragraph
    paragraph.appendChild(link);
}

// This function is called when the "Create Session" button is clicked
function sendValue() {
    console.log('sent');

    let participant_number = document.getElementById('participant_number').value;
    let content_url = document.getElementById('content_url').value;
    let recruitment_platform = document.getElementById('recruitment_platform').value;
    let survey_url = document.getElementById('survey_url').value;
    let search_term = document.getElementById('search_term').value;
    let sort_by = document.getElementById('sort_by').value;
    let condition_col = document.getElementById('condition_col').value;
    let display_skyscraper = document.getElementById('display_skyscraper').checked;
    let html_briefing = document.getElementById('html_briefing').value;

    fetch('/create_session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
    .then(data => {
        liveRecv(data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// This event listener is used to show/hide the skyscraper ad configuration
document.addEventListener('DOMContentLoaded', function () {
    var checkBox = document.getElementById('display_skyscraper');
    var adCard = document.getElementById('adCard');

    checkBox.addEventListener('change', function () {
        if (this.checked) {
            adCard.style.display = 'block';
        } else {
            adCard.style.display = 'none';
        }
    });
});
