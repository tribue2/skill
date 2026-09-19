(() => {
    const CHANNEL = 'iqwin-terminal-top-display';
    const params = new URLSearchParams(window.location.search || '');
    const isPaytableExport = params.has('iqwinPaytableExport');

    if (isPaytableExport) {
        try {
            document.documentElement.classList.add('iqwin-paytable-export');
            const style = document.createElement('style');
            style.textContent = `
                html.iqwin-paytable-export, html.iqwin-paytable-export body {
                    background: #05070d !important;
                    overflow: hidden !important;
                }
                html.iqwin-paytable-export body > *:not(#vergaInfoPopup) {
                    display: none !important;
                }
                html.iqwin-paytable-export #vergaInfoPopup {
                    display: block !important;
                    visibility: hidden !important;
                    position: fixed !important;
                    left: -10000px !important;
                    top: 0 !important;
                    width: 1200px !important;
                    height: 800px !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
                html.iqwin-paytable-export #vergaInfoPopup.is-hidden {
                    display: block !important;
                }
            `;
            (document.head || document.documentElement).appendChild(style);
        } catch (error) {
        }
    }

    function detectSlug() {
        const match = String(window.location.pathname || '').match(/\/games\/([^/]+)/i);
        return match ? match[1].toLowerCase() : '';
    }

    function getTrackHtml() {
        const track = document.getElementById('vergaInfoTrack');
        return track ? String(track.innerHTML || '').trim() : '';
    }

    function publishInfoPages(options = {}) {
        const html = String(options.html || getTrackHtml() || '').trim();
        if (!html) return false;

        const payload = {
            type: 'info-html',
            slug: String(options.slug || detectSlug() || '').toLowerCase(),
            title: String(options.title || document.title || '').trim(),
            html,
            ts: Date.now(),
            export: isPaytableExport ? 1 : 0
        };

        try {
            const channel = new BroadcastChannel(CHANNEL);
            channel.postMessage(payload);
            channel.close();
        } catch (error) {
        }

        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(payload, '*');
            }
        } catch (error) {
        }

        return true;
    }

    function publishWhenReady(options = {}, attempt = 0) {
        if (publishInfoPages(options)) {
            if (isPaytableExport && attempt < 8) {
                window.setTimeout(() => {
                    publishInfoPages(options);
                }, 400 + attempt * 200);
            }
            return;
        }
        const maxAttempts = isPaytableExport ? 40 : 12;
        if (attempt >= maxAttempts) {
            return;
        }
        window.setTimeout(() => {
            publishWhenReady(options, attempt + 1);
        }, isPaytableExport ? 200 : (250 + attempt * 150));
    }

    window.IqwinTopDisplaySync = {
        slug: detectSlug(),
        isPaytableExport,
        publishInfoPages,
        publishWhenReady
    };

    window.addEventListener('message', (event) => {
        if (!event.data || event.data.type !== 'iqwin-top-display-request') {
            return;
        }
        publishWhenReady({});
    });

    window.setTimeout(() => {
        publishWhenReady({});
    }, isPaytableExport ? 300 : 900);

    if (isPaytableExport) {
        [800, 1600, 3000, 5000, 8000].forEach((delay) => {
            window.setTimeout(() => {
                publishWhenReady({});
            }, delay);
        });
    }
})();
