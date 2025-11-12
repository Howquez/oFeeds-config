/**
 * Form Validation System for DICE App
 * Provides real-time validation and feedback for form fields
 */

const validationRules = {
    name: {
        required: true,
        minLength: 2,
        pattern: /^[a-zA-Z\s'-]+$/,
        errorMessages: {
            required: 'Name is required',
            minLength: 'Name must be at least 2 characters',
            pattern: 'Name can only contain letters, spaces, hyphens, and apostrophes'
        }
    },
    eMail: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        errorMessages: {
            required: 'Email is required',
            pattern: 'Please enter a valid email address (e.g., name@example.com)'
        }
    },
    external_name: {
        required: true,
        minLength: 3,
        errorMessages: {
            required: 'Study name is required',
            minLength: 'Study name must be at least 3 characters'
        }
    },
    internal_name: {
        required: true,
        minLength: 3,
        errorMessages: {
            required: 'Internal study name is required',
            minLength: 'Internal study name must be at least 3 characters'
        }
    },
    participant_number: {
        required: true,
        min: 1,
        max: 400,
        type: 'number',
        errorMessages: {
            required: 'Number of participants is required',
            min: 'Participant number must be at least 1',
            max: 'Participant number cannot exceed 400',
            type: 'Must be a valid number'
        }
    },
    content_url: {
        required: true,
        pattern: /^https?:\/\/.+$/,
        errorMessages: {
            required: 'Content URL is required',
            pattern: 'Please enter a valid URL starting with http:// or https://'
        }
    },
    survey_url: {
        required: false,
        pattern: /^(https?:\/\/.+)?$/,
        errorMessages: {
            pattern: 'Please enter a valid URL starting with http:// or https://, or leave blank'
        }
    },
    search_term: {
        required: true,
        minLength: 1,
        errorMessages: {
            required: 'Search term is required',
            minLength: 'Search term must not be empty'
        }
    },
    dwell_threshold: {
        required: true,
        min: 1,
        max: 100,
        type: 'number',
        errorMessages: {
            required: 'Dwell time threshold is required',
            min: 'Value must be at least 1',
            max: 'Value cannot exceed 100',
            type: 'Must be a valid number'
        }
    }
};

/**
 * Validate a single field based on rules
 */
function validateField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return true;

    const rules = validationRules[fieldId];
    if (!rules) return true; // No validation rules defined

    const value = field.value.trim();
    const isRequired = rules.required !== false;
    const isEmpty = value === '';

    // Clear previous validation state
    field.classList.remove('is-invalid', 'is-valid');
    removeFieldError(fieldId);

    // Check required
    if (isRequired && isEmpty) {
        showFieldError(fieldId, rules.errorMessages.required);
        field.classList.add('is-invalid');
        return false;
    }

    // If empty and not required, it's valid
    if (isEmpty && !isRequired) {
        field.classList.add('is-valid');
        return true;
    }

    // Check minimum length
    if (rules.minLength && value.length < rules.minLength) {
        showFieldError(fieldId, rules.errorMessages.minLength);
        field.classList.add('is-invalid');
        return false;
    }

    // Check pattern
    if (rules.pattern && !rules.pattern.test(value)) {
        showFieldError(fieldId, rules.errorMessages.pattern);
        field.classList.add('is-invalid');
        return false;
    }

    // Check min value (for numbers)
    if (rules.min !== undefined) {
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < rules.min) {
            showFieldError(fieldId, rules.errorMessages.min || rules.errorMessages.type);
            field.classList.add('is-invalid');
            return false;
        }
    }

    // Check max value (for numbers)
    if (rules.max !== undefined) {
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue > rules.max) {
            showFieldError(fieldId, rules.errorMessages.max || rules.errorMessages.type);
            field.classList.add('is-invalid');
            return false;
        }
    }

    // If all checks pass
    field.classList.add('is-valid');
    return true;
}

/**
 * Show error message for a field
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Remove existing error message
    removeFieldError(fieldId);

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.id = `${fieldId}-error`;
    errorDiv.textContent = message;

    // Insert after the field
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

/**
 * Remove error message for a field
 */
function removeFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Validate all required fields
 */
