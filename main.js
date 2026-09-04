
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

const pageRoutes = {
    '/': 'home',
    '/about': 'about',
    '/skills': 'skills',
    '/projects': 'projects',
    '/contact': 'contact',
    '/sponsors': 'sponsors',
    '/avion': 'avion'
};

window.showPage = function(page, updateUrl = true) {
    const pageElement = document.getElementById(page);
    if (!pageElement || !pageElement.classList.contains('page')) {
        return;
    }

    document.querySelectorAll('.page').forEach((element) => {
        element.classList.toggle('active', element === pageElement);
    });

    document.querySelectorAll('.nav-links a[data-page]').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('data-page') === page);
    });

    document.querySelector('.nav-links')?.classList.remove('open');

    updateSkillProgress(pageElement);

    if (updateUrl) {
        const route = Object.keys(pageRoutes).find((path) => pageRoutes[path] === page) || '/';
        window.history.pushState({ page }, '', route);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.toggleMobileMenu = function() {
    document.querySelector('.nav-links')?.classList.toggle('open');
};

window.toggleTheme = function() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);

    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = nextTheme === 'dark' ? '☀️' : '🌙';
    }
};

function updateSkillProgress(pageElement) {
    if (!pageElement) {
        return;
    }

    pageElement.querySelectorAll('.skill-progress-fill[data-progress]').forEach((bar) => {
        const progress = Math.max(0, Math.min(100, Number(bar.dataset.progress) || 0));
        requestAnimationFrame(() => {
            bar.style.width = `${progress}%`;
        });
    });
}

// Event delegation for all navigation and interaction handlers (CSP hardening)
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const initialPage = pageRoutes[window.location.pathname] || 'home';
    window.showPage(initialPage, false);
    updateSkillProgress(document.getElementById('skills'));

    window.addEventListener('popstate', function() {
        window.showPage(pageRoutes[window.location.pathname] || 'home', false);
    });

    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon && document.documentElement.getAttribute('data-theme') === 'dark') {
        themeIcon.textContent = '☀️';
    }

    // Navigation event delegation
    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('[data-page]');
        if (target) {
            e.preventDefault();
            const page = target.getAttribute('data-page');
            window.showPage(page);
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
