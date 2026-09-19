(function (global) {
    'use strict';

    var creditRate = 0.1;
    function clampCredits(credits) {
        return Math.max(0, Number(credits) || 0);
    }

    function setCreditRate(rate) {
        var parsed = Number(rate);
        creditRate = parsed > 0 ? parsed : 0.1;
    }

    function getCreditRate() {
        return creditRate;
    }

    function moneyForCredits(credits) {
        return Math.round(Number(credits || 0) * creditRate * 100) / 100;
    }

    function formatLeiNumber(value) {
        return Number(value || 0).toLocaleString('ro-RO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function formatCreditsNumber(value) {
        return formatLeiNumber(moneyForCredits(value));
    }

    function formatLeiFromCredits(credits) {
        return formatLeiNumber(moneyForCredits(credits)) + ' LEI';
    }

    function parseRoNumber(text) {
        if (text == null) return 0;
        var cleaned = String(text)
            .replace(/\s/g, '')
            .replace(/[^\d.,\-]/g, '')
            .replace(/\./g, '')
            .replace(',', '.');
        var value = Number(cleaned);
        return Number.isFinite(value) ? value : 0;
    }

    function clearInlineFontSize(el) {
        if (!el) return;
        el.style.removeProperty('font-size');
        el.style.removeProperty('line-height');
    }

    // Kept as no-ops for older game code that still calls fit helpers.
    function fitBalanceValue() {
        clearInlineFontSize(document.getElementById('balanceValue'));
    }

    function fitLastWinValue() {
        clearInlineFontSize(document.getElementById('lastWinValue'));
    }

    function scheduleFitBalanceValue() {
        fitBalanceValue();
        fitLastWinValue();
    }

    function syncLastWinLeiFromValue() {
        var leiEl = document.getElementById('lastWinLeiValue');
        if (leiEl) leiEl.textContent = 'LEI';
    }

    var lastWinObserver = null;

    function observeLastWinValue() {
        var creditsEl = document.getElementById('lastWinValue');
        if (!creditsEl || lastWinObserver) return;

        lastWinObserver = new MutationObserver(function () {
            syncLastWinLeiFromValue();
        });
        lastWinObserver.observe(creditsEl, {
            characterData: true,
            childList: true,
            subtree: true
        });
        syncLastWinLeiFromValue();
    }

    function paintValue(el, text) {
        if (!el) return;
        clearInlineFontSize(el);
        el.style.removeProperty('color');
        el.style.removeProperty('-webkit-text-fill-color');
        el.textContent = text;
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('opacity', '1', 'important');
    }

    function updateBalance(credits) {
        if (global.IqwinContestMode && typeof global.IqwinContestMode.isActive === 'function' && global.IqwinContestMode.isActive()) {
            if (typeof global.IqwinContestMode.handleBalanceUpdate === 'function') {
                global.IqwinContestMode.handleBalanceUpdate(Number(credits) || 0);
                return;
            }
        }
        var safeCredits = clampCredits(credits);
        var creditsEl = document.getElementById('balanceValue');
        var leiEl = document.getElementById('balanceLeiValue');
        paintValue(creditsEl, formatCreditsNumber(safeCredits));
        if (leiEl) leiEl.textContent = 'LEI';
    }

    function updateLastWin(credits) {
        var value = Math.max(0, Number(credits) || 0);
        var creditsEl = document.getElementById('lastWinValue');
        var leiEl = document.getElementById('lastWinLeiValue');
        paintValue(creditsEl, formatCreditsNumber(value));
        if (creditsEl) {
            creditsEl.classList.remove('is-forfeited');
        }
        if (leiEl) leiEl.textContent = 'LEI';
    }

    window.addEventListener('message', function (event) {
        if (!event.data || event.data.type !== 'skill-game-credits') return;
        if (typeof event.data.credits === 'number') {
            updateBalance(event.data.credits);
        }
        if (typeof event.data.lastWin === 'number' && event.data.lastWin > 0) {
            updateLastWin(event.data.lastWin);
            var lastWinPanel = document.querySelector('.boss-crown-last-win.terminal-stat-panel')
                || document.querySelector('.terminal-stat-panel:has(#lastWinValue)');
            if (lastWinPanel) {
                lastWinPanel.classList.add('is-golden-bubble-win');
                window.setTimeout(function () {
                    lastWinPanel.classList.remove('is-golden-bubble-win');
                }, 3500);
            }
        }
    });

    global.IqwinTerminalCreditsDisplay = {
        setCreditRate: setCreditRate,
        getCreditRate: getCreditRate,
        moneyForCredits: moneyForCredits,
        formatCreditsNumber: formatCreditsNumber,
        formatLeiFromCredits: formatLeiFromCredits,
        updateBalance: updateBalance,
        updateLastWin: updateLastWin,
        fitBalanceValue: fitBalanceValue,
        fitLastWinValue: fitLastWinValue,
        clampCredits: clampCredits
    };

    function bootPaint() {
        observeLastWinValue();
        clearInlineFontSize(document.getElementById('balanceValue'));
        clearInlineFontSize(document.getElementById('lastWinValue'));
        var balanceEl = document.getElementById('balanceValue');
        if (balanceEl && (!balanceEl.textContent || !String(balanceEl.textContent).trim())) {
            balanceEl.textContent = '0,00';
        }
        var lastWinEl = document.getElementById('lastWinValue');
        if (lastWinEl && (!lastWinEl.textContent || !String(lastWinEl.textContent).trim())) {
            lastWinEl.textContent = '0,00';
        }
        paintValue(balanceEl, balanceEl ? balanceEl.textContent : '0,00');
        paintValue(lastWinEl, lastWinEl ? lastWinEl.textContent : '0,00');
    }

    document.addEventListener('DOMContentLoaded', bootPaint);
    window.addEventListener('load', bootPaint);
}(window));