function validateAllFields() {
    const fieldsToValidate = [
        'name', 'eMail', 'external_name', 'internal_name',
        'participant_number', 'content_url', 'search_term', 'dwell_threshold'
    ];

    let allValid = true;
    fieldsToValidate.forEach(fieldId => {
        if (!validateField(fieldId)) {
            allValid = false;
        }
    });

    return allValid;
}

/**
 * Update submit button state based on form validity
 */
function updateSubmitButtonState() {
    const createSessionBtn = document.getElementById('createSessionBtn');
    if (!createSessionBtn) return;

    const isValid = validateAllFields();
    createSessionBtn.disabled = !isValid;
}

/**
 * Initialize validation on form fields
 */
function initializeFormValidation() {
    // Get all fields that have validation rules
    const fieldsWithValidation = Object.keys(validationRules);

    fieldsWithValidation.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Validate on blur
            field.addEventListener('blur', function() {
                validateField(fieldId);
                updateSubmitButtonState();
            });

            // Validate on input (for real-time feedback)
            field.addEventListener('input', function() {
                // Only show errors after user has left the field once (on blur)
                if (this.classList.contains('is-invalid') || this.classList.contains('is-valid')) {
                    validateField(fieldId);
                    updateSubmitButtonState();
                }
            });

            // For select elements, validate on change
            if (field.tagName === 'SELECT') {
                field.addEventListener('change', function() {
                    validateField(fieldId);
                    updateSubmitButtonState();
                });
            }
        }
    });

    // Initial button state
    updateSubmitButtonState();
}

/**
 * Test CSV and show preview
 */
async function testCSV() {
    const contentUrl = document.getElementById('content_url').value;
    const delimiter = document.getElementById('delimiter').value;
    const previewContainer = document.getElementById('csv-preview-container');

    if (!contentUrl) {
        showCSVError('Please enter a CSV URL first');
        return;
    }

    try {
        const response = await fetch('/test_csv', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content_url: contentUrl,
                delimiter: delimiter
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showCSVError(data.error || 'Failed to load CSV');
            return;
        }

        displayCSVPreview(data);
    } catch (error) {
        showCSVError(`Network error: ${error.message}`);
    }
}

/**
 * Display CSV validation results
 */
