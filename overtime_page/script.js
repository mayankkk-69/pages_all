document.addEventListener('DOMContentLoaded', () => {

    /* =====================================================
       CUSTOM DROPDOWNS
       ===================================================== */
    const setupCustomDropdowns = () => {
        const dropdowns = document.querySelectorAll('.custom-dropdown');

        dropdowns.forEach(dropdown => {
            const trigger    = dropdown.querySelector('.dropdown-trigger');
            const selectedText = dropdown.querySelector('.selected-value');
            const options    = dropdown.querySelectorAll('.dropdown-options li');

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close all other open dropdowns
                dropdowns.forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
                dropdown.classList.toggle('open');
            });

            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    options.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    selectedText.textContent = option.textContent;
                    dropdown.classList.remove('open');
                });
            });
        });

        // Close on outside click
        document.addEventListener('click', () => {
            dropdowns.forEach(d => d.classList.remove('open'));
        });
    };

    /* =====================================================
       FILTER BUTTON — LOADING STATE
       ===================================================== */
    const setupFilters = () => {
        const btn = document.getElementById('apply-filters');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');
            const originalClass = icon.className;
            const originalText  = text.textContent;

            // Enter loading state
            icon.className = 'ph ph-circle-notch';
            icon.style.animation = 'spin 0.7s linear infinite';
            text.textContent = 'Filtering…';
            btn.disabled = true;

            // Update the section subtitle dynamically
            const subtitle = document.getElementById('table-subtitle');
            const monthVal = document.querySelector('#month-dropdown .selected-value')?.textContent || '';
            const yearVal  = document.querySelector('#year-dropdown .selected-value')?.textContent  || '';

            setTimeout(() => {
                // Restore
                icon.className = originalClass;
                icon.style.animation = '';
                text.textContent = originalText;
                btn.disabled = false;

                // Update subtitle
                if (subtitle && monthVal && yearVal) {
                    subtitle.textContent = `All requests for ${monthVal} ${yearVal}`;
                }
            }, 700);
        });
    };

    /* =====================================================
       ICON BUTTON RIPPLE / SPIN ANIMATION
       ===================================================== */
    const setupIconButtons = () => {
        const refreshBtn = document.querySelector('.btn-icon[title="Refresh"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                const icon = refreshBtn.querySelector('i');
                icon.style.transition = 'transform 0.6s ease';
                icon.style.transform  = 'rotate(360deg)';
                setTimeout(() => {
                    icon.style.transition = 'none';
                    icon.style.transform  = 'rotate(0deg)';
                }, 620);
            });
        }
    };

    /* =====================================================
       ANIMATE STAT VALUES (COUNT-UP EFFECT)
       ===================================================== */
    const setupCountUp = () => {
        const values = document.querySelectorAll('.stat-value[data-value]');
        values.forEach(el => {
            const target = parseFloat(el.dataset.value) || 0;
            if (target === 0) return; // skip zeros for now
            let start = 0;
            const duration = 900;
            const step = (timestamp) => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                el.textContent = (target % 1 === 0)
                    ? Math.floor(eased * target)
                    : (eased * target).toFixed(1);
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        });
    };

    /* Keyframe for spinner (injected inline) */
    const style = document.createElement('style');
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);

    // Initialize all
    setupCustomDropdowns();
    setupFilters();
    setupIconButtons();
    setupCountUp();
});
