// This script should be included on EVERY page (dashboard, analytics, settings, mining) to ensure the theme is consistent.

document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    initThemeListeners();
});

function applySavedTheme() {
    // Check if the user has a saved theme color or animation preference
    const savedColor = localStorage.getItem('cobuy_theme_color');
    const animationsDisabled = localStorage.getItem('cobuy_disable_animations') === 'true';

    // Apply Colors
    if (savedColor) {
        setThemeVariables(savedColor);
    }

    // Apply Animation Toggles
    if (animationsDisabled) {
        document.body.classList.add('disable-animations');
        // Specific checks for vis.js if we are on Analytics page
        if (window.location.href.includes('analytics.html')) {
            // Let the analytics logic handle disabling physics
        }
    }
}

function initThemeListeners() {
    // Only applies if we are actually on settings.html
    const swatches = document.querySelectorAll('.theme-swatches .swatch');
    if (swatches.length > 0) {

        // Setup initial UI active state based on saved memory
        const currentTheme = localStorage.getItem('cobuy_theme_color') || 'cyan';
        swatches.forEach(s => s.classList.remove('active'));
        const activeSwatch = document.querySelector(`.swatch[data-color="${currentTheme}"]`);
        if (activeSwatch) activeSwatch.classList.add('active');

        swatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                // Remove active from all
                swatches.forEach(s => s.classList.remove('active'));

                // Add active to clicked
                const target = e.target;
                target.classList.add('active');

                // Get color and apply
                const colorCode = target.getAttribute('data-color');
                setThemeVariables(colorCode);

                // Save Memory
                localStorage.setItem('cobuy_theme_color', colorCode);
            });
        });
    }

    // Physics Toggle Handler
    const physicsToggle = document.getElementById('physicsToggle');
    if (physicsToggle) {
        // Init state
        const animationsDisabled = localStorage.getItem('cobuy_disable_animations') === 'true';
        physicsToggle.checked = !animationsDisabled; // Checked = physics ON

        physicsToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                localStorage.setItem('cobuy_disable_animations', 'false');
                document.body.classList.remove('disable-animations');
            } else {
                localStorage.setItem('cobuy_disable_animations', 'true');
                document.body.classList.add('disable-animations');
            }
        });
    }
}

function setThemeVariables(themeName) {
    const root = document.documentElement;

    switch (themeName) {
        case 'cyan':
            root.style.setProperty('--neon-cyan', '#00f2fe');
            root.style.setProperty('--neon-cyan-glow', 'rgba(0, 242, 254, 0.4)');
            break;
        case 'purple':
            root.style.setProperty('--neon-cyan', '#d53369');
            root.style.setProperty('--neon-cyan-glow', 'rgba(213, 51, 105, 0.4)');
            break;
        case 'green':
            root.style.setProperty('--neon-cyan', '#0ba360');
            root.style.setProperty('--neon-cyan-glow', 'rgba(11, 163, 96, 0.4)');
            break;
    }
}