function displayCSVPreview(data) {
    const previewContainer = document.getElementById('csv-preview-container');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';
    previewContainer.style.display = 'block';

    // Auto-fill the delimiter field if detected (only show pill on first validation)
    if (data.delimiter) {
        const delimiterSelect = document.getElementById('delimiter');
        const delimiterBadge = document.querySelector('[data-delimiter-badge]');

        if (delimiterSelect) {
            delimiterSelect.value = data.delimiter;

            // Show "Auto-Detected" badge only on first successful validation
            if (delimiterBadge && !delimiterBadge.dataset.detected) {
                delimiterBadge.style.opacity = '1';
                delimiterBadge.dataset.detected = 'true';
            }
        }
    }

    // Show errors first (if any)
    if (data.errors && data.errors.length > 0) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert';
        errorDiv.style.borderLeft = '4px solid #dc3545';
        errorDiv.style.borderRight = 'none';
        errorDiv.style.borderTop = 'none';
        errorDiv.style.borderBottom = 'none';
        errorDiv.style.backgroundColor = '#fff5f5';
        errorDiv.style.color = '#721c24';
        errorDiv.style.padding = '0.75rem 1rem';

        // Main error title and messages
        let errorHTML = '<h6 class="mb-2"><i class="bi bi-exclamation-circle"></i> CSV Validation Failed</h6>';
        errorHTML += '<ul class="mb-3">' +
            data.errors.map(e => `<li>${e}</li>`).join('') +
            '</ul>';

        // Recovery steps
        errorHTML += '<p class="mb-2"><strong>What to do:</strong></p>';
        errorHTML += '<ul class="small mb-3"><li>Check the errors above and fix your CSV file</li><li><a href="' + (document.querySelector('a[href*="sample_feed.csv"]')?.href || '#') + '" target="_blank">Download a sample CSV</a> to see the correct structure</li><li>See our <a href="/docs/index.html" target="_blank">documentation</a> for help</li></ul>';

        // GitHub support section - minimalistic
        errorHTML += '<div style="border-top: 1px solid rgba(114, 28, 36, 0.2); padding-top: 0.75rem; margin-top: 0.75rem;"><small><strong>Still stuck?</strong> Post on our <a href="https://github.com/Howquez/DICE/discussions" target="_blank">GitHub Discussions</a> forum and we\'ll help you.</small></div>';

        errorDiv.innerHTML = errorHTML;
        previewContainer.appendChild(errorDiv);

        // Hide form sections if CSV validation fails
        hideFormSections();
    }

    // Show success message only if no errors
    if (data.success) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert mb-2';
        successDiv.style.borderLeft = '4px solid #28a745';
        successDiv.style.borderRight = 'none';
        successDiv.style.borderTop = 'none';
        successDiv.style.borderBottom = 'none';
        successDiv.style.backgroundColor = '#f0f8f5';
        successDiv.style.color = '#155724';
        successDiv.style.padding = '0.75rem 1rem';

        let delimiterDisplay = data.delimiter === ';' ? 'semi-colon separated' :
                               data.delimiter === ',' ? 'comma-separated' :
                               data.delimiter === '\t' ? 'tab-separated' :
                               data.delimiter === '|' ? 'pipe-separated' : 'separated';

        successDiv.innerHTML = `<strong>✓ Your CSV looks good!</strong> We detected ${data.total_rows} rows with ${data.num_columns} ${delimiterDisplay} columns. You can now create your session.`;
        previewContainer.appendChild(successDiv);

        // Show form fields that were hidden during testing
        showFormSections();
    }

    // Show warnings (if any)
    if (data.warnings && data.warnings.length > 0) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'csv-preview-warning';
        warningDiv.innerHTML = '<strong><i class="bi bi-info-circle"></i> Heads up:</strong><ul class="mb-0 mt-2">' +
            data.warnings.map(w => `<li>${w}</li>`).join('') +
            '</ul>';
        previewContainer.appendChild(warningDiv);
    }
}

/**
 * Show CSV network/fetch error
 */
function showCSVError(message) {
    const previewContainer = document.getElementById('csv-preview-container');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';
    previewContainer.style.display = 'block';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'csv-preview-error';
    errorDiv.innerHTML = `<h6 class="mb-2"><i class="bi bi-exclamation-circle"></i> Could Not Load CSV</h6><p class="mb-3">${escapeHtml(message)}</p>`;
    errorDiv.innerHTML += '<p class="small text-muted mb-0">Check your URL is correct and the file is accessible, then try again.</p>';
    previewContainer.appendChild(errorDiv);
}

/**
 * Escape HTML to prevent injection
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Hide form sections after the content URL (until CSV is validated)
 */
function hideFormSections() {
    const card5 = document.getElementById('card5'); // Participant Briefing
    const card6 = document.getElementById('card6'); // Measurement
    const createSessionBtn = document.getElementById('createSessionBtn');
    const previewFeedBtn = document.getElementById('previewFeedBtn');

    if (card5) card5.style.display = 'none';
    if (card6) card6.style.display = 'none';
    if (createSessionBtn) createSessionBtn.style.display = 'none';
    if (previewFeedBtn) {
        previewFeedBtn.disabled = true;
        previewFeedBtn.classList.remove('btn-success');
        previewFeedBtn.classList.add('btn-secondary');
    }
}

/**
 * Show form sections after CSV is validated
 */
function showFormSections() {
    const card5 = document.getElementById('card5');
    const card6 = document.getElementById('card6');
    const createSessionBtn = document.getElementById('createSessionBtn');
    const previewFeedBtn = document.getElementById('previewFeedBtn');

    if (card5) card5.style.display = 'block';
    if (card6) card6.style.display = 'block';
    if (createSessionBtn) createSessionBtn.style.display = 'block';
    if (previewFeedBtn) {
        previewFeedBtn.disabled = false;
        previewFeedBtn.classList.remove('btn-secondary');
        previewFeedBtn.classList.add('btn-success');
    }
}

/**
 * Initialize everything when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Form field validation disabled for now
    // initializeFormValidation();
    hideFormSections(); // Hide optional sections until CSV is tested
});
