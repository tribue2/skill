(function (window) {
    'use strict';

    const GAME_DURATION_MS = 10000;
    const CLOSE_AFTER_WIN_MS = 5000;
    const CLOSE_AFTER_LOSE_MS = 2200;
    const CHEST_OPEN_DELAY_MS = 500;
    const COIN_VISIBLE_MS = 550;
    const COIN_GAP_MS = 200;
    const COIN_COUNT = 8;

    const COIN_WEIGHTS = { 1: 40, 2: 30, 5: 20, 10: 10 };

    const COIN_PALETTES = {
        1: {
            face: ['#ffd0a8', '#cd7f32', '#8f4f18', '#4a2808'],
            rim: ['#f0a060', '#9a5520', '#3d2208'],
            edge: ['#ffb870', '#6b3a10'],
            text: '#2a1606',
            textSize: 30
        },
        2: {
            face: ['#ffffff', '#e0e0e0', '#a8a8a8', '#505050'],
            rim: ['#f5f5f5', '#909090', '#404040'],
            edge: ['#e8e8e8', '#606060'],
            text: '#282828',
            textSize: 30
        },
        5: {
            face: ['#fff8c8', '#ffd700', '#c8960c', '#7a5500'],
            rim: ['#ffe566', '#c8960c', '#5c3a00'],
            edge: ['#ffe080', '#8b6914'],
            text: '#4a3200',
            textSize: 28
        },
        10: {
            face: ['#fffce0', '#ffcf40', '#e0a800', '#8a6500'],
            rim: ['#fff0a0', '#e0a800', '#6b4f00'],
            edge: ['#ffe566', '#9a7200'],
            text: '#3d2800',
            textSize: 24
        }
    };

    let coinSvgUid = 0;

    const game = {
        active: false,
        ended: false,
        won: false,
        gameEnd: 0,
        hudFrameId: null,
        sequenceTimer: null,
        totalSum: 0,
        coins: [],
        coinIndex: 0,
        inputReady: false
    };

    const state = {
        open: false,
        offerMode: false,
        closeTimer: null,
        isBlocked: () => false,
        getOffer: () => null,
        formatCredits: (value) => String(value),
        onRefundApplied: null,
        onOfferConsumed: null,
        isSoundEnabled: () => true
    };

    function getPopup() {
        return document.getElementById('gcMiniPopup');
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

    function clearSequenceTimer() {
        if (game.sequenceTimer) {
            window.clearTimeout(game.sequenceTimer);
            game.sequenceTimer = null;
        }
    }

    function clearHudLoop() {
        if (game.hudFrameId) {
            window.cancelAnimationFrame(game.hudFrameId);
            game.hudFrameId = null;
        }
    }

    function formatHudRemaining(ms) {
        return `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
    }

    function isExpired() {
        return Date.now() >= game.gameEnd;
    }

    function updateHudTimer() {
        const node = q('#gcMiniTimer');
        const fill = q('#gcMiniTimerFill');
        if (!node || !game.active || game.ended) return;
        const remaining = Math.max(0, game.gameEnd - Date.now());
        const progress = Math.max(0, Math.min(1, remaining / GAME_DURATION_MS));
        node.textContent = formatHudRemaining(remaining);
        node.classList.toggle('gc-mini-is-low', remaining <= 3000);
        node.classList.toggle('gc-mini-is-tick', remaining > 0);
        if (fill) fill.style.width = `${progress * 100}%`;
    }

    function tickHudLoop() {
        if (!game.active || game.ended) {
            game.hudFrameId = null;
            return;
        }
        updateHudTimer();
        if (isExpired()) {
            onGameExpired();
            return;
        }
        game.hudFrameId = requestAnimationFrame(tickHudLoop);
    }

    function setFeedback(text, type) {
        const node = q('#gcMiniFeedback');
        if (!node) return;
        node.textContent = text || '';
        node.classList.remove('gc-mini-is-win', 'gc-mini-is-lose', 'gc-mini-is-hint');
        if (type) node.classList.add(`gc-mini-is-${type}`);
    }

    function hideResultCard() {
        const card = q('#gcMiniResult');
        if (!card) return;
        card.classList.add('is-hidden');
        card.classList.remove('gc-mini-is-win', 'gc-mini-is-lose');
    }

    function showResultCard({ title, sub, type, icon }) {
        const card = q('#gcMiniResult');
        const iconNode = q('#gcMiniResultIcon');
        const titleNode = q('#gcMiniResultTitle');
        const subNode = q('#gcMiniResultSub');
        if (!card || !titleNode) return;
        hideResultCard();
        card.classList.remove('is-hidden');
        card.classList.add(type === 'win' ? 'gc-mini-is-win' : 'gc-mini-is-lose');
        if (iconNode) iconNode.textContent = icon || '';
        titleNode.textContent = title || '';
        if (subNode) subNode.textContent = sub || '';
        setFeedback('', null);
    }

    function updateOfferHint() {
        const prize = q('#gcMiniOfferHint');
        const prizeValue = q('#gcMiniPrizeValue');
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

    function spawnParticles(clientX, clientY) {
        const container = q('#gcMiniParticles');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'gc-mini-particle';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.setProperty('--gc-x', `${(Math.random() - 0.5) * 70}px`);
            particle.style.setProperty('--gc-y', `${(Math.random() - 0.5) * 70 - 24}px`);
            container.appendChild(particle);
            window.setTimeout(() => particle.remove(), 800);
        }
    }

    function spawnParticlesFromElement(element) {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    function randomCoinValue() {
        const totalWeight = Object.values(COIN_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        for (const [value, weight] of Object.entries(COIN_WEIGHTS)) {
            random -= weight;
            if (random <= 0) return parseInt(value, 10);
        }
        return 1;
    }

    function shuffle(values) {
        const list = values.slice();
        for (let i = list.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
        return list;
    }

    function buildAnswerOptions(correct) {
        const options = new Set([correct]);
        const deltas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -1, -2, -3, -4, -5, -6, -7, -8];
        shuffle(deltas).forEach((delta) => {
            if (options.size >= 5) return;
            const candidate = correct + delta;
            if (candidate > 0 && candidate !== correct) {
                options.add(candidate);
            }
        });
        let fallback = 1;
        while (options.size < 5) {
            const candidate = correct + fallback;
            if (candidate > 0) options.add(candidate);
            fallback += 1;
        }
        return shuffle([...options]);
    }

    function hideAnswerChoices() {
        const container = q('#gcMiniChoices');
        if (!container) return;
        container.classList.add('is-hidden');
        container.replaceChildren();
    }

    function setChoicesEnabled(enabled) {
        const container = q('#gcMiniChoices');
        if (!container) return;
        container.querySelectorAll('.gc-mini-choice-btn').forEach((button) => {
            button.disabled = !enabled;
        });
        game.inputReady = enabled;
    }

    function renderAnswerChoices() {
        const container = q('#gcMiniChoices');
        if (!container) return;

        hideAnswerChoices();
        setCoinLegendVisible(true);
        container.classList.remove('is-hidden');
        buildAnswerOptions(game.totalSum).forEach((value) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'gc-mini-choice-btn';
            button.dataset.value = String(value);
            button.textContent = String(value);
            button.addEventListener('click', () => submitGuess(value));
            container.appendChild(button);
        });
        setChoicesEnabled(true);
    }

    function buildReedMarks(cx, cy, radius, count, light, dark) {
        let marks = '';
        for (let i = 0; i < count; i += 1) {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            const inner = radius - 3.2;
            const x1 = cx + Math.cos(angle) * inner;
            const y1 = cy + Math.sin(angle) * inner;
            const x2 = cx + Math.cos(angle) * radius;
            const y2 = cy + Math.sin(angle) * radius;
            marks += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${i % 2 === 0 ? light : dark}" stroke-width="1.15" stroke-linecap="round"/>`;
        }
        return marks;
    }

    function buildCoinSvgMarkup(value) {
        const palette = COIN_PALETTES[value] || COIN_PALETTES[1];
        const uid = `gc${value}${coinSvgUid += 1}`;
        const reed = buildReedMarks(50, 50, 47.5, 72, palette.edge[0], palette.edge[1]);
        const premiumRing = value === 10
            ? `<circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,248,210,0.55)" stroke-width="2.2" stroke-dasharray="3.5 2.5"/>`
            : value === 2
                ? `<circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.4" stroke-dasharray="2.8 2.8"/>`
                : `<circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.3"/>`;

        return `<svg class="gc-mini-coin-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <defs>
                <radialGradient id="${uid}Face" cx="34%" cy="28%" r="68%">
                    <stop offset="0%" stop-color="${palette.face[0]}"/>
                    <stop offset="28%" stop-color="${palette.face[1]}"/>
                    <stop offset="62%" stop-color="${palette.face[2]}"/>
                    <stop offset="100%" stop-color="${palette.face[3]}"/>
                </radialGradient>
                <linearGradient id="${uid}Rim" x1="12%" y1="8%" x2="88%" y2="92%">
                    <stop offset="0%" stop-color="${palette.rim[0]}"/>
                    <stop offset="52%" stop-color="${palette.rim[1]}"/>
                    <stop offset="100%" stop-color="${palette.rim[2]}"/>
                </linearGradient>
                <linearGradient id="${uid}Bevel" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/>
                    <stop offset="45%" stop-color="rgba(255,255,255,0)"/>
                    <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
                </linearGradient>
                <filter id="${uid}Shadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity="0.45"/>
                </filter>
                <filter id="${uid}Emboss" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1.2" stdDeviation="0.2" flood-color="rgba(255,255,255,0.65)"/>
                    <feDropShadow dx="0" dy="-1.4" stdDeviation="0.3" flood-color="rgba(0,0,0,0.55)"/>
                </filter>
            </defs>
            <g filter="url(#${uid}Shadow)">
                <circle cx="50" cy="51.5" r="46.5" fill="rgba(0,0,0,0.28)"/>
                <circle cx="50" cy="50" r="47.5" fill="url(#${uid}Rim)"/>
                <g>${reed}</g>
                <circle cx="50" cy="50" r="43.5" fill="none" stroke="rgba(0,0,0,0.32)" stroke-width="1.4"/>
                <circle cx="50" cy="50" r="41.5" fill="url(#${uid}Face)"/>
                <circle cx="50" cy="50" r="41.5" fill="url(#${uid}Bevel)" opacity="0.55"/>
                <circle cx="50" cy="50" r="37" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="0.9"/>
                ${premiumRing}
                <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(0,0,0,0.14)" stroke-width="0.7"/>
                <ellipse cx="36" cy="31" rx="14" ry="9" fill="rgba(255,255,255,0.38)" transform="rotate(-22 36 31)"/>
                <ellipse cx="62" cy="66" rx="8" ry="5" fill="rgba(0,0,0,0.12)" transform="rotate(18 62 66)"/>
                <text x="50" y="${value === 10 ? 59 : 58}" text-anchor="middle" dominant-baseline="middle"
                    font-family="Georgia, 'Times New Roman', serif" font-size="${palette.textSize}" font-weight="800"
                    fill="${palette.text}" filter="url(#${uid}Emboss)">${value}</text>
            </g>
        </svg>`;
    }

    function createCoinElement(value, legend) {
        const coin = document.createElement('div');
        coin.className = `gc-mini-coin gc-mini-coin--${value}${legend ? ' gc-mini-coin--legend' : ''}`;
        coin.setAttribute('role', 'img');
        coin.setAttribute('aria-label', `Moneda de ${value}`);
        coin.innerHTML = buildCoinSvgMarkup(value);
        return coin;
    }

    function renderLegendCoins() {
        const legend = q('#gcMiniCoinLegend');
        if (!legend) return;
        legend.replaceChildren();
        [1, 2, 5, 10].forEach((value) => {
            const item = document.createElement('span');
            item.className = 'gc-mini-legend-item';
            item.appendChild(createCoinElement(value, true));
            legend.appendChild(item);
        });
    }

    function setCoinLegendVisible(visible) {
        const legend = q('#gcMiniCoinLegend');
        if (!legend) return;
        legend.classList.toggle('is-hidden', !visible);
        legend.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }

    function closeLid() {
        q('#gcMiniLid')?.classList.remove('is-open');
    }

    function openLid() {
        q('#gcMiniLid')?.classList.add('is-open');
    }

    function showNextCoin() {
        if (!game.active || game.ended) return;
        clearSequenceTimer();

        if (isExpired()) {
            onGameExpired();
            return;
        }

        if (game.coinIndex >= game.coins.length) {
            closeLid();
            q('#gcMiniIndicator').textContent = '';
            q('#gcMiniCoinZone').innerHTML = '';
            renderAnswerChoices();
            setFeedback('Alege suma totala corecta', 'hint');
            return;
        }

        const value = game.coins[game.coinIndex];
        const indicator = q('#gcMiniIndicator');
        const zone = q('#gcMiniCoinZone');
        if (indicator) {
            indicator.textContent = `Moneda ${game.coinIndex + 1} din ${game.coins.length}`;
        }
        if (zone) {
            zone.innerHTML = '';
            zone.appendChild(createCoinElement(value));
            spawnParticlesFromElement(zone.querySelector('.gc-mini-coin'));
        }

        game.coinIndex += 1;

        game.sequenceTimer = window.setTimeout(() => {
            if (zone) zone.innerHTML = '';
            game.sequenceTimer = window.setTimeout(showNextCoin, COIN_GAP_MS);
        }, COIN_VISIBLE_MS);
    }

    function openChest() {
        if (!game.active || game.ended) return;
        clearSequenceTimer();

        game.totalSum = 0;
        game.coins = [];
        game.coinIndex = 0;
        game.inputReady = false;

        q('#gcMiniCoinZone').innerHTML = '';
        hideAnswerChoices();
        setChoicesEnabled(false);
        setCoinLegendVisible(false);
        q('#gcMiniIndicator').textContent = '';
        setFeedback('Cufarul se deschide...', 'hint');
        hideResultCard();

        openLid();
        spawnParticlesFromElement(q('#gcMiniChest'));

        for (let i = 0; i < COIN_COUNT; i++) {
            const value = randomCoinValue();
            game.totalSum += value;
            game.coins.push(value);
        }

        game.sequenceTimer = window.setTimeout(showNextCoin, CHEST_OPEN_DELAY_MS);
    }

    function clearCloseTimer() {
        if (state.closeTimer) {
            window.clearTimeout(state.closeTimer);
            state.closeTimer = null;
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

    async function endGame(won, loseReason) {
        if (game.ended) return;
        game.ended = true;
        game.won = won;
        game.active = false;
        clearSequenceTimer();
        clearHudLoop();
        setChoicesEnabled(false);
        q('#gcMiniChest')?.classList.remove('is-ready');

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
                title: 'Calcul corect',
                sub: refund > 0
                    ? `Recuperare: +${state.formatCredits(refund)} LEI`
                    : 'Recuperare aplicata in sold'
            });
            finishOfferRound(true);
            return;
        }

        playSfx('lose.mp3');
        await claimRefund(false);
        const wrongGuess = loseReason === 'wrong';
        showResultCard({
            type: 'lose',
            icon: '×',
            title: wrongGuess ? 'Calcul gresit' : 'Timp expirat',
            sub: wrongGuess
                ? `Suma corecta era ${game.totalSum}.`
                : 'Nu ai reusit sa calculezi la timp.'
        });
        finishOfferRound(false);
    }

    function onGameExpired() {
        if (game.ended) return;
        endGame(false, 'time');
    }

    function submitGuess(guess) {
        if (!game.active || game.ended || !game.inputReady) return;
        clearSequenceTimer();
        setChoicesEnabled(false);
        endGame(guess === game.totalSum, guess === game.totalSum ? null : 'wrong');
    }

    function resetRoundVisuals() {
        clearSequenceTimer();
        clearHudLoop();
        closeLid();
        q('#gcMiniCoinZone').innerHTML = '';
        q('#gcMiniIndicator').textContent = '';
        hideAnswerChoices();
        setChoicesEnabled(false);
        setCoinLegendVisible(false);
        hideResultCard();
        setFeedback('', null);
        q('#gcMiniChest')?.classList.remove('is-ready');
    }

    function startRound() {
        resetRoundVisuals();
        game.active = true;
        game.ended = false;
        game.won = false;
        game.gameEnd = Date.now() + GAME_DURATION_MS;
        game.inputReady = false;
        updateOfferHint();
        updateHudTimer();
        game.hudFrameId = requestAnimationFrame(tickHudLoop);
        openChest();
    }

    function setPlayingLayout(active) {
        q('.gc-mini-panel')?.classList.toggle('is-playing', Boolean(active));
    }

    function setOpen(open) {
        const popup = getPopup();
        if (!popup) return;

        if (!open) {
            game.active = false;
            game.ended = false;
            clearSequenceTimer();
            clearHudLoop();
            clearCloseTimer();
            stopSfx();
            resetRoundVisuals();
            setPlayingLayout(false);
        }

        state.open = open;
        state.offerMode = Boolean(open && currentOffer());
        popup.classList.toggle('is-hidden', !open);
        popup.setAttribute('aria-hidden', open ? 'false' : 'true');

        const halfBtn = document.getElementById('halfButton');
        if (halfBtn) halfBtn.setAttribute('aria-expanded', open ? 'true' : 'false');

        if (open) {
            setPlayingLayout(true);
            startRound();
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

        renderLegendCoins();

        q('#gcMiniClose')?.addEventListener('click', close);

        getPopup()?.addEventListener('click', (event) => {
            if (event.target === q('.gc-mini-backdrop')) {
                close();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && state.open) {
                close();
            }
        });
    }

    window.GoldChestMini = {
        init,
        open,
        close
    };
}(window));
