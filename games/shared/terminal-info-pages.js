(() => {
    window.IqwinTerminalInfoPages = {
        init(options = {}) {
            const popup = options.popup || document.getElementById('vergaInfoPopup');
            const track = options.track || document.getElementById('vergaInfoTrack');
            const pager = options.pager || document.getElementById('vergaInfoPager');
            const prevBtn = options.prevBtn || document.getElementById('vergaInfoPrev');
            const nextBtn = options.nextBtn || document.getElementById('vergaInfoNext');
            const closeButtons = options.closeButtons || [
                document.getElementById('vergaInfoClose'),
                document.getElementById('vergaInfoNavClose')
            ].filter(Boolean);
            const openButton = options.openButton || document.getElementById('infoButton');
            const pageLabel = options.pageLabel || 'Pagina';
            const onOpenChange = typeof options.onOpenChange === 'function' ? options.onOpenChange : null;

            if (!popup || !track) {
                return null;
            }

            let pageIndex = 0;

            // Mută popup-ul pe body ca să nu rămână sub meniul din dreapta
            // (părintele reels-panel are contain/isolation → stacking context).
            function ensurePopupOnTopLayer() {
                if (popup.parentElement !== document.body) {
                    document.body.appendChild(popup);
                }
                popup.style.position = 'fixed';
                popup.style.inset = '0';
                popup.style.width = '100vw';
                popup.style.height = '100vh';
                popup.style.zIndex = '2147483000';
            }

            ensurePopupOnTopLayer();

            function pages() {
                return Array.from(track.querySelectorAll('.terminal-info-pages__page'));
            }

            function pageCount() {
                return Math.max(1, pages().length);
            }

            function setOpen(open) {
                if (open) {
                    ensurePopupOnTopLayer();
                }
                popup.classList.toggle('is-hidden', !open);
                document.body.classList.toggle('iqwin-info-open', !!open);
                if (openButton) {
                    openButton.setAttribute('aria-expanded', open ? 'true' : 'false');
                }
                if (open) {
                    goToPage(0);
                }
                if (onOpenChange) {
                    onOpenChange(open);
                }
            }

            function updatePager() {
                const total = pageCount();
                if (pager) {
                    if (total <= 2) {
                        pager.textContent = pageIndex === 0 ? 'Tabel plati' : 'Reguli & info';
                    } else {
                        pager.textContent = `${pageLabel} ${pageIndex + 1}/${total}`;
                    }
                }
                if (prevBtn) {
                    prevBtn.disabled = pageIndex <= 0;
                }
                if (nextBtn) {
                    nextBtn.disabled = pageIndex >= total - 1;
                }
                track.style.transform = `translateX(-${pageIndex * 100}%)`;
            }

            function goToPage(index) {
                const total = pageCount();
                pageIndex = Math.max(0, Math.min(total - 1, index));
                updatePager();
            }

            function goNext() {
                goToPage(pageIndex + 1);
            }

            function goPrev() {
                goToPage(pageIndex - 1);
            }

            prevBtn?.addEventListener('click', goPrev);
            nextBtn?.addEventListener('click', goNext);
            closeButtons.forEach((button) => {
                button.addEventListener('click', () => setOpen(false));
            });
            openButton?.addEventListener('click', () => setOpen(true));

            document.addEventListener('keydown', (event) => {
                if (popup.classList.contains('is-hidden')) {
                    return;
                }
                if (event.key === 'Escape') {
                    setOpen(false);
                    return;
                }
                if (event.key === 'ArrowRight') {
                    goNext();
                }
                if (event.key === 'ArrowLeft') {
                    goPrev();
                }
            });

            updatePager();

            return {
                setOpen,
                goToPage,
                goNext,
                goPrev,
                refresh() {
                    updatePager();
                }
            };
        }
    };
})();
