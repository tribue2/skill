(function (global) {
    'use strict';

    var config = null;
    var spinCount = 0;
    var targetSpins = randomTarget();
    var activeBubble = null;
    var pendingBet = 0;
    var pendingPrize = 0;
    var expireTimer = null;
    var lastWinHighlightTimer = null;
    var hintRevealRaf = null;

    function randomTarget() {
        return 1 + Math.floor(Math.random() * 10000);
    }

    function scheduleNextCycle() {
        spinCount = 0;
        targetSpins = randomTarget();
    }

    function roundBet(value) {
        return Math.round((Number(value) || 0) * 100) / 100;
    }

    function randomMultiplier() {
        return 5 + Math.random() * 15;
    }

    function getBalloonsHost() {
        return document.querySelector('.verga-side-balloons');
    }

    function ensurePopRoot() {
        var root = document.getElementById('terminalGoldenBubblePopRoot');
        if (!root) {
            root = document.createElement('div');
            root.id = 'terminalGoldenBubblePopRoot';
            root.className = 'terminal-golden-bubble-pop-root';
            root.setAttribute('aria-hidden', 'true');
            document.body.appendChild(root);
        }
        return root;
    }

    function setGoldenActive(active) {
        var host = getBalloonsHost();
        if (host) {
            host.classList.toggle('has-golden-bubble', active);
        }
        if (document.body) {
            document.body.classList.toggle('has-terminal-golden-bubble', active);
        }
    }

    function clearExpireTimer() {
        if (expireTimer) {
            window.clearTimeout(expireTimer);
            expireTimer = null;
        }
    }

    function finishBubbleCycle() {
        setGoldenActive(false);
        scheduleNextCycle();
    }

    function isSoundEnabled() {
        if (config && typeof config.isSoundEnabled === 'function') {
            return config.isSoundEnabled();
        }
        return true;
    }

    function getSoundVolume() {
        if (config && typeof config.getSoundVolume === 'function') {
            return config.getSoundVolume();
        }
        return 1;
    }

    function resolveBombSoundUrl() {
        return new URL('../dodge-bomb/sounds/bomba.mp3', window.location.href).href;
    }

    function playPopSound() {
        if (!isSoundEnabled()) {
            return;
        }
        if (config && typeof config.ensureAudio === 'function') {
            config.ensureAudio();
        }
        if (config && typeof config.playPopSound === 'function') {
            config.playPopSound();
            return;
        }
        try {
            var audio = new Audio(resolveBombSoundUrl());
            audio.preload = 'auto';
            audio.volume = Math.max(0, Math.min(1, 0.88 * getSoundVolume()));
            var playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {});
            }
        } catch (error) {
        }
    }

    function captureClickSpot(event, bubbleNode) {
        if (event && typeof event.clientX === 'number' && typeof event.clientY === 'number') {
            return {
                x: event.clientX,
                y: event.clientY
            };
        }
        var rect = bubbleNode.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height * 0.4
        };
    }

    function spawnSceneParticles(scene) {
        var colors = ['#fff4b8', '#ffd34a', '#ffb020', '#ffe890', '#e8a818', '#ffffff'];
        for (var i = 0; i < 20; i += 1) {
            var particle = document.createElement('span');
            particle.className = 'terminal-golden-bubble-particle';
            var angle = (Math.PI * 2 * i) / 20;
            var distance = 34 + Math.random() * 52;
            particle.style.setProperty('--p-x', Math.round(Math.cos(angle) * distance) + 'px');
            particle.style.setProperty('--p-y', Math.round(Math.sin(angle) * distance) + 'px');
            particle.style.setProperty('--p-size', (8 + Math.random() * 11).toFixed(1) + 'px');
            particle.style.setProperty('--p-color', colors[i % colors.length]);
            particle.style.setProperty('--p-delay', Math.round(Math.random() * 90) + 'ms');
            scene.appendChild(particle);
        }
    }

    var PRIZE_VISIBLE_MS = 3000;
    var PRIZE_FADE_MS = 350;
    var PRIZE_SCENE_MS = PRIZE_VISIBLE_MS + PRIZE_FADE_MS + 120;

    function formatPrizeText(prize) {
        var text = config && typeof config.formatAmount === 'function'
            ? config.formatAmount(prize)
            : String(prize);
        if (!text || text === 'NaN' || text === 'undefined') {
            text = roundBet(prize).toFixed(2);
        }
        return text;
    }

    function createPopScene(spot, prizeText) {
        var root = ensurePopRoot();
        var scene = document.createElement('div');
        scene.className = 'terminal-golden-bubble-pop-scene';
        scene.style.left = spot.x + 'px';
        scene.style.top = spot.y + 'px';

        var flash = document.createElement('span');
        flash.className = 'terminal-golden-bubble-burst-flash';

        var ring = document.createElement('span');
        ring.className = 'terminal-golden-bubble-burst-ring';

        var prize = document.createElement('div');
        prize.className = 'terminal-golden-bubble-prize';
        var prizeValue = document.createElement('span');
        prizeValue.className = 'terminal-golden-bubble-prize-value';
        prizeValue.textContent = '+' + prizeText;
        if (('+' + prizeText).length > 8) {
            prizeValue.classList.add('is-long');
        }
        prize.appendChild(prizeValue);

        scene.appendChild(flash);
        scene.appendChild(ring);
        spawnSceneParticles(scene);
        scene.appendChild(prize);
        root.appendChild(scene);

        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
                prize.classList.add('is-visible');
            });
        });

        window.setTimeout(function () {
            prize.classList.remove('is-visible');
            prize.classList.add('is-fading');
        }, PRIZE_VISIBLE_MS);

        window.setTimeout(function () {
            scene.remove();
        }, PRIZE_SCENE_MS);
    }

    function highlightLastWin() {
        var lastWinPanel = document.querySelector('.boss-crown-last-win.terminal-stat-panel')
            || document.querySelector('.terminal-stat-panel:has(#lastWinValue)');
        if (!lastWinPanel) {
            return;
        }
        lastWinPanel.classList.add('is-golden-bubble-win');
        if (lastWinHighlightTimer) {
            window.clearTimeout(lastWinHighlightTimer);
        }
        lastWinHighlightTimer = window.setTimeout(function () {
            lastWinPanel.classList.remove('is-golden-bubble-win');
            lastWinHighlightTimer = null;
        }, PRIZE_SCENE_MS);
    }

    function hasTerminalServer() {
        return Boolean(
            localStorage.getItem('skill_terminal_credentials')
            && localStorage.getItem('skill_terminal_server')
        );
    }

    function getTerminalApiConfig() {
        var storage = localStorage.getItem('skill_terminal_credentials');
        var server = localStorage.getItem('skill_terminal_server');
        if (!storage || !server) {
            return null;
        }
        return {
            credentials: JSON.parse(storage),
            base: server.replace(/\/$/, '') + '/api/terminal'
        };
    }

    function toServerCredits(amount) {
        return Math.round((Math.max(0, Number(amount) || 0)) * 100) / 100;
    }

    function syncBubbleWinToServer(prize) {
        var api = getTerminalApiConfig();
        if (!api) {
            return Promise.resolve(null);
        }

        var gameId = 0;
        if (config && typeof config.getGameId === 'function') {
            gameId = Number(config.getGameId()) || 0;
        }

        return fetch(api.base + '/session.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Terminal-Code': api.credentials.terminal_code,
                'X-Terminal-Secret': api.credentials.api_secret
            },
            body: JSON.stringify({
                action: 'golden_bubble_bonus',
                prize_credits: toServerCredits(prize),
                game_id: gameId
            })
        }).then(function (response) {
            return response.json();
        }).catch(function () {
            return null;
        });
    }

    function deliverAward(prize, prizeText) {
        updateLastWin(prize, prizeText);

        if (!(typeof config.onAward === 'function') || prize <= 0) {
            return;
        }

        if (!hasTerminalServer()) {
            config.onAward(prize);
            return;
        }

        syncBubbleWinToServer(prize).then(function (data) {
            if (data && data.ok && data.credits_balance !== undefined) {
                config.onAward(prize, Number(data.credits_balance));
            } else {
                config.onAward(prize);
            }
            if (typeof config.refreshCredits === 'function') {
                config.refreshCredits();
            }
        });
    }

    function updateLastWin(prize, prizeText) {
        var displayText = prizeText || formatPrizeText(prize);
        var lastWin = document.getElementById('lastWinValue');
        if (lastWin) {
            lastWin.textContent = displayText;
            lastWin.classList.remove('is-forfeited');
        }
        if (typeof config.onShowLastWin === 'function') {
            config.onShowLastWin(prize);
            if (lastWin && !lastWin.textContent) {
                lastWin.textContent = displayText;
            }
        }
        highlightLastWin();
    }

    function shouldRevealTapHint(bubbleRect) {
        var statusFrame = document.querySelector('#terminalStatusFrame')
            || document.querySelector('.verga-side-play-stack .terminal-status-frame');
        if (statusFrame) {
            var statusRect = statusFrame.getBoundingClientRect();
            return bubbleRect.top <= statusRect.bottom + 8;
        }
        var tools = document.querySelector('.verga-side-play-stack .verga-side-tools');
        if (tools) {
            var toolsRect = tools.getBoundingClientRect();
            return bubbleRect.top <= toolsRect.bottom + 8;
        }
        var playStack = document.querySelector('.verga-side-play-stack');
        if (playStack) {
            var stackRect = playStack.getBoundingClientRect();
            return bubbleRect.top <= stackRect.bottom + 8;
        }
        return false;
    }

    function stopHintRevealWatcher() {
        if (hintRevealRaf) {
            window.cancelAnimationFrame(hintRevealRaf);
            hintRevealRaf = null;
        }
    }

    function startHintRevealWatcher(bubble) {
        stopHintRevealWatcher();
        if (!bubble) {
            return;
        }

        var tapHint = bubble.querySelector('.terminal-golden-bubble-tap-hint');
        if (!tapHint) {
            return;
        }

        tapHint.classList.add('is-hint-hidden');
        tapHint.classList.remove('is-hint-visible');

        function tick() {
            hintRevealRaf = null;
            if (!bubble.isConnected || bubble !== activeBubble) {
                return;
            }

            var rect = bubble.getBoundingClientRect();

            if (shouldRevealTapHint(rect)) {
                tapHint.classList.remove('is-hint-hidden');
                tapHint.classList.add('is-hint-visible');
                return;
            }

            hintRevealRaf = window.requestAnimationFrame(tick);
        }

        hintRevealRaf = window.requestAnimationFrame(tick);
    }

    function removeActiveBubble(skipAnimation) {
        stopHintRevealWatcher();
        clearExpireTimer();
        if (!activeBubble) {
            return;
        }
        var node = activeBubble;
        activeBubble = null;
        pendingBet = 0;
        pendingPrize = 0;
        node.remove();
        finishBubbleCycle();
        if (!skipAnimation) {
            return;
        }
    }

    function popBubble(event) {
        if (!activeBubble || !config) {
            return;
        }
        var bubbleNode = activeBubble;
        var prize = pendingPrize;
        var prizeText = formatPrizeText(prize);
        var spot = captureClickSpot(event, bubbleNode);

        activeBubble = null;
        clearExpireTimer();
        stopHintRevealWatcher();
        pendingBet = 0;
        pendingPrize = 0;

        playPopSound();
        bubbleNode.classList.add('is-vanishing');
        window.setTimeout(function () {
            bubbleNode.remove();
        }, 190);

        createPopScene(spot, prizeText);
        deliverAward(prize, prizeText);

        window.setTimeout(function () {
            finishBubbleCycle();
        }, 520);
    }

    function createGoldenBubble(betAmount) {
        var host = getBalloonsHost();
        if (!host || activeBubble) {
            return;
        }

        ensurePopRoot();
        pendingBet = roundBet(betAmount);
        pendingPrize = roundBet(pendingBet * randomMultiplier());
        if (pendingPrize <= 0) {
            pendingPrize = roundBet(pendingBet * 5);
        }

        var bubble = document.createElement('div');
        bubble.className = 'terminal-golden-bubble is-rising';
        bubble.style.setProperty('--start-x', (8 + Math.random() * 82).toFixed(1) + '%');
        bubble.style.setProperty('--drift-x', ((Math.random() * 14 - 7).toFixed(1)) + 'px');
        bubble.style.setProperty('--tilt', ((Math.random() * 8 - 4).toFixed(1)) + 'deg');
        bubble.setAttribute('role', 'button');
        bubble.setAttribute('aria-label', 'Balon bonus auriu');

        bubble.innerHTML = [
            '<button type="button" class="terminal-golden-bubble-hit">',
            '<span class="terminal-golden-bubble-body"></span>',
            '<span class="terminal-golden-bubble-shine"></span>',
            '<span class="terminal-golden-bubble-tap-hint is-hint-hidden" aria-hidden="true">',
            '<span class="terminal-golden-bubble-tap-ring"></span>',
            '<span class="terminal-golden-bubble-tap-ring terminal-golden-bubble-tap-ring--delay"></span>',
            '<span class="terminal-golden-bubble-tap-core">',
            '<svg class="terminal-golden-bubble-tap-icon" viewBox="0 0 24 24" fill="none" stroke="#ffe08a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '<path d="M12 9a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v5a6 6 0 0 1-6 6h-1.5a8 8 0 0 1-6.4-3.2l-2.7-3.6a2 2 0 0 1 3.2-2.4L8 14.667V4a2 2 0 0 1 4 0v6"/>',
            '</svg>',
            '</span>',
            '</span>',
            '<span class="terminal-golden-bubble-knot"></span>',
            '<span class="terminal-golden-bubble-string"></span>',
            '</button>'
        ].join('');

        var hit = bubble.querySelector('.terminal-golden-bubble-hit');
        if (hit) {
            hit.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                popBubble(event);
            });
        }

        setGoldenActive(true);
        host.appendChild(bubble);
        activeBubble = bubble;
        startHintRevealWatcher(bubble);

        expireTimer = window.setTimeout(function () {
            removeActiveBubble(false);
        }, 50000);
    }

    global.IqwinTerminalGoldenBubble = {
        init: function (options) {
            config = options || {};
            ensurePopRoot();
            scheduleNextCycle();
        },
        onSpinComplete: function (betAmount) {
            if (!config) {
                return;
            }
            var host = getBalloonsHost();
            if (!host) {
                return;
            }
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return;
            }
            if (activeBubble) {
                return;
            }
            spinCount += 1;
            if (spinCount < targetSpins) {
                return;
            }
            createGoldenBubble(betAmount);
        },
        onSpinStart: function () {
        },
        reset: function () {
            removeActiveBubble(true);
            scheduleNextCycle();
        }
    };
})(window);
