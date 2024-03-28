console.log('config_goals running')

document.addEventListener('DOMContentLoaded', function () {
    // Initially hide all cards, the create session button, and optionally the Next Steps text
    const cardsToShowHide = ['card1', 'card2', 'card3', 'card4', 'card5', 'card6'];
    cardsToShowHide.forEach(cardId => document.getElementById(cardId).style.display = 'none');
    document.getElementById('createSessionBtn').style.display = 'none'; // Hide the create session button initially

    const nextStepsText = document.getElementById('nextStepsText'); // Assume this is the ID of the Next Steps text element
    if(nextStepsText) nextStepsText.style.display = 'none';

    // Function to show/hide elements based on the selection
    function toggleElements(show) {
        // Hide all first
        cardsToShowHide.forEach(cardId => document.getElementById(cardId).style.display = 'none');

        // Hide the Next Steps text by default when toggling, show it only in Final Configuration
        if(nextStepsText) nextStepsText.style.display = 'none';

        if (show === 'testing') {
            // For Testing, show specific cards
            ['card3', 'card4', 'card5'].forEach(cardId => document.getElementById(cardId).style.display = 'block');
            // Set defaults for Recruitment card
            document.getElementById('recruitment_platform').value = 'None';
            document.getElementById('participant_number').value = 20;
        } else if (show === 'final') {
            // For Final Configuration, show all cards
            cardsToShowHide.forEach(cardId => document.getElementById(cardId).style.display = 'block');
            // Show the Next Steps text in final configuration
            if(nextStepsText) nextStepsText.style.display = 'block';
        }

        // Show the create session button after any selection is made
        document.getElementById('createSessionBtn').style.display = 'block';
    }

    // Event listeners for radio buttons to handle the display logic
    document.getElementById('btnradio1').addEventListener('change', function() {
        if (this.checked) toggleElements('testing');
    });

    document.getElementById('btnradio2').addEventListener('change', function() {
        if (this.checked) toggleElements('final');
    });
});
