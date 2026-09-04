
// Font loading (moved from inline onload)
window.addEventListener('load', function() {
    const fontLink = document.querySelector('link[media="print"]');
    if (fontLink) {
        fontLink.media = 'all';
    }
});

// Retry load projects (moved from inline)
if (!window.retryLoadProjects) {
    window.retryLoadProjects = function() {
        if (window.loadingAttempts < window.maxRetries) {
            loadGitHubProjects();
        } else {
            document.getElementById('error').querySelector('p').textContent = 'Maximum retry attempts reached. Please refresh the page.';
            const retryBtn = document.getElementById('error').querySelector('button');
            if (retryBtn) retryBtn.style.display = 'none';
        }
    };
}

// Event delegation for all navigation and interaction handlers (CSP hardening)
document.addEventListener('DOMContentLoaded', function() {
    // Navigation event delegation
    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('[data-page]');
        if (target) {
            e.preventDefault();
            const page = target.getAttribute('data-page');
            if (window.showPage) {
                window.showPage(page);
            }
            return false;
        }

        // Mobile menu toggle
        if (e.target.closest('[data-action="toggle-menu"]')) {
            if (window.toggleMobileMenu) {
                window.toggleMobileMenu();
            }
            return;
        }

        // Theme toggle
        if (e.target.closest('[data-action="toggle-theme"]')) {
            if (window.toggleTheme) {
                window.toggleTheme();
            }
            return;
        }

        // Scroll to top
        if (e.target.closest('[data-action="scroll-top"]')) {
            if (window.scrollToTop) {
                window.scrollToTop();
            }
            return;
        }

        // Retry load projects
        if (e.target.closest('[data-action="retry-projects"]')) {
            if (window.retryLoadProjects) {
                window.retryLoadProjects();
            }
            return;
        }

    });
});
