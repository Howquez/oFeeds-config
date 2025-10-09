// CITATION MODAL FUNCTIONALITY

const citations = {
    bibtex: `@article{RoggenkampEtAl_2025_JM,
  author = {Roggenkamp, Hauke and Boegershausen, Johannes and Hildebrand, Christian},
  title = {EXPRESS: DICE: Advancing Social Media Research through Digital In-Context Experiments},
  journal = {Journal of Marketing},
  year = {2025},
  pages = {00222429251371702},
  doi = {10.1177/00222429251371702},
  url = {https://journals.sagepub.com/doi/10.1177/00222429251371702}
}`,

    apa: `Roggenkamp, H., Boegershausen, J., & Hildebrand, C. (2025). EXPRESS: DICE: Advancing Social Media Research through Digital In-Context Experiments. Journal of Marketing, 00222429251371702. https://doi.org/10.1177/00222429251371702`,

    chicago: `Roggenkamp, Hauke, Johannes Boegershausen, and Christian Hildebrand. "EXPRESS: DICE: Advancing Social Media Research through Digital In-Context Experiments." Journal of Marketing (2025): 00222429251371702. https://doi.org/10.1177/00222429251371702.`,

    plaintext: `Roggenkamp, H., Boegershausen, J., & Hildebrand, C. (2025). EXPRESS: DICE: Advancing Social Media Research through Digital In-Context Experiments. Journal of Marketing, 00222429251371702.`,

    ris: `TY  - JOUR
AU  - Roggenkamp, Hauke
AU  - Boegershausen, Johannes
AU  - Hildebrand, Christian
TI  - EXPRESS: DICE: Advancing Social Media Research through Digital In-Context Experiments
JO  - Journal of Marketing
PY  - 2025
SP  - 00222429251371702
DO  - 10.1177/00222429251371702
UR  - https://journals.sagepub.com/doi/10.1177/00222429251371702
ER  -`
};

function updateCitation() {
    const format = document.getElementById('citationFormat').value;
    const citationText = document.getElementById('citationText');
    citationText.value = citations[format];
}

function copyCitation() {
    const citationText = document.getElementById('citationText');
    citationText.select();
    document.execCommand('copy');

    // Show success message
    const successMsg = document.getElementById('copySuccess');
    successMsg.style.display = 'block';

    // Hide after 3 seconds
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 3000);
}

function downloadCitation() {
    const format = document.getElementById('citationFormat').value;
    const citationText = document.getElementById('citationText').value;

    // Determine file extension
    const extensions = {
        bibtex: 'bib',
        apa: 'txt',
        chicago: 'txt',
        plaintext: 'txt',
        ris: 'ris'
    };

    const extension = extensions[format];
    const filename = `dice_citation.${extension}`;

    // Create blob and download
    const blob = new Blob([citationText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Initialize citation text when modal is shown
document.addEventListener('DOMContentLoaded', function() {
    const citationModal = document.getElementById('citationModal');
    if (citationModal) {
        citationModal.addEventListener('show.bs.modal', function () {
            updateCitation();
        });
    }
});