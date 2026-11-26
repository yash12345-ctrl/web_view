(function () {
    'use strict';

    function ensureViewport() {
        var meta = document.querySelector('meta[name="viewport"]');
        var content = 'width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes';
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = content;
            if (document.head) {
                document.head.appendChild(meta);
            }
        } else {
            meta.setAttribute('content', content);
        }
    }

    function detectAuthState() {
        var url = (window.location.href || '').toLowerCase();
        var isLoginUrl = url.indexOf('youlogin.jsp') !== -1 || url.indexOf('loginmanager') !== -1;
        var hasLoginForm = !!document.getElementById('divLogin') || !!document.getElementById('btnLogin');
        var isLoggedIn = !isLoginUrl && !hasLoginForm;

        if (window.AndroidBridge && typeof window.AndroidBridge.onAuthStateChanged === 'function') {
            window.AndroidBridge.onAuthStateChanged(isLoggedIn);
        }
    }

    function wrapWideTables(root) {
        var tables = (root || document).querySelectorAll('table');
        tables.forEach(function (table) {
            if (table.closest('.srm-table-scroll') || table.closest('.table-responsive')) {
                return;
            }
            var cols = table.rows && table.rows.length > 0 ? table.rows[0].cells.length : 0;
            // Keep 2-column key-value profile tables native & clean without horizontal scroll
            if (cols <= 2 && !table.querySelector('thead')) {
                return;
            }
            table.classList.add('srm-wide-table');
            var wrapper = document.createElement('div');
            wrapper.className = 'srm-table-scroll';
            if (table.parentNode) {
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }

    function clampFixedWidths(root) {
        var vw = window.innerWidth || document.documentElement.clientWidth || 390;
        var elements = (root || document).querySelectorAll('div, section, main, form, iframe');
        elements.forEach(function (el) {
            if (el.closest('.srm-table-scroll')) {
                return;
            }
            var inlineWidth = el.style && el.style.width;
            if (inlineWidth && inlineWidth.endsWith('px')) {
                var px = parseFloat(inlineWidth);
                if (!isNaN(px) && px > vw) {
                    el.style.width = '100%';
                    el.style.maxWidth = '100%';
                }
            }
        });
    }

    function toggleSidebarDrawer() {
        var selectors = [
            '#sidebarToggle',
            '#sidebarToggleTop',
            '.navbar-toggler',
            '[data-toggle="sidebar"]',
            '[data-bs-toggle="offcanvas"]',
            'button .fa-bars',
            'a .fa-bars',
            '.fa-bars'
        ];
        for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el) {
                var clickable = el.closest('button, a') || el;
                clickable.click();
                return true;
            }
        }
        return false;
    }

    function findAndClickMenuLink(keywords) {
        var candidates = document.querySelectorAll(
            '#layoutSidenav_nav a, .sidenav a, .sidebar a, nav a, .nav-link, [onclick]'
        );
        for (var k = 0; k < keywords.length; k++) {
            var kw = keywords[k];
            for (var i = 0; i < candidates.length; i++) {
                var el = candidates[i];
                var text = (el.textContent || '').trim().toLowerCase();
                var href = (el.getAttribute('href') || '').toLowerCase();
                var onclick = (el.getAttribute('onclick') || '').toLowerCase();
                if (text.indexOf('logout') !== -1 || href.indexOf('logout') !== -1) {
                    continue;
                }
                if (text.indexOf(kw) !== -1 || href.indexOf(kw) !== -1 || onclick.indexOf(kw) !== -1) {
                    // Close mobile sidebar if it's open after clicking
                    el.click();
                    if (document.body.classList.contains('sidenav-toggled')) {
                        setTimeout(function () {
                            document.body.classList.remove('sidenav-toggled');
                        }, 150);
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return true;
                }
            }
        }
        return false;
    }

    // Native Bottom Navigation Bar bridge
    window.SRMNav = {
        navigate: function (tab) {
            if (tab === 'menu') {
                toggleSidebarDrawer();
                return;
            }
            var map = {
                home: ['student profile', 'dashboard', 'profile', 'home'],
                attendance: ['attendance'],
                marks: ['internal mark', 'mark', 'grade', 'exam', 'result'],
                fees: ['fee', 'finance', 'payment', 'dues']
            };
            var keywords = map[tab] || [];
            var clicked = findAndClickMenuLink(keywords);
            if (!clicked) {
                // Fallback: open the sidebar menu so user can pick the exact section
                toggleSidebarDrawer();
            }
        }
    };

    function applyEnhancements(root) {
        ensureViewport();
        detectAuthState();
        wrapWideTables(root);
        clampFixedWidths(root);
    }

    applyEnhancements(document);

    if (!window.__srmObserverAttached && typeof MutationObserver !== 'undefined' && document.body) {
        window.__srmObserverAttached = true;
        var debounceTimer = null;
        var observer = new MutationObserver(function () {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(function () {
                applyEnhancements(document);
            }, 150);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
