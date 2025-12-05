(function () {
    if (window.BitHabMobileNav && window.BitHabMobileNav.initialized) {
        window.BitHabMobileNav.updateBottomNavHeight();
        return;
    }

    const mobileNav = {
    initialized: false,
    resizeTimer: null,
    documentClickHandler: null,
        updateBottomNavHeight() {
            const bottomNav = document.querySelector('.bottom-nav');
            const root = document.documentElement;
            if (!bottomNav || !root) {
                return;
            }

            const computed = window.getComputedStyle(bottomNav);
            if (computed.display === 'none') {
                root.style.setProperty('--bottom-nav-height', '0px');
                return;
            }

            const height = bottomNav.getBoundingClientRect().height;
            if (height > 0) {
                root.style.setProperty('--bottom-nav-height', `${Math.round(height)}px`);
            }
        },
        closeDropdowns() {
            document.querySelectorAll('.more-bottom-nav.open').forEach(nav => nav.classList.remove('open'));
        },
        bindMoreDropdown() {
            const moreBottomNav = document.querySelector('.more-bottom-nav');
            if (!moreBottomNav || moreBottomNav.dataset.dropdownBound === 'true') {
                return;
            }

            moreBottomNav.addEventListener('click', (event) => {
                if (event.target.closest('.more-dropdown-item')) {
                    moreBottomNav.classList.remove('open');
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                const isOpen = moreBottomNav.classList.toggle('open');
                if (isOpen) {
                    this.updateBottomNavHeight();
                }
            });

            if (!this.documentClickHandler) {
                this.documentClickHandler = (event) => {
                    document.querySelectorAll('.more-bottom-nav.open').forEach(nav => {
                        if (!nav.contains(event.target)) {
                            nav.classList.remove('open');
                        }
                    });
                };
                document.addEventListener('click', this.documentClickHandler);
            }

            moreBottomNav.dataset.dropdownBound = 'true';
        },
        showConfirmation(message, onConfirm) {
            if (window.BitHabUI && typeof window.BitHabUI.showConfirmation === 'function') {
                window.BitHabUI.showConfirmation(message, onConfirm);
                return;
            }

            const modal = document.getElementById('confirmation-modal');
            const messageEl = document.getElementById('confirmation-message');
            const yesBtn = document.getElementById('confirm-yes');
            const noBtn = document.getElementById('confirm-no');

            if (modal && messageEl && yesBtn && noBtn) {
                const cleanup = () => {
                    modal.classList.add('hidden');
                    yesBtn.removeEventListener('click', onYes);
                    noBtn.removeEventListener('click', onNo);
                    modal.removeEventListener('click', onOutsideClick);
                };

                messageEl.textContent = message;
                modal.classList.remove('hidden');

                const onYes = () => {
                    cleanup();
                    if (typeof onConfirm === 'function') {
                        onConfirm();
                    }
                };

                const onNo = () => cleanup();
                const onOutsideClick = (event) => {
                    if (event.target === modal) {
                        cleanup();
                    }
                };

                yesBtn.addEventListener('click', onYes, { once: true });
                noBtn.addEventListener('click', onNo, { once: true });
                modal.addEventListener('click', onOutsideClick, { once: true });
                return;
            }

            if (window.confirm(message) && typeof onConfirm === 'function') {
                onConfirm();
            }
        },
        bindLogout() {
            const logoutBtn = document.getElementById('logout-bottom-nav');
            if (!logoutBtn || logoutBtn.dataset.logoutBound === 'true') {
                return;
            }

            logoutBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.closeDropdowns();

                const confirmLogout = () => {
                    if (window.authManager && typeof window.authManager.signOut === 'function') {
                        window.authManager.signOut();
                    } else if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
                        firebase.auth().signOut();
                    }
                };

                this.showConfirmation('Are you sure you want to logout?', confirmLogout);
            });

            logoutBtn.dataset.logoutBound = 'true';
        },
        bindResize() {
            if (this.initialized) {
                return;
            }

            const updateOnResize = () => {
                window.clearTimeout(this.resizeTimer);
                this.resizeTimer = window.setTimeout(() => this.updateBottomNavHeight(), 120);
            };

            window.addEventListener('resize', updateOnResize);
            window.addEventListener('orientationchange', () => this.updateBottomNavHeight());

            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', updateOnResize);
            }
        },
        init() {
            if (this.initialized) {
                this.updateBottomNavHeight();
                this.bindMoreDropdown();
                this.bindLogout();
                return;
            }

            this.initialized = true;
            this.updateBottomNavHeight();
            this.bindMoreDropdown();
            this.bindLogout();
            this.bindResize();
        }
    };

    const start = () => mobileNav.init();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    window.addEventListener('load', () => mobileNav.updateBottomNavHeight());

    window.BitHabMobileNav = mobileNav;
})();
