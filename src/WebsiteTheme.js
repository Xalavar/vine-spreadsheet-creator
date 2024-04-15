import React, { useEffect } from 'react';

const WebsiteTheme = () => {
    useEffect(() => {
        // Your custom JavaScript snippet handling Dark/Light mode switching
        const getStoredTheme = () => {
            const storedVSEDs = localStorage.getItem('VSE_settings');
            if (storedVSEDs) {
                const parsedVSEDs = JSON.parse(storedVSEDs);
                return parsedVSEDs.webTheme;
            }
            return null;
        };

        const setStoredTheme = (theme) => {
            let storedVSEDs = localStorage.getItem('VSE_settings');
            if (storedVSEDs) {
                storedVSEDs = JSON.parse(storedVSEDs);
            } else {
                storedVSEDs = {};
            }
            storedVSEDs.webTheme = theme;
            localStorage.setItem('VSE_settings', JSON.stringify(storedVSEDs));
        };

        const forcedTheme = document.documentElement.getAttribute('data-bss-forced-theme');

        const getPreferredTheme = () => {
            if (forcedTheme) return forcedTheme;

            const storedTheme = getStoredTheme();
            if (storedTheme) {
                return storedTheme;
            }

            const pageTheme = document.documentElement.getAttribute('data-bs-theme');
            if (pageTheme) {
                return pageTheme;
            }

            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        };

        const setTheme = (theme) => {
            if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-bs-theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-bs-theme', theme);
            }
        };

        setTheme(getPreferredTheme());

        const showActiveTheme = (theme, focus = false) => {
            const themeSwitchers = [].slice.call(document.querySelectorAll('.theme-switcher'));

            if (!themeSwitchers.length) return;

            document.querySelectorAll('[data-bs-theme-value]').forEach((element) => {
                element.classList.remove('active');
                element.setAttribute('aria-pressed', 'false');
            });

            for (const themeSwitcher of themeSwitchers) {
                const btnToActivate = themeSwitcher.querySelector('[data-bs-theme-value="' + theme + '"]');
                if (btnToActivate) {
                    btnToActivate.classList.add('active');
                    btnToActivate.setAttribute('aria-pressed', 'true');
                }
            }
        };

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const storedTheme = getStoredTheme();
            if (storedTheme !== 'light' && storedTheme !== 'dark') {
                setTheme(getPreferredTheme());
            }
        });

        window.addEventListener('DOMContentLoaded', () => {
            showActiveTheme(getPreferredTheme());

            document.querySelectorAll('[data-bs-theme-value]').forEach((toggle) => {
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    const theme = toggle.getAttribute('data-bs-theme-value');
                    console.log('Changed theme to');
                    setStoredTheme(theme);
                    setTheme(theme);
                    showActiveTheme(theme);
                });
            });
        });
    }, []); // Empty dependency array to run the effect only once when the component mounts

    return null; // Return null because this component doesn't render anything
};

export default WebsiteTheme;
