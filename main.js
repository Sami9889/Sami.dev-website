if (!window.samiConsoleWelcomeShown) {
    window.samiConsoleWelcomeShown = true;
    const consoleLogo = String.raw`
   _____          __  ___
  / ___/____     /  |/  /__  ____ _   __
  \__ \/ __ \   / /|_/ / _ \/ __ \ | / /
 ___/ / /_/ /  / /  / /  __/ / / / |/ /
/____/\____/  /_/  /_/\___/_/ /_/|___/   .dev`;
    const consoleMessage = [
        '  > building useful things for the web',
        '',
        '  You found the console. Nice to have you here.',
        '  Have an idea, a project, or just want to say hello?',
        '',
        '  Explore: https://sami-s.dev',
        '  Code:    https://github.com/Sami9889'
    ].join('\n');
    const consoleColors = ['#ff4d6d', '#ff9f1c', '#f9c74f', '#43aa8b', '#4cc9f0', '#7b61ff'];
    let consoleFrame = 0;

    const showConsoleWelcome = () => {
        const accent = consoleColors[consoleFrame % consoleColors.length];
        console.log('%c' + consoleLogo + '\n%c' + consoleMessage,
            `background:#101114;color:${accent};font:bold 16px/1.2 monospace;padding:10px 14px;`,
            'background:#101114;color:#f5f7fa;font:13px/1.7 monospace;padding:4px 14px 12px;');
        consoleFrame += 1;
    };

    showConsoleWelcome();
    const consoleAnimation = window.setInterval(() => {
        showConsoleWelcome();
        if (consoleFrame >= 12) {
            window.clearInterval(consoleAnimation);
        }
    }, 260);
}


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

function escapeHTML(value) {
    return String(value || '').replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    })[character]);
}

window.loadGitHubProjects = async function() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const container = document.getElementById('projects-container');
    if (!loading || !error || !container) {
        return;
    }

    loading.style.display = 'block';
    error.style.display = 'none';

    try {
        const response = await fetch('https://api.github.com/users/Sami9889/repos?sort=updated&per_page=6');
        if (!response.ok) {
            throw new Error(`GitHub returned ${response.status}`);
        }

        const repositories = await response.json();
        container.innerHTML = repositories.length ? repositories.map((repository) => `
            <article class="project-card github-project">
                <span class="section-kicker">GitHub project</span>
                <h3>${escapeHTML(repository.name)}</h3>
                <p>${escapeHTML(repository.description || 'A project I am building and improving in public.')}</p>
                <div class="project-meta">
                    <span>${escapeHTML(repository.language || 'Code')}</span>
                    <span>${repository.stargazers_count} stars</span>
                </div>
                <a class="text-link" href="${escapeHTML(repository.html_url)}" target="_blank" rel="noopener noreferrer">View on GitHub <span aria-hidden="true">↗</span></a>
            </article>
        `).join('') : '<p class="projects-empty">I am still adding projects here. Visit GitHub to see what I am working on now.</p>';
        loading.style.display = 'none';
    } catch (requestError) {
        loading.style.display = 'none';
        error.style.display = 'block';
        error.querySelector('p').textContent = 'The project list could not load right now. You can still browse everything on GitHub.';
        console.error('Could not load GitHub projects:', requestError);
    }
};

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
    window.loadGitHubProjects();

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
