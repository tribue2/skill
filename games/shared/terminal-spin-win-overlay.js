(function (global) {
    'use strict';

    var hideTimer = null;
    var countUpFrame = null;
    var overlayEl = null;
    var amountEl = null;
    var labelEl = null;
    var bigWinEl = null;
    var bigWinAmountEl = null;
    var bigWinTitleEl = null;
    var bigWinAudio = null;
    var bigWinActive = false;
    var DEFAULT_DURATION = 2200;

    var TIERS = [
        { id: 'epic', minMult: 100, title: 'EPIC WIN', duration: 10000, countUp: true, sound: 'jackpot.mp3' },
        { id: 'mega', minMult: 50, title: 'MEGA WIN', duration: 8500, countUp: true, sound: 'hugewin.mp3' },
        { id: 'huge', minMult: 25, title: 'HUGE WIN', duration: 7000, countUp: true, sound: 'hugewin.mp3' },
        { id: 'big', minMult: 10, title: 'BIG WIN', duration: 5000, countUp: true, sound: 'bigwin.mp3' }
    ];

    function getContainer() {
        return document.querySelector('.verga-reels-led-inner');
    }

    function ensureOverlay() {
        var wrap = getContainer();
        if (!wrap) return null;

        if (!overlayEl) {
            overlayEl = document.createElement('div');
            overlayEl.id = 'terminalSpinWinOverlay';
            overlayEl.className = 'terminal-spin-win-overlay';
            overlayEl.setAttribute('aria-hidden', 'true');

            var box = document.createElement('div');
            box.className = 'terminal-spin-win-box';

            labelEl = document.createElement('span');
            labelEl.className = 'terminal-spin-win-label';
            labelEl.textContent = 'Câștig';

            var divider = document.createElement('span');
            divider.className = 'terminal-spin-win-divider';
            divider.setAttribute('aria-hidden', 'true');

            var amountWrap = document.createElement('div');
            amountWrap.className = 'terminal-spin-win-amount-wrap';

            amountEl = document.createElement('strong');
            amountEl.className = 'terminal-spin-win-amount';
            amountEl.textContent = '0,00';

            var unit = document.createElement('span');
            unit.className = 'terminal-spin-win-unit';
            unit.textContent = 'LEI';

            amountWrap.appendChild(amountEl);
            amountWrap.appendChild(unit);
            box.appendChild(labelEl);
            box.appendChild(divider);
            box.appendChild(amountWrap);
            overlayEl.appendChild(box);
            wrap.appendChild(overlayEl);
        }

        return overlayEl;
    }

    function ensureBigWinOverlay() {
        var wrap = getContainer();
        if (!wrap) return null;

        if (!bigWinEl) {
            bigWinEl = document.createElement('div');
            bigWinEl.id = 'terminalBigWinOverlay';
            bigWinEl.className = 'terminal-big-win-overlay';
            bigWinEl.setAttribute('aria-hidden', 'true');

            var backdrop = document.createElement('div');
            backdrop.className = 'terminal-big-win-backdrop';
            backdrop.setAttribute('aria-hidden', 'true');

            var bgOrbs = document.createElement('div');
            bgOrbs.className = 'terminal-big-win-bg-orbs';
            bgOrbs.setAttribute('aria-hidden', 'true');
            createBgOrbs(bgOrbs);
            backdrop.appendChild(bgOrbs);

            var rays = document.createElement('div');
            rays.className = 'terminal-big-win-rays';
            rays.setAttribute('aria-hidden', 'true');

            var raysReverse = document.createElement('div');
            raysReverse.className = 'terminal-big-win-rays-reverse';
            raysReverse.setAttribute('aria-hidden', 'true');

            var fireworks = document.createElement('div');
            fireworks.className = 'terminal-big-win-fireworks';
            fireworks.setAttribute('aria-hidden', 'true');
            createFireworks(fireworks);

            var confetti = document.createElement('div');
            confetti.className = 'terminal-big-win-confetti';
            confetti.setAttribute('aria-hidden', 'true');
            createConfetti(confetti);

            var stage = document.createElement('div');
            stage.className = 'terminal-big-win-stage';

            var bulbs = document.createElement('div');
            bulbs.className = 'terminal-big-win-bulbs';
            bulbs.setAttribute('aria-hidden', 'true');
            createBulbs(bulbs);

            var panel = document.createElement('div');
            panel.className = 'terminal-big-win-panel';

            var crown = document.createElement('div');
            crown.className = 'terminal-big-win-crown';
            crown.setAttribute('aria-hidden', 'true');
            crown.innerHTML = '<span></span>';

            bigWinTitleEl = document.createElement('div');
            bigWinTitleEl.className = 'terminal-big-win-title';
            bigWinTitleEl.textContent = 'BIG WIN';

            var amountBox = document.createElement('div');
            amountBox.className = 'terminal-big-win-amount-box';

            bigWinAmountEl = document.createElement('div');
            bigWinAmountEl.className = 'terminal-big-win-amount';
            bigWinAmountEl.textContent = '0,00';

            var unit = document.createElement('div');
            unit.className = 'terminal-big-win-unit';
            unit.textContent = 'LEI';

            amountBox.appendChild(bigWinAmountEl);
            amountBox.appendChild(unit);
            panel.appendChild(crown);
            panel.appendChild(bigWinTitleEl);
            panel.appendChild(amountBox);
            stage.appendChild(bulbs);
            stage.appendChild(panel);
            bigWinEl.appendChild(backdrop);
            bigWinEl.appendChild(rays);
            bigWinEl.appendChild(raysReverse);
            bigWinEl.appendChild(stage);
            bigWinEl.appendChild(fireworks);
            bigWinEl.appendChild(confetti);
            wrap.appendChild(bigWinEl);
        }

        return bigWinEl;
    }

    function createBgOrbs(root) {
        for (var i = 0; i < 14; i += 1) {
            var orb = document.createElement('span');
            orb.className = 'terminal-big-win-bg-orb';
            orb.style.setProperty('--ox', (10 + Math.random() * 80) + '%');
            orb.style.setProperty('--oy', (12 + Math.random() * 76) + '%');
            orb.style.setProperty('--os', (48 + Math.random() * 72) + 'px');
            orb.style.setProperty('--od', (Math.random() * 2.4) + 's');
            orb.style.setProperty('--tx', ((Math.random() * 2 - 1) * 24) + 'px');
            orb.style.setProperty('--ty', ((Math.random() * -1) * 28 - 8) + 'px');
            orb.style.setProperty('--tx2', ((Math.random() * 2 - 1) * 20) + 'px');
            orb.style.setProperty('--ty2', ((Math.random() * 24) + 4) + 'px');
            root.appendChild(orb);
        }
    }

    function createBulbs(root) {
        for (var i = 0; i < 48; i += 1) {
            var bulb = document.createElement('span');
            bulb.className = 'terminal-big-win-bulb';
            bulb.style.setProperty('--i', String(i));
            root.appendChild(bulb);
        }
    }

    function createConfetti(root) {
        var colors = ['#ffd700', '#ffbe3d', '#fff4c8', '#e8c040', '#ff8c42', '#ffffff'];
        for (var i = 0; i < 28; i += 1) {
            var piece = document.createElement('span');
            piece.className = 'terminal-big-win-confetti-piece';
            piece.style.setProperty('--cx', (8 + Math.random() * 84) + '%');
            piece.style.setProperty('--cw', (6 + Math.random() * 6) + 'px');
            piece.style.setProperty('--ch', (8 + Math.random() * 10) + 'px');
            piece.style.setProperty('--cc', colors[i % colors.length]);
            piece.style.setProperty('--dx', ((Math.random() * 2 - 1) * 60) + 'px');
            piece.style.setProperty('--cd', (Math.random() * 1.8) + 's');
            root.appendChild(piece);
        }
    }

    function createFireworks(root) {
        var positions = [
            { x: '18%', y: '22%' },
            { x: '82%', y: '20%' },
            { x: '50%', y: '14%' },
            { x: '28%', y: '78%' },
            { x: '72%', y: '76%' },
            { x: '50%', y: '50%' }
        ];

        positions.forEach(function (pos) {
            var burst = document.createElement('div');
            burst.className = 'terminal-big-win-burst';
            burst.style.setProperty('--bx', pos.x);
            burst.style.setProperty('--by', pos.y);
            for (var i = 0; i < 24; i += 1) {
                var spark = document.createElement('span');
                spark.className = 'terminal-big-win-spark';
                spark.style.setProperty('--i', String(i));
                burst.appendChild(spark);
            }
            root.appendChild(burst);
        });
    }

    function clearHideTimer() {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
    }

    function clearCountUp() {
        if (countUpFrame) {
            cancelAnimationFrame(countUpFrame);
            countUpFrame = null;
        }
    }

    function formatCredits(value) {
        var display = global.IqwinTerminalCreditsDisplay;
        var amount = Number(value) || 0;
        if (display && typeof display.moneyForCredits === 'function') {
            amount = display.moneyForCredits(amount);
        }
        return amount.toLocaleString('ro-RO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function resolveTier(credits, betAmount) {
        var bet = Number(betAmount) || 0;
        var win = Number(credits) || 0;
        if (bet <= 0 || win <= 0) return null;
        var mult = win / bet;
        for (var i = 0; i < TIERS.length; i += 1) {
            if (mult >= TIERS[i].minMult) {
                return TIERS[i];
            }
        }
        return null;
    }

    function getSoundUrl(fileName) {
        var sound = fileName || 'bigwin.mp3';
        try {
            return new URL('sounds/' + sound, new URL('../shared/', window.location.href)).href;
        } catch (error) {
            return '../shared/sounds/' + sound;
        }
    }

    function stopBigWinSound() {
        if (!bigWinAudio) return;
        try {
            bigWinAudio.pause();
            bigWinAudio.currentTime = 0;
        } catch (error) {}
        bigWinAudio = null;
    }

    function playBigWinSound(volume, soundFile) {
        stopBigWinSound();
        if (volume <= 0) return;

        try {
            bigWinAudio = new Audio(getSoundUrl(soundFile));
            bigWinAudio.volume = Math.max(0, Math.min(1, volume));
            bigWinAudio.loop = true;
            bigWinAudio.play().catch(function () {
                playSynthFanfare(volume);
            });
        } catch (error) {
            playSynthFanfare(volume);
        }
    }

    function playSynthFanfare(volume) {
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            var master = ctx.createGain();
            master.gain.value = Math.max(0, Math.min(1, volume)) * 0.35;
            master.connect(ctx.destination);

            var notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach(function (freq, index) {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.0001, ctx.currentTime + index * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + index * 0.08 + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.08 + 0.45);
                osc.connect(gain);
                gain.connect(master);
                osc.start(ctx.currentTime + index * 0.08);
                osc.stop(ctx.currentTime + index * 0.08 + 0.5);
            });
        } catch (error) {}
    }

    function hideSmallOverlay() {
        if (!overlayEl) return;
        overlayEl.classList.remove('is-visible', 'is-animate', 'is-forfeited');
        overlayEl.setAttribute('aria-hidden', 'true');
    }

    function setBigWinActive(active) {
        var next = Boolean(active);
        if (bigWinActive === next) return;
        bigWinActive = next;
        document.body.classList.toggle('is-terminal-big-win-active', next);
        try {
            global.dispatchEvent(new CustomEvent('iqwin-terminal-big-win-change', { detail: { active: next } }));
        } catch (error) {}
    }

    function isBigWinActive() {
        return bigWinActive;
    }

    function hideBigWinOverlay() {
        clearCountUp();
        stopBigWinSound();
        setBigWinActive(false);
        if (!bigWinEl) return;
        bigWinEl.classList.remove(
            'is-visible',
            'is-tier-big',
            'is-tier-huge',
            'is-tier-mega',
            'is-tier-epic',
            'is-shake-1',
            'is-shake-2',
            'is-shake-3'
        );
        bigWinEl.setAttribute('aria-hidden', 'true');
    }

    function getShakeClass(tierId) {
        if (tierId === 'epic' || tierId === 'mega') return 'is-shake-3';
        if (tierId === 'huge') return 'is-shake-2';
        if (tierId === 'big') return 'is-shake-1';
        return '';
    }

    function showSmallOverlay(credits, options) {
        var el = ensureOverlay();
        if (!el || !amountEl) return;

        amountEl.textContent = options.formatted || formatCredits(credits);
        if (labelEl) {
            labelEl.textContent = options.forfeit ? 'Câștig pierdut' : 'Câștig';
        }

        el.classList.toggle('is-forfeited', Boolean(options.forfeit));
        el.classList.remove('is-animate');
        el.classList.add('is-visible');
        el.setAttribute('aria-hidden', 'false');
        void el.offsetWidth;
        el.classList.add('is-animate');

        var duration = options.duration === 0 ? 0 : (options.duration || DEFAULT_DURATION);
        if (duration > 0) {
            hideTimer = setTimeout(hide, duration);
        }
    }

    function animateBigWinAmount(targetCredits, durationMs) {
        if (!bigWinAmountEl) return;

        var target = Number(targetCredits) || 0;
        var startTime = Date.now();
        var colorStops = [
            { t: 0, color: '#fff4c8' },
            { t: 0.35, color: '#ffd700' },
            { t: 0.65, color: '#ff9f2e' },
            { t: 1, color: '#e85d3f' }
        ];

        function colorAtProgress(progress) {
            var i = 0;
            while (i + 1 < colorStops.length && colorStops[i + 1].t < progress) i += 1;
            return colorStops[Math.min(i, colorStops.length - 1)].color;
        }

        function tick() {
            var elapsed = Date.now() - startTime;
            var progress = Math.min(1, elapsed / durationMs);
            var eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            var current = target * eased;
            bigWinAmountEl.textContent = formatCredits(current);
            bigWinAmountEl.style.color = colorAtProgress(progress);
            if (progress < 1) {
                countUpFrame = requestAnimationFrame(tick);
            } else {
                bigWinAmountEl.textContent = formatCredits(target);
            }
        }

        tick();
    }

    function showBigWinOverlay(credits, tier, options) {
        var el = ensureBigWinOverlay();
        if (!el || !bigWinAmountEl || !bigWinTitleEl) return;

        hideSmallOverlay();

        bigWinTitleEl.textContent = tier.title;
        bigWinAmountEl.textContent = '0,00';
        bigWinAmountEl.style.color = '#fff4c8';

        el.classList.remove('is-tier-big', 'is-tier-huge', 'is-tier-mega', 'is-tier-epic', 'is-shake-1', 'is-shake-2', 'is-shake-3');
        el.classList.add('is-tier-' + tier.id);
        var shakeClass = getShakeClass(tier.id);
        if (shakeClass) el.classList.add(shakeClass);
        el.classList.add('is-visible');
        el.setAttribute('aria-hidden', 'false');

        var volume = options.soundEnabled === false ? 0 : Math.max(0, Math.min(1, Number(options.soundVolume) || 0.8));
        if (tier.id === 'mega') {
            volume = Math.min(1, volume * 1.05);
        } else if (tier.id === 'epic') {
            volume = Math.min(1, volume * 1.1);
        }
        playBigWinSound(volume, tier.sound || 'bigwin.mp3');
        setBigWinActive(true);

        if (tier.countUp) {
            animateBigWinAmount(credits, Math.min(tier.duration, 3200));
        } else {
            bigWinAmountEl.textContent = options.formatted || formatCredits(credits);
        }

        hideTimer = setTimeout(hide, tier.duration);
    }

    function canShowBigWinTier(options) {
        if (!options) return false;
        if (options.forfeit) return false;
        if (options.skillStopUsed === false) return false;
        if (options.allowBigWin === false) return false;
        return true;
    }

    function show(credits, options) {
        options = options || {};
        clearHideTimer();
        clearCountUp();

        if (options.forfeit) {
            hideBigWinOverlay();
            return;
        }

        var tier = canShowBigWinTier(options) ? resolveTier(credits, options.betAmount) : null;
        if (tier) {
            showBigWinOverlay(credits, tier, options);
            return;
        }

        hideBigWinOverlay();
        showSmallOverlay(credits, options);
    }

    function hide() {
        clearHideTimer();
        clearCountUp();
        stopBigWinSound();
        hideSmallOverlay();
        hideBigWinOverlay();
    }

    global.IqwinTerminalSpinWinOverlay = {
        show: show,
        hide: hide,
        isBigWinActive: isBigWinActive,
        formatCredits: formatCredits,
        resolveTier: resolveTier
    };
})(typeof window !== 'undefined' ? window : this);
