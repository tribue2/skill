(function () {
    const api = {
        setHidden(btn, hidden) {
            if (!btn) return;
            const wrap = btn.closest('.verga-spin-wrap');
            document.body.classList.toggle('is-spin-button-manual-stop-hidden', hidden);
            btn.classList.toggle('is-hidden-during-manual-stop', hidden);
            if (wrap) wrap.classList.toggle('is-spin-hidden-during-manual-stop', hidden);
            btn.hidden = hidden;
            if (hidden) {
                btn.style.setProperty('display', 'none', 'important');
                btn.style.setProperty('visibility', 'hidden', 'important');
                btn.style.setProperty('opacity', '0', 'important');
                btn.style.setProperty('pointer-events', 'none', 'important');
                if (wrap) wrap.style.setProperty('display', 'none', 'important');
                btn.setAttribute('aria-hidden', 'true');
                return;
            }
            btn.style.removeProperty('display');
            btn.style.removeProperty('visibility');
            btn.style.removeProperty('opacity');
            btn.style.removeProperty('pointer-events');
            if (wrap) wrap.style.removeProperty('display');
            btn.hidden = false;
            btn.removeAttribute('aria-hidden');
        },
        shouldHideDuringSpin(state) {
            return Boolean(state.spinning && state.manualStopReels && state.manualStopReels.size > 0);
        },
    };

    window.IqwinTerminalSpinButtonVisibility = api;
})();
