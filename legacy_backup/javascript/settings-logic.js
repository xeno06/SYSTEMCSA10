document.addEventListener('DOMContentLoaded', () => {
    initSettingsValues();
});

function initSettingsValues() {
    // 1. Load existing preferences from localStorage (or set defaults)
    let savedSupport = localStorage.getItem('cobuy_min_support') || 5;
    let savedConfidence = localStorage.getItem('cobuy_min_confidence') || 20;

    // 2. Set the DOM inputs to match the saved state
    const supportSlider = document.getElementById('minSupportSlider');
    const confidenceSlider = document.getElementById('minConfidenceSlider');

    if (supportSlider) {
        supportSlider.value = savedSupport;
        document.getElementById('supportVal').innerText = savedSupport + '%';

        // Add dynamic text listener
        supportSlider.addEventListener('input', (e) => {
            document.getElementById('supportVal').innerText = e.target.value + '%';
        });
    }

    if (confidenceSlider) {
        confidenceSlider.value = savedConfidence;
        document.getElementById('confidenceVal').innerText = savedConfidence + '%';

        // Add dynamic text listener
        confidenceSlider.addEventListener('input', (e) => {
            document.getElementById('confidenceVal').innerText = e.target.value + '%';
        });
    }
}

// Triggered by the "Save Engine Configurations" button
function saveAlgorithmSettings() {
    const supportVal = document.getElementById('minSupportSlider').value;
    const confidenceVal = document.getElementById('minConfidenceSlider').value;

    localStorage.setItem('cobuy_min_support', supportVal);
    localStorage.setItem('cobuy_min_confidence', confidenceVal);

    // Provide visual feedback
    const btn = document.querySelector('.btn-action');
    const originalText = btn.innerHTML;

    btn.innerHTML = `<i class="fas fa-check"></i> Values Saved!`;
    btn.style.background = 'linear-gradient(135deg, #0ba360, #3cba92)'; // Turn green

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = ''; // Revert to CSS default (cyan mapping)
    }, 2000);
}
