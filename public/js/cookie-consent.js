// Cookie Consent Banner - Cumplimiento GDPR/Leyes locales
(function () {
    const CONSENT_KEY = 'impostor-cookie-consent';
    const ANALYTICS_KEY = 'impostor-analytics-consent';

    function hasConsent() {
        return localStorage.getItem(CONSENT_KEY) === 'accepted';
    }

    function getAnalyticsConsent() {
        return localStorage.getItem(ANALYTICS_KEY) === 'true';
    }

    function showBanner() {
        // No mostrar si ya aceptó
        if (hasConsent()) {
            // Cargar analytics si aceptó
            if (getAnalyticsConsent()) {
                loadGoogleAnalytics();
            }
            return;
        }

        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.innerHTML = `
            <div class="cookie-banner-content">
                <div class="cookie-banner-text">
                    <p>
                        🍪 Usamos cookies para mejorar tu experiencia. 
                        <a href="/privacidad" target="_blank" rel="noopener">Ver Política de Privacidad</a>
                    </p>
                </div>
                <div class="cookie-banner-actions">
                    <button id="cookie-accept-all" class="btn btn-primary">Aceptar todo</button>
                    <button id="cookie-reject" class="btn btn-ghost">Solo esenciales</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Estilos inline para evitar dependencias
        const style = document.createElement('style');
        style.textContent = `
            #cookie-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--card-bg, #1e1e1e);
                border-top: 2px solid var(--primary, #6c5ce7);
                padding: 1rem;
                z-index: 9999;
                box-shadow: 0 -4px 12px rgba(0,0,0,0.2);
                animation: slideUp 0.3s ease;
            }
            @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }
            .cookie-banner-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                flex-wrap: wrap;
            }
            .cookie-banner-text p {
                margin: 0;
                color: var(--text, #fff);
                font-size: 0.95rem;
            }
            .cookie-banner-text a {
                color: var(--primary, #6c5ce7);
                text-decoration: underline;
            }
            .cookie-banner-actions {
                display: flex;
                gap: 0.5rem;
                flex-shrink: 0;
            }
            @media (max-width: 600px) {
                .cookie-banner-content {
                    flex-direction: column;
                    text-align: center;
                }
                .cookie-banner-actions {
                    width: 100%;
                    flex-direction: column;
                }
                .cookie-banner-actions button {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);

        // Event listeners
        document.getElementById('cookie-accept-all').addEventListener('click', () => {
            acceptCookies(true);
        });

        document.getElementById('cookie-reject').addEventListener('click', () => {
            acceptCookies(false);
        });
    }

    function acceptCookies(includeAnalytics) {
        localStorage.setItem(CONSENT_KEY, 'accepted');
        localStorage.setItem(ANALYTICS_KEY, includeAnalytics ? 'true' : 'false');

        // Remover banner
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => banner.remove(), 300);
        }

        // Cargar analytics si aceptó
        if (includeAnalytics) {
            loadGoogleAnalytics();
        }

    }

    function loadGoogleAnalytics() {
        // Google Analytics ya está cargado en el HTML
        // Aquí podríamos inicializar eventos adicionales
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
    }

    const styleSlideDown = document.createElement('style');
    styleSlideDown.textContent = `
        @keyframes slideDown {
            from { transform: translateY(0); }
            to { transform: translateY(100%); }
        }
    `;
    document.head.appendChild(styleSlideDown);

    // Mostrar banner al cargar la página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBanner);
    } else {
        showBanner();
    }

    // API pública para gestionar consentimiento
    window.ImpostorCookieConsent = {
        hasConsent,
        getAnalyticsConsent,
        reset: function () {
            localStorage.removeItem(CONSENT_KEY);
            localStorage.removeItem(ANALYTICS_KEY);
            location.reload();
        }
    };
})();
