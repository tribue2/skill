(function (global) {
    'use strict';

    var contestLocked = false;
    var normalBalance = 0;
    var blitzSoldDisplay = 0;
    var spinBudget = 0;
    var contestSpinCost = null;
    var contestBetPerLine = null;
    var contestLines = null;
    var contestWinnings = 0;
    var spinsUsed = 0;
    var spinsRequired = 50;
    var secondsRemaining = 0;
    var contestSecondsTotal = 300;
    var contestHasFinisher = false;
    var countdownSyncedAt = 0;
    var waitCountdownTimer = null;
    var waitPollTimer = null;
    var waitOverlayActive = false;
    var waitCelebrateDone = false;
    var originalUpdateBalance = null;
    var CONTEST_RESULT_PAUSE_MS = 3000;
    var contestResultPauseUntil = 0;
    var lastResultPauseContestId = 0;
    var resultPauseTimer = null;
    var resultPauseKeepBlockTimer = null;
    var MP_WIN_SEEN_KEY = 'iqwin_mp_win_seen';

    function loadSeenMpWinIds() {
        try {
            var raw = sessionStorage.getItem(MP_WIN_SEEN_KEY);
            if (!raw) return [];
            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed.map(function (id) { return Number(id) || 0; }).filter(Boolean);
        } catch (e) {
            return [];
        }
    }

    function hasSeenMpWin(contestId) {
        var id = Number(contestId) || 0;
        if (!id) return false;
        return loadSeenMpWinIds().indexOf(id) !== -1;
    }

    function getDisplayApi() {
        return global.IqwinTerminalCreditsDisplay || null;
    }

    function getOriginalUpdate() {
        var display = getDisplayApi();
        if (!display) {
            return null;
        }
        if (!originalUpdateBalance) {
            originalUpdateBalance = display.updateBalance.bind(display);
        }
        return originalUpdateBalance;
    }

    function formatLeiLabel(credits) {
        var display = getDisplayApi();
        if (display && typeof display.formatLeiFromCredits === 'function') {
            return display.formatLeiFromCredits(Number(credits) || 0);
        }
        var rate = display && typeof display.getCreditRate === 'function' ? display.getCreditRate() : 0.1;
        var lei = Math.round((Number(credits) || 0) * rate * 100) / 100;
        return '(' + lei.toFixed(2).replace('.', ',') + ' lei)';
    }

    function formatCreditsLabel(credits) {
        var display = getDisplayApi();
        if (display && typeof display.formatCreditsNumber === 'function') {
            return display.formatCreditsNumber(Number(credits) || 0);
        }
        return Number(credits || 0).toLocaleString('ro-RO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function fitBalancePanel() {
        var display = getDisplayApi();
        if (display && typeof display.fitBalanceValue === 'function') {
            display.fitBalanceValue();
        }
    }

    function getBalanceLabel() {
        return document.querySelector('.boss-crown-balance .terminal-stat-label')
            || document.querySelector('.terminal-stat-panel .terminal-stat-label');
    }

    function paintBlitzPanel() {
        var creditsEl = document.getElementById('balanceValue');
        var leiEl = document.getElementById('balanceLeiValue');
        var amount = Number(blitzSoldDisplay) || 0;
        if (creditsEl) {
            creditsEl.textContent = formatCreditsLabel(amount);
        }
        if (leiEl) {
            leiEl.textContent = 'LEI';
        }
        fitBalancePanel();
    }

    function paintNormalBadge() {
        var normalEl = document.getElementById('mpNormalSoldValue');
        var normalLeiEl = document.getElementById('mpNormalSoldLei');
        var winEl = document.getElementById('mpContestWinValue');
        var winLeiEl = document.getElementById('mpContestWinLei');
        var amount = Number(normalBalance) || 0;
        var winAmount = Number(contestWinnings) || 0;
        if (normalEl) {
            normalEl.textContent = formatCreditsLabel(amount);
        }
        if (normalLeiEl) {
            normalLeiEl.textContent = 'LEI';
        }
        if (winEl) {
            winEl.textContent = formatCreditsLabel(winAmount);
        }
        if (winLeiEl) {
            winLeiEl.textContent = 'LEI';
        }
    }

    function refreshContestLabels() {
        if (!contestLocked) {
            return;
        }
        var balanceLabel = getBalanceLabel();
        if (balanceLabel) {
            balanceLabel.textContent = 'Sold Blitz';
        }
    }

    function paintContestBalances() {
        if (!document.getElementById('mpContestStats')) {
            return;
        }
        paintBlitzPanel();
        paintNormalBadge();
        refreshContestLabels();
    }

    function handleBalanceUpdate(credits) {
        if (!contestLocked) {
            var original = getOriginalUpdate();
            if (original) {
                original(Number(credits) || 0);
            }
            return;
        }
        normalBalance = Number(credits) || 0;
        paintContestBalances();
    }

    function suppressHalfBetMiniUi() {
        var halfBtn = document.getElementById('halfButton');
        if (halfBtn) {
            halfBtn.classList.add('is-hidden');
            halfBtn.classList.remove('is-half-ready', 'is-half-pending');
            halfBtn.disabled = true;
        }
        try {
            if (global.GoldenBrainXO && typeof global.GoldenBrainXO.close === 'function') {
                global.GoldenBrainXO.close();
            }
            if (global.MillionaireQuiz && typeof global.MillionaireQuiz.close === 'function') {
                global.MillionaireQuiz.close();
            }
            if (global.DodgeBombAviator && typeof global.DodgeBombAviator.close === 'function') {
                global.DodgeBombAviator.close();
            }
            if (global.LogicZeusMaze && typeof global.LogicZeusMaze.close === 'function') {
                global.LogicZeusMaze.close();
            }
            if (global.GoldChestMini && typeof global.GoldChestMini.close === 'function') {
                global.GoldChestMini.close();
            }
            if (global.TheTimeMini && typeof global.TheTimeMini.close === 'function') {
                global.TheTimeMini.close();
            }
        } catch (e) {}
        try {
            global.dispatchEvent(new CustomEvent('iqwin-contest-block-half-bet'));
        } catch (e2) {}
    }

    function ensureContestUiChrome() {
        var speedBar = document.getElementById('terminalSpeedBar');
        var mpBtn = document.getElementById('gameMultiplayerBtn');
        var betControls = document.getElementById('betControls');
        var linesWrap = document.querySelector('.verga-lines-wrap');
        if (speedBar) speedBar.hidden = true;
        if (mpBtn) mpBtn.hidden = true;
        if (betControls) betControls.hidden = true;
        suppressHalfBetMiniUi();
        if (linesWrap && !document.getElementById('mpContestStats')) {
            var stats = document.createElement('div');
            stats.id = 'mpContestStats';
            stats.className = 'mp-contest-stats verga-side-stats';
            stats.innerHTML =
                '<div class="mp-contest-stat-normal boss-crown-balance terminal-stat-panel">' +
                    '<div class="terminal-stat-body">' +
                        '<div class="terminal-stat-head">' +
                            '<span class="terminal-stat-icon terminal-stat-icon--wallet" aria-hidden="true"></span>' +
                            '<span class="terminal-stat-label">Sold normal</span>' +
                        '</div>' +
                        '<strong class="terminal-stat-value" id="mpNormalSoldValue">0,00</strong>' +
                        '<span class="terminal-stat-lei" id="mpNormalSoldLei">LEI</span>' +
                    '</div>' +
                '</div>' +
                '<div class="mp-contest-stat-win boss-crown-last-win terminal-stat-panel">' +
                    '<div class="terminal-stat-body">' +
                        '<div class="terminal-stat-head">' +
                            '<span class="terminal-stat-icon terminal-stat-icon--crown" aria-hidden="true"></span>' +
                            '<span class="terminal-stat-label">Castig concurs</span>' +
                        '</div>' +
                        '<strong class="terminal-stat-value" id="mpContestWinValue">0,00</strong>' +
                        '<span class="terminal-stat-lei" id="mpContestWinLei">LEI</span>' +
                    '</div>' +
                '</div>';
            linesWrap.parentNode.insertBefore(stats, linesWrap);
        }
        refreshContestLabels();
    }

    function teardownContestUiChrome() {
        var balanceLabel = getBalanceLabel();
        if (balanceLabel) {
            balanceLabel.textContent = 'Sold';
        }
        var speedBar = document.getElementById('terminalSpeedBar');
        var mpBtn = document.getElementById('gameMultiplayerBtn');
        var betControls = document.getElementById('betControls');
        if (speedBar) {
            speedBar.hidden = true;
            speedBar.style.display = 'none';
        }
        if (mpBtn) {
            mpBtn.hidden = false;
        }
        if (betControls) betControls.hidden = false;
        var oldBadge = document.getElementById('mpContestStats');
        if (oldBadge) oldBadge.remove();
    }

    function installBalanceGuard() {
        var display = getDisplayApi();
        if (!display || display.__iqwinContestGuard) {
            return;
        }
        var original = display.updateBalance.bind(display);
        originalUpdateBalance = original;
        display.updateBalance = function (credits) {
            if (contestLocked) {
                handleBalanceUpdate(credits);
                return;
            }
            return original(Number(credits) || 0);
        };
        display.__iqwinContestGuard = true;
    }

    function applyBetConfig(metrics) {
        if (!metrics || typeof metrics !== 'object') {
            return;
        }
        if (typeof metrics.contest_bet_per_line === 'number' && metrics.contest_bet_per_line > 0) {
            contestBetPerLine = Number(metrics.contest_bet_per_line);
        }
        if (typeof metrics.contest_lines === 'number' && metrics.contest_lines > 0) {
            contestLines = Number(metrics.contest_lines);
        }
    }

    function applyMetrics(metrics) {
        if (!metrics || typeof metrics !== 'object') {
            return;
        }
        applyBetConfig(metrics);
        if (typeof metrics.normal_balance === 'number') {
            normalBalance = Number(metrics.normal_balance);
        }
        if (typeof metrics.blitz_sold === 'number') {
            blitzSoldDisplay = Number(metrics.blitz_sold);
        } else if (typeof metrics.blitz_balance === 'number') {
            blitzSoldDisplay = Number(metrics.blitz_balance);
        } else if (typeof metrics.contest_winnings === 'number') {
            blitzSoldDisplay = Number(metrics.contest_winnings);
        }
        spinBudget = 0;
        if (typeof metrics.spin_budget === 'number' && Number(metrics.spin_budget) > 0) {
            spinBudget = Number(metrics.spin_budget);
        }
        if (typeof metrics.contest_winnings === 'number') {
            var serverWinnings = Number(metrics.contest_winnings);
            if (contestLocked || document.getElementById('mpContestStats')) {
                contestWinnings = Math.max(Number(contestWinnings) || 0, serverWinnings);
            } else {
                contestWinnings = serverWinnings;
            }
        } else if (typeof metrics.blitz_balance === 'number') {
            var blitzWinOnly = Number(metrics.blitz_balance);
            if (contestLocked || document.getElementById('mpContestStats')) {
                contestWinnings = Math.max(Number(contestWinnings) || 0, blitzWinOnly);
            } else {
                contestWinnings = blitzWinOnly;
            }
        }
        if (typeof metrics.fixed_spin_credits === 'number') {
            contestSpinCost = Number(metrics.fixed_spin_credits);
        }
        if (typeof metrics.spins_used === 'number') {
            spinsUsed = Number(metrics.spins_used);
        }
        if (typeof metrics.spins_required === 'number') {
            spinsRequired = Number(metrics.spins_required);
        }
        if (typeof metrics.seconds_remaining === 'number') {
            syncContestCountdown(Number(metrics.seconds_remaining), contestSecondsTotal);
        }
        if (typeof metrics.is_qualified === 'boolean' && metrics.is_qualified) {
            spinsUsed = Math.max(spinsUsed, spinsRequired);
        }
        refreshWaitingState();
    }

    function formatCountdown(seconds) {
        var total = Math.max(0, Math.floor(Number(seconds) || 0));
        var mins = Math.floor(total / 60);
        var secs = total % 60;
        return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    function getLocalSecondsRemaining() {
        if (!countdownSyncedAt) {
            return Math.max(0, Math.floor(Number(secondsRemaining) || 0));
        }
        var elapsed = Math.floor((Date.now() - countdownSyncedAt) / 1000);
        return Math.max(0, Math.floor(Number(secondsRemaining) || 0) - elapsed);
    }

    function syncContestCountdown(seconds, total) {
        secondsRemaining = Math.max(0, Math.floor(Number(seconds) || 0));
        if (typeof total === 'number' && total > 0) {
            contestSecondsTotal = Math.floor(total);
        }
        countdownSyncedAt = Date.now();
        paintWaitCountdown();
    }

    function isGameSpinning() {
        return document.body.classList.contains('is-boss-crown-spinning')
            || document.body.classList.contains('is-terminal-big-win-active');
    }

    function isSpinsComplete() {
        return contestLocked && spinsUsed >= spinsRequired;
    }

    function shouldShowWaitOverlay() {
        if (!contestLocked || !isSpinsComplete() || isGameSpinning()) {
            return false;
        }
        if (contestHasFinisher) {
            return false;
        }
        return true;
    }

    function isContestResultPayload(contest) {
        if (!contest || typeof contest !== 'object') {
            return false;
        }
        if (contest.recent_win && contest.recent_win.contest_id) {
            return true;
        }
        var mode = String(contest.mode || '');
        return mode === 'won' || mode === 'forfeit' || mode === 'draw';
    }

    function handleContestEndedUi(contest) {
        var selfWin = !!(contest && contest.recent_win && contest.recent_win.is_self);
        hideWaitOverlay();
        releaseWaitUiBlock();
        if (selfWin) {
            applyWinnerBalanceAfterContest(contest);
        }
        if (shouldPauseForContestResult(contest)) {
            beginContestResultPause(contest);
        }
        if (global.IqwinTopDisplaySync && typeof global.IqwinTopDisplaySync.publishWhenReady === 'function') {
            global.IqwinTopDisplaySync.publishWhenReady({});
        }
        try {
            if (global.parent && global.parent !== global) {
                global.parent.postMessage({ type: 'iqwin-contest-poll-now' }, '*');
            }
        } catch (e) {}
    }

    function ensureWaitOverlay() {
        var overlay = document.getElementById('mpContestWaitOverlay');
        if (overlay) {
            return overlay;
        }
        overlay = document.createElement('div');
        overlay.id = 'mpContestWaitOverlay';
        overlay.className = 'mp-contest-wait-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML =
            '<div class="mp-contest-wait-backdrop" aria-hidden="true"></div>' +
            '<div class="mp-contest-wait-panel" role="status" aria-live="polite">' +
                '<div class="mp-contest-wait-badge">50 / 50 SPINURI</div>' +
                '<h2 class="mp-contest-wait-title">Ai terminat!</h2>' +
                '<p class="mp-contest-wait-lead">Ai finalizat cele 50 spinuri. Concursul se incheie imediat pentru primul jucator care le termina — nu mai astepti cronometrul.</p>' +
                '<div class="mp-contest-wait-countdown-wrap">' +
                    '<span class="mp-contest-wait-countdown-label">Status concurs</span>' +
                    '<strong class="mp-contest-wait-countdown" id="mpContestWaitCountdown">FINALIZARE</strong>' +
                '</div>' +
                '<div class="mp-contest-wait-progress" aria-hidden="true">' +
                    '<span class="mp-contest-wait-progress-fill" id="mpContestWaitProgress"></span>' +
                '</div>' +
                '<div class="mp-contest-wait-win">' +
                    '<span class="mp-contest-wait-win-label">Castigul tau in concurs</span>' +
                    '<strong class="mp-contest-wait-win-value" id="mpContestWaitWinValue">0,00</strong>' +
                    '<span class="mp-contest-wait-win-unit">LEI</span>' +
                '</div>' +
                '<p class="mp-contest-wait-foot">Rezultatul apare imediat aici si pe ecranul de sus.</p>' +
            '</div>';
        document.body.appendChild(overlay);
        return overlay;
    }

    function paintWaitCountdown() {
        var countdownEl = document.getElementById('mpContestWaitCountdown');
        var progressEl = document.getElementById('mpContestWaitProgress');
        var winEl = document.getElementById('mpContestWaitWinValue');
        var overlay = document.getElementById('mpContestWaitOverlay');
        var countdownWrap = countdownEl ? countdownEl.closest('.mp-contest-wait-countdown-wrap') : null;
        var countdownLabel = countdownWrap ? countdownWrap.querySelector('.mp-contest-wait-countdown-label') : null;
        var awaitingResult = isSpinsComplete() || contestHasFinisher;
        if (overlay) {
            overlay.classList.toggle('is-awaiting-result', awaitingResult);
        }
        if (awaitingResult) {
            if (countdownLabel) {
                countdownLabel.textContent = 'Status concurs';
            }
            if (countdownEl) {
                countdownEl.textContent = contestHasFinisher ? 'SE INCHEIE' : 'FINALIZARE';
                countdownEl.classList.remove('is-urgent');
            }
            if (progressEl) {
                progressEl.style.width = '100%';
                progressEl.classList.remove('is-urgent');
            }
        } else {
            var remaining = getLocalSecondsRemaining();
            var urgent = remaining > 0 && remaining <= 60;
            if (countdownLabel) {
                countdownLabel.textContent = 'Timp ramas';
            }
            if (countdownEl) {
                countdownEl.textContent = formatCountdown(remaining);
                countdownEl.classList.toggle('is-urgent', urgent);
            }
            if (progressEl) {
                var total = Math.max(1, contestSecondsTotal);
                var pct = Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
                progressEl.style.width = pct.toFixed(1) + '%';
                progressEl.classList.toggle('is-urgent', urgent);
            }
            if (overlay) {
                overlay.classList.toggle('is-urgent-countdown', urgent);
            }
            if (countdownWrap) {
                countdownWrap.classList.toggle('is-urgent', urgent);
            }
        }
        if (winEl) {
            winEl.textContent = formatCreditsLabel(contestWinnings);
        }
    }

    function requestContestPollNow() {
        try {
            if (global.parent && global.parent !== global) {
                global.parent.postMessage({ type: 'iqwin-contest-poll-now' }, '*');
            }
        } catch (e) {}
    }

    function startWaitTimers() {
        if (waitCountdownTimer) {
            return;
        }
        waitCountdownTimer = window.setInterval(paintWaitCountdown, 1000);
        if (!waitPollTimer) {
            waitPollTimer = window.setInterval(refreshWaitingState, 200);
        }
        requestContestPollNow();
    }

    function stopWaitTimers() {
        if (waitCountdownTimer) {
            window.clearInterval(waitCountdownTimer);
            waitCountdownTimer = null;
        }
        if (waitPollTimer) {
            window.clearInterval(waitPollTimer);
            waitPollTimer = null;
        }
    }

    function isContestResultMode(mode) {
        return mode === 'won' || mode === 'draw' || mode === 'forfeit';
    }

    function shouldPauseForContestResult(contest) {
        if (!contest || typeof contest !== 'object') {
            return false;
        }
        var mode = String(contest.mode || '');
        if (!isContestResultMode(mode)) {
            return false;
        }
        return !!(contest.recent_win || mode === 'forfeit' || mode === 'draw' || mode === 'won');
    }

    function isContestResultPauseActive() {
        return Date.now() < contestResultPauseUntil;
    }

    function endContestResultPause() {
        contestResultPauseUntil = 0;
        document.body.classList.remove('is-mp-contest-result-pause');
        if (resultPauseTimer) {
            window.clearTimeout(resultPauseTimer);
            resultPauseTimer = null;
        }
        if (resultPauseKeepBlockTimer) {
            window.clearInterval(resultPauseKeepBlockTimer);
            resultPauseKeepBlockTimer = null;
        }
        if (!waitOverlayActive && !shouldShowWaitOverlay()) {
            syncSpinButtonsBlocked(false);
        }
        try {
            window.dispatchEvent(new CustomEvent('iqwin-contest-result-pause-end'));
        } catch (e) {}
    }

    function beginContestResultPause(contest) {
        if (!shouldPauseForContestResult(contest)) {
            return;
        }
        var win = contest.recent_win || null;
        var contestId = Number(win && win.contest_id) || Number(contest.contest_id) || 0;
        if (contestId && contestId === lastResultPauseContestId) {
            if (isContestResultPauseActive()) {
                syncSpinButtonsBlocked(true);
            }
            return;
        }
        if (contestId) {
            lastResultPauseContestId = contestId;
        }
        contestResultPauseUntil = Date.now() + CONTEST_RESULT_PAUSE_MS;
        document.body.classList.add('is-mp-contest-result-pause');
        syncSpinButtonsBlocked(true);
        if (resultPauseTimer) {
            window.clearTimeout(resultPauseTimer);
        }
        resultPauseTimer = window.setTimeout(endContestResultPause, CONTEST_RESULT_PAUSE_MS);
        if (resultPauseKeepBlockTimer) {
            window.clearInterval(resultPauseKeepBlockTimer);
        }
        resultPauseKeepBlockTimer = window.setInterval(function () {
            if (isContestResultPauseActive()) {
                syncSpinButtonsBlocked(true);
            } else {
                window.clearInterval(resultPauseKeepBlockTimer);
                resultPauseKeepBlockTimer = null;
            }
        }, 120);
        try {
            window.dispatchEvent(new CustomEvent('iqwin-contest-result-pause', {
                detail: { contest: contest, win: win }
            }));
        } catch (e) {}
    }

    function isSpinBlocked() {
        return isContestResultPauseActive();
    }

    function releaseWaitUiBlock() {
        document.body.classList.remove('is-mp-contest-waiting', 'is-mp-contest-wait-overlay');
        var btn = document.getElementById('spinButton');
        if (btn) {
            if (isContestResultPauseActive()) {
                btn.disabled = true;
                btn.classList.add('is-mp-wait-blocked');
                btn.setAttribute('aria-disabled', 'true');
                return;
            }
            btn.disabled = false;
            btn.classList.remove('is-mp-wait-blocked');
            btn.removeAttribute('aria-disabled');
        }
    }

    function syncSpinButtonsBlocked(blocked) {
        var btn = document.getElementById('spinButton');
        if (!btn) {
            return;
        }
        if (!blocked && isContestResultPauseActive()) {
            blocked = true;
        }
        if (blocked && !isGameSpinning()) {
            btn.disabled = true;
            btn.setAttribute('aria-disabled', 'true');
            btn.classList.add('is-mp-wait-blocked');
            return;
        }
        btn.disabled = false;
        btn.classList.remove('is-mp-wait-blocked');
        btn.removeAttribute('aria-disabled');
    }

    function showWaitOverlay() {
        var overlay = ensureWaitOverlay();
        if (isGameSpinning()) {
            return;
        }
        var entering = !waitOverlayActive;
        waitOverlayActive = true;
        document.body.classList.add('is-mp-contest-wait-overlay');
        document.body.classList.remove('is-mp-contest-waiting');
        overlay.hidden = false;
        overlay.classList.add('is-visible');
        overlay.setAttribute('aria-hidden', 'false');
        if (entering && !waitCelebrateDone) {
            waitCelebrateDone = true;
            overlay.classList.add('is-celebrate');
            window.setTimeout(function () {
                overlay.classList.remove('is-celebrate');
            }, 2200);
        }
        paintWaitCountdown();
        var badge = overlay.querySelector('.mp-contest-wait-badge');
        if (badge) {
            badge.textContent = spinsRequired + ' / ' + spinsRequired + ' SPINURI';
        }
        syncSpinButtonsBlocked(true);
        startWaitTimers();
        requestContestPollNow();
    }

    function hideWaitOverlay() {
        waitOverlayActive = false;
        waitCelebrateDone = false;
        document.body.classList.remove('is-mp-contest-wait-overlay');
        var overlay = document.getElementById('mpContestWaitOverlay');
        if (overlay) {
            overlay.hidden = true;
            overlay.classList.remove('is-visible', 'is-celebrate');
            overlay.setAttribute('aria-hidden', 'true');
        }
        releaseWaitUiBlock();
        stopWaitTimers();
    }

    function refreshWaitingState() {
        if (!contestLocked) {
            hideWaitOverlay();
            return;
        }
        if (isGameSpinning()) {
            document.body.classList.remove('is-mp-contest-wait-overlay', 'is-mp-contest-waiting');
            var hiddenOverlay = document.getElementById('mpContestWaitOverlay');
            if (hiddenOverlay) {
                hiddenOverlay.hidden = true;
                hiddenOverlay.classList.remove('is-visible');
            }
            waitOverlayActive = false;
            syncSpinButtonsBlocked(false);
            return;
        }
        if (shouldShowWaitOverlay()) {
            showWaitOverlay();
            syncSpinButtonsBlocked(true);
            return;
        }
        hideWaitOverlay();
    }

    function applyContestCountdownFromContest(contest) {
        if (!contest || typeof contest !== 'object') {
            contestHasFinisher = false;
            return;
        }
        contestHasFinisher = contest.contest_has_finisher === true || contest.contest_has_finisher === 1;
        if (contestHasFinisher || contest.self_spins_complete === true || contest.self_spins_complete === 1) {
            paintWaitCountdown();
        }
        if (typeof contest.contest_seconds_remaining === 'number') {
            syncContestCountdown(
                contest.contest_seconds_remaining,
                contest.contest_seconds_total || contestSecondsTotal
            );
        } else if (contest.participant && typeof contest.participant.seconds_remaining === 'number') {
            syncContestCountdown(
                contest.participant.seconds_remaining,
                contest.contest_seconds_total || contestSecondsTotal
            );
        }
    }

    function applyContestSessionStart(data) {
        if (!data || typeof data !== 'object') {
            return;
        }
        if (typeof data.contest_bet_per_line === 'number' && data.contest_bet_per_line > 0) {
            contestBetPerLine = Number(data.contest_bet_per_line);
        } else if (typeof data.bet_per_line === 'number' && data.bet_per_line > 0) {
            contestBetPerLine = Number(data.bet_per_line);
        }
        if (typeof data.contest_lines === 'number' && data.contest_lines > 0) {
            contestLines = Number(data.contest_lines);
        } else if (typeof data.lines === 'number' && data.lines > 0) {
            contestLines = Number(data.lines);
        }
        if (typeof data.fixed_bet_credits === 'number') {
            contestSpinCost = Number(data.fixed_bet_credits);
        }
        if (data.mp_display) {
            applyMetrics(data.mp_display);
        }
    }

    function syncGameBetFromSession(state, data) {
        if (!contestLocked) {
            return;
        }
        applyContestSessionStart(data);
        if (!state || typeof state !== 'object') {
            return;
        }
        var betPerLine = null;
        if (typeof data.bet_per_line === 'number' && data.bet_per_line > 0) {
            betPerLine = Number(data.bet_per_line);
        } else if (typeof data.contest_bet_per_line === 'number' && data.contest_bet_per_line > 0) {
            betPerLine = Number(data.contest_bet_per_line);
        } else if (contestBetPerLine !== null && contestBetPerLine > 0) {
            betPerLine = contestBetPerLine;
        }
        if (betPerLine !== null) {
            state.bet = betPerLine;
        }
        var lines = null;
        if (typeof data.lines === 'number' && data.lines > 0) {
            lines = Number(data.lines);
        } else if (typeof data.contest_lines === 'number' && data.contest_lines > 0) {
            lines = Number(data.contest_lines);
        } else if (contestLines !== null && contestLines > 0) {
            lines = contestLines;
        }
        if (lines !== null) {
            state.lines = lines;
        }
    }

    function lockGameBetState(state) {
        syncGameBetFromSession(state, {});
    }

    function buildStartSessionBody(body) {
        if (!contestLocked || !body || typeof body !== 'object') {
            return body;
        }
        var next = Object.assign({}, body);
        if (contestBetPerLine !== null && contestBetPerLine > 0) {
            next.bet = contestBetPerLine;
        }
        if (contestLines !== null && contestLines > 0) {
            next.lines = contestLines;
        }
        return next;
    }

    function resolvePostContestBalance(contest) {
        var recentWin = contest && contest.recent_win;
        if (recentWin && recentWin.is_self && typeof recentWin.credits_balance === 'number') {
            return Number(recentWin.credits_balance);
        }
        return Number(normalBalance) || 0;
    }

    function applyWinnerBalanceAfterContest(contest) {
        var recentWin = contest && contest.recent_win;
        if (!recentWin || !recentWin.is_self) {
            return;
        }
        var winId = Number(recentWin.contest_id) || 0;
        if (winId && hasSeenMpWin(winId)) {
            return;
        }
        var balance = typeof recentWin.credits_balance === 'number'
            ? Number(recentWin.credits_balance)
            : null;
        if (balance !== null) {
            normalBalance = balance;
            var original = getOriginalUpdate();
            if (original) {
                original(balance);
            }
            try {
                if (global.parent && global.parent !== global) {
                    global.parent.postMessage({ type: 'skill-game-credits', credits: balance }, '*');
                }
            } catch (e) {}
        }
        if (global.IqwinMultiplayerWin && typeof global.IqwinMultiplayerWin.celebrate === 'function') {
            global.IqwinMultiplayerWin.celebrate(recentWin, balance, { force: false });
        }
        if (balance === null && recentWin.contest_id) {
            try {
                if (global.parent && global.parent !== global) {
                    global.parent.postMessage({
                        type: 'iqwin-winner-balance-refresh',
                        contest_id: Number(recentWin.contest_id)
                    }, '*');
                }
            } catch (e) {}
        }
    }

    function updateBlitzContestTheme(active) {
        if (document.body) {
            document.body.classList.toggle('is-blitz-contest-live', !!active);
        }
    }

    function applyContestUi(contest) {
        installBalanceGuard();

        var participant = contest && contest.participant;
        var mode = contest ? String(contest.mode || '') : '';
        var inContest = !!(contest && contest.enabled && mode === 'contest' && participant);

        if (inContest) {
            contestLocked = true;
            updateBlitzContestTheme(true);
            applyMetrics(participant);
            applyContestCountdownFromContest(contest);
            ensureContestUiChrome();
            suppressHalfBetMiniUi();
            paintContestBalances();
            refreshWaitingState();
            return;
        }

        if (mode !== 'contest') {
            var wasLocked = contestLocked;
            var selfWin = !!(contest && contest.recent_win && contest.recent_win.is_self);
            contestLocked = false;
            contestHasFinisher = false;
            updateBlitzContestTheme(false);
            blitzSoldDisplay = 0;
            spinBudget = 0;
            contestSpinCost = null;
            contestBetPerLine = null;
            contestLines = null;
            contestWinnings = 0;
            spinsUsed = 0;
            secondsRemaining = 0;
            countdownSyncedAt = 0;
            teardownContestUiChrome();
            if (wasLocked || isContestResultPayload(contest)) {
                handleContestEndedUi(contest);
                window.requestAnimationFrame(function () {
                    releaseWaitUiBlock();
                    try {
                        window.dispatchEvent(new CustomEvent('iqwin-contest-released'));
                    } catch (e) {}
                });
            } else {
                hideWaitOverlay();
                releaseWaitUiBlock();
            }
            var restoredBalance = !contestLocked && typeof normalBalance === 'number'
                ? normalBalance
                : resolvePostContestBalance(contest);
            var original = getOriginalUpdate();
            if (original && typeof restoredBalance === 'number') {
                original(restoredBalance);
            }
        } else if (!inContest) {
            hideWaitOverlay();
            releaseWaitUiBlock();
        }
    }

    function applyMpDisplay(mpDisplay) {
        if (!mpDisplay || typeof mpDisplay !== 'object' || !contestLocked) {
            return;
        }
        applyMetrics(mpDisplay);
        paintContestBalances();
        refreshWaitingState();
    }

    function resolveSessionCreditsBalance(data) {
        if (!data || typeof data !== 'object') {
            return null;
        }
        if (typeof data.credits_balance === 'number') {
            return Number(data.credits_balance);
        }
        if (contestLocked) {
            var contest = data.contest;
            var recentWin = contest && contest.recent_win;
            if (recentWin && recentWin.is_self && typeof recentWin.credits_balance === 'number') {
                return Number(recentWin.credits_balance);
            }
        }
        return null;
    }

    function applySessionPayload(data) {
        if (data && data.contest) {
            var contestPayload = data.contest;
            var recentWin = contestPayload.recent_win;
            var seenWinId = recentWin ? Number(recentWin.contest_id) || 0 : 0;
            if (seenWinId && hasSeenMpWin(seenWinId)) {
                contestPayload = Object.assign({}, contestPayload);
                delete contestPayload.recent_win;
            }
            applyContestCountdownFromContest(contestPayload);
            applyContestUi(contestPayload);
        }
        if (data && data.mp_display && contestLocked) {
            applyMpDisplay(data.mp_display);
        }
        if (data && data.contest && data.contest.participant && contestLocked) {
            applyBetConfig(data.contest.participant);
        }
        if (data && typeof data.contest_bet_per_line === 'number' && contestLocked) {
            contestBetPerLine = Number(data.contest_bet_per_line);
        }
        if (data && typeof data.contest_lines === 'number' && contestLocked) {
            contestLines = Number(data.contest_lines);
        }
        if (data && typeof data.fixed_bet_credits === 'number' && contestLocked) {
            contestSpinCost = Number(data.fixed_bet_credits);
        }
        var resolvedBalance = resolveSessionCreditsBalance(data);
        if (resolvedBalance !== null) {
            normalBalance = resolvedBalance;
            if (contestLocked) {
                paintContestBalances();
            } else {
                var original = getOriginalUpdate();
                if (original) {
                    original(resolvedBalance);
                }
            }
        }
        refreshWaitingState();
    }

    function checkSpinCredits(betAmount, normalCredits) {
        if (isContestResultPauseActive()) {
            return {
                ok: false,
                message: 'Concursul s-a terminat. Vezi cine a castigat...'
            };
        }
        if (!contestLocked) {
            return {
                ok: Number(normalCredits) >= Number(betAmount),
                message: 'Sold insuficient'
            };
        }
        if (spinsUsed >= spinsRequired) {
            refreshWaitingState();
            return {
                ok: false,
                message: 'Ai terminat cele 50 de spinuri. Asteapta finalul concursului.'
            };
        }
        var required = contestSpinCost !== null ? contestSpinCost : Number(betAmount);
        var balance = Number(normalBalance) || Number(normalCredits) || 0;
        if (balance + 0.001 < required) {
            return {
                ok: false,
                message: 'Sold normal insuficient pentru spin.'
            };
        }
        return { ok: true, message: '' };
    }

    function shouldInspectPayload(url) {
        return url.indexOf('/session.php') !== -1
            || url.indexOf('/bootstrap.php') !== -1
            || url.indexOf('/contest-start.php') !== -1;
    }

    window.addEventListener('message', function (event) {
        if (!event.data) return;
        if (event.data.type === 'iqwin-contest-result-pause' && event.data.contest) {
            beginContestResultPause(event.data.contest);
            return;
        }
        if (event.data.type === 'iqwin-contest-state') {
            var incoming = event.data.contest || null;
            if (incoming && incoming.recent_win) {
                var incomingWinId = Number(incoming.recent_win.contest_id) || 0;
                if (incomingWinId && hasSeenMpWin(incomingWinId)) {
                    incoming = Object.assign({}, incoming);
                    delete incoming.recent_win;
                }
            }
            applyContestCountdownFromContest(incoming);
            applyContestUi(incoming);
            refreshWaitingState();
            return;
        }
        if (event.data.type === 'skill-game-credits' && typeof event.data.credits === 'number') {
            normalBalance = Number(event.data.credits);
            if (contestLocked) {
                paintContestBalances();
            } else {
                var original = getOriginalUpdate();
                if (original) {
                    original(normalBalance);
                }
            }
        }
    }, true);

    var originalFetch = global.fetch;
    if (typeof originalFetch === 'function') {
        global.fetch = function () {
            var args = arguments;
            return originalFetch.apply(global, args).then(function (response) {
                try {
                    var input = args[0];
                    var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
                    if (url && shouldInspectPayload(url) && response && response.clone) {
                        response.clone().json().then(function (data) {
                            if (data && (data.ok || data.contest)) {
                                applySessionPayload(data);
                            }
                        }).catch(function () {});
                    }
                } catch (e) {}
                return response;
            });
        };
    }

    installBalanceGuard();

    global.IqwinContestMode = {
        applyContestUi: applyContestUi,
        applyMpDisplay: applyMpDisplay,
        handleBalanceUpdate: handleBalanceUpdate,
        isActive: function () { return contestLocked; },
        isHalfBetBlocked: function () { return contestLocked; },
        suppressHalfBetMiniUi: suppressHalfBetMiniUi,
        isSpinBlocked: isSpinBlocked,
        isContestResultPauseActive: isContestResultPauseActive,
        beginResultPause: beginContestResultPause,
        isSpinsComplete: isSpinsComplete,
        isWaitingForResults: function () { return shouldShowWaitOverlay(); },
        refreshWaitingState: refreshWaitingState,
        releaseWaitUiBlock: releaseWaitUiBlock,
        checkSpinCredits: checkSpinCredits,
        lockGameBetState: lockGameBetState,
        syncGameBetFromSession: syncGameBetFromSession,
        applyContestSessionStart: applyContestSessionStart,
        buildStartSessionBody: buildStartSessionBody,
        getSpendableCredits: function () {
            if (!contestLocked) return null;
            return Number(normalBalance) || 0;
        }
    };
}(window));
