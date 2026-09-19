(() => {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));
    const params = new URLSearchParams(window.location.search);

    const symbolFiles = {
        stea: 'stea.webp',
        coroana: 'coroana.webp',
        sapte: '7.webp',
        pepene: 'pepene.webp',
        strugure: 'strugure.webp',
        clopotel: 'clopotel.webp',
        pruna: 'pruna.webp',
        portocala: 'portocala.webp',
        lamaie: 'lamaie.webp',
        cireasa: 'cireasa.webp',
        dolar: 'dolar.webp'
    };

    const paytableLabels = {
        stea: 'Stea',
        coroana: 'Coroana',
        sapte: '7',
        pepene: 'Pepene',
        strugure: 'Strugure',
        clopotel: 'Clopotel',
        pruna: 'Pruna',
        portocala: 'Portocala',
        lamaie: 'Lamaie',
        cireasa: 'Cireasa',
        dolar: 'Dolar'
    };

    const symbolKeys = Object.keys(symbolFiles);

        const paytable = {
        sapte: { 5: 300, 4: 20, 3: 4 },
        pepene: { 5: 50, 4: 10, 3: 1 },
        strugure: { 5: 50, 4: 10, 3: 1 },
        clopotel: { 5: 20, 4: 5, 3: 1 },
        pruna: { 5: 10, 4: 3, 3: 1 },
        portocala: { 5: 10, 4: 3, 3: 1 },
        lamaie: { 5: 10, 4: 3, 3: 1 },
        cireasa: { 5: 10, 4: 3, 3: 1 }
    };

    const paytableOrder = ['sapte', 'pepene', 'strugure', 'clopotel', 'pruna', 'portocala', 'lamaie', 'cireasa'];

    const paylines = [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
        [2, 2, 2, 2, 2],
        [3, 3, 3, 3, 3],
        [0, 1, 2, 1, 0],
        [3, 2, 1, 2, 3],
        [0, 0, 1, 2, 2],
        [3, 3, 2, 1, 1],
        [1, 0, 0, 0, 1],
        [2, 3, 3, 3, 2],
        [0, 1, 1, 1, 0],
        [3, 2, 2, 2, 3],
        [1, 0, 1, 2, 1],
        [2, 3, 2, 1, 2],
        [0, 1, 0, 1, 0],
        [3, 2, 3, 2, 3],
        [1, 1, 0, 1, 1],
        [2, 2, 3, 2, 2],
        [0, 2, 0, 2, 0],
        [3, 1, 3, 1, 3],
        [0, 2, 3, 2, 0],
        [3, 1, 0, 1, 3],
        [0, 0, 2, 3, 3],
        [3, 3, 1, 0, 0],
        [1, 2, 3, 2, 1],
        [2, 1, 0, 1, 2],
        [0, 3, 0, 3, 0],
        [3, 0, 3, 0, 3],
        [1, 3, 1, 3, 1],
        [2, 0, 2, 0, 2],
        [0, 1, 2, 3, 3],
        [3, 2, 1, 0, 0],
        [1, 0, 2, 3, 1],
        [2, 3, 1, 0, 2],
        [0, 2, 2, 2, 0],
        [3, 1, 1, 1, 3],
        [1, 2, 2, 2, 1],
        [2, 1, 1, 1, 2],
        [0, 3, 2, 1, 0],
        [3, 0, 1, 2, 3]
    ];

    const lineColors = [
        { main: '#00e701', soft: 'rgba(0, 231, 1, 0.52)', glow: 'rgba(0, 231, 1, 0.74)', core: '#dcffdc' },
        { main: '#facc15', soft: 'rgba(250, 204, 21, 0.52)', glow: 'rgba(250, 204, 21, 0.72)', core: '#fff7ad' },
        { main: '#38bdf8', soft: 'rgba(56, 189, 248, 0.52)', glow: 'rgba(56, 189, 248, 0.72)', core: '#bae6fd' },
        { main: '#fb7185', soft: 'rgba(251, 113, 133, 0.52)', glow: 'rgba(251, 113, 133, 0.72)', core: '#ffe4e6' },
        { main: '#a78bfa', soft: 'rgba(167, 139, 250, 0.52)', glow: 'rgba(167, 139, 250, 0.72)', core: '#ede9fe' },
        { main: '#fb923c', soft: 'rgba(251, 146, 60, 0.52)', glow: 'rgba(251, 146, 60, 0.72)', core: '#ffedd5' },
        { main: '#2dd4bf', soft: 'rgba(45, 212, 191, 0.52)', glow: 'rgba(45, 212, 191, 0.72)', core: '#ccfbf1' },
        { main: '#e879f9', soft: 'rgba(232, 121, 249, 0.52)', glow: 'rgba(232, 121, 249, 0.72)', core: '#fae8ff' },
        { main: '#84cc16', soft: 'rgba(132, 204, 22, 0.52)', glow: 'rgba(132, 204, 22, 0.72)', core: '#ecfccb' },
        { main: '#f472b6', soft: 'rgba(244, 114, 182, 0.52)', glow: 'rgba(244, 114, 182, 0.72)', core: '#fce7f3' }
    ];

    const LINE_OPTIONS = [10];
    const REEL_ROWS = 4;

    function activePaylines() {
        return paylines.slice(0, state.lines);
    }

    function normalizeLines(value) {
        const parsed = Number(value);
        return LINE_OPTIONS.includes(parsed) ? parsed : 10;
    }

    const MECHANICAL_REEL_STRIP_1_5 = ['cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'clopotel', 'clopotel', 'clopotel', 'pepene', 'pepene', 'strugure', 'strugure', 'sapte', 'sapte', 'stea', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'clopotel', 'clopotel', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'stea', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'stea', 'sapte', 'sapte', 'clopotel', 'clopotel', 'pepene', 'pepene', 'strugure', 'strugure'];
    const MECHANICAL_REEL_STRIP_2 = ['coroana', 'coroana', 'coroana', 'coroana', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'clopotel', 'clopotel', 'clopotel', 'pepene', 'pepene', 'strugure', 'strugure', 'sapte', 'sapte', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'clopotel', 'clopotel', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'clopotel', 'clopotel', 'sapte', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'coroana', 'coroana', 'coroana', 'coroana'];
    const MECHANICAL_REEL_STRIP_3 = ['coroana', 'coroana', 'coroana', 'coroana', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'clopotel', 'clopotel', 'clopotel', 'pepene', 'pepene', 'strugure', 'strugure', 'sapte', 'sapte', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'clopotel', 'clopotel', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'cireasa', 'cireasa', 'cireasa', 'clopotel', 'clopotel', 'sapte', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'coroana', 'coroana', 'coroana', 'coroana'];
    const MECHANICAL_REEL_STRIP_4 = ['coroana', 'coroana', 'coroana', 'coroana', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'clopotel', 'clopotel', 'clopotel', 'pepene', 'pepene', 'strugure', 'strugure', 'sapte', 'sapte', 'coroana', 'coroana', 'coroana', 'coroana', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'clopotel', 'clopotel', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'clopotel', 'clopotel', 'sapte', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'coroana', 'coroana', 'coroana', 'coroana'];

    const MECHANICAL_REEL_STRIPS = [
        MECHANICAL_REEL_STRIP_1_5,
        MECHANICAL_REEL_STRIP_2,
        MECHANICAL_REEL_STRIP_3,
        MECHANICAL_REEL_STRIP_4,
        MECHANICAL_REEL_STRIP_1_5
    ];

    const SCATTER_REEL_INDEXES = new Set([0, 4]);
    const WILD_REEL_INDEXES = [1, 2, 3];
    const symbolsBase = new URL('symbols/', window.location.href);
    const soundsBase = new URL('sounds/', window.location.href);
    const sampleSoundVolumes = {
        bong: 0.3,
        linewin: 1,
        lose: 1
    };
    const sampleSoundFiles = {
        bong: 'bong.mp3',
        linewin: 'linewin.mp3',
        lose: '../../sounds/lose.mp3'
    };
    const sampleSoundCache = {};
    const fullSizeSymbols = new Set(['stea', 'coroana', 'sapte', 'pepene', 'strugure', 'clopotel', 'dolar']);

    const STOP_TIMEOUT_MS = 5000;

    const LEGACY_SPEED_KEY = 'forty_burn_hot_speed';

    function getGameSlug() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const gamesIdx = parts.indexOf('games');
        if (gamesIdx >= 0 && parts[gamesIdx + 1]) {
            return parts[gamesIdx + 1];
        }
        return '40-burn-hot';
    }

    function getSpeedPreferenceKey() {
        return `skill_slot_speed:${getGameSlug()}`;
    }

    const STOP_ALL_REEL_DELAY_MS = 25;

    const SPEED_PROFILES = {
        normal: {
            stopTimeoutMs: 5000,
            reelScrollMult: 1.45,
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
            reelScrollMult: 2.1,
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
            reelScrollMult: 2.9,
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

    const BET_BASE_VALUES = [0.1, 0.2, 0.5, 1, 1.5, 2, 3, 4, 5];
    const MIN_TOTAL_BET = 5;
    const MAX_TOTAL_BET = 20;
    const state = {
        credits: 0,
        bet: 0.1,
        betBaseIndex: 0,
        lines: 10,
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
        spinEpoch: 0,
        pendingHalfBetSettlement: null,
        halfBetOffer: {
            active: false,
            sessionId: null,
            gameId: null,
            betAmount: 0,
        },
        activeRound: null,
    };

    let audioCtx = null;

    function renderInfoPages() {
        const track = $('#vergaInfoTrack');
        const C = window.IqwinTerminalInfoPagesContent;
        if (!track || !C) return;

        const paySymbolScale = {
            sapte: 1.1
        };

        track.innerHTML = C.compose([
            C.symbolsPage({
                brandTitle: 'Wild Clover',
                layout: 'rows',
                cardLayout: 'stack',
                lead: 'Toate simbolurile platesc de la stanga la dreapta pe liniile selectate, incepand cu rola din stanga. Multiplicatorii din tabel se aplica la <strong>pariul total (bet)</strong> al rotirii.',
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
                        imageSrc: symbolSrc('stea'),
                        alt: 'Stea',
                        label: 'Stea Scatter',
                        wild: true,
                        symbolScale: 1.08,
                        notesLayout: 'spread',
                        notes: ['Doar pe R1 si R5', 'Simbol scatter special']
                    }),
                    C.renderPayCard({
                        imageSrc: symbolSrc('coroana'),
                        alt: 'Coroana',
                        label: 'Coroana Wild',
                        wild: true,
                        symbolScale: 0.78,
                        notesLayout: 'spread',
                        notes: ['Doar pe R2, R3 si R4', 'Wild doar in casuta, fara extindere']
                    })
                ]
            }),
            C.linesPage({
                lead: '10 linii fixe de plata. Toate liniile sunt active la fiecare rotire.',
                paylines: activePaylines(),
                reelRows: REEL_ROWS,
                paylinesClass: 'terminal-info-pages__paylines--all',
                rules: [
                    'Castig = multiplicator x pariul total (bet). Pariul total = pariu pe linie x 10 linii fixe.',
                    '5 role, 4 randuri, 10 linii fixe. Opreste manual fiecare rola pentru control maxim asupra rezultatului.',
                    'Coroana Wild inlocuieste simbolul doar in casuta unde apare, fara extindere pe coloana.',
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
                title: 'Mini-joc TheTimeMini',
                lead: 'Dupa o rotire fara castig, poti incerca recuperarea partiala prinzand timpul tinta.',
                badgeHtml: C.textBadge('Time', 'T'),
                paragraphs: [
                    'Ai 10 secunde pentru a opri ceasul cat mai aproape de timpul tinta afisat.',
                    'Cu cat esti mai precis, cu atat sansele de recuperare cresc.',
                    'Daca prinzi timpul tinta, primesti inapoi <strong>50% din pariul rotirii</strong> care a activat mini-jocul.',
                    'Dupa o rotire fara plata, butonul The Time devine activ si poti deschide mini-jocul.'
                ]
            }),
            C.skillPage({
                gameTitle: 'Wild Clover',
                lead: 'Wild Clover nu este un joc de noroc. Rezultatul depinde de deciziile si abilitatile jucatorului.',
                mainCardText: 'Opresti manual fiecare rola. Momentul si ordinea opririlor iti apartin, iar aceste decizii influenteaza direct rezultatul rotirii.',
                miniCardTitle: 'Mini-joc TheTimeMini',
                miniCardText: 'Recuperarea depinde de precizia ta la oprirea ceasului, nu de hazard.',
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
        return win.count >= 4;
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
            playTone({ frequency: 440, endFrequency: 660, duration: 0.12, type: 'sine', gain: 0.07 });
            playTone({ frequency: 660, endFrequency: 880, duration: 0.14, type: 'sine', gain: 0.06, delayTime: 0.08 });
            playTone({ frequency: 880, endFrequency: 1175, duration: 0.16, type: 'triangle', gain: 0.05, delayTime: 0.16 });
            return;
        }

        if (name === 'stea') {
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
            state.soundEnabled = localStorage.getItem('forty_burn_hot_mute') !== '1';
            const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
            if (savedVolume !== null && savedVolume !== '') {
                state.soundVolume = Math.max(0, Math.min(100, Number(savedVolume) || 0));
                state.soundEnabled = state.soundVolume > 0;
            }
            state.playStopMode = localStorage.getItem('forty_burn_hot_play_stop') === '1';
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
            localStorage.setItem('forty_burn_hot_mute', state.soundEnabled ? '0' : '1');
        } catch (error) {
        }
    
        saveVolumePreference();
    }

    function savePlayStopPreference() {
        try {
            localStorage.setItem('forty_burn_hot_play_stop', state.playStopMode ? '1' : '0');
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
        return new URL(symbolFiles[key] || 'q.webp', symbolsBase).href;
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

    function symbolImageScale(symbol) {
        if (symbol === 'pepene' || symbol === 'strugure') return '96%';
        if (symbol === 'portocala' || symbol === 'lamaie' || symbol === 'cireasa') return '99%';
        if (symbol === 'stea' || symbol === 'coroana' || symbol === 'sapte' || symbol === 'dolar') return '100%';
        return '98%';
    }

    function applyUniformCellStyle(cell) {
        if (!cell) return;
        cell.style.removeProperty('background-color');
        cell.style.setProperty('overflow', 'hidden', 'important');
        cell.style.setProperty('display', 'grid', 'important');
        cell.style.setProperty('place-items', 'center', 'important');
        cell.style.setProperty('align-content', 'center', 'important');
        cell.style.setProperty('justify-content', 'center', 'important');
    }

    function applyUniformImageStyle(image) {
        if (!image) return;
        const symbol = image.dataset.symbol || '';
        const cell = image.closest('.boss-crown-cell');
        const isStackedWild = symbol === 'coroana' && WILD_REEL_INDEXES.includes(Number(cell?.closest('.boss-crown-reel')?.dataset?.reel));
        const size = isStackedWild ? '88%' : symbolImageScale(symbol);
        image.style.setProperty('width', 'auto', 'important');
        image.style.setProperty('height', size, 'important');
        image.style.setProperty('max-width', size, 'important');
        image.style.setProperty('max-height', size, 'important');
        image.style.setProperty('object-fit', 'contain', 'important');
        image.style.setProperty('object-position', 'center center', 'important');
        image.style.setProperty('display', 'block', 'important');
        image.style.setProperty('margin', 'auto', 'important');
        image.style.setProperty('position', 'relative', 'important');
    }

    function applyUniformStyles() {
        $$('.boss-crown-cell, .boss-crown-spin-strip-item').forEach(applyUniformCellStyle);
        $$('.boss-crown-cell img, .boss-crown-spin-strip-item img').forEach(applyUniformImageStyle);
    }

    function setCellSymbol(cell, key) {
        const image = cell.querySelector('img');
        if (!image) return;
        image.dataset.symbol = key;
        image.src = symbolSrc(key);
        applyUniformCellStyle(cell);
        applyUniformImageStyle(image);
    }

    function getMechanicalReelStrip(reelIndex) {
        return MECHANICAL_REEL_STRIPS[reelIndex] || MECHANICAL_REEL_STRIPS[0];
    }

    function readMechanicalColumn(reelIndex, stopIndex) {
        const strip = getMechanicalReelStrip(reelIndex);
        const top = ((stopIndex % strip.length) + strip.length) % strip.length;
        return [0, 1, 2, 3].map((row) => strip[(top + row) % strip.length]);
    }

    function columnsMatch(left, right) {
        if (!Array.isArray(left) || !Array.isArray(right) || left.length !== REEL_ROWS || right.length !== REEL_ROWS) {
            return false;
        }
        for (let row = 0; row < REEL_ROWS; row += 1) {
            if (left[row] !== right[row]) {
                return false;
            }
        }
        return true;
    }

    function normalizeSpinStopIndex(spinLength, stopIndex) {
        if (!Number.isFinite(stopIndex) || spinLength <= 0) {
            return 0;
        }
        return ((Math.round(stopIndex) % spinLength) + spinLength) % spinLength;
    }

    function findStopIndexForColumn(reelIndex, column, preferred = null) {
        if (!Array.isArray(column) || column.length !== REEL_ROWS) {
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
            const normalizedPreferred = wrapStopIndex(reelIndex, preferred);
            if (matches.includes(normalizedPreferred)) {
                return normalizedPreferred;
            }
            return matches.reduce((best, candidate) => (
                Math.abs(candidate - normalizedPreferred) < Math.abs(best - normalizedPreferred) ? candidate : best
            ));
        }
        return matches[0];
    }

    function randomReelColumn(reelIndex) {
        const strip = getMechanicalReelStrip(reelIndex);
        const stopIndex = Math.floor(Math.random() * strip.length);
        return readMechanicalColumn(reelIndex, stopIndex);
    }

    function createEmptyRoundBoard() {
        return Array.from({ length: 5 }, () => null);
    }

    const stripScrollLoops = new WeakMap();
    const STRIP_LOOP_TAIL = REEL_ROWS;

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

    function freezeReelOnStop(reelIndex) {
        const reelNode = $(`.boss-crown-reel[data-reel="${reelIndex}"]`);
        if (!reelNode) return;
        stopStripScroll(reelNode);
        reelNode.classList.add('is-reel-freezing');
    }

    function prepareReelStripSymbols(reelIndex) {
        let base = getMechanicalReelStrip(reelIndex).slice();
        if (!SCATTER_REEL_INDEXES.has(reelIndex)) {
            base = base.filter((symbol) => symbol !== 'stea');
        }
        if (!WILD_REEL_INDEXES.includes(reelIndex)) {
            base = base.filter((symbol) => symbol !== 'coroana');
        }
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

    function wrapStopIndex(reelIndex, stopIndex) {
        const strip = getMechanicalReelStrip(reelIndex);
        return ((stopIndex % strip.length) + strip.length) % strip.length;
    }

    function normalizeRoundStopIndexes(stops) {
        if (!Array.isArray(stops) || stops.length < 5) {
            return null;
        }
        const normalized = [];
        for (let reelIndex = 0; reelIndex < 5; reelIndex += 1) {
            const raw = Number(stops[reelIndex]);
            if (!Number.isFinite(raw)) {
                return null;
            }
            normalized.push(wrapStopIndex(reelIndex, Math.floor(raw)));
        }
        return normalized;
    }

    function getStripLengths() {
        return [0, 1, 2, 3, 4].map((reelIndex) => getMechanicalReelStrip(reelIndex).length);
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

    function readSettledColumnFromStrip(reelNode, reelIndex) {
        const strip = reelNode.querySelector('.boss-crown-spin-strip');
        if (!strip || !strip.children.length) return null;

        const rowHeight = getStripRowHeight(strip);
        if (rowHeight <= 0) return null;

        const spinLength = Number(strip.dataset.spinLength) || getMechanicalReelStrip(reelIndex).length;
        let spinStopIndex = null;
        if (strip.dataset.resolvedStopIndex !== undefined && strip.dataset.resolvedStopIndex !== '') {
            spinStopIndex = normalizeSpinStopIndex(spinLength, Number(strip.dataset.resolvedStopIndex));
        } else {
            let offset = readStripOffset(strip, reelNode);
            const loopHeight = rowHeight * spinLength;
            while (offset >= loopHeight) offset -= loopHeight;
            spinStopIndex = normalizeSpinStopIndex(spinLength, Math.floor(offset / rowHeight));
        }

        const column = Array.from({ length: REEL_ROWS }, (_, row) => {
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
            return wrapStopIndex(reelIndex, Number(strip.dataset.resolvedStopIndex));
        }

        const rowHeight = getStripRowHeight(strip);
        if (rowHeight <= 0) return null;

        const spinLength = Number(strip.dataset.spinLength) || getMechanicalReelStrip(reelIndex).length;
        const loopHeight = rowHeight * spinLength;
        let offset = readStripOffset(strip, reelNode);
        while (offset >= loopHeight) offset -= loopHeight;

        const topIndex = Math.round(offset / rowHeight);
        return wrapStopIndex(reelIndex, topIndex);
    }

    function readReelOutcomeFromStrip(reelNode, reelIndex) {
        let stopIndex = readReelStopIndex(reelNode, reelIndex);
        const strip = reelNode.querySelector('.boss-crown-spin-strip');
        if (stopIndex === null && strip?.dataset.resolvedStopIndex !== undefined && strip.dataset.resolvedStopIndex !== '') {
            stopIndex = wrapStopIndex(reelIndex, Number(strip.dataset.resolvedStopIndex));
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

            const reelIndex = Number(reelNode.dataset.reel || 0);
            const spinLength = Number(strip.dataset.spinLength) || getMechanicalReelStrip(reelIndex).length;
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
            const spinStopIndex = normalizeSpinStopIndex(spinLength, Math.floor(to / rowHeight));

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
        strip.style.height = `calc(${symbols.length} * (100% / ${REEL_ROWS}))`;
        strip.style.gridTemplateRows = `repeat(${symbols.length}, calc(100% / ${symbols.length}))`;

        symbols.forEach((symbol) => {
            const item = document.createElement('div');
            item.className = 'boss-crown-spin-strip-item';
            applyUniformCellStyle(item);
            const image = document.createElement('img');
            image.src = symbolSrc(symbol);
            image.alt = '';
            image.dataset.symbol = symbol;
            image.loading = 'eager';
            applyUniformImageStyle(image);
            item.append(image);
            strip.append(item);
        });

        reel.append(strip);
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

    function shouldShowHalfBetOffer(settledWin, sourceRound = null) {
        if (isContestHalfBetBlocked()) return false;
        const round = sourceRound || state.activeRound;
        const betAmount = Number(round?.betAmount || totalBetAmount());
        return settledWin <= 0 && betAmount > 0;
    }

    function captureOfferSnapshot() {
        const betAmount = Number(state.activeRound?.betAmount ?? totalBetAmount());
        if (betAmount <= 0) return null;
        return {
            sessionId: state.activeRound?.sessionId ?? state.sessionId ?? null,
            gameId: state.activeRound?.gameId ?? state.gameId,
            betAmount,
        };
    }

    function tryApplySettledHalfBetOffer(settledWin, sourceRound, settleEpoch) {
        if (settleEpoch !== state.spinEpoch) return;
        if (settledWin <= 0 && sourceRound) {
            state.pendingHalfBetSettlement = {
                settledWin,
                snapshot: sourceRound,
                settleEpoch,
            };
        } else {
            state.pendingHalfBetSettlement = null;
        }
        finalizeHalfBetOffer(settledWin, sourceRound);
    }

    function finalizeHalfBetOffer(settledWin, sourceRound = null) {
        if (shouldShowHalfBetOffer(settledWin, sourceRound)) {
            activateHalfBetOffer(sourceRound);
        } else {
            clearHalfBetOffer();
        }
    }

    function consumeHalfBetOffer() {
        state.halfBetOffer = { active: false, sessionId: null, gameId: null, betAmount: 0 };
        state.pendingHalfBetSettlement = null;
        updateHalfButton();
    }

    function clearHalfBetOffer({ closeQuiz = true } = {}) {
        state.halfBetOffer = { active: false, sessionId: null, gameId: null, betAmount: 0 };
        state.pendingHalfBetSettlement = null;
        updateHalfButton();
        if (closeQuiz && window.TheTimeMini) {
            TheTimeMini.close();
        }
    }

    function activateHalfBetOffer(sourceRound = null) {
        if (isContestHalfBetBlocked()) {
            clearHalfBetOffer({ closeQuiz: true });
            return;
        }
        const round = sourceRound || state.activeRound;
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
        const pending = state.pendingHalfBetSettlement;
        if (!state.halfBetOffer?.active && pending && pending.settleEpoch === state.spinEpoch && pending.settledWin <= 0) {
            activateHalfBetOffer(pending.snapshot);
        }
        const hasOffer = Boolean(state.halfBetOffer?.active);
        const canOpen = hasOffer && !state.spinning;
        btn.classList.toggle('is-hidden', !hasOffer);
        btn.disabled = !canOpen;
        btn.classList.toggle('is-half-ready', canOpen);
        btn.classList.toggle('is-half-pending', hasOffer && !canOpen);
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
            if (!btn) return;
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

    function columnHasScatter(column) {
        return Array.isArray(column) && column.includes('stea');
    }

    function clearWildReelVisuals() {
        $$('.boss-crown-reel').forEach((reel) => {
            reel.classList.remove('is-locked-wild-reel', 'is-wild-expanding-reel', 'has-wild-line-win', 'has-expanded-wild', 'has-stacked-wild');
        });
        $$('.boss-crown-cell').forEach((cell) => {
            cell.classList.remove('is-wild-source', 'is-wild-expanded-cell', 'is-wild-line-win');
        });
    }

    function refreshNaturalWildReels(board = state.roundBoard) {
        if (!Array.isArray(board)) return;
        WILD_REEL_INDEXES.forEach((reelIndex) => {
            const reelNode = $(`.boss-crown-reel[data-reel="${reelIndex}"]`);
            const column = board[reelIndex];
            if (!reelNode || !Array.isArray(column)) return;
            const allWild = column.length >= REEL_ROWS && column.slice(0, REEL_ROWS).every((symbol) => symbol === 'coroana');
            reelNode.classList.toggle('has-stacked-wild', allWild);
        });
    }

    function scatterPositions(board) {
        const positions = [];
        board.forEach((column, reel) => {
            if (!SCATTER_REEL_INDEXES.has(reel)) return;
            column.forEach((symbol, row) => {
                if (symbol === 'stea') positions.push(`${reel}-${row}`);
            });
        });
        return positions;
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

    function isWildSymbol(symbol) {
        return symbol === 'coroana';
    }

    function evaluatePayline(board, lineRows) {
        const symbols = [];
        for (let reel = 0; reel < 5; reel += 1) {
            symbols.push(board[reel][lineRows[reel]]);
        }

        let target = null;
        for (const symbol of symbols) {
            if (!isWildSymbol(symbol)) {
                target = symbol;
                break;
            }
        }

        let matched = 0;
        for (const symbol of symbols) {
            if (isWildSymbol(symbol)) {
                matched += 1;
                continue;
            }
            if (target === null) {
                target = symbol;
                matched += 1;
                continue;
            }
            if (symbol === target) {
                matched += 1;
                continue;
            }
            break;
        }

        const minMatch = 3;
        if (!target || matched < minMatch) {
            return null;
        }

        const multiplier = paytable[target]?.[matched];
        if (!multiplier) return null;
        const payout = calcWinPayout(multiplier);
        if (payout <= 0) return null;

        return {
            symbol: target,
            count: matched,
            payout,
            positions: lineRows.slice(0, matched).map((row, reel) => `${reel}-${row}`)
        };
    }

    function evaluateBoard(board) {
        const wins = [];
        let total = 0;

        activePaylines().forEach((lineRows, index) => {
            const lineWin = evaluatePayline(board, lineRows);
            if (!lineWin) return;
            total += lineWin.payout;
            wins.push({
                line: index + 1,
                symbol: lineWin.symbol,
                count: lineWin.count,
                payout: lineWin.payout,
                positions: lineWin.positions
            });
        });

        return { wins, total: roundBet(total) };
    }

    function resetWinVisuals() {
        $$('.boss-crown-cell.is-winning, .boss-crown-cell.is-line-symbol-active, .boss-crown-cell.is-line-symbol-loop, .boss-crown-cell.is-wild-line-win').forEach((cell) => {
            cell.classList.remove('is-winning', 'is-line-symbol-active', 'is-line-symbol-loop', 'is-wild-line-win');
            cell.style.removeProperty('--boss-crown-line-color');
            cell.style.removeProperty('--boss-crown-line-soft');
            cell.style.removeProperty('--boss-crown-line-glow');
            cell.style.removeProperty('--boss-crown-line-core');
            const img = cell.querySelector('img');
            if (img) {
                img.style.animation = 'none';
                void img.offsetWidth;
                img.style.removeProperty('animation');
            }
            void cell.offsetWidth;
        });
        $$('.boss-crown-reel.has-win, .boss-crown-reel.has-wild-line-win').forEach((reel) => {
            reel.classList.remove('has-win', 'has-wild-line-win');
        });
        const overlay = $('#paylineOverlay');
        if (overlay) {
            overlay.replaceChildren();
            overlay.style.visibility = 'hidden';
            void overlay.offsetWidth;
            overlay.style.removeProperty('visibility');
        }
    }

    function clearWinHighlights() {
        state.winCycleId += 1;
        resetWinVisuals();
    }

    function clearScatterPulseTimers() {
        state.scatterPulseTimers.forEach((timer) => window.clearTimeout(timer));
        state.scatterPulseTimers = [];
    }

    function clearScatterPulses() {
        clearScatterPulseTimers();
        $$('.boss-crown-cell img[data-symbol="stea"]').forEach((image) => {
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
        if (type === 'stea') {
            if (!loop) {
                window.setTimeout(() => {
                    cell.classList.remove('is-special-reveal', 'is-dollar-reveal', 'is-star-reveal');
                }, 1180);
                return;
            }
            const pulseScatter = () => {
                if (!cell.isConnected || cell.querySelector('img')?.dataset.symbol !== 'stea') return;
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
        if (!SCATTER_REEL_INDEXES.has(reelIndex)) return;
        const reelHasScatter = column.includes('stea');
        if (!reelHasScatter) return;

        state.resolvedScatterCount += column.filter((symbol) => symbol === 'stea').length;
        playSampleSound('bong');

        const loopScatterAnimation = state.resolvedScatterCount >= 3;
        column.forEach((symbol, row) => {
            if (symbol !== 'stea') return;
            animateSpecialSymbol($(`[data-position="${reelIndex}-${row}"]`), 'stea', loopScatterAnimation);
        });

        if (loopScatterAnimation) {
            $$('.boss-crown-cell img[data-symbol="stea"]').forEach((image) => {
                const cell = image.closest('.boss-crown-cell');
                if (!cell) return;
                const cellReel = Number(String(cell.dataset.position || '0-0').split('-')[0]);
                if (cellReel === reelIndex) return;
                animateSpecialSymbol(cell, 'stea', true);
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
            cell.style.setProperty('--boss-crown-line-core', color.core);
            cell.classList.add('is-winning');
            if (cell.querySelector('img[data-symbol="coroana"]')) {
                cell.classList.add('is-wild-line-win');
                cell.closest('.boss-crown-reel')?.classList.add('has-wild-line-win');
            }
            const reelIndex = String(position).split('-')[0];
            $(`.boss-crown-reel[data-reel="${reelIndex}"]`)?.classList.add('has-win');
        });
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
                const positions = Array.isArray(win.positions) ? win.positions : [];
                const cells = positions.map((position) => {
                    const cell = $(`[data-position="${position}"]`);
                    if (!cell) return null;
                    const rect = cell.getBoundingClientRect();
                    return {
                        left: rect.left - overlayRect.left,
                        right: rect.right - overlayRect.left,
                        top: rect.top - overlayRect.top,
                        bottom: rect.bottom - overlayRect.top,
                        x: rect.left - overlayRect.left + rect.width / 2,
                        y: rect.top - overlayRect.top + rect.height / 2,
                        width: rect.width,
                        height: rect.height
                    };
                }).filter(Boolean);

                if (cells.length < 2) return '';

                const delay = `${Math.min(index * 0.14, 0.56).toFixed(2)}s`;
                const color = getLineColor(win, index);
                const style = `--boss-crown-line-color:${color.main};--boss-crown-line-soft:${color.soft};--boss-crown-line-glow:${color.glow};--boss-crown-line-core:${color.core};animation-delay:${delay}`;

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

    function showActiveWinLine(win, index = 0) {
        resetWinVisuals();
        const color = getLineColor(win, index);
        markWins(win.positions, color);
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

    async function playWinCycle(wins) {
        const cycleId = ++state.winCycleId;
        const isCurrentCycle = () => state.winCycleId === cycleId;
        const speedProfile = getSpeedProfile();
        const payableLines = wins.filter((win) => win.line > 0 && win.payout > 0 && win.positions.length >= 2);
        const scatterWins = wins.filter((win) => win.line === 0);
        const lineShowDuration = 2000;

        if (!payableLines.length) {
            if (scatterWins.length) {
                const positions = scatterWins.flatMap((win) => win.positions);
                markWins(positions, lineColors[0]);
                await delay(speedProfile.winScatterHold);
            }
            return;
        }

        if (hasLineWinSound(payableLines)) {
            playSampleSound('linewin');
        }

        while (isCurrentCycle()) {
            for (let index = 0; index < payableLines.length; index += 1) {
                if (!isCurrentCycle()) return;
                showActiveWinLine(payableLines[index], index);
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
        markStopButtonUsed(stopBtn);
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

            removeSpinStrip(reelNode);
            reelNode.classList.remove('is-spinning', 'is-reel-settling', 'is-reel-freezing');

            state.stoppedReels.add(reelIndex);
            updateSpinButton();
            if (column.includes('stea')) {
                revealScatterOnReel(reelIndex, column);
            } else {
                playGameSound('stop');
            }
        } finally {
            revealingReels.delete(reelIndex);
        }
    }

    async function finishRound(result) {
        const settleEpoch = state.spinEpoch;
        const roundBetAmount = totalBetAmount();
        const winAmount = result.total;
        const reelStops = normalizeRoundStopIndexes(state.roundStopIndexes);
        const serverLinked = hasTerminalServer();
        const skillStopUsed = state.skillStopSatisfied || isSkillStopSatisfied();
        const forfeitWin = winAmount > 0 && !skillStopUsed;
        const lastWinNode = $('#lastWinValue');

        let creditedWin = forfeitWin ? 0 : winAmount;
        let overlayWin = 0;
        let settlement = null;
        const offerRoundSnapshot = creditedWin <= 0 ? captureOfferSnapshot() : null;

        if (winAmount > 0) {
            if (!serverLinked) {
                if (!hasLineWinSound(result.wins)) {
                    playGameSound('win');
                }
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
            if (!reelStops) {
                showMessage('Eroare sincronizare runda.');
                creditedWin = 0;
                if (window.IqwinTerminalRoundSync && state.sessionId) {
                    IqwinTerminalRoundSync.clearPendingRound(state.gameId, state.sessionId);
                }
                await loadCredits();
            } else {
                settlement = await IqwinTerminalRoundSync.settleRound({
                    gameId: state.gameId,
                    getSessionId: () => state.sessionId,
                    setSessionId: (id) => { state.sessionId = id; },
                    reelStops,
                    stripLengths: getStripLengths(),
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
            }
            tryApplySettledHalfBetOffer(creditedWin, offerRoundSnapshot, settleEpoch);
        } else {
            tryApplySettledHalfBetOffer(creditedWin, offerRoundSnapshot, settleEpoch);
            if (creditedWin > 0) {
                overlayWin = creditedWin;
            }
        }

        tryApplySettledHalfBetOffer(creditedWin, offerRoundSnapshot, settleEpoch);

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
        updateHalfButton();

        if (window.IqwinTerminalGoldenBubble) {
            window.IqwinTerminalGoldenBubble.onSpinComplete(roundBetAmount);
        }

        if (forfeitWin && winAmount > 0 && window.IqwinTerminalSpinWinOverlay) {
            window.IqwinTerminalSpinWinOverlay.show(winAmount, {
                formatted: formatBalanceNumber(toDisplayCredits(winAmount)),
                forfeit: true,
                skillStopUsed: false,
                allowBigWin: false,
                betAmount: roundBetAmount,
                soundEnabled: state.soundEnabled,
                soundVolume: getSoundVolumeMultiplier()
            });
            void playWinCycle(result.wins);
        } else if (overlayWin > 0) {
            if (serverLinked && settlement?.syncOk) {
                if (!hasLineWinSound(result.wins)) {
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
            void playWinCycle(result.wins);
        }
    }

    async function onAllReelsStopped() {
        if (state.finishingRound) return;
        if (!state.roundBoard || state.roundBoard.some((column) => !column)) return;
        state.finishingRound = true;
        try {
            const board = state.roundBoard.map((column) => column.slice());
            refreshNaturalWildReels(board);
            const result = evaluateBoard(board);
            state.skillStopSatisfied = state.skillStopSatisfied || isSkillStopSatisfied();
            await finishRound(result);
        } finally {
            state.finishingRound = false;
            updateHalfButton();
        }
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
        clearWildReelVisuals();
        resetSkillStopTracking();
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
        state.spinEpoch += 1;
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
        clearWildReelVisuals();
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
        if (window.TheTimeMini) {
            TheTimeMini.open();
        }
    }

    function handleSpinButtonClick() {
        if (window.IqwinTerminalSpinWinOverlay && window.IqwinTerminalSpinWinOverlay.isBigWinActive()) return;
        if (state.spinning) {
            if (!state.playStopMode && !state.finishingRound && state.sessionReady && state.manualStopReels.size === 0) {
                state.stopAllUsed = true;
                state.skillStopSatisfied = true;
                if (state.stoppedReels.size < 5) {
                    stopAllReelsManual();
                }
            }
            return;
        }
        clearWinHighlights();
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

    async function handleStopClick(reelIndex) {
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
                playPopSound: () => {
                    if (!state.soundEnabled) return;
                    ensureAudio();
                    try {
                        const audio = new Audio(new URL('../dodge-bomb/sounds/bomba.mp3', window.location.href).href);
                        audio.volume = 0.88 * getSoundVolumeMultiplier();
                        audio.play().catch(() => {});
                    } catch (error) {
                    }
                },
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
    loadPreferences();
    renderInfoPages();
    bindEvents();
    if (window.TheTimeMini) {
        TheTimeMini.init({
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
    try {
        if (!sessionStorage.getItem('iqwin_wc_pending_reset_v74')) {
            if (window.IqwinTerminalRoundSync) {
                IqwinTerminalRoundSync.clearAllPendingRounds(state.gameId);
            } else {
                sessionStorage.removeItem('iqwin_pending_round_sync');
            }
            sessionStorage.setItem('iqwin_wc_pending_reset_v74', '1');
        }
    } catch (error) {
    }
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
