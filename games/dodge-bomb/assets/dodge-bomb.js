(() => {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));
    const params = new URLSearchParams(window.location.search);

    const symbolFiles = {
        sapte: 'diamond.webp',
        cireasa: 'cireasa.webp',
        lamaie: 'lamaie.webp',
        pepene: 'pepene.webp',
        portocala: 'portocala.webp',
        pruna: 'pruna.webp',
        stea: 'stea.webp',
        strugure: 'strugure.webp',
        mult0: 'bomb.webp'
    };

    const multiplierLabels = {
        mult0: '',
        mult1: 'x1',
        mult2: 'x2',
        mult3: 'x3'
    };

    const multiplierSymbols = Object.keys(multiplierLabels);
    const fruitSymbols = Object.keys(symbolFiles).filter((key) => !multiplierSymbols.includes(key));
    const isMultiplierSymbol = (key) => Object.prototype.hasOwnProperty.call(multiplierLabels, key);
    const isBombSymbol = (key) => key === 'mult0';
    const symbolKeys = [...fruitSymbols, ...multiplierSymbols];

    const paytableLabels = {
        sapte: 'Diamant',
        cireasa: 'q',
        lamaie: 'K',
        pepene: 'Pepene',
        portocala: 'Portocala',
        pruna: 'A',
        stea: 'Stea',
        strugure: 'Strugure'
    };

        const paytable = {
        sapte: { 4: 400, 3: 20 },
        stea: { 4: 60, 3: 5 },
        pepene: { 4: 80, 3: 20 },
        strugure: { 4: 80, 3: 20 },
        pruna: { 4: 40, 3: 10 },
        portocala: { 4: 40, 3: 10 },
        lamaie: { 4: 40, 3: 10 },
        cireasa: { 4: 20, 3: 5, 2: 2 }
    };

    const paytableOrder = ['sapte', 'pepene', 'strugure', 'pruna', 'portocala', 'lamaie', 'cireasa', 'stea'];

    const PAYING_REELS = 4;
    const MULTIPLIER_REEL = 4;

    const paylines = [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
        [2, 2, 2, 2, 2],
        [0, 1, 2, 1, 0],
        [2, 1, 0, 1, 2],
        [0, 0, 1, 2, 2],
        [2, 2, 1, 0, 0],
        [1, 0, 0, 0, 1],
        [1, 2, 2, 2, 1],
        [0, 1, 1, 1, 0]
    ];

    const lineColors = [
        { main: '#0f7a24', soft: 'rgba(15, 122, 36, 0.42)', glow: 'rgba(20, 96, 36, 0.56)', core: '#14532d' },
        { main: '#9a6b05', soft: 'rgba(154, 107, 5, 0.42)', glow: 'rgba(120, 77, 8, 0.56)', core: '#713f12' },
        { main: '#0c5a8f', soft: 'rgba(12, 90, 143, 0.42)', glow: 'rgba(7, 71, 118, 0.56)', core: '#075985' },
        { main: '#9f1239', soft: 'rgba(159, 18, 57, 0.42)', glow: 'rgba(136, 19, 55, 0.56)', core: '#881337' },
        { main: '#5b21b6', soft: 'rgba(91, 33, 182, 0.42)', glow: 'rgba(76, 29, 149, 0.56)', core: '#4c1d95' },
        { main: '#9a3412', soft: 'rgba(154, 52, 18, 0.42)', glow: 'rgba(124, 45, 18, 0.56)', core: '#7c2d12' },
        { main: '#0f766e', soft: 'rgba(15, 118, 110, 0.42)', glow: 'rgba(17, 94, 89, 0.56)', core: '#115e59' },
        { main: '#86198f', soft: 'rgba(134, 25, 143, 0.42)', glow: 'rgba(112, 26, 117, 0.56)', core: '#701a75' },
        { main: '#4d7c0f', soft: 'rgba(77, 124, 15, 0.42)', glow: 'rgba(63, 98, 18, 0.56)', core: '#3f6212' },
        { main: '#9d174d', soft: 'rgba(157, 23, 77, 0.42)', glow: 'rgba(131, 24, 67, 0.56)', core: '#831843' }
    ];

    const LINE_OPTIONS = [5];

    function activePaylines() {
        return paylines.slice(0, state.lines);
    }

    function normalizeLines(value) {
        const parsed = Number(value);
        return LINE_OPTIONS.includes(parsed) ? parsed : 5;
    }

    function buildReel5Strip() {
        const strip = Array(26).fill('mult0');
        strip[4] = 'mult1';
        strip[9] = 'mult2';
        strip[14] = 'mult1';
        strip[19] = 'mult2';
        strip[25] = 'mult3';
        return strip;
    }

    const MECHANICAL_REEL_STRIPS = [
        [
            'cireasa', 'cireasa', 'strugure', 'lamaie', 'lamaie', 'pepene', 'portocala', 'portocala',
            'sapte', 'pruna', 'pruna', 'pepene', 'cireasa', 'cireasa', 'strugure', 'lamaie',
            'lamaie', 'portocala', 'portocala', 'stea', 'pruna', 'pruna', 'pepene', 'cireasa',
            'cireasa', 'lamaie', 'lamaie', 'strugure', 'portocala', 'portocala', 'sapte', 'pruna',
            'pruna', 'pepene', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'portocala', 'portocala',
            'strugure', 'pruna', 'pruna', 'pepene', 'sapte', 'cireasa', 'cireasa', 'lamaie',
            'lamaie', 'portocala', 'strugure', 'strugure', 'pruna', 'pruna', 'strugure', 'pepene',
            'stea', 'pepene', 'pepene'
        ],
        [
            'lamaie', 'lamaie', 'pepene', 'cireasa', 'cireasa', 'strugure', 'portocala', 'portocala',
            'sapte', 'pruna', 'pruna', 'pepene', 'lamaie', 'lamaie', 'cireasa', 'cireasa',
            'portocala', 'portocala', 'strugure', 'pruna', 'pruna', 'pepene', 'lamaie', 'lamaie',
            'cireasa', 'cireasa', 'sapte', 'portocala', 'portocala', 'pruna', 'pruna', 'strugure',
            'lamaie', 'lamaie', 'pepene', 'cireasa', 'cireasa', 'portocala', 'portocala', 'pruna',
            'pruna', 'stea', 'strugure', 'lamaie', 'lamaie', 'pepene', 'cireasa', 'cireasa',
            'portocala', 'portocala', 'pruna', 'strugure', 'sapte', 'strugure', 'lamaie', 'lamaie',
            'strugure', 'pepene', 'pepene', 'pepene'
        ],
        [
            'portocala', 'portocala', 'strugure', 'pruna', 'pruna', 'pepene', 'cireasa', 'cireasa',
            'sapte', 'lamaie', 'lamaie', 'pepene', 'portocala', 'portocala', 'pruna', 'pruna',
            'strugure', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'pepene', 'portocala', 'portocala',
            'pruna', 'pruna', 'stea', 'strugure', 'cireasa', 'cireasa', 'lamaie', 'lamaie',
            'portocala', 'portocala', 'pepene', 'pruna', 'pruna', 'sapte', 'cireasa', 'cireasa',
            'lamaie', 'lamaie', 'portocala', 'portocala', 'strugure', 'pruna', 'pruna', 'pepene',
            'cireasa', 'cireasa', 'lamaie', 'lamaie', 'portocala', 'strugure', 'strugure', 'pruna',
            'pruna', 'sapte', 'pepene', 'pepene', 'pepene'
        ],
        [
            'pruna', 'pruna', 'pepene', 'portocala', 'portocala', 'strugure', 'lamaie', 'lamaie',
            'sapte', 'cireasa', 'cireasa', 'pepene', 'pruna', 'pruna', 'portocala', 'portocala',
            'lamaie', 'lamaie', 'strugure', 'cireasa', 'cireasa', 'pepene', 'pruna', 'pruna',
            'portocala', 'portocala', 'sapte', 'lamaie', 'lamaie', 'cireasa', 'cireasa', 'strugure',
            'pruna', 'pruna', 'pepene', 'portocala', 'portocala', 'lamaie', 'lamaie', 'stea',
            'cireasa', 'cireasa', 'pruna', 'pruna', 'strugure', 'portocala', 'portocala', 'pepene',
            'lamaie', 'lamaie', 'cireasa', 'cireasa', 'pruna', 'strugure', 'strugure', 'portocala',
            'portocala', 'sapte', 'pepene', 'pepene', 'pepene'
        ],
        buildReel5Strip()
    ];

    const SCATTER_REEL_INDEXES = new Set();
    const symbolsBase = new URL('symbols/', window.location.href);
    const soundsBase = new URL('sounds/', window.location.href);
    const PREMIUM_LINE_WIN_SYMBOLS = new Set(['sapte', 'pepene', 'strugure']);
    const SMALL_LINE_WIN_SYMBOLS = new Set(['cireasa', 'lamaie', 'portocala', 'pruna']);
    const sampleSoundVolumes = {
        bong: 0.3,
        linewin: 1,
        lose: 1,
        bomb: 0.88,
        win: 0.74
    };
    const sampleSoundFiles = {
        bong: 'bong.mp3',
        linewin: 'linewin.mp3',
        bomb: 'bomba.mp3',
        win: 'winsss.mp3',
        lose: '../../sounds/lose.mp3'
    };
    const sampleSoundCache = {};
    const fullSizeSymbols = new Set(['sapte', 'pepene', 'strugure', 'stea', 'mult0']);

    const STOP_TIMEOUT_MS = 5000;

    const LEGACY_SPEED_KEY = 'dodge_bomb_speed';

    function getGameSlug() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const gamesIdx = parts.indexOf('games');
        if (gamesIdx >= 0 && parts[gamesIdx + 1]) {
            return parts[gamesIdx + 1];
        }
        return 'dodge-bomb';
    }

    function getSpeedPreferenceKey() {
        return `skill_slot_speed:${getGameSlug()}`;
    }

    const STOP_ALL_REEL_DELAY_MS = 25;

    const SPEED_PROFILES = {
        normal: {
            stopTimeoutMs: 5000,
            reelScrollMult: 1,
            settleManual: { duration: 0, maxDuration: 0, instant: true },
            settleAuto: { duration: 90, maxDuration: 180 },
            reelStopDelay: 160,
            winLineDuration: 540,
            winLineGap: 90,
            winSymbolLead: 180,
            winScatterHold: 720,
            spinAutoStopDelay: 480
        },
        rapid: {
            stopTimeoutMs: 5000,
            reelScrollMult: 1.5,
            settleManual: { duration: 0, maxDuration: 0, instant: true },
            settleAuto: { duration: 52, maxDuration: 105 },
            reelStopDelay: 85,
            winLineDuration: 300,
            winLineGap: 45,
            winSymbolLead: 95,
            winScatterHold: 420,
            spinAutoStopDelay: 300
        },
        turbo: {
            stopTimeoutMs: 5000,
            reelScrollMult: 2.15,
            settleManual: { duration: 0, maxDuration: 0, instant: true },
            settleAuto: { duration: 32, maxDuration: 65 },
            reelStopDelay: 40,
            winLineDuration: 165,
            winLineGap: 28,
            winSymbolLead: 55,
            winScatterHold: 240,
            spinAutoStopDelay: 180
        }
    };

    const BET_BASE_VALUES = [0.1, 0.2, 0.5, 1, 2, 3, 4, 5];
    const MIN_TOTAL_BET = 5;
    const MAX_TOTAL_BET = 20;
    const state = {
        credits: 0,
        bet: 0.1,
        betBaseIndex: 0,
        lines: 5,
        speed: 'normal',
        soundEnabled: true,
        soundVolume: 100,
        spinning: false,
        sessionReady: true,
        playStopMode: false,
        manualStopReels: new Set(),
        stopAllUsed: false,
        skillStopSatisfied: false,
        autoStopAfterStart: false,
        autoStopping: false,
        finishingRound: false,
        roundBoard: null,
        roundStopIndexes: [null, null, null, null, null],
        stoppedReels: new Set(),
        sessionId: Number(params.get('session_id') || 0) || null,
        gameId: Number(params.get('game_id') || 1) || 1,
        winCycleId: 0,
        scatterPulseTimers: [],
        resolvedScatterCount: 0,
        halfBetOffer: {
            active: false,
            sessionId: null,
            gameId: null,
            betAmount: 0,
        },
        activeRound: null,
    };

    let audioCtx = null;
    const activeOscillators = [];

    function stopAllSounds() {
        Object.values(sampleSoundCache).forEach((audio) => {
            try {
                audio.pause();
                audio.currentTime = 0;
            } catch (error) {
            }
        });
        while (activeOscillators.length) {
            const osc = activeOscillators.pop();
            try {
                osc.stop();
                osc.disconnect();
            } catch (error) {
            }
        }
    }

    function renderInfoPages() {
        const track = $('#vergaInfoTrack');
        const C = window.IqwinTerminalInfoPagesContent;
        if (!track || !C) return;

        const paySymbolScale = {
            sapte: 1.1,
            stea: 1.1
        };

        track.innerHTML = C.compose([
            C.symbolsPage({
                brandTitle: 'Dodge the Bomb',
                layout: 'rows',
                cardLayout: 'stack',
                lead: 'Combina simboluri pe primele 4 role, de la stanga la dreapta. Multiplicatorii se aplica la <strong>pariul total (bet)</strong> al rotirii.',
                cards: [
                    ...paytableOrder.map((key) => C.renderPayCard({
                        imageSrc: symbolSrc(key),
                        alt: paytableLabels[key] || key,
                        label: paytableLabels[key] || key,
                        pays: paytable[key],
                        formatEntry: (count, multiplier) => `${count} - ${multiplier}x bet`,
                        symbolScale: paySymbolScale[key] || 1
                    })),
                    C.renderPayCard({
                        imageSrc: symbolSrc('mult0'),
                        alt: 'Bomba',
                        label: 'Rola 5',
                        wild: true,
                        symbolScale: 1.08,
                        notesLayout: 'spread',
                        notes: ['Bomba anuleaza linia', 'x1, x2, x3 inmultesc', 'Un singur multiplicator pe rola']
                    })
                ],
                extras: `<div class="terminal-info-pages__rules">${[
                    'Stea opreste evaluarea liniei. 3 sau mai multe Stele pe ecran declanseaza castig bonus.',
                    'Platile obisnuite se calculeaza doar pe rolele 1-4.'
                ].map((text) => `<p>${text}</p>`).join('')}</div>`
            }),
            C.linesPage({
                lead: '5 linii fixe de plata. Toate liniile sunt active la fiecare rotire.',
                paylines: activePaylines(),
                rules: [
                    'Castig = multiplicator x pariul total (bet). Pariul total = pariu pe linie x 5 linii fixe.',
                    'Rola 5 modifica castigul liniei (multiplicator sau bomba).',
                    '5 role, 5 linii fixe. Opreste manual fiecare rola pentru control maxim asupra rezultatului.',
                    'Doar cel mai mare castig este platit pe fiecare linie activa.'
                ],
                betLimits: C.getBetLimits({
                    betBaseValues: BET_BASE_VALUES,
                    minTotalBet: MIN_TOTAL_BET,
                    maxTotalBet: MAX_TOTAL_BET,
                    lineOptions: LINE_OPTIONS,
                    totalBetForBase,
                    formatBalanceNumber,
                    roundBet
                })
            }),
            C.miniGamePage({
                title: 'Mini-joc Aviator',
                lead: 'Dupa o rotire fara castig, poti incerca recuperarea partiala in mini-jocul Aviator.',
                badgeHtml: C.textBadge('Aviator', 'A'),
                paragraphs: [
                    'Multiplicatorul creste in timp real. Trebuie sa opresti pe verde inainte sa dispara sansa.',
                    'Daca opresti la momentul potrivit, primesti inapoi <strong>50% din pariul rotirii</strong> care a activat mini-jocul.',
                    'Dupa o rotire fara plata, butonul Aviator devine activ si poti deschide mini-jocul.'
                ]
            }),
            C.skillPage({
                gameTitle: 'Dodge the Bomb',
                lead: 'Dodge the Bomb nu este un joc de noroc. Rezultatul depinde de deciziile si abilitatile jucatorului.',
                mainCardText: 'Opresti manual fiecare rola. Momentul opririlor influenteaza direct combinatia finala si interactiunea cu rola 5.',
                miniCardTitle: 'Mini-joc Aviator',
                miniCardText: 'Recuperarea depinde de momentul in care alegi sa opresti, nu de un rezultat intamplator.',
                footerText: 'Nici jocul principal, nici mini-jocul nu se bazeaza pe sorte intamplatoare. Ambele tin de abilitatea jucatorului.'
            })
        ]);
        if (window.IqwinTopDisplaySync) {
            window.IqwinTopDisplaySync.publishInfoPages();
        }
    }

    let infoPagesController = null;

    function setInfoPopupOpen(open) {
        if (infoPagesController) {
            infoPagesController.setOpen(open);
            return;
        }
        const popup = $('#vergaInfoPopup');
        if (!popup) return;
        popup.classList.toggle('is-hidden', !open);
    }

    function delay(ms) {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    function getSpeedProfile() {
        return SPEED_PROFILES[state.speed] || SPEED_PROFILES.normal;
    }

    function getStopTimeoutMs() {
        return STOP_TIMEOUT_MS;
    }

    function getStopTimeoutSeconds() {
        return Math.max(1, Math.ceil(getStopTimeoutMs() / 1000));
    }

    function ensureAudio() {
        if (!window.AudioContext && !window.webkitAudioContext) {
            return null;
        }
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playTone(options = {}) {
        if (!state.soundEnabled) {
            return;
        }
        const ctx = ensureAudio();
        if (!ctx) {
            return;
        }

        const {
            frequency = 440,
            endFrequency = frequency,
            duration = 0.08,
            type = 'sine',
            gain = 0.08,
            delayTime = 0
        } = options;

        const start = ctx.currentTime + delayTime;
        const end = start + duration;
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, start);
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), end);
        amp.gain.setValueAtTime(0.0001, start);
        amp.gain.exponentialRampToValueAtTime(gain * getSoundVolumeMultiplier(), start + 0.01);
        amp.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(amp);
        amp.connect(ctx.destination);
        activeOscillators.push(osc);
        osc.onended = () => {
            const index = activeOscillators.indexOf(osc);
            if (index >= 0) activeOscillators.splice(index, 1);
        };
        osc.start(start);
        osc.stop(end + 0.02);
    }

    function playSampleSound(name) {
        if (!state.soundEnabled) {
            return;
        }

        const fileName = sampleSoundFiles[name];
        if (!fileName) {
            return;
        }

        ensureAudio();

        try {
            if (!sampleSoundCache[name]) {
                const audioUrl = fileName.includes('/')
                    ? new URL(fileName, window.location.href).href
                    : new URL(fileName, soundsBase).href;
                const audio = new Audio(audioUrl);
                audio.preload = 'auto';
                sampleSoundCache[name] = audio;
            }

            const audio = sampleSoundCache[name];
            audio.volume = (sampleSoundVolumes[name] ?? 1) * getSoundVolumeMultiplier();
            audio.currentTime = 0;
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        } catch (error) {
        }
    }

    function shouldPlayLineWinSound(win) {
        if (!win || win.line <= 0) {
            return false;
        }
        if (PREMIUM_LINE_WIN_SYMBOLS.has(win.symbol)) {
            return win.count >= 3;
        }
        if (SMALL_LINE_WIN_SYMBOLS.has(win.symbol)) {
            return win.count >= 4;
        }
        return false;
    }

    function hasLineWinSound(wins) {
        return (wins || []).some(shouldPlayLineWinSound);
    }

    function playGameSound(name) {
        if (!state.soundEnabled) {
            return;
        }

        if (name === 'spin') {
            playTone({ frequency: 180, endFrequency: 95, duration: 0.14, type: 'triangle', gain: 0.06 });
            playTone({ frequency: 320, endFrequency: 210, duration: 0.1, type: 'sine', gain: 0.04, delayTime: 0.03 });
            return;
        }

        if (name === 'stop') {
            playTone({ frequency: 520, endFrequency: 280, duration: 0.07, type: 'square', gain: 0.045 });
            playTone({ frequency: 140, endFrequency: 90, duration: 0.09, type: 'triangle', gain: 0.05 });
            return;
        }

        if (name === 'win') {
            playSampleSound('win');
            return;
        }

        if (name === 'bomb') {
            playSampleSound('bomb');
            return;
        }

        if (name === 'scatter') {
            playTone({ frequency: 620, endFrequency: 280, duration: 0.22, type: 'sine', gain: 0.09 });
            playTone({ frequency: 980, endFrequency: 520, duration: 0.16, type: 'triangle', gain: 0.06, delayTime: 0.04 });
            playTone({ frequency: 180, endFrequency: 95, duration: 0.28, type: 'sine', gain: 0.07, delayTime: 0.02 });
        }
    }

    function loadPreferences() {
        try {
            const speedKey = getSpeedPreferenceKey();
            let savedSpeed = localStorage.getItem(speedKey);
            if (!savedSpeed) {
                savedSpeed = localStorage.getItem(LEGACY_SPEED_KEY);
            }
            if (savedSpeed && SPEED_PROFILES[savedSpeed]) {
                state.speed = savedSpeed;
            }
            state.soundEnabled = localStorage.getItem('dodge_bomb_mute') !== '1';
            const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
            if (savedVolume !== null && savedVolume !== '') {
                state.soundVolume = Math.max(0, Math.min(100, Number(savedVolume) || 0));
                state.soundEnabled = state.soundVolume > 0;
            }
            state.playStopMode = localStorage.getItem('dodge_bomb_play_stop') === '1';
        } catch (error) {
        }
    }

    function saveSpeedPreference() {
        try {
            localStorage.setItem(getSpeedPreferenceKey(), state.speed);
            localStorage.setItem(LEGACY_SPEED_KEY, state.speed);
        } catch (error) {
        }
    }


    const VOLUME_STORAGE_KEY = 'iqwin_terminal_volume';

    function getSoundVolumeMultiplier() {
        if (!state.soundEnabled) {
            return 0;
        }
        return Math.max(0, Math.min(1, Number(state.soundVolume || 0) / 100));
    }

    function saveVolumePreference() {
        try {
            localStorage.setItem(VOLUME_STORAGE_KEY, String(Math.max(0, Math.min(100, Math.round(Number(state.soundVolume) || 0)))));
        } catch (error) {
        }
    }

    function saveSoundPreference() {
        try {
            localStorage.setItem('dodge_bomb_mute', state.soundEnabled ? '0' : '1');
        } catch (error) {
        }
    
        saveVolumePreference();
    }

    function savePlayStopPreference() {
        try {
            localStorage.setItem('dodge_bomb_play_stop', state.playStopMode ? '1' : '0');
        } catch (error) {
        }
    }

    function updateSpeedButtons() {
        settingsController?.refresh();
        const stopSeconds = getStopTimeoutSeconds();
        $$('.verga-stop-btn .verga-stop-seconds').forEach((node) => {
            if (!node.closest('.verga-stop-btn')?.classList.contains('is-stopped')) {
                node.textContent = String(stopSeconds);
            }
        });
    }

    let settingsController = null;

    function initSettingsMenu() {
        if (typeof IqwinTerminalSettings === 'undefined') {
            return;
        }
        settingsController = IqwinTerminalSettings.bind({
            getSpeed: () => state.speed,
            setSpeed: (speed) => {
                if (state.spinning || !SPEED_PROFILES[speed]) {
                    return;
                }
                state.speed = speed;
                saveSpeedPreference();
                ensureAudio();
                playTone({ frequency: 420, endFrequency: 520, duration: 0.06, type: 'triangle', gain: 0.04 });
            },
            speedOrder: ['normal', 'rapid', 'turbo'],
            getVolume: () => state.soundVolume,
            setVolume: (volume) => {
                state.soundVolume = Math.max(0, Math.min(100, Math.round(Number(volume) || 0)));
                state.soundEnabled = state.soundVolume > 0;
                saveSoundPreference();
            },
            setSoundEnabled: (enabled) => {
                state.soundEnabled = Boolean(enabled);
                if (!state.soundEnabled) {
                    state.soundVolume = 0;
                } else if (state.soundVolume <= 0) {
                    state.soundVolume = 100;
                }
                saveSoundPreference();
            },
            isLocked: () => state.spinning,
            onSpeedChange: () => {
                updateSpeedButtons();
            }
        });
    }

    function updatePreferenceControls() {
        updateSpeedButtons();
        updateSpinModeToggle();
        updateSpinButton();
    }

    function updateSpinModeToggle() {
        const btn = $('#spinModeToggle');
        if (!btn) return;

        const active = state.playStopMode;
        btn.textContent = active ? 'NM' : 'PS';
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.disabled = state.spinning;
        if (active) {
            btn.setAttribute('aria-label', 'Mod normal');
            btn.setAttribute('title', 'Mod normal');
        } else {
            btn.setAttribute('aria-label', 'Play + Stop automat');
            btn.setAttribute('title', 'Play + Stop automat');
        }
    }

    function symbolSrc(key) {
        if (isMultiplierSymbol(key) && !isBombSymbol(key)) {
            return '';
        }
        return new URL(symbolFiles[key] || 'cireasa.webp', symbolsBase).href;
    }

    function symbolMultiplier(key) {
        const match = String(key || '').match(/^mult(\d+)$/);
        return match ? Math.max(0, Number(match[1])) : 1;
    }

    function buildMultiplierToken(symbol) {
        const token = document.createElement('span');
        token.className = 'db-multiplier-token';
        token.textContent = multiplierLabels[symbol] || '';
        return token;
    }

    function syncReelFiveSymbolSize(container, widthHint) {
        if (!container) return;
        const reel = container.closest('.boss-crown-reel');
        if (!reel || reel.dataset.reel !== '4') return;
        if (!container.classList.contains('boss-crown-cell') && !container.classList.contains('boss-crown-spin-strip-item')) return;
        const cellWidth = Math.round(widthHint || container.getBoundingClientRect().width || container.clientWidth);
        if (cellWidth < 8) return;
        const size = Math.max(42, Math.round(cellWidth * 0.82));
        const fontSize = Math.max(16, Math.round(size * 0.4));
        const token = container.querySelector('.db-multiplier-token');
        if (token) {
            token.style.setProperty('width', `${size}px`, 'important');
            token.style.setProperty('height', `${size}px`, 'important');
            token.style.setProperty('max-width', `${size}px`, 'important');
            token.style.setProperty('max-height', `${size}px`, 'important');
            token.style.setProperty('font-size', `${fontSize}px`, 'important');
        }
        const image = container.querySelector('img');
        if (image && container.classList.contains('is-bomb-symbol')) {
            image.style.setProperty('width', `${size}px`, 'important');
            image.style.setProperty('height', `${size}px`, 'important');
            image.style.setProperty('max-width', `${size}px`, 'important');
            image.style.setProperty('max-height', `${size}px`, 'important');
        }
    }

    function syncAllReelFiveSymbolSizes() {
        $$('.boss-crown-reel[data-reel="4"] .boss-crown-cell').forEach((cell) => syncReelFiveSymbolSize(cell));
    }

    function resolveReelIndex(container, reelIndexHint) {
        if (reelIndexHint !== null && reelIndexHint !== undefined) {
            return Number(reelIndexHint);
        }
        return Number(container?.closest('.boss-crown-reel')?.dataset.reel);
    }

    function isReelFiveContainer(container, reelIndexHint) {
        return resolveReelIndex(container, reelIndexHint) === MULTIPLIER_REEL;
    }

    function syncReelFiveStripSizes(reel) {
        if (!reel || reel.dataset.reel !== '4') return;
        const strip = reel.querySelector('.boss-crown-spin-strip');
        if (!strip) return;
        const fallbackWidth = Math.round(reel.getBoundingClientRect().width);
        strip.querySelectorAll('.boss-crown-spin-strip-item').forEach((item) => {
            const width = Math.round(item.getBoundingClientRect().width) || fallbackWidth;
            if (width >= 8) syncReelFiveSymbolSize(item, width);
        });
    }

    function syncReelFiveCellsFromStrip(reelNode, stopIndex) {
        if (!reelNode) return;
        const strip = reelNode.querySelector('.boss-crown-spin-strip');
        if (!strip || stopIndex === null) {
            syncAllReelFiveSymbolSizes();
            return;
        }
        [0, 1, 2].forEach((row) => {
            const cell = $(`[data-position="4-${row}"]`);
            const stripItem = strip.children[stopIndex + row];
            const width = Math.round(stripItem?.getBoundingClientRect().width || cell?.getBoundingClientRect().width || 0);
            if (cell && width >= 8) {
                syncReelFiveSymbolSize(cell, width);
            }
        });
    }

    function symbolLabel(key) {
        if (isBombSymbol(key)) return 'BOMB';
        if (isMultiplierSymbol(key)) return (multiplierLabels[key] || key).toUpperCase();
        if (key === 'sapte') return 'DIAMANT';
        return (paytableLabels[key] || key).toUpperCase();
    }

    function setStripItemSymbol(item, key, reelIndexHint) {
        item.dataset.symbol = key;
        item.dataset.symbolLabel = symbolLabel(key);
        item.classList.toggle('is-multiplier-symbol', isMultiplierSymbol(key) && !isBombSymbol(key));
        item.classList.toggle('is-bomb-symbol', isBombSymbol(key));
        item.querySelector('.db-multiplier-token')?.remove();
        item.querySelector('img')?.remove();

        if (isBombSymbol(key)) {
            const image = document.createElement('img');
            image.src = symbolSrc(key);
            image.alt = 'bomb';
            image.dataset.symbol = key;
            item.append(image);
            applyUniformCellStyle(item, reelIndexHint);
            applyUniformImageStyle(image, reelIndexHint);
            return;
        }

        if (isMultiplierSymbol(key)) {
            item.append(buildMultiplierToken(key));
            applyUniformCellStyle(item, reelIndexHint);
            return;
        }

        const image = document.createElement('img');
        image.src = symbolSrc(key);
        image.alt = paytableLabels[key] || key;
        image.dataset.symbol = key;
        item.append(image);
        applyUniformImageStyle(image, reelIndexHint);
    }

    function formatAmount(value) {
        return Number(value || 0).toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function formatBetNumber(value) {
        return Number(value || 0).toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    function formatBalanceNumber(value) {
        return Number(value || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function roundBet(value) {
        return Math.round((Number(value) || 0) * 100) / 100;
    }

    function toDisplayCredits(serverCredits) {
        var display = window.IqwinTerminalCreditsDisplay;
        if (display && typeof display.moneyForCredits === 'function') {
            return roundBet(display.moneyForCredits(serverCredits));
        }
        return roundBet(Number(serverCredits) || 0);
    }

    function isBetBaseAllowed(basePerLine) {
        const total = totalBetForBase(basePerLine);
        if (total < MIN_TOTAL_BET || total > MAX_TOTAL_BET) {
            return false;
        }
        if (typeof IqwinTerminalBetButtons !== 'undefined'
            && IqwinTerminalBetButtons.isTotalBetLeiBlockedForLines(total, state.lines)) {
            return false;
        }
        return true;
    }

    function getBetBaseValues() {
        return BET_BASE_VALUES.filter(isBetBaseAllowed);
    }

    function resolveBetBaseIndex() {
        const values = getBetBaseValues();
        if (!values.length) {
            state.betBaseIndex = BET_BASE_VALUES.length - 1;
            state.bet = BET_BASE_VALUES[state.betBaseIndex];
            return;
        }
        const current = roundBet(state.bet);
        let idx = values.findIndex((value) => roundBet(value) === current);
        if (idx < 0) {
            idx = values.findIndex((value) => roundBet(value) > current);
            if (idx < 0) idx = 0;
        }
        state.betBaseIndex = idx;
        syncEffectiveBet();
    }

    function clampBetBaseIndex() {
        const values = getBetBaseValues();
        state.betBaseIndex = Math.max(0, Math.min(values.length - 1, state.betBaseIndex));
    }

    function getCurrentBetBase() {
        const values = getBetBaseValues();
        clampBetBaseIndex();
        return values[state.betBaseIndex] ?? values[0] ?? 1;
    }

    function calcLinePayout(baseMultiplier, winMultiplier = 1) {
        return calcWinPayout(Number(baseMultiplier || 0) * Number(winMultiplier || 1));
    }

    function calcWinPayout(multiplier) {
        const payout = roundBet(totalBetAmount() * (Number(multiplier) || 0));
        return payout > 0 ? payout : 0;
    }

    function syncEffectiveBet() {
        state.bet = roundBet(getCurrentBetBase());
    }

    let betButtonsController = null;

    function initBetButtons() {
        if (typeof IqwinTerminalBetButtons === 'undefined') return;
        betButtonsController = IqwinTerminalBetButtons.create({
            getValues: getBetBaseValues,
            getIndex: () => state.betBaseIndex,
            setIndex: (index) => {
                state.betBaseIndex = index;
                syncEffectiveBet();
            },
            isLocked: () => state.spinning,
            formatValue: formatBetNumber,
            getDisplayValue: (baseValue) => totalBetForBase(baseValue),
            onChange: updateBetLabel
        });
        betButtonsController.bind();
    }

    function updateBetStepperUI(renderOptions) {
        syncEffectiveBet();
        betButtonsController?.render(renderOptions);
    }

    function applyUniformCellStyle(cell, reelIndexHint) {
        if (!cell) return;
        cell.style.removeProperty('background-color');
        const isReelFive = isReelFiveContainer(cell, reelIndexHint);
        const symbol = cell.dataset.symbol || cell.querySelector('img')?.dataset.symbol || '';
        const isBombCell = isBombSymbol(symbol) || cell.classList.contains('is-bomb-symbol');
        const isMultiplierCell = (!isBombCell && isMultiplierSymbol(symbol)) || cell.classList.contains('is-multiplier-symbol');
        if (isReelFive && (isBombCell || isMultiplierCell)) {
            cell.style.setProperty('display', 'flex', 'important');
            cell.style.setProperty('align-items', 'center', 'important');
            cell.style.setProperty('justify-content', 'center', 'important');
            cell.style.setProperty('position', 'relative', 'important');
            cell.style.setProperty('overflow', 'visible', 'important');
            cell.style.removeProperty('place-items');
            cell.style.removeProperty('align-content');
            return;
        }
        cell.style.setProperty('overflow', 'hidden', 'important');
        if (isBombCell || isMultiplierCell) {
            cell.style.setProperty('display', 'grid', 'important');
            cell.style.setProperty('place-items', 'center', 'important');
            cell.style.setProperty('align-content', 'center', 'important');
            cell.style.setProperty('justify-content', 'center', 'important');
            cell.style.setProperty('position', 'relative', 'important');
            cell.style.setProperty('overflow', 'visible', 'important');
        } else {
            cell.style.setProperty('display', 'block', 'important');
            cell.style.removeProperty('place-items');
            cell.style.removeProperty('align-content');
            cell.style.removeProperty('justify-content');
        }
    }

    function applyUniformImageStyle(image, reelIndexHint) {
        if (!image) return;
        const parent = image.closest('.boss-crown-cell, .boss-crown-spin-strip-item');
        const isReelFive = isReelFiveContainer(parent, reelIndexHint);
        const symbol = image.dataset.symbol || '';
        const isBomb = isBombSymbol(symbol);
        if (isReelFive && isBomb) {
            image.style.setProperty('object-fit', 'contain', 'important');
            image.style.setProperty('display', 'block', 'important');
            image.style.setProperty('object-position', 'center center', 'important');
            image.style.setProperty('margin', '0', 'important');
            image.style.removeProperty('width');
            image.style.removeProperty('height');
            image.style.removeProperty('max-width');
            image.style.removeProperty('max-height');
            return;
        }
        const size = isBomb ? '88%' : '100%';
        image.style.setProperty('width', size, 'important');
        image.style.setProperty('height', size, 'important');
        image.style.setProperty('max-width', isBomb ? size : 'none', 'important');
        image.style.setProperty('max-height', isBomb ? size : 'none', 'important');
        image.style.setProperty('object-fit', isBomb ? 'contain' : 'fill', 'important');
        image.style.setProperty('display', 'block', 'important');
        if (isBomb) {
            image.style.setProperty('object-position', 'center center', 'important');
            image.style.setProperty('margin', '0', 'important');
        } else {
            image.style.removeProperty('object-position');
            image.style.removeProperty('margin');
            image.style.removeProperty('max-width');
            image.style.removeProperty('max-height');
        }
    }

    function applyUniformStyles() {
        $$('.boss-crown-reel').forEach((reel) => {
            reel.style.setProperty('background', 'transparent', 'important');
            reel.style.setProperty('box-shadow', 'none', 'important');
        });
        $$('.boss-crown-cell, .boss-crown-spin-strip-item').forEach(applyUniformCellStyle);
        $$('.boss-crown-cell img, .boss-crown-spin-strip-item img').forEach((image) => {
            const parent = image.closest('.boss-crown-cell, .boss-crown-spin-strip-item');
            if (parent?.classList.contains('is-multiplier-symbol')) return;
            applyUniformImageStyle(image);
        });
    }

    function setCellSymbol(cell, key) {
        if (!cell) return;

        cell.dataset.symbol = key;
        cell.dataset.symbolLabel = symbolLabel(key);
        cell.classList.toggle('is-multiplier-symbol', isMultiplierSymbol(key) && !isBombSymbol(key));
        cell.classList.toggle('is-bomb-symbol', isBombSymbol(key));

        if (isBombSymbol(key)) {
            cell.querySelector('.db-multiplier-token')?.remove();
            let image = cell.querySelector('img');
            if (!image) {
                image = document.createElement('img');
                image.loading = 'eager';
                cell.append(image);
            }
            const nextSrc = symbolSrc(key);
            image.dataset.symbol = key;
            if (image.getAttribute('src') !== nextSrc) {
                image.src = nextSrc;
            }
            image.alt = 'bomb';
            applyUniformCellStyle(cell);
            applyUniformImageStyle(image);
            return;
        }

        if (isMultiplierSymbol(key)) {
            cell.querySelector('img')?.remove();
            let token = cell.querySelector('.db-multiplier-token');
            const label = multiplierLabels[key] || '';
            if (!token) {
                token = buildMultiplierToken(key);
                cell.append(token);
            } else {
                token.textContent = label;
            }
            applyUniformCellStyle(cell);
            return;
        }

        cell.querySelector('.db-multiplier-token')?.remove();
        let image = cell.querySelector('img');
        if (!image) {
            image = document.createElement('img');
            image.loading = 'eager';
            cell.append(image);
        }
        image.dataset.symbol = key;
        image.src = symbolSrc(key);
        image.alt = paytableLabels[key] || key;
        applyUniformCellStyle(cell);
        applyUniformImageStyle(image);
    }

    function getMechanicalReelStrip(reelIndex) {
        return MECHANICAL_REEL_STRIPS[reelIndex] || MECHANICAL_REEL_STRIPS[0];
    }

    function readMechanicalColumn(reelIndex, stopIndex) {
        const strip = getMechanicalReelStrip(reelIndex);
        const top = ((stopIndex % strip.length) + strip.length) % strip.length;
        return [0, 1, 2].map((row) => strip[(top + row) % strip.length]);
    }

    function randomReelColumn(reelIndex) {
        const strip = getMechanicalReelStrip(reelIndex);
        const stopIndex = Math.floor(Math.random() * strip.length);
        return readMechanicalColumn(reelIndex, stopIndex);
    }

    function createEmptyRoundBoard() {
        return Array.from({ length: 5 }, () => null);
    }

    function columnsMatch(left, right) {
        if (!Array.isArray(left) || !Array.isArray(right) || left.length !== 3 || right.length !== 3) {
            return false;
        }
        return left[0] === right[0] && left[1] === right[1] && left[2] === right[2];
    }

    function findStopIndexForColumn(reelIndex, column, preferred = null) {
        if (!Array.isArray(column) || column.length !== 3) {
            return null;
        }
        const strip = getMechanicalReelStrip(reelIndex);
        const matches = [];
        for (let stopIndex = 0; stopIndex < strip.length; stopIndex += 1) {
            if (columnsMatch(readMechanicalColumn(reelIndex, stopIndex), column)) {
                matches.push(stopIndex);
            }
        }
        if (!matches.length) {
            return null;
        }
        if (preferred !== null && preferred !== undefined) {
            const normalizedPreferred = normalizeStopIndex(reelIndex, preferred);
            if (matches.includes(normalizedPreferred)) {
                return normalizedPreferred;
            }
            return matches.reduce((best, candidate) => (
                Math.abs(candidate - normalizedPreferred) < Math.abs(best - normalizedPreferred) ? candidate : best
            ));
        }
        return matches[0];
    }

    function normalizeStopIndex(reelIndex, stopIndex) {
        const strip = getMechanicalReelStrip(reelIndex);
        const length = strip.length;
        if (!Number.isFinite(stopIndex)) {
            return null;
        }
        return ((Math.round(stopIndex) % length) + length) % length;
    }

    function readBoardFromVisibleCells() {
        const board = createEmptyRoundBoard();
        let complete = true;
        for (let reelIndex = 0; reelIndex < 5; reelIndex += 1) {
            const column = [0, 1, 2].map((row) => {
                const image = document.querySelector(`[data-position="${reelIndex}-${row}"] img`);
                const symbol = image?.dataset?.symbol;
                if (!symbol) {
                    complete = false;
                    return null;
                }
                return symbol;
            });
            if (column.some((symbol) => !symbol)) {
                complete = false;
            }
            board[reelIndex] = column;
        }
        return complete ? board : null;
    }

    function resolveMissingStopIndexes(sourceBoard = state.roundBoard) {
        for (let reelIndex = 0; reelIndex < 5; reelIndex += 1) {
            const column = sourceBoard?.[reelIndex];
            const current = state.roundStopIndexes[reelIndex];
            if (column) {
                const preferred = (current !== null && current !== undefined) ? current : null;
                const resolved = findStopIndexForColumn(reelIndex, column, preferred);
                if (resolved !== null) {
                    state.roundStopIndexes[reelIndex] = resolved;
                    continue;
                }
            }
            if (current !== null && current !== undefined) {
                state.roundStopIndexes[reelIndex] = normalizeStopIndex(reelIndex, current);
            }
        }
    }

    function buildRoundBoardFromStopIndexes() {
        const board = createEmptyRoundBoard();
        for (let reelIndex = 0; reelIndex < 5; reelIndex += 1) {
            const stopIndex = state.roundStopIndexes[reelIndex];
            if (stopIndex === null || stopIndex === undefined) {
                return null;
            }
            board[reelIndex] = readMechanicalColumn(reelIndex, stopIndex);
        }
        return board;
    }

    function reconcileAllRoundStops() {
        const visibleBoard = readBoardFromVisibleCells();
        for (let reelIndex = 0; reelIndex < 5; reelIndex += 1) {
            let column = state.roundBoard?.[reelIndex];
            if (!Array.isArray(column) || column.some((symbol) => !symbol)) {
                column = visibleBoard?.[reelIndex] || null;
            }
            if (!Array.isArray(column) || column.some((symbol) => !symbol)) {
                continue;
            }
            const preferred = state.roundStopIndexes[reelIndex];
            const resolved = findStopIndexForColumn(reelIndex, column, preferred);
            if (resolved === null) {
                continue;
            }
            state.roundStopIndexes[reelIndex] = resolved;
            if (!state.roundBoard) {
                state.roundBoard = createEmptyRoundBoard();
            }
            state.roundBoard[reelIndex] = readMechanicalColumn(reelIndex, resolved);
        }
    }

    function finalizeRoundState() {
        reconcileAllRoundStops();

        const boardFromStops = buildRoundBoardFromStopIndexes();
        if (boardFromStops && state.roundStopIndexes.every((stopIndex) => stopIndex !== null && stopIndex !== undefined)) {
            state.roundBoard = boardFromStops;
        }
    }

    function hasCompleteRoundStops() {
        return state.roundStopIndexes.every((stopIndex, reelIndex) => {
            if (stopIndex === null || stopIndex === undefined) {
                return false;
            }
            const column = state.roundBoard?.[reelIndex];
            if (!column) {
                return false;
            }
            return columnsMatch(readMechanicalColumn(reelIndex, stopIndex), column);
        });
    }

    let autoStopChain = Promise.resolve();

    function freezeReelOnStop(reelIndex) {
        const reelNode = $(`.boss-crown-reel[data-reel="${reelIndex}"]`);
        if (!reelNode) return;
        stopStripScroll(reelNode);
        reelNode.classList.add('is-reel-freezing');
    }

    function freezeAllSpinningReels() {
        [0, 1, 2, 3, 4].forEach((reelIndex) => {
            if (state.stoppedReels.has(reelIndex)) return;
            const reelNode = $(`.boss-crown-reel[data-reel="${reelIndex}"]`);
            if (!reelNode?.classList.contains('is-spinning')) return;
            freezeReelOnStop(reelIndex);
        });
    }

    async function waitForRevealsIdle(maxMs = 8000) {
        const deadline = Date.now() + maxMs;
        while (Date.now() < deadline) {
            if (!state.spinning) return;
            if (revealingReels.size === 0) return;
            await delay(16);
        }
    }

    async function waitForAllReelsSettled(maxMs = 12000) {
        const deadline = Date.now() + maxMs;
        while (Date.now() < deadline) {
            if (!state.spinning) return;
            if (state.stoppedReels.size >= 5 && revealingReels.size === 0) {
                return;
            }
            await delay(32);
        }
    }

    const stripScrollLoops = new WeakMap();
    const STRIP_LOOP_TAIL = 3;

    function removeSpinStrip(reel) {
        stopStripScroll(reel);
        reel?.querySelector('.boss-crown-spin-strip')?.remove();
    }

    function clearSpinStrip(reel) {
        removeSpinStrip(reel);
        reel?.classList.remove('is-reel-settling', 'is-spinning');
    }

    function stopStripScroll(reel) {
        const loop = stripScrollLoops.get(reel);
        if (!loop) return;
        loop.cancelled = true;
        if (loop.frameId) cancelAnimationFrame(loop.frameId);
        const strip = reel.querySelector('.boss-crown-spin-strip');
        if (strip) {
            strip.style.transform = `translate3d(0, ${-loop.offset}px, 0)`;
        }
        stripScrollLoops.delete(reel);
    }

    function prepareReelStripSymbols(reelIndex) {
        const base = getMechanicalReelStrip(reelIndex).slice();
        const loopTail = base.slice(0, STRIP_LOOP_TAIL);
        return {
            symbols: base.concat(loopTail),
            spinLength: base.length
        };
    }

    function readStripOffset(strip, reel) {
        const loop = stripScrollLoops.get(reel);
        if (loop) return loop.offset;
        const match = strip.style.transform.match(/,\s*(-?[\d.]+)px/);
        return match ? Math.abs(parseFloat(match[1])) : 0;
    }

    function getStripRowHeight(strip) {
        const firstItem = strip?.children?.[0];
        if (!firstItem) return 0;
        return firstItem.getBoundingClientRect().height;
    }

    async function waitForStripRowHeight(strip, attempts = 8) {
        for (let attempt = 0; attempt < attempts; attempt += 1) {
            const rowHeight = getStripRowHeight(strip);
            if (rowHeight > 0) {
                return rowHeight;
            }
            await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        return 0;
    }

    function readSettledColumnFromStrip(reelNode, reelIndex) {
        const strip = reelNode.querySelector('.boss-crown-spin-strip');
        if (!strip || !strip.children.length) return null;

        const rowHeight = getStripRowHeight(strip);
        if (rowHeight <= 0) return null;

        const spinLength = Number(strip.dataset.spinLength) || getMechanicalReelStrip(reelIndex).length;
        let spinStopIndex = null;
        if (strip.dataset.resolvedStopIndex !== undefined && strip.dataset.resolvedStopIndex !== '') {
            spinStopIndex = ((Number(strip.dataset.resolvedStopIndex) % spinLength) + spinLength) % spinLength;
        } else {
            let offset = readStripOffset(strip, reelNode);
            const loopHeight = rowHeight * spinLength;
            while (offset >= loopHeight) offset -= loopHeight;
            spinStopIndex = ((Math.floor(offset / rowHeight) % spinLength) + spinLength) % spinLength;
        }

        const column = [0, 1, 2].map((row) => {
            const child = strip.children[spinStopIndex + row];
            return child?.querySelector('img')?.dataset?.symbol || null;
        });
        if (column.some((symbol) => !symbol)) {
            return null;
        }

        const resolved = findStopIndexForColumn(reelIndex, column, spinStopIndex);
        if (resolved === null) {
            return null;
        }

        return {
            stopIndex: resolved,
            column: readMechanicalColumn(reelIndex, resolved)
        };
    }

    function readReelStopIndex(reelNode, reelIndex) {
        const strip = reelNode.querySelector('.boss-crown-spin-strip');
        if (!strip || !strip.children.length) return null;

        if (strip.dataset.resolvedStopIndex !== undefined && strip.dataset.resolvedStopIndex !== '') {
            return normalizeStopIndex(reelIndex, Number(strip.dataset.resolvedStopIndex));
        }

        const rowHeight = getStripRowHeight(strip);
        if (rowHeight <= 0) return null;

        const spinLength = Number(strip.dataset.spinLength) || getMechanicalReelStrip(reelIndex).length;
        const loopHeight = rowHeight * spinLength;
        let offset = readStripOffset(strip, reelNode);
        while (offset >= loopHeight) offset -= loopHeight;

        const topIndex = Math.round(offset / rowHeight);
        return normalizeStopIndex(reelIndex, topIndex);
    }

    function readReelOutcomeFromStrip(reelNode, reelIndex) {
        let stopIndex = readReelStopIndex(reelNode, reelIndex);
        const strip = reelNode.querySelector('.boss-crown-spin-strip');
        if (stopIndex === null && strip?.dataset.resolvedStopIndex !== undefined && strip.dataset.resolvedStopIndex !== '') {
            stopIndex = normalizeStopIndex(reelIndex, Number(strip.dataset.resolvedStopIndex));
        }
        if (stopIndex === null) {
            stopIndex = 0;
        }
        return readMechanicalColumn(reelIndex, stopIndex);
    }

    function settleReelToNearestRow(reelNode, profile = 'manual') {
        const strip = reelNode.querySelector('.boss-crown-spin-strip');
        if (!strip) return Promise.resolve();

        stopStripScroll(reelNode);

        if (!strip.children.length) return Promise.resolve();

        return (async () => {
            let rowHeight = getStripRowHeight(strip);
            if (rowHeight <= 0) {
                rowHeight = await waitForStripRowHeight(strip, profile === 'manual' ? 2 : 8);
            }
            if (rowHeight <= 0) return;

            const spinLength = Number(strip.dataset.spinLength) || getMechanicalReelStrip(Number(reelNode.dataset.reel || 0)).length;
            const loopHeight = rowHeight * spinLength;

            let current = readStripOffset(strip, reelNode);
            while (current >= loopHeight) current -= loopHeight;

            const from = current;
            const to = profile === 'auto'
                ? Math.floor(current / rowHeight) * rowHeight
                : Math.round(current / rowHeight) * rowHeight;
            const presets = {
                manual: getSpeedProfile().settleManual,
                auto: getSpeedProfile().settleAuto
            };
            const preset = presets[profile] || presets.manual;
            const travelRows = Math.max(0, Math.abs(to - from) / rowHeight);
            const reelIndex = Number(reelNode.dataset.reel || 0);
            const spinStopIndex = ((Math.floor(to / rowHeight) % spinLength) + spinLength) % spinLength;

            const applySettledPosition = () => {
                strip.style.transform = `translate3d(0, ${-to}px, 0)`;
                strip.dataset.resolvedStopIndex = String(spinStopIndex);
            };

            if (preset.instant || preset.duration <= 0) {
                applySettledPosition();
                return;
            }

            let settleDuration = Math.max(preset.duration, 50 + travelRows * 14);
            if (preset.maxDuration) settleDuration = Math.min(settleDuration, preset.maxDuration);

            await new Promise((resolve) => {
                const start = performance.now();
                const step = (now) => {
                    const progress = Math.min(1, (now - start) / settleDuration);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const value = from + (to - from) * eased;
                    strip.style.transform = `translate3d(0, ${-value}px, 0)`;
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        applySettledPosition();
                        resolve();
                    }
                };
                requestAnimationFrame(step);
            });
        })();
    }

    function startStripScroll(reel, reelIndex) {
        stopStripScroll(reel);
        const strip = reel.querySelector('.boss-crown-spin-strip');
        if (!strip) return;

        const loop = {
            cancelled: false,
            frameId: 0,
            offset: 0,
            lastTime: 0,
            speed: window.IqwinTerminalReelSpeed.getReelSpinScrollSpeed(reelIndex, getSpeedProfile().reelScrollMult)
        };
        stripScrollLoops.set(reel, loop);

        const spinLength = Number(strip.dataset.spinLength) || getMechanicalReelStrip(reelIndex).length;

        const frame = (now) => {
            if (loop.cancelled || !reel.classList.contains('is-spinning')) {
                stopStripScroll(reel);
                return;
            }
            if (!loop.lastTime) {
                loop.lastTime = now;
                const firstItem = strip.children[0];
                const rowHeight = firstItem?.getBoundingClientRect().height || 0;
                if (rowHeight > 0) {
                    loop.offset = Math.random() * rowHeight * spinLength * 0.85;
                }
            }
            const dt = Math.min(0.05, (now - loop.lastTime) / 1000);
            loop.lastTime = now;

            const firstItem = strip.children[0];
            if (!firstItem) {
                loop.frameId = requestAnimationFrame(frame);
                return;
            }
            const rowHeight = firstItem.getBoundingClientRect().height;
            if (rowHeight <= 0) {
                loop.frameId = requestAnimationFrame(frame);
                return;
            }

            loop.offset += rowHeight * loop.speed * dt;
            const loopHeight = rowHeight * spinLength;
            while (loop.offset >= loopHeight) {
                loop.offset -= loopHeight;
            }
            strip.style.transform = `translate3d(0, ${-loop.offset}px, 0)`;
            loop.frameId = requestAnimationFrame(frame);
        };

        loop.frameId = requestAnimationFrame(frame);
    }

    function createSpinStrip(reel, reelIndex) {
        removeSpinStrip(reel);
        const strip = document.createElement('div');
        strip.className = 'boss-crown-spin-strip';
        const prepared = prepareReelStripSymbols(reelIndex);
        const symbols = prepared.symbols;

        strip.dataset.spinLength = String(prepared.spinLength);
        strip.style.setProperty('--verga-strip-rows', String(symbols.length));
        strip.style.height = `calc(${symbols.length} * (100% / 3))`;
        strip.style.gridTemplateRows = `repeat(${symbols.length}, calc(100% / ${symbols.length}))`;

        symbols.forEach((symbol) => {
            const item = document.createElement('div');
            item.className = 'boss-crown-spin-strip-item';
            applyUniformCellStyle(item, reelIndex);
            setStripItemSymbol(item, symbol, reelIndex);
            strip.append(item);
        });

        reel.append(strip);
        if (reelIndex === MULTIPLIER_REEL) {
            requestAnimationFrame(() => {
                syncReelFiveStripSizes(reel);
                requestAnimationFrame(() => syncReelFiveStripSizes(reel));
            });
        }
        requestAnimationFrame(() => startStripScroll(reel, reelIndex));
    }

    const timers = {
        autoStop: null,
        countdown: null,
        quickAutoStop: null
    };

    function clearStopTimers() {
        if (timers.autoStop) window.clearTimeout(timers.autoStop);
        if (timers.countdown) window.clearInterval(timers.countdown);
        if (timers.quickAutoStop) window.clearTimeout(timers.quickAutoStop);
        timers.autoStop = null;
        timers.countdown = null;
        timers.quickAutoStop = null;
    }

    function resetStopButtonVisuals(btn) {
        if (!btn) return;
        btn.classList.remove('is-counting', 'is-stopped');
        const seconds = btn.querySelector('.verga-stop-seconds');
        if (seconds) {
            seconds.textContent = String(getStopTimeoutSeconds());
            seconds.removeAttribute('aria-hidden');
        }
    }

    function setStopSecondPhase(secs) {
        const stops = $('#reelStops');
        if (!stops) return;
        stops.classList.remove('is-stop-sec-5', 'is-stop-sec-4', 'is-stop-sec-3', 'is-stop-sec-2', 'is-stop-sec-1');
        if (secs >= 5) stops.classList.add('is-stop-sec-5');
        else if (secs === 4) stops.classList.add('is-stop-sec-4');
        else if (secs === 3) stops.classList.add('is-stop-sec-3');
        else if (secs === 2) stops.classList.add('is-stop-sec-2');
        else if (secs === 1) stops.classList.add('is-stop-sec-1');
    }

    function clearStopSecondPhase() {
        $('#reelStops')?.classList.remove('is-stop-sec-5', 'is-stop-sec-4', 'is-stop-sec-3', 'is-stop-sec-2', 'is-stop-sec-1');
    }

    function setStopCountdownActive(active) {
        const stops = $('#reelStops');
        stops?.classList.toggle('is-countdown-active', active);
        if (!active) clearStopSecondPhase();
    }

function runStopCountdownPhase(timeoutMs) {
        const deadline = Date.now() + timeoutMs;
        const stops = $('#reelStops');
        const initialSeconds = getStopTimeoutSeconds();

        $$('.verga-stop-btn').forEach((btn) => {
            if (btn.classList.contains('is-stopped')) return;
            btn.classList.add('is-counting');
        });

        if (stops) {
            stops.style.setProperty('--verga-stop-countdown-duration', timeoutMs + 'ms');
            stops.offsetHeight;
            setStopCountdownActive(true);
            setStopSecondPhase(initialSeconds);
        }

        const tick = () => {
            const left = Math.max(0, deadline - Date.now());
            const secs = Math.max(0, Math.ceil(left / 1000));
            setStopSecondPhase(secs);
            $$('.verga-stop-btn').forEach((btn) => {
                if (btn.classList.contains('is-stopped')) return;
                const node = btn.querySelector('.verga-stop-seconds');
                if (node) node.textContent = String(secs);
            });
            if (left <= 0 && timers.countdown) {
                window.clearInterval(timers.countdown);
                timers.countdown = null;
            }
        };

        tick();
        timers.countdown = window.setInterval(tick, 50);

        timers.autoStop = window.setTimeout(() => {
            playSampleSound('lose');
            autoStopAllReels();
        }, timeoutMs);
    }

    function startStopCountdown({ enableButtons = true } = {}) {
        clearStopTimers();
        const timeoutMs = getStopTimeoutMs();

        setStopCountdownActive(false);
        $$('.verga-stop-btn').forEach((btn) => {
            resetStopButtonVisuals(btn);
            btn.disabled = !enableButtons;
        });

        runStopCountdownPhase(timeoutMs);
    }

    const revealingReels = new Set();

    async function waitForReelStopped(reelIndex, maxMs = 12000) {
        const deadline = Date.now() + maxMs;
        while (state.spinning && !state.stoppedReels.has(reelIndex) && Date.now() < deadline) {
            await delay(32);
        }
    }

    async function waitForAllReelsStopped(maxMs = 12000) {
        const deadline = Date.now() + maxMs;
        while (state.spinning && state.stoppedReels.size < 5 && Date.now() < deadline) {
            await delay(32);
        }
    }

    async function stopRemainingReels(options = {}) {
        if (!state.spinning) return;
        if (options.markStopAll) {
            state.stopAllUsed = true;
            state.skillStopSatisfied = true;
        }
        if (state.autoStopping) return;
        state.autoStopping = true;
        clearStopTimers();
        setStopCountdownActive(false);
        updateSpinButton();
        $$('.verga-stop-btn').forEach((btn) => {
            btn.disabled = true;
            btn.classList.remove('is-counting');
        });
        const remaining = [0, 1, 2, 3, 4].filter((reelIndex) => !state.stoppedReels.has(reelIndex));
        remaining.forEach((reelIndex) => {
            const reelNode = $(`.boss-crown-reel[data-reel="${reelIndex}"]`);
            if (reelNode?.classList.contains('is-spinning')) {
                stopStripScroll(reelNode);
            }
        });
        for (let index = 0; index < remaining.length; index += 1) {
            const reelIndex = remaining[index];
            if (!state.spinning) return;
            if (revealingReels.has(reelIndex) || state.stoppedReels.has(reelIndex)) {
                await waitForReelStopped(reelIndex);
            } else {
                await revealReel(reelIndex, true);
            }
            if (index < remaining.length - 1) {
                const reelGap = options.markStopAll
                    ? STOP_ALL_REEL_DELAY_MS
                    : getSpeedProfile().reelStopDelay;
                await delay(reelGap);
            }
        }
        await waitForAllReelsStopped();
        if (state.stoppedReels.size >= 5 && !state.finishingRound) {
            await onAllReelsStopped();
        }
    }

    async function autoStopAllReels() {
        await stopRemainingReels();
    }

    async function stopAllReelsManual() {
        await stopRemainingReels({ markStopAll: true });
    }

    function markStopButtonUsed(btn) {
        if (!btn) return;
        btn.classList.remove('is-counting');
        btn.classList.add('is-stopped');
        btn.disabled = true;
        const seconds = btn.querySelector('.verga-stop-seconds');
        if (seconds) seconds.setAttribute('aria-hidden', 'true');
    }

    function applySpinButtonState(btn) {
        if (!btn) return;

        const spinBlocked = state.spinning;
        const bigWinBlocked = window.IqwinTerminalSpinWinOverlay && window.IqwinTerminalSpinWinOverlay.isBigWinActive();
        const contestBlocked = window.IqwinContestMode && typeof window.IqwinContestMode.isSpinBlocked === 'function'
            && window.IqwinContestMode.isSpinBlocked();
        const spinVisibility = window.IqwinTerminalSpinButtonVisibility;
        const hideAfterManualReelStop = spinVisibility && spinVisibility.shouldHideDuringSpin(state);

        if (hideAfterManualReelStop) {
            btn.classList.remove('is-stop-all', 'is-play-stop-mode');
            btn.disabled = true;
            spinVisibility.setHidden(btn, true);
            return;
        }

        if (spinVisibility) spinVisibility.setHidden(btn, false);

        const canStopAll = state.sessionReady
            && state.manualStopReels.size === 0
            && !state.autoStopping
            && state.stoppedReels.size < 5;

        btn.classList.toggle('is-play-stop-mode', state.playStopMode && !spinBlocked);

        if (state.playStopMode) {
            const canStopAllDuringSpin = state.spinning
                && state.sessionReady
                && state.manualStopReels.size === 0
                && !state.autoStopping
                && state.stoppedReels.size < 5;
            if (canStopAllDuringSpin) {
                btn.classList.add('is-stop-all');
                btn.disabled = bigWinBlocked || contestBlocked;
                btn.setAttribute('aria-label', 'Opreste toate');
                return;
            }
            btn.classList.remove('is-stop-all');
            btn.disabled = spinBlocked || bigWinBlocked || contestBlocked;
            btn.setAttribute('aria-label', state.spinning ? 'Se opreste automat' : 'Spin si opreste automat');
            return;
        }

        if (!state.spinning || state.finishingRound) {
            btn.classList.remove('is-stop-all');
            btn.disabled = spinBlocked || bigWinBlocked || contestBlocked;
            btn.setAttribute('aria-label', 'Start');
            return;
        }

        btn.classList.toggle('is-stop-all', canStopAll);
        btn.disabled = !canStopAll || bigWinBlocked || contestBlocked;
        btn.setAttribute('aria-label', canStopAll ? 'Opreste toate' : 'Start');
    }

    function updateSpinButton() {
        applySpinButtonState($('#spinButton'));
        updateSpinModeToggle();
    }

    function scheduleQuickAutoStop() {
        if (timers.quickAutoStop) window.clearTimeout(timers.quickAutoStop);
        const delay = getSpeedProfile().spinAutoStopDelay ?? 480;
        timers.quickAutoStop = window.setTimeout(() => {
            timers.quickAutoStop = null;
            if (state.spinning && !state.autoStopping && !state.finishingRound) {
                stopAllReelsManual();
            }
        }, delay);
    }

    function setControlsLocked(locked) {
        document.body.classList.toggle('is-boss-crown-spinning', locked);
        updateSpinButton();
        $$('#betBasePrev, #betBaseNext, #betBaseButtons .slot-bet-btn, #lineButtons [data-lines], #terminalVolumeToggle, #terminalVolumeSlider, #terminalSpeedBar, #infoButton').forEach((btn) => {
            btn.disabled = locked;
        });
        if (!locked) {
            clearStopTimers();
            setStopCountdownActive(false);
            $$('.verga-stop-btn').forEach((btn) => {
                btn.disabled = true;
                resetStopButtonVisuals(btn);
            });
            updateBetStepperUI();
            updateHalfButton();
        }
    }

    function captureActiveRound() {
        state.activeRound = {
            sessionId: state.sessionId || null,
            gameId: state.gameId,
            betAmount: totalBetAmount(),
        };
    }

    function isContestHalfBetBlocked() {
        return !!(window.IqwinContestMode
            && typeof window.IqwinContestMode.isHalfBetBlocked === 'function'
            && window.IqwinContestMode.isHalfBetBlocked());
    }

    function shouldShowHalfBetOffer(winAmount) {
        if (isContestHalfBetBlocked()) return false;
        const betAmount = Number(state.activeRound?.betAmount || totalBetAmount());
        return winAmount <= 0 && betAmount > 0;
    }

    function finalizeHalfBetOffer(winAmount) {
        if (shouldShowHalfBetOffer(winAmount)) {
            activateHalfBetOffer();
        } else {
            clearHalfBetOffer();
        }
    }

    function consumeHalfBetOffer() {
        state.halfBetOffer = { active: false, sessionId: null, gameId: null, betAmount: 0 };
        updateHalfButton();
    }

    function clearHalfBetOffer({ closeQuiz = true } = {}) {
        state.halfBetOffer = { active: false, sessionId: null, gameId: null, betAmount: 0 };
        updateHalfButton();
        if (closeQuiz && window.DodgeBombAviator) {
            DodgeBombAviator.close();
        }
    }

    function activateHalfBetOffer() {
        if (isContestHalfBetBlocked()) {
            clearHalfBetOffer({ closeQuiz: true });
            return;
        }
        const round = state.activeRound;
        const betAmount = Math.max(0, Number(round?.betAmount || totalBetAmount()));
        if (betAmount <= 0) {
            clearHalfBetOffer({ closeQuiz: false });
            return;
        }
        state.halfBetOffer = {
            active: true,
            sessionId: round?.sessionId ?? state.sessionId ?? null,
            gameId: round?.gameId ?? state.gameId,
            betAmount,
        };
        updateHalfButton();
    }

    function updateHalfButton() {
        const btn = $('#halfButton');
        if (!btn) return;
        if (isContestHalfBetBlocked()) {
            btn.classList.add('is-hidden');
            btn.classList.remove('is-half-ready', 'is-half-pending');
            btn.disabled = true;
            return;
        }
        const ready = Boolean(state.halfBetOffer?.active) && !state.spinning;
        btn.classList.toggle('is-hidden', !ready);
        btn.disabled = !ready;
        btn.classList.toggle('is-half-ready', ready);
    }

    function updateBalance() {
        if (window.IqwinTerminalCreditsDisplay) {
            IqwinTerminalCreditsDisplay.updateBalance(state.credits);
            return;
        }
        const node = $('#balanceValue');
        if (node) node.textContent = formatBalanceNumber(toDisplayCredits(state.credits));
    }

    function notifyParentCredits() {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'skill-game-credits', credits: state.credits }, '*');
        }
    }

    function updateBetLabel(options = {}) {
        const node = $('#betLabel');
        if (node) node.classList.remove('is-skill-forfeit');
        if (state.spinning) {
            if (node) node.textContent = 'STOP pe toate cele 5 role sau apasa Opreste toate';
            if (!options.preserveStatusHint && window.IqwinTerminalStatusHint) {
                window.IqwinTerminalStatusHint.setSpinning();
            }
            return;
        }
        if (!options.preserveStatusHint && window.IqwinTerminalStatusHint) {
            window.IqwinTerminalStatusHint.setIdle();
        }
        if (!node) return;
        const lineLabel = state.lines === 1 ? 'linie' : 'linii';
        const displayBet = toDisplayCredits(state.bet);
        const displayTotal = toDisplayCredits(totalBetAmount());
        node.textContent = `${formatBetNumber(displayBet)} valoare/linie x ${state.lines} ${lineLabel} = ${formatBetNumber(displayTotal)} — apasa START`;
    }

    function showMessage(text, keep = false, options = {}) {
        if (options.forfeit && window.IqwinTerminalStatusHint) {
            window.IqwinTerminalStatusHint.setForfeit();
            return;
        }
        if (text && !state.spinning && window.IqwinTerminalStatusHint) {
            window.IqwinTerminalStatusHint.setMessage(text, options);
        }
        const node = $('#betLabel');
        if (!node || !text || state.spinning) {
            return;
        }
        node.textContent = text;
        node.classList.toggle('is-skill-forfeit', Boolean(options.forfeit));
        if (!keep) {
            window.setTimeout(() => {
                if (node.textContent === text && !state.spinning) {
                    updateBetLabel();
                }
            }, 2200);
        }
    }

    function resetSkillStopTracking() {
        state.manualStopReels.clear();
        state.stopAllUsed = false;
        state.skillStopSatisfied = false;
    }

    function markManualStopReel(reelIndex) {
        state.manualStopReels.add(reelIndex);
        if (state.manualStopReels.size >= 5) {
            state.skillStopSatisfied = true;
        }
        const spinVisibility = window.IqwinTerminalSpinButtonVisibility;
        if (spinVisibility && state.spinning) {
            const btn = $('#spinButton');
            btn.classList.remove('is-stop-all', 'is-play-stop-mode');
            btn.disabled = true;
            spinVisibility.setHidden(btn, true);
        }
    }

    function isSkillStopSatisfied() {
        return state.skillStopSatisfied || state.stopAllUsed || state.manualStopReels.size >= 5;
    }

    function randomizeVisibleBoard() {
        $$('.boss-crown-reel').forEach((reel) => {
            const reelIndex = Number(reel.dataset.reel || 0);
            const column = randomReelColumn(reelIndex);
            reel.querySelectorAll('.boss-crown-cell').forEach((cell, row) => {
                setCellSymbol(cell, column[row] || symbolKeys[0]);
            });
        });
    }

    function totalBetAmount() {
        const lineHundredths = Math.round(state.bet * 100);
        const totalHundredths = lineHundredths * state.lines;
        return roundBet(totalHundredths / 100);
    }

    function totalBetForBase(basePerLine) {
        const lineHundredths = Math.round(roundBet(basePerLine) * 100);
        const totalHundredths = lineHundredths * state.lines;
        return roundBet(totalHundredths / 100);
    }

    function scatterPositions() {
        return [];
    }

    function evaluateStarScatter(board) {
        const positions = [];
        for (let reel = 0; reel < PAYING_REELS; reel += 1) {
            for (let row = 0; row < 3; row += 1) {
                if (board[reel][row] === 'stea') {
                    positions.push(`${reel}-${row}`);
                    break;
                }
            }
        }
        if (positions.length < 3) return null;
        const multiplier = paytable.stea[Math.min(4, positions.length)] || 0;
        const payout = calcWinPayout(multiplier);
        if (payout <= 0) return null;
        return {
            line: 0,
            symbol: 'stea',
            count: positions.length,
            payout,
            positions
        };
    }

    function evaluatePayline(board, lineRows, lineNumber) {
        let target = null;
        const positions = [];

        for (let reel = 0; reel < PAYING_REELS; reel += 1) {
            const symbol = board[reel][lineRows[reel]];
            if (symbol === 'stea') {
                break;
            }
            if (target === null) {
                target = symbol;
                positions.push(`${reel}-${lineRows[reel]}`);
                continue;
            }
            if (symbol !== target) {
                break;
            }
            positions.push(`${reel}-${lineRows[reel]}`);
        }

        if (!target) {
            target = 'sapte';
        }

        const count = positions.length;
        const baseMultiplier = paytable[target]?.[count] || 0;
        if (!baseMultiplier) {
            return null;
        }

        const multiplierPosition = `${MULTIPLIER_REEL}-${lineRows[MULTIPLIER_REEL]}`;
        const reelSymbol = board[MULTIPLIER_REEL][lineRows[MULTIPLIER_REEL]];
        const winMultiplier = symbolMultiplier(reelSymbol);

        if (winMultiplier <= 0) {
            return {
                cancelled: {
                    line: lineNumber,
                    symbol: target,
                    count,
                    base_multiplier: baseMultiplier,
                    win_multiplier: 0,
                    payout: 0,
                    positions: [...positions, multiplierPosition],
                    reason: 'bomb'
                }
            };
        }

        const payout = calcLinePayout(baseMultiplier, winMultiplier);
        if (payout <= 0) {
            return null;
        }

        return {
            payout,
            win: {
                line: lineNumber,
                symbol: target,
                count,
                base_multiplier: baseMultiplier,
                win_multiplier: winMultiplier,
                payout,
                positions: [...positions, multiplierPosition]
            }
        };
    }

    function evaluateBoard(board) {
        const wins = [];
        const cancelledLines = [];
        let total = 0;

        activePaylines().forEach((lineRows, index) => {
            const lineResult = evaluatePayline(board, lineRows, index + 1);
            if (!lineResult) return;
            if (lineResult.cancelled) {
                cancelledLines.push(lineResult.cancelled);
                return;
            }
            total += lineResult.payout;
            wins.push(lineResult.win);
        });

        const starWin = evaluateStarScatter(board);
        if (starWin) {
            total += starWin.payout;
            wins.push(starWin);
        }

        return { wins, cancelledLines, total: roundBet(total) };
    }

    function resetWinVisuals() {
        $$('.boss-crown-cell.is-bomb-triggered').forEach((cell) => cell.classList.remove('is-bomb-triggered'));
        $$('.boss-crown-cell.is-winning, .boss-crown-cell.is-line-symbol-active, .boss-crown-cell.is-line-symbol-loop').forEach((cell) => {
            cell.classList.remove('is-winning', 'is-line-symbol-active', 'is-line-symbol-loop');
            cell.style.removeProperty('--boss-crown-line-color');
            cell.style.removeProperty('--boss-crown-line-soft');
            cell.style.removeProperty('--boss-crown-line-glow');
            const img = cell.querySelector('img');
            if (img) {
                img.style.animation = 'none';
                void img.offsetWidth;
                img.style.removeProperty('animation');
            }
            void cell.offsetWidth;
        });
        const overlay = $('#paylineOverlay');
        if (overlay) {
            overlay.replaceChildren();
            overlay.style.visibility = 'hidden';
            void overlay.offsetWidth;
            overlay.style.removeProperty('visibility');
        }
    }

    function skipWinPresentation() {
        state.winCycleId += 1;
        stopAllSounds();
        resetWinVisuals();
        clearScatterPulses();
    }

    function clearWinHighlights() {
        skipWinPresentation();
    }

    function clearScatterPulseTimers() {
        state.scatterPulseTimers.forEach((timer) => window.clearTimeout(timer));
        state.scatterPulseTimers = [];
    }

    function clearScatterPulses() {
        clearScatterPulseTimers();
        $$('.boss-crown-cell img[data-symbol="scatter"]').forEach((image) => {
            image.closest('.boss-crown-cell')?.classList.remove(
                'is-special-reveal',
                'is-dollar-reveal',
                'is-star-reveal',
                'is-scatter-anticipation-pulse'
            );
        });
    }

    function scatterPulseDelay(cell) {
        return cell.classList.contains('is-scatter-anticipation-pulse') ? 900 : 1850;
    }

    function animateSpecialSymbol(cell, type, loop = false) {
        if (!cell) return;
        cell.classList.remove('is-special-reveal', 'is-dollar-reveal', 'is-star-reveal');
        void cell.offsetWidth;
        cell.classList.add('is-special-reveal', 'is-dollar-reveal');
        if (type === 'scatter') {
            if (!loop) {
                window.setTimeout(() => {
                    cell.classList.remove('is-special-reveal', 'is-dollar-reveal', 'is-star-reveal');
                }, 1180);
                return;
            }
            const pulseScatter = () => {
                if (!cell.isConnected || cell.querySelector('img')?.dataset.symbol !== 'scatter') return;
                cell.classList.remove('is-special-reveal', 'is-dollar-reveal', 'is-star-reveal');
                void cell.offsetWidth;
                cell.classList.add('is-special-reveal', 'is-dollar-reveal');
                state.scatterPulseTimers.push(window.setTimeout(pulseScatter, scatterPulseDelay(cell)));
            };
            state.scatterPulseTimers.push(window.setTimeout(pulseScatter, scatterPulseDelay(cell)));
            return;
        }
        window.setTimeout(() => {
            cell.classList.remove('is-special-reveal', 'is-dollar-reveal', 'is-star-reveal');
        }, 1180);
    }

    function revealScatterOnReel(reelIndex, column) {
        const reelHasScatter = column.includes('scatter');
        if (!reelHasScatter) return;

        state.resolvedScatterCount += column.filter((symbol) => symbol === 'scatter').length;
        playSampleSound('bong');

        const loopScatterAnimation = state.resolvedScatterCount >= 3;
        column.forEach((symbol, row) => {
            if (symbol !== 'scatter') return;
            animateSpecialSymbol($(`[data-position="${reelIndex}-${row}"]`), 'scatter', loopScatterAnimation);
        });

        if (loopScatterAnimation) {
            $$('.boss-crown-cell img[data-symbol="scatter"]').forEach((image) => {
                const cell = image.closest('.boss-crown-cell');
                if (!cell) return;
                const cellReel = Number(String(cell.dataset.position || '0-0').split('-')[0]);
                if (cellReel === reelIndex) return;
                animateSpecialSymbol(cell, 'scatter', true);
            });
        }
    }

    function getLineColor(line, fallbackIndex = 0) {
        const lineNumber = Number(line?.line || 0);
        const index = lineNumber > 0 ? lineNumber - 1 : fallbackIndex;
        return lineColors[((index % lineColors.length) + lineColors.length) % lineColors.length];
    }

    function markWins(positions, color) {
        positions.forEach((position) => {
            const cell = $(`[data-position="${position}"]`);
            if (!cell) return;
            cell.style.setProperty('--boss-crown-line-color', color.main);
            cell.style.setProperty('--boss-crown-line-soft', color.soft);
            cell.style.setProperty('--boss-crown-line-glow', color.glow);
            cell.classList.add('is-winning');
        });
    }

    function getFullPaylinePositions(line) {
        const lineNumber = Number(line?.line || 0);
        const rows = lineNumber > 0 ? paylines[lineNumber - 1] : null;
        if (!Array.isArray(rows)) {
            return Array.isArray(line?.positions) ? [...line.positions] : [];
        }
        return rows.map((row, reel) => `${reel}-${row}`);
    }

    function renderWinPaylineOverlay(wins) {
        const overlay = $('#paylineOverlay');
        if (!overlay) return;

        const draw = () => {
            const overlayRect = overlay.getBoundingClientRect();
            if (!overlayRect.width || !overlayRect.height) {
                overlay.innerHTML = '';
                return;
            }

            overlay.setAttribute('viewBox', `0 0 ${overlayRect.width} ${overlayRect.height}`);
            overlay.innerHTML = wins.map((win, index) => {
                if (!win.line) return '';
                const linePattern = paylines[win.line - 1];
                if (!linePattern) return '';
                const color = getLineColor(win, index);
                const delay = `${Math.min(index * 0.14, 0.56).toFixed(2)}s`;
                const style = `--boss-crown-line-color:${color.main};--boss-crown-line-soft:${color.soft};--boss-crown-line-glow:${color.glow};--boss-crown-line-core:${color.core};animation-delay:${delay}`;
                const useFullLine = String(win.reason || '') === 'bomb';
                const positions = useFullLine ? getFullPaylinePositions(win) : null;
                const cells = [];

                if (useFullLine && positions.length >= 2) {
                    positions.forEach((position) => {
                        const cell = $(`.verga-reels-panel [data-position="${position}"]`);
                        if (!cell) return;
                        const rect = cell.getBoundingClientRect();
                        cells.push({
                            x: rect.left - overlayRect.left + rect.width / 2,
                            y: rect.top - overlayRect.top + rect.height / 2,
                            width: rect.width,
                            height: rect.height
                        });
                    });
                } else {
                    for (let reel = 0; reel < win.count; reel += 1) {
                        const row = linePattern[reel];
                        const cell = $(`.verga-reels-panel [data-position="${reel}-${row}"]`);
                        if (!cell) continue;
                        const rect = cell.getBoundingClientRect();
                        cells.push({
                            x: rect.left - overlayRect.left + rect.width / 2,
                            y: rect.top - overlayRect.top + rect.height / 2,
                            width: rect.width,
                            height: rect.height
                        });
                    }
                }

                if (cells.length < 2) return '';

                return cells.slice(0, -1).map((start, segmentIndex) => {
                    const end = cells[segmentIndex + 1];
                    const dx = end.x - start.x;
                    const dy = end.y - start.y;
                    const distance = Math.hypot(dx, dy);
                    if (!distance) return '';
                    const startInset = Math.min(start.width, start.height) * 0.5;
                    const endInset = Math.min(end.width, end.height) * 0.5;
                    const startX = start.x + (dx / distance) * startInset;
                    const startY = start.y + (dy / distance) * startInset;
                    const endX = end.x - (dx / distance) * endInset;
                    const endY = end.y - (dy / distance) * endInset;
                    const path = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`;
                    return `<path class="boss-crown-payline-glow" d="${path}" style="${style}"></path><path class="boss-crown-payline-core" d="${path}" style="${style}"></path>`;
                }).join('');
            }).join('');
        };

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(draw);
        });
    }

    function showActiveWinLine(win, index = 0, options = {}) {
        resetWinVisuals();
        const color = getLineColor(win, index);
        win.positions.forEach((position) => {
            const cell = $(`[data-position="${position}"]`);
            if (!cell) return;
            cell.style.setProperty('--boss-crown-line-color', color.main);
            cell.style.setProperty('--boss-crown-line-soft', color.soft);
            cell.style.setProperty('--boss-crown-line-glow', color.glow);
            cell.classList.add('is-line-symbol-active');
            cell.classList.toggle('is-line-symbol-loop', Boolean(options.loopSymbols));
        });
        renderWinPaylineOverlay([win]);
    }

    function showLineSymbolAnimation(win, index = 0) {
        resetWinVisuals();
        const color = getLineColor(win, index);
        win.positions.forEach((position) => {
            const cell = $(`[data-position="${position}"]`);
            if (!cell) return;
            cell.style.setProperty('--boss-crown-line-color', color.main);
            cell.style.setProperty('--boss-crown-line-soft', color.soft);
            cell.style.setProperty('--boss-crown-line-glow', color.glow);
            cell.classList.add('is-line-symbol-active');
        });
    }

    async function playBombCancelledLines(cancelledLines = [], presentationId = state.winCycleId) {
        const isActive = () => state.winCycleId === presentationId;
        const lines = (cancelledLines || []).filter((line) =>
            String(line?.reason || '') === 'bomb' &&
            Number(line?.line || 0) > 0 &&
            Array.isArray(line.positions) &&
            line.positions.length >= 2
        );
        if (!lines.length || !isActive()) return;

        for (let index = 0; index < lines.length; index += 1) {
            if (!isActive()) return;
            const line = lines[index];
            showActiveWinLine(line, index, { loopSymbols: false });
            line.positions
                .filter((position) => String(position).startsWith('4-'))
                .forEach((position) => {
                    $(`[data-position="${position}"]`)?.classList.add('is-bomb-triggered');
                });
            if (!isActive()) return;
            playGameSound('bomb');
            await delay(1150);
            if (!isActive()) {
                resetWinVisuals();
                $$('.boss-crown-cell.is-bomb-triggered').forEach((cell) => cell.classList.remove('is-bomb-triggered'));
                return;
            }
            resetWinVisuals();
            $$('.boss-crown-cell.is-bomb-triggered').forEach((cell) => cell.classList.remove('is-bomb-triggered'));
        }
    }

    async function playWinCycle(wins, presentationId = state.winCycleId) {
        const isCurrentCycle = () => state.winCycleId === presentationId;
        const speedProfile = getSpeedProfile();
        const payableLines = wins.filter((win) => win.line > 0 && win.payout > 0 && win.positions.length >= 2);
        const scatterWins = wins.filter((win) => win.line === 0);
        const lineShowDuration = 1000;

        if (!payableLines.length) {
            if (scatterWins.length && isCurrentCycle()) {
                const positions = scatterWins.flatMap((win) => win.positions);
                markWins(positions, lineColors[0]);
                await delay(speedProfile.winScatterHold);
                if (!isCurrentCycle()) {
                    resetWinVisuals();
                }
            }
            return;
        }

        if (!isCurrentCycle()) return;

        const hasMultiplierLineWin = payableLines.some((win) => Number(win.win_multiplier || 0) > 0);
        if (hasMultiplierLineWin) {
            playSampleSound('win');
        } else if (hasLineWinSound(payableLines)) {
            playSampleSound('linewin');
        }

        while (isCurrentCycle()) {
            for (let index = 0; index < payableLines.length; index += 1) {
                if (!isCurrentCycle()) return;
                showActiveWinLine(payableLines[index], index, { loopSymbols: true });
                await delay(lineShowDuration);
                if (!isCurrentCycle()) return;
                resetWinVisuals();
            }
        }
    }

    function renderPaylines(wins) {
        renderWinPaylineOverlay(wins);
    }

    function hasTerminalServer() {
        return Boolean(
            localStorage.getItem('skill_terminal_credentials')
            && localStorage.getItem('skill_terminal_server')
        );
    }

    function terminalRoundSyncOptions() {
        return {
            gameId: state.gameId,
            formatDisplayAmount: (value) => formatBalanceNumber(toDisplayCredits(value)),
            onBalance: (balance) => {
                state.credits = Number(balance);
                updateBalance();
                notifyParentCredits();
            },
            onLastWin: (amount) => {
                const node = $('#lastWinValue');
                if (node && window.IqwinTerminalRoundSync) {
                    IqwinTerminalRoundSync.renderLastWin(node, amount, (value) => formatBalanceNumber(toDisplayCredits(value)), {});
                }
            },
            onWinRecovered: (amount) => {
                const node = $('#lastWinValue');
                if (node && window.IqwinTerminalRoundSync) {
                    IqwinTerminalRoundSync.renderLastWin(node, amount, (value) => formatBalanceNumber(toDisplayCredits(value)), {});
                }
                if (window.IqwinTerminalSpinWinOverlay && amount > 0) {
                    window.IqwinTerminalSpinWinOverlay.show(amount, {
                        formatted: formatBalanceNumber(toDisplayCredits(amount)),
                        forfeit: false,
                        skillStopUsed: true,
                        allowBigWin: true,
                        betAmount: totalBetAmount(),
                        soundEnabled: state.soundEnabled,
                        soundVolume: getSoundVolumeMultiplier()
                    });
                }
            },
            onProcessingMessage: (text) => {
                showMessage(text || '');
            }
        };
    }

    async function flushPendingRoundSync() {
        if (!hasTerminalServer() || !window.IqwinTerminalRoundSync) {
            return { ready: true, credited: 0 };
        }
        return IqwinTerminalRoundSync.prepareForNewSpin({
            ...terminalRoundSyncOptions(),
            loadCredits
        });
    }

    async function loadCredits() {
        try {
            const storage = localStorage.getItem('skill_terminal_credentials');
            const server = localStorage.getItem('skill_terminal_server');
            if (!storage || !server) {
                state.credits = 100;
                updateBalance();
                return;
            }
            const credentials = JSON.parse(storage);
            const base = server.replace(/\/$/, '') + '/api/terminal';
            const response = await fetch(base + '/bootstrap.php', {
                headers: {
                    'X-Terminal-Code': credentials.terminal_code,
                    'X-Terminal-Secret': credentials.api_secret
                }
            });
            const data = await response.json();
            if (data.ok && data.terminal) {
                state.credits = Number(data.terminal.credits_balance || 0);
                if (window.IqwinTerminalCreditsDisplay) {
                    IqwinTerminalCreditsDisplay.setCreditRate(data.terminal.credit_rate);
                }
            }
        } catch (error) {
            state.credits = 100;
        }
        updateBalance();
    }

    async function revealReel(reelIndex, fromAuto = false) {
        if (revealingReels.has(reelIndex)) return;
        const reelNode = $(`.boss-crown-reel[data-reel="${reelIndex}"]`);
        if (!reelNode || !state.roundBoard || state.stoppedReels.has(reelIndex)) return;
        if (!fromAuto && state.autoStopping) return;

        revealingReels.add(reelIndex);
        const stopBtn = $(`.verga-stop-btn[data-reel="${reelIndex}"]`);
        if (!fromAuto) {
            markStopButtonUsed(stopBtn);
        } else if (stopBtn) {
            markStopButtonUsed(stopBtn);
        }
        updateSpinButton();
        try {
            reelNode.classList.remove('is-reel-freezing');
            reelNode.classList.add('is-reel-settling');
            await settleReelToNearestRow(reelNode, 'auto');

            const settled = readSettledColumnFromStrip(reelNode, reelIndex);
            let column = settled?.column || null;
            let resolvedStopIndex = settled?.stopIndex ?? null;
            if (!column) {
                const stopIndex = readReelStopIndex(reelNode, reelIndex);
                column = stopIndex !== null
                    ? readMechanicalColumn(reelIndex, stopIndex)
                    : readReelOutcomeFromStrip(reelNode, reelIndex);
                resolvedStopIndex = stopIndex;
                if (resolvedStopIndex === null) {
                    resolvedStopIndex = findStopIndexForColumn(reelIndex, column);
                }
            }
            if (resolvedStopIndex !== null) {
                state.roundStopIndexes[reelIndex] = resolvedStopIndex;
                column = readMechanicalColumn(reelIndex, resolvedStopIndex);
            }
            if (!state.roundBoard) state.roundBoard = createEmptyRoundBoard();
            state.roundBoard[reelIndex] = column;

            column.forEach((symbol, row) => {
                const cell = $(`[data-position="${reelIndex}-${row}"]`);
                if (cell) setCellSymbol(cell, symbol);
            });

            if (reelIndex === MULTIPLIER_REEL) {
                syncReelFiveCellsFromStrip(reelNode, resolvedStopIndex);
            }

            removeSpinStrip(reelNode);
            reelNode.classList.remove('is-spinning', 'is-reel-settling', 'is-reel-freezing');

            state.stoppedReels.add(reelIndex);
            updateSpinButton();
            if (column.includes('stea') && reelIndex < PAYING_REELS) {
                playGameSound('scatter');
            } else {
                playGameSound('stop');
            }
        } finally {
            revealingReels.delete(reelIndex);
        }
    }

    async function finishRound(result) {
        const roundBetAmount = totalBetAmount();
        const winAmount = result.total;
        const reelStops = state.roundStopIndexes.slice();
        const serverLinked = hasTerminalServer();
        const skillStopUsed = state.skillStopSatisfied || isSkillStopSatisfied();
        const forfeitWin = winAmount > 0 && !skillStopUsed;
        const lastWinNode = $('#lastWinValue');

        let creditedWin = forfeitWin ? 0 : winAmount;
        let overlayWin = 0;
        let settlement = null;

        if (winAmount > 0) {
            const hasMultiplierLineWin = (result.wins || []).some((win) => win.line > 0 && win.payout > 0 && Number(win.win_multiplier || 0) > 0);
            if (!serverLinked && !hasMultiplierLineWin && !hasLineWinSound(result.wins)) {
                playGameSound('win');
            }
            if (!serverLinked && creditedWin > 0) {
                state.credits += creditedWin;
                if (lastWinNode) {
                    lastWinNode.textContent = formatBalanceNumber(toDisplayCredits(creditedWin));
                    lastWinNode.classList.remove('is-forfeited');
                }
            }
        } else {
            if (lastWinNode) {
                lastWinNode.textContent = formatBalanceNumber(0);
                lastWinNode.classList.remove('is-forfeited');
            }
            clearWinHighlights();
        }

        if (!serverLinked) {
            updateBalance();
        }

        if (serverLinked) {
            settlement = await IqwinTerminalRoundSync.settleRound({
                gameId: state.gameId,
                getSessionId: () => state.sessionId,
                setSessionId: (id) => { state.sessionId = id; },
                reelStops,
                winAmount,
                creditedWin,
                skillStopUsed,
                forfeitWin,
                lastWinNode,
                formatDisplayAmount: (value) => formatBalanceNumber(toDisplayCredits(value)),
                onBalance: (balance) => {
                    state.credits = Number(balance);
                    updateBalance();
                    notifyParentCredits();
                },
                showMessage,
                loadCredits,
                onWinRecovered: terminalRoundSyncOptions().onWinRecovered
            });
            creditedWin = settlement.creditedWin;
            if (settlement.syncOk && creditedWin > 0) {
                overlayWin = creditedWin;
            }
            finalizeHalfBetOffer(winAmount);
        } else if (creditedWin > 0) {
            overlayWin = creditedWin;
        }

        const presentationId = state.winCycleId;

        if (winAmount > 0) {
            if (!serverLinked) {
                clearHalfBetOffer();
            }
        } else if (!serverLinked) {
            finalizeHalfBetOffer(winAmount);
        }

        state.spinning = false;
        state.autoStopAfterStart = false;
        state.autoStopping = false;
        state.finishingRound = false;
        state.sessionReady = true;
        resetSkillStopTracking();
        state.roundBoard = null;
        state.roundStopIndexes = [null, null, null, null, null];
        state.stoppedReels.clear();
        state.resolvedScatterCount = 0;
        clearScatterPulses();
        clearStopTimers();
        setControlsLocked(false);
        updateSpinButton();
        if (forfeitWin) {
            showMessage('', true, { forfeit: true });
        }
        updateBetLabel({ preserveStatusHint: forfeitWin });

        if (window.IqwinTerminalGoldenBubble) {
            window.IqwinTerminalGoldenBubble.onSpinComplete(roundBetAmount);
        }

        if (result.cancelledLines?.length) {
            void playBombCancelledLines(result.cancelledLines, presentationId);
        }

        if (overlayWin > 0 && state.winCycleId === presentationId) {
            if (serverLinked && settlement?.syncOk) {
                const hasMultiplierLineWin = (result.wins || []).some((win) => win.line > 0 && win.payout > 0 && Number(win.win_multiplier || 0) > 0);
                if (!hasMultiplierLineWin && !hasLineWinSound(result.wins)) {
                    playGameSound('win');
                }
            }
            if (window.IqwinTerminalSpinWinOverlay) {
                window.IqwinTerminalSpinWinOverlay.show(overlayWin, {
                    formatted: formatBalanceNumber(toDisplayCredits(overlayWin)),
                    forfeit: false,
                    skillStopUsed: skillStopUsed,
                    allowBigWin: skillStopUsed,
                    betAmount: roundBetAmount,
                    soundEnabled: state.soundEnabled,
                    soundVolume: getSoundVolumeMultiplier()
                });
            }
            void playWinCycle(result.wins, presentationId);
        }
    }

    async function onAllReelsStopped() {
        if (state.finishingRound) return;
        state.finishingRound = true;

        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));

        finalizeRoundState();
        if (!hasCompleteRoundStops()) {
            reconcileAllRoundStops();
        }

        if (!state.roundBoard || !hasCompleteRoundStops()) {
            state.finishingRound = false;
            state.spinning = false;
            state.autoStopping = false;
            clearStopTimers();
            setControlsLocked(false);
            updateSpinButton();
            showMessage('Eroare sincronizare runda.');
            return;
        }

        const board = state.roundBoard.map((column) => column.slice());
        const result = evaluateBoard(board);
        state.skillStopSatisfied = state.skillStopSatisfied || isSkillStopSatisfied();
        await finishRound(result);
    }

    async function startNewSession() {
        try {
            const storage = localStorage.getItem('skill_terminal_credentials');
            const server = localStorage.getItem('skill_terminal_server');
            if (!storage || !server) return true;
            const credentials = JSON.parse(storage);
            const base = server.replace(/\/$/, '') + '/api/terminal';
            const response = await fetch(base + '/session.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Terminal-Code': credentials.terminal_code,
                    'X-Terminal-Secret': credentials.api_secret
                },
                body: JSON.stringify(
                    window.IqwinContestMode && typeof window.IqwinContestMode.buildStartSessionBody === 'function'
                        ? window.IqwinContestMode.buildStartSessionBody({
                            action: 'start',
                            game_id: state.gameId,
                            bet: state.bet,
                            lines: state.lines
                        })
                        : {
                            action: 'start',
                            game_id: state.gameId,
                            bet: state.bet,
                            lines: state.lines
                        }
                )
            });
            let data = await response.json();
            if (!data.ok && data.code === 'open_session' && window.IqwinTerminalRoundSync) {
                await IqwinTerminalRoundSync.handleOpenSessionConflict(terminalRoundSyncOptions(), data.open_session_id);
                const retryResponse = await fetch(base + '/session.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Terminal-Code': credentials.terminal_code,
                        'X-Terminal-Secret': credentials.api_secret
                    },
                    body: JSON.stringify(
                        window.IqwinContestMode && typeof window.IqwinContestMode.buildStartSessionBody === 'function'
                            ? window.IqwinContestMode.buildStartSessionBody({
                                action: 'start',
                                game_id: state.gameId,
                                bet: state.bet,
                                lines: state.lines
                            })
                            : {
                                action: 'start',
                                game_id: state.gameId,
                                bet: state.bet,
                                lines: state.lines
                            }
                    )
                });
                data = await retryResponse.json();
            }
            if (!data.ok) {
                showMessage(data.message || 'Sesiune respinsa.');
                return false;
            }
            state.sessionId = data.session_id;
            if (window.IqwinContestMode && typeof window.IqwinContestMode.syncGameBetFromSession === 'function') {
                window.IqwinContestMode.syncGameBetFromSession(state, data);
            } else if (window.IqwinContestMode && typeof window.IqwinContestMode.lockGameBetState === 'function') {
                window.IqwinContestMode.lockGameBetState(state);
            }
            captureActiveRound();
            if (data.credits_balance !== undefined) {
                state.credits = Number(data.credits_balance);
                updateBalance();
                notifyParentCredits();
            }
            return true;
        } catch (error) {
            showMessage('Eroare pornire sesiune.');
            return false;
        }
    }

    function abortSpinRound() {
        if (!state.spinning) return;
        skipWinPresentation();
        autoStopChain = Promise.resolve();
        clearStopTimers();
        state.spinning = false;
        state.sessionReady = true;
        state.autoStopAfterStart = false;
        state.autoStopping = false;
        state.finishingRound = false;
        state.roundBoard = null;
        state.roundStopIndexes = [null, null, null, null, null];
        state.stoppedReels.clear();
        state.resolvedScatterCount = 0;
        clearScatterPulses();
        resetSkillStopTracking();
        $$('.boss-crown-reel').forEach((reel) => {
            stopStripScroll(reel);
            removeSpinStrip(reel);
            reel.classList.remove('is-spinning', 'is-reel-settling', 'is-reel-freezing');
        });
        $$('.verga-stop-btn').forEach((btn) => {
            btn.disabled = true;
            resetStopButtonVisuals(btn);
        });
        setControlsLocked(false);
        updateSpinButton();
        updateBetLabel();
    }

    function activateSpinControlsAfterSession() {
        if (!state.spinning) return;
        state.sessionReady = true;
        const autoStopAfterStart = state.autoStopAfterStart;
        if (autoStopAfterStart) {
            scheduleQuickAutoStop();
        } else if (!timers.autoStop && !timers.countdown) {
            startStopCountdown();
        } else {
            $$('.verga-stop-btn').forEach((btn) => {
                if (!btn.classList.contains('is-stopped')) btn.disabled = false;
            });
        }
        updateSpinButton();
    }

    function beginSpinRound({ waitForSession = false, debitLocalCredits = false } = {}) {
        if (window.IqwinTerminalGoldenBubble) {
            window.IqwinTerminalGoldenBubble.onSpinStart();
        }
        autoStopChain = Promise.resolve();
        clearHalfBetOffer();
        state.activeRound = null;
        state.spinning = true;
        state.sessionReady = !waitForSession;
        const autoStopAfterStart = state.playStopMode;
        state.autoStopAfterStart = autoStopAfterStart;
        state.autoStopping = false;
        state.finishingRound = false;
        resetSkillStopTracking();
        state.stoppedReels.clear();
        state.resolvedScatterCount = 0;
        state.roundStopIndexes = [null, null, null, null, null];
        clearScatterPulses();
        state.roundBoard = createEmptyRoundBoard();
        if (debitLocalCredits) {
            state.credits -= totalBetAmount();
            updateBalance();
            notifyParentCredits();
            captureActiveRound();
        }
        setControlsLocked(true);
        updateBetLabel();
        ensureAudio();
        playGameSound('spin');
        $$('.boss-crown-cell').forEach((cell) => cell.classList.remove('is-winning'));

        $$('.boss-crown-reel').forEach((reel) => {
            reel.classList.add('is-spinning');
            createSpinStrip(reel, Number(reel.dataset.reel || 0));
        });

        if (waitForSession) {
            if (!autoStopAfterStart) {
                startStopCountdown({ enableButtons: false });
            } else {
                $$('.verga-stop-btn').forEach((btn) => {
                    btn.disabled = true;
                    resetStopButtonVisuals(btn);
                });
                setStopCountdownActive(false);
            }
        } else if (autoStopAfterStart) {
            $$('.verga-stop-btn').forEach((btn) => {
                btn.disabled = true;
                resetStopButtonVisuals(btn);
            });
            setStopCountdownActive(false);
            scheduleQuickAutoStop();
        } else {
            startStopCountdown();
        }
        updateSpinButton();
    }

    function startSpin() {
        if (state.spinning || state.finishingRound) return;
        if (window.IqwinTerminalSpinWinOverlay && window.IqwinTerminalSpinWinOverlay.isBigWinActive()) return;
        if (window.IqwinTerminalSpinWinOverlay) {
            window.IqwinTerminalSpinWinOverlay.hide();
        }
        clearWinHighlights();
        const betAmount = totalBetAmount();
        const creditCheck = window.IqwinContestMode && typeof window.IqwinContestMode.checkSpinCredits === 'function'
            ? window.IqwinContestMode.checkSpinCredits(betAmount, state.credits)
            : { ok: state.credits >= betAmount, message: 'Sold insuficient' };
        if (!creditCheck.ok) {
            showMessage(creditCheck.message || 'Sold insuficient');
            return;
        }
        skipWinPresentation();

        const needsServer = hasTerminalServer();

        const run = async () => {
            if (needsServer) {
                const prepared = await flushPendingRoundSync();
                if (!prepared?.ready) {
                    if (window.IqwinTerminalRoundSync) {
                        IqwinTerminalRoundSync.scheduleBackgroundRetry(terminalRoundSyncOptions());
                    }
                    return;
                }
                beginSpinRound({ waitForSession: true });
            }
            const ok = await startNewSession();
            if (!ok) {
                if (needsServer) abortSpinRound();
                return;
            }
            if (needsServer) {
                activateSpinControlsAfterSession();
                return;
            }
            beginSpinRound({ debitLocalCredits: true });
        };
        void run();
    }

    function handleHalfButtonClick() {
        if (state.spinning || !state.halfBetOffer?.active) return;
        setInfoPopupOpen(false);
        if (window.DodgeBombAviator) {
            DodgeBombAviator.open();
        }
    }

    async function handleSpinButtonClick() {
        if (window.IqwinTerminalSpinWinOverlay && window.IqwinTerminalSpinWinOverlay.isBigWinActive()) return;
        if (state.spinning) {
            if (!state.finishingRound && state.sessionReady && state.manualStopReels.size === 0 && state.stoppedReels.size < 5) {
                clearStopTimers();
                setStopCountdownActive(false);
                state.stopAllUsed = true;
                state.skillStopSatisfied = true;
                if (state.stoppedReels.size < 5) {
                    await stopAllReelsManual();
                } else if (!state.finishingRound) {
                    await onAllReelsStopped();
                }
            }
            return;
        }
        startSpin();
    }

    function handleSpinModeToggle(event) {
        event.preventDefault();
        event.stopPropagation();
        if (state.spinning) return;
        state.playStopMode = !state.playStopMode;
        savePlayStopPreference();
        updateSpinModeToggle();
        updateSpinButton();
    }

    function handleStopClick(reelIndex) {
        if (!state.spinning || !state.sessionReady || state.autoStopping || state.stoppedReels.has(reelIndex)) return;
        if (revealingReels.has(reelIndex)) return;

        markManualStopReel(reelIndex);
        markStopButtonUsed($(`.verga-stop-btn[data-reel="${reelIndex}"]`));
        freezeReelOnStop(reelIndex);
        updateSpinButton();

        void finalizeManualReelStop(reelIndex);
    }

    async function finalizeManualReelStop(reelIndex) {
        try {
            await revealReel(reelIndex);
            if (state.stoppedReels.size >= 5 && !state.finishingRound) {
                clearStopTimers();
                setStopCountdownActive(false);
                await waitForAllReelsSettled();
                state.skillStopSatisfied = state.skillStopSatisfied || isSkillStopSatisfied();
                await onAllReelsStopped();
            }
        } catch (error) {
        }
    }

    function bindKioskGuards() {
        const block = (event) => {
            event.preventDefault();
        };

        document.addEventListener('selectstart', block);
        document.addEventListener('dragstart', block);
        document.addEventListener('contextmenu', block);

        document.addEventListener('mousedown', (event) => {
            if (event.detail > 1) {
                event.preventDefault();
            }
        });
    }

    function bindEvents() {
        initBetButtons();
        $('#spinButton')?.addEventListener('click', handleSpinButtonClick);
        window.addEventListener('iqwin-terminal-big-win-change', updateSpinButton);
        $('#halfButton')?.addEventListener('click', handleHalfButtonClick);
        window.addEventListener('iqwin-contest-block-half-bet', () => {
            clearHalfBetOffer({ closeQuiz: true });
        });

        $$('.verga-stop-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                handleStopClick(Number(btn.dataset.reel || 0));
            });
        });

        $$('#lineButtons [data-lines]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (state.spinning) return;
                $$('#lineButtons [data-lines]').forEach((item) => item.classList.remove('is-active'));
                btn.classList.add('is-active');
                state.lines = normalizeLines(btn.dataset.lines);
                resolveBetBaseIndex();
                updateBetStepperUI({ syncSelection: false });
                updateBetLabel();
            });
        });
        if (window.IqwinTerminalInfoPages) {
            infoPagesController = window.IqwinTerminalInfoPages.init({
                onOpenChange(open) {
                    if (!open) return;
                    renderInfoPages();
                    infoPagesController?.refresh();
                }
            });
        }

        initSettingsMenu();
        if (window.IqwinTerminalFooter) {
            window.IqwinTerminalFooter.bind();
        }
        if (window.IqwinTerminalGoldenBubble) {
            window.IqwinTerminalGoldenBubble.init({
                isSoundEnabled: () => state.soundEnabled,
                getSoundVolume: () => getSoundVolumeMultiplier(),
                ensureAudio: () => ensureAudio(),
                playPopSound: () => playSampleSound('bomb'),
                onAward: (amount, syncedBalance) => {
                    if (syncedBalance !== undefined && syncedBalance !== null) {
                        state.credits = Number(syncedBalance);
                    } else {
                        state.credits += amount;
                    }
                    updateBalance();
                    notifyParentCredits();
                },
                getGameId: () => state.gameId,
                refreshCredits: () => { loadCredits(); },
                formatAmount: (value) => formatBalanceNumber(toDisplayCredits(value)),
                onShowLastWin: (value) => {
                    const lastWin = $('#lastWinValue');
                    if (lastWin) {
                        lastWin.textContent = formatBalanceNumber(toDisplayCredits(value));
                        lastWin.classList.remove('is-forfeited');
                    }
                }
            });
        }

    }

    function initReelsLedFrame() {
        const track = $('.verga-reels-led-track');
        if (!track) {
            return;
        }

        const ledPoints = [
            [4, 0], [8, 0], [12, 0], [16, 0], [20, 0], [24, 0], [28, 0], [32, 0], [36, 0], [40, 0], [44, 0], [48, 0], [52, 0], [56, 0], [60, 0], [64, 0], [68, 0], [72, 0], [76, 0], [80, 0], [84, 0], [88, 0], [92, 0], [96, 0],
            [100, 10], [100, 20], [100, 30], [100, 40], [100, 50], [100, 60], [100, 70], [100, 80], [100, 90],
            [96, 100], [92, 100], [88, 100], [84, 100], [80, 100], [76, 100], [72, 100], [68, 100], [64, 100], [60, 100], [56, 100], [52, 100], [48, 100], [44, 100], [40, 100], [36, 100], [32, 100], [28, 100], [24, 100], [20, 100], [16, 100], [12, 100], [8, 100], [4, 100],
            [0, 90], [0, 80], [0, 70], [0, 60], [0, 50], [0, 40], [0, 30], [0, 20], [0, 10]
        ];

        track.replaceChildren();

        ledPoints.forEach((point, index) => {
            const led = document.createElement('i');
            led.style.setProperty('--x', `${point[0]}%`);
            led.style.setProperty('--y', `${point[1]}%`);
            led.style.setProperty('--d', String(index));
            track.appendChild(led);
        });
    }

    symbolKeys.forEach((key) => {
        const img = new Image();
        img.src = symbolSrc(key);
    });

    applyUniformStyles();
    randomizeVisibleBoard();
    requestAnimationFrame(() => {
        requestAnimationFrame(() => syncAllReelFiveSymbolSizes());
    });
    let reelFiveResizeTimer = null;
    window.addEventListener('resize', () => {
        window.clearTimeout(reelFiveResizeTimer);
        reelFiveResizeTimer = window.setTimeout(syncAllReelFiveSymbolSizes, 120);
    });
    loadPreferences();
    renderInfoPages();
    bindEvents();
    if (window.DodgeBombAviator) {
        DodgeBombAviator.init({
            isBlocked: () => state.spinning,
            isSoundEnabled: () => state.soundEnabled,
            getOffer: () => state.halfBetOffer,
            formatCredits: (value) => formatBetNumber(toDisplayCredits(value)),
            onRefundApplied: (refundAmount, newBalance) => {
                if (newBalance !== undefined && newBalance !== null) {
                    state.credits = Number(newBalance);
                } else {
                    state.credits += refundAmount;
                }
                if (refundAmount > 0) {
                    const lastWin = $('#lastWinValue');
                    if (lastWin) {
                        lastWin.textContent = formatBalanceNumber(toDisplayCredits(refundAmount));
                    }
                }
                updateBalance();
                notifyParentCredits();
            },
            onOfferConsumed: () => {
                consumeHalfBetOffer();
            },
        });
    }
    updateHalfButton();
    bindKioskGuards();
    initReelsLedFrame();
    resolveBetBaseIndex();
    updateBetStepperUI();
    updateBetLabel();
    updatePreferenceControls();
    updateBalance();
    notifyParentCredits();
    loadCredits().then(() => {
        updateBalance();
        notifyParentCredits();
        void flushPendingRoundSync().then((prepared) => {
            if (prepared && !prepared.ready && window.IqwinTerminalRoundSync) {
                IqwinTerminalRoundSync.scheduleBackgroundRetry(terminalRoundSyncOptions());
            }
        });
    });
})();
