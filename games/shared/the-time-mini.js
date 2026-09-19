(function (window) {
    'use strict';

    const STOPWATCH_MAX_MS = 2000;
    const GAME_DURATION_MS = 10000;
    const STOPWATCH_SPEED = 1.5;
    const SUCCESS_TOLERANCE = 0.08;
    const CLOSE_AFTER_WIN_MS = 5000;
    const CLOSE_AFTER_LOSE_MS = 2200;

    const game = {
        targetTime: 0,
        currentTimeMs: 0,
        animId: null,
        animStart: 0,
        gameStart: 0,
        gameEnd: 0,
        expiryTimer: null,
        hudFrameId: null,
        active: false,
        ended: false,
        won: false,
        pressResetTimer: null
    };

    const state = {
        open: false,
        offerMode: false,
        closeTimer: null,
        keyHandler: null,
        isBlocked: () => false,
        getOffer: () => null,
        formatCredits: (value) => String(value),
        onRefundApplied: null,
        onOfferConsumed: null,
        isSoundEnabled: () => true
    };

    function getPopup() {
        return document.getElementById('ttMiniPopup');
    }

    function q(selector) {
        const popup = getPopup();
        return popup ? popup.querySelector(selector) : null;
    }

    function currentOffer() {
        const offer = state.getOffer?.();
        if (!offer || !offer.active) return null;
        return offer;
    }

    function getTerminalApiBase() {
        const server = localStorage.getItem('skill_terminal_server');
        if (!server) return null;
        return server.replace(/\/$/, '') + '/api/terminal';
    }

    function getTerminalHeaders() {
        const storage = localStorage.getItem('skill_terminal_credentials');
        if (!storage) return null;
        try {
            const credentials = JSON.parse(storage);
            return {
                'Content-Type': 'application/json',
                'X-Terminal-Code': credentials.terminal_code,
                'X-Terminal-Secret': credentials.api_secret
            };
        } catch (error) {
            return null;
        }
    }

    function getSoundUrls(fileName) {
        const urls = [];
        const server = localStorage.getItem('skill_terminal_server');
        if (server) {
            urls.push(new URL(`sounds/${fileName}`, `${server.replace(/\/$/, '')}/`).href);
        }
        const parts = window.location.pathname.split('/').filter(Boolean);
        const gamesIdx = parts.indexOf('games');
        if (gamesIdx > 0) {
            const terminalRoot = `${window.location.origin}/${parts.slice(0, gamesIdx).join('/')}/`;
            urls.push(new URL(`sounds/${fileName}`, terminalRoot).href);
        }
        urls.push(new URL(`../../sounds/${fileName}`, window.location.href).href);
        return [...new Set(urls)];
    }

    let activeSfx = null;

    function stopSfx() {
        if (!activeSfx) return;
        try {
            activeSfx.pause();
            activeSfx.currentTime = 0;
        } catch (error) {}
        activeSfx = null;
    }

    function playSfx(fileName) {
        if (!state.isSoundEnabled()) return;
        try {
            stopSfx();
            const urls = getSoundUrls(fileName);
            let urlIndex = 0;
            const audio = new Audio(urls[urlIndex]);
            activeSfx = audio;
            audio.volume = 0.75;
            audio.addEventListener('ended', () => {
                if (activeSfx === audio) activeSfx = null;
            });
            audio.addEventListener('error', () => {
                if (urlIndex + 1 < urls.length) {
                    urlIndex += 1;
                    audio.src = urls[urlIndex];
                    audio.load();
                    audio.play().catch(() => {});
                }
            });
            audio.play().catch(() => {});
        } catch (error) {}
    }

    function formatHudRemaining(ms) {
        const sec = Math.max(0, ms) / 1000;
        return `${sec.toFixed(1)}s`;
    }

    function updateHudTimer() {
        const node = q('#ttMiniTimer');
        const fill = q('#ttMiniTimerFill');
        if (!node || !game.active || game.ended) return;
        const remaining = Math.max(0, game.gameEnd - Date.now());
        const progress = Math.max(0, Math.min(1, remaining / GAME_DURATION_MS));
        node.textContent = formatHudRemaining(remaining);
        node.classList.toggle('tt-mini-is-low', remaining <= 3000);
        node.classList.toggle('tt-mini-is-tick', remaining > 0);
        if (fill) {
            fill.style.width = `${progress * 100}%`;
        }
    }

    function tickHudLoop() {
        if (!game.active || game.ended) {
            game.hudFrameId = null;
            return;
        }
        updateHudTimer();
        if (game.gameEnd - Date.now() <= 0) {
            onGameExpired();
            return;
        }
        game.hudFrameId = requestAnimationFrame(tickHudLoop);
    }

    function playStopTapSound() {
        if (!state.isSoundEnabled()) return;
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const audioCtx = new Ctx();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(920, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(520, audioCtx.currentTime + 0.07);
            gain.gain.setValueAtTime(0.11, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.09);
        } catch (error) {}
    }

    function clearStopPressVisual() {
        window.clearTimeout(game.pressResetTimer);
        game.pressResetTimer = null;
        q('#ttMiniStop')?.classList.remove('is-stop-pressed', 'is-stop-hit', 'is-stop-miss', 'is-stop-holding');
        const chrono = q('.tt-mini-chrono');
        chrono?.classList.remove('is-stop-flash', 'is-stop-flash--hit', 'is-stop-flash--miss');
        q('.tt-mini-chrono-lcd')?.classList.remove('is-stop-capture');
    }

    function triggerStopPressVisual(type) {
        const stopBtn = q('#ttMiniStop');
        const chrono = q('.tt-mini-chrono');
        const lcd = q('.tt-mini-chrono-lcd');
        clearStopPressVisual();
        if (stopBtn) {
            stopBtn.classList.add('is-stop-pressed', type === 'hit' ? 'is-stop-hit' : 'is-stop-miss');
        }
        if (chrono) {
            chrono.classList.add('is-stop-flash', type === 'hit' ? 'is-stop-flash--hit' : 'is-stop-flash--miss');
        }
        if (lcd) {
            lcd.classList.add('is-stop-capture');
        }
        if (type !== 'hit') {
            game.pressResetTimer = window.setTimeout(() => {
                clearStopPressVisual();
                if (stopBtn && game.active && !game.ended) {
                    stopBtn.textContent = 'STOP';
                }
            }, 480);
        }
    }

    function playStopTapFeedback(type, capturedLabel) {
        playStopTapSound();
        const stopBtn = q('#ttMiniStop');
        if (stopBtn && capturedLabel) {
            stopBtn.textContent = capturedLabel;
        }
        triggerStopPressVisual(type);
    }

    function generateTarget() {
        game.targetTime = Math.random() * 2;
        const node = q('#ttMiniTarget');
        if (node) node.textContent = game.targetTime.toFixed(2);
    }

    function updateStopwatchDisplay(timeMs) {
        const sec = timeMs / 1000;
        const node = q('#ttMiniClockValue');
        if (node) node.textContent = sec.toFixed(2);
    }

    function setFeedback(html, type) {
        const node = q('#ttMiniFeedback');
        if (!node) return;
        node.innerHTML = html;
        node.classList.remove('tt-mini-is-win', 'tt-mini-is-lose', 'tt-mini-is-hint');
        if (type) {
            const normalized = String(type).replace(/^tt-mini-is-/, '').replace(/^is-/, '');
            node.classList.add(`tt-mini-is-${normalized}`);
        }
    }

    function hideResultCard() {
        const card = q('#ttMiniResult');
        if (!card) return;
        card.classList.add('is-hidden');
        card.classList.remove('tt-mini-is-win', 'tt-mini-is-lose');
    }

    function showResultCard({ title, sub, type, icon }) {
        const card = q('#ttMiniResult');
        const iconNode = q('#ttMiniResultIcon');
        const titleNode = q('#ttMiniResultTitle');
        const subNode = q('#ttMiniResultSub');
        if (!card || !titleNode) return;
        hideResultCard();
        card.classList.remove('is-hidden');
        card.classList.add(type === 'win' ? 'tt-mini-is-win' : 'tt-mini-is-lose');
        if (iconNode) iconNode.textContent = icon || '';
        titleNode.textContent = title || '';
        if (subNode) subNode.textContent = sub || '';
        setFeedback('', null);
    }

    function updateOfferHint() {
        const prize = q('#ttMiniOfferHint');
        const prizeValue = q('#ttMiniPrizeValue');
        const offer = currentOffer();
        if (!prize) return;
        if (offer && state.offerMode) {
            const refund = Math.floor(Number(offer.betAmount || 0) / 2);
            if (prizeValue) {
                prizeValue.textContent = `50% pariu · ${state.formatCredits(refund)} LEI`;
            }
            prize.classList.remove('is-hidden');
        } else {
            prize.classList.add('is-hidden');
        }
    }

    async function claimRefund(won) {
        const offer = currentOffer();
        const base = getTerminalApiBase();
        const headers = getTerminalHeaders();

        if (!won) {
            return { ok: true, correct: false, refund_credits: 0 };
        }

        if (offer && base && headers && offer.sessionId) {
            try {
                const response = await fetch(base + '/quiz.php', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        action: 'claim_refund_xo',
                        won: true,
                        session_id: offer.sessionId,
                        game_id: offer.gameId
                    })
                });
                const data = await response.json();
                if (data.ok) return data;
            } catch (error) {}
        }

        const refundCredits = offer ? Math.floor(Number(offer.betAmount || 0) / 2) : 0;
        return { ok: true, correct: true, refund_credits: refundCredits };
    }

    function clearCloseTimer() {
        if (state.closeTimer) {
            window.clearTimeout(state.closeTimer);
            state.closeTimer = null;
        }
    }

    function scheduleClose(won) {
        clearCloseTimer();
        const delay = won ? CLOSE_AFTER_WIN_MS : CLOSE_AFTER_LOSE_MS;
        state.closeTimer = window.setTimeout(() => {
            state.closeTimer = null;
            close();
        }, delay);
    }

    function finishOfferRound(won) {
        if (state.offerMode) {
            state.onOfferConsumed?.();
        }
        scheduleClose(won);
    }

    function stopAnimationLoop() {
        if (game.animId) {
            cancelAnimationFrame(game.animId);
            game.animId = null;
        }
        game.animStart = 0;
    }

    function clearExpiryTimer() {
        if (game.expiryTimer) {
            clearTimeout(game.expiryTimer);
            game.expiryTimer = null;
        }
        if (game.hudFrameId) {
            cancelAnimationFrame(game.hudFrameId);
            game.hudFrameId = null;
        }
    }

    function resetStopwatchLoop() {
        stopAnimationLoop();
        game.currentTimeMs = 0;
        updateStopwatchDisplay(0);
        if (game.active && !game.ended) {
            game.animId = requestAnimationFrame(tickStopwatch);
        }
    }

    function tickStopwatch(timestamp) {
        if (!game.active || game.ended) return;

        if (!game.animStart) {
            game.animStart = timestamp;
        }

        const elapsed = (timestamp - game.animStart) * STOPWATCH_SPEED;
        game.currentTimeMs = Math.min(elapsed, STOPWATCH_MAX_MS);
        updateStopwatchDisplay(game.currentTimeMs);

        if (game.currentTimeMs >= STOPWATCH_MAX_MS) {
            resetStopwatchLoop();
            return;
        }

        game.animId = requestAnimationFrame(tickStopwatch);
    }

    async function endGame(won) {
        if (game.ended) return;
        game.ended = true;
        game.won = won;
        game.active = false;
        stopAnimationLoop();
        clearExpiryTimer();

        const stopBtn = q('#ttMiniStop');
        if (stopBtn) {
            stopBtn.disabled = true;
            stopBtn.textContent = 'OPRIT';
        }

        if (won) {
            playSfx('next.mp3');
            const refundData = await claimRefund(true);
            const refund = Number(refundData.refund_credits || 0);
            if (refund > 0) {
                state.onRefundApplied?.(refund, refundData.credits_balance);
            }
            showResultCard({
                type: 'win',
                icon: '✓',
                title: 'Timp prins',
                sub: refund > 0
                    ? `Recuperare: +${state.formatCredits(refund)} LEI`
                    : 'Recuperare aplicata in sold'
            });
            finishOfferRound(true);
            return;
        }

        playSfx('lose.mp3');
        await claimRefund(false);
        showResultCard({
            type: 'lose',
            icon: '×',
            title: 'Timp expirat',
            sub: 'Nu ai prins timpul tinta. Mai incearca la urmatoarea sansa.'
        });
        finishOfferRound(false);
    }

    function onGameExpired() {
        if (!game.active || game.ended) return;
        setFeedback('<span>Timp total expirat</span>', 'lose');
        endGame(false);
    }

    function scheduleExpiryCheck() {
        clearExpiryTimer();
        const startedAt = Date.now();
        game.gameStart = startedAt;
        game.gameEnd = startedAt + GAME_DURATION_MS;
        updateHudTimer();
        game.hudFrameId = requestAnimationFrame(tickHudLoop);
        game.expiryTimer = window.setTimeout(onGameExpired, GAME_DURATION_MS + 80);
    }

    function startRound() {
        stopAnimationLoop();
        clearExpiryTimer();
        clearStopPressVisual();
        hideResultCard();

        game.targetTime = 0;
        game.currentTimeMs = 0;
        game.animStart = 0;
        game.active = true;
        game.ended = false;
        game.won = false;
        game.gameStart = 0;
        game.gameEnd = 0;

        generateTarget();
        updateStopwatchDisplay(0);
        updateHudTimer();

        const stopBtn = q('#ttMiniStop');
        if (stopBtn) {
            stopBtn.disabled = false;
            stopBtn.textContent = 'STOP';
        }

        setFeedback('Apasa STOP cand cronometrul ajunge la timpul tinta', 'hint');
        scheduleExpiryCheck();
        game.animId = requestAnimationFrame(tickStopwatch);
    }

    function handleStop() {
        if (!game.active || game.ended) return;

        const currentSec = game.currentTimeMs / 1000;
        const diff = Math.abs(currentSec - game.targetTime);
        const capturedLabel = currentSec.toFixed(2);

        if (diff <= SUCCESS_TOLERANCE) {
            playStopTapFeedback('hit', capturedLabel);
            setFeedback(`Prins perfect (${diff.toFixed(3)}s)`, 'win');
            endGame(true);
            return;
        }

        playStopTapFeedback('miss', capturedLabel);
        resetStopwatchLoop();
        const remainingSec = Math.max(0, Math.ceil((game.gameEnd - Date.now()) / 1000));
        setFeedback(
            `Ratat (${diff.toFixed(3)}s) · Mai ai ${remainingSec}s`,
            'lose'
        );
    }

    function handleStopPointerDown() {
        if (!game.active || game.ended) return;
        q('#ttMiniStop')?.classList.add('is-stop-holding');
    }

    function handleStopPointerUp() {
        q('#ttMiniStop')?.classList.remove('is-stop-holding');
    }

    function handleKeyDown(event) {
        if (!state.open || game.ended) return;
        if (event.key === 'Escape') {
            close();
            return;
        }
        if (event.key === ' ' || event.key === 's' || event.key === 'S') {
            event.preventDefault();
            handleStop();
        }
    }

    function setOpen(open) {
        const popup = getPopup();
        if (!popup) return;

        if (!open) {
            clearCloseTimer();
            stopSfx();
            stopAnimationLoop();
            clearExpiryTimer();
            clearStopPressVisual();
            game.active = false;
        }

        state.open = open;
        state.offerMode = Boolean(open && currentOffer());
        popup.classList.toggle('is-hidden', !open);
        popup.setAttribute('aria-hidden', open ? 'false' : 'true');

        const halfBtn = document.getElementById('halfButton');
        if (halfBtn) halfBtn.setAttribute('aria-expanded', open ? 'true' : 'false');

        if (open) {
            updateOfferHint();
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    if (state.open) startRound();
                });
            });
        }
    }

    function close() {
        setOpen(false);
    }

    function open() {
        if (state.isBlocked()) return;
        if (!currentOffer()) return;
        setOpen(true);
    }

    function init(options) {
        if (options && typeof options.isBlocked === 'function') {
            state.isBlocked = options.isBlocked;
        }
        if (options && typeof options.getOffer === 'function') {
            state.getOffer = options.getOffer;
        }
        if (options && typeof options.formatCredits === 'function') {
            state.formatCredits = options.formatCredits;
        }
        if (options && typeof options.onRefundApplied === 'function') {
            state.onRefundApplied = options.onRefundApplied;
        }
        if (options && typeof options.onOfferConsumed === 'function') {
            state.onOfferConsumed = options.onOfferConsumed;
        }
        if (options && typeof options.isSoundEnabled === 'function') {
            state.isSoundEnabled = options.isSoundEnabled;
        }

        if (!getPopup()) return;

        q('#ttMiniClose')?.addEventListener('click', close);
        const stopBtn = q('#ttMiniStop');
        stopBtn?.addEventListener('click', handleStop);
        stopBtn?.addEventListener('pointerdown', handleStopPointerDown);
        stopBtn?.addEventListener('pointerup', handleStopPointerUp);
        stopBtn?.addEventListener('pointercancel', handleStopPointerUp);
        stopBtn?.addEventListener('pointerleave', handleStopPointerUp);

        getPopup()?.addEventListener('click', (event) => {
            if (event.target === q('.tt-mini-backdrop')) {
                close();
            }
        });

        if (state.keyHandler) {
            document.removeEventListener('keydown', state.keyHandler);
        }
        state.keyHandler = handleKeyDown;
        document.addEventListener('keydown', state.keyHandler);
    }

    window.TheTimeMini = {
        init,
        open,
        close
    };
}(window));
