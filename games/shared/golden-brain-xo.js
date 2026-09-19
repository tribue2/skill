(function (window) {
    'use strict';

    const PLAYER = 'X';
    const CPU = 'O';
    const WIN_LINES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];
    const LINE_COORDS = [
        { x1: 11, y1: 17, x2: 89, y2: 17 },
        { x1: 11, y1: 50, x2: 89, y2: 50 },
        { x1: 11, y1: 83, x2: 89, y2: 83 },
        { x1: 17, y1: 11, x2: 17, y2: 89 },
        { x1: 50, y1: 11, x2: 50, y2: 89 },
        { x1: 83, y1: 11, x2: 83, y2: 89 },
        { x1: 14, y1: 14, x2: 86, y2: 86 },
        { x1: 86, y1: 14, x2: 14, y2: 86 },
    ];
    const CPU_LENIENT_ROUND_CHANCE = 0.5;
    const CPU_OPTIMAL_CHANCE = 0.82;
    const CPU_THINK_MS = 520;
    const CLOSE_AFTER_WIN_MS = 5000;
    const CLOSE_AFTER_LOSE_MS = 1800;

    let activeSfx = null;
    let cells = [];
    let nextGameStarter = 'player';

    const state = {
        open: false,
        locked: false,
        offerMode: false,
        board: Array(9).fill(''),
        cpuLenient: false,
        starter: 'player',
        closeTimer: null,
        isBlocked: () => false,
        getOffer: () => null,
        formatCredits: (value) => String(value),
        onRefundApplied: null,
        onOfferConsumed: null,
        isSoundEnabled: () => true,
    };

    function $(selector, root) {
        return (root || document).querySelector(selector);
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
                'X-Terminal-Secret': credentials.api_secret,
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

    function playWinSfx() {
        stopSfx();
        playSfx('next.mp3');
    }

    function playLoseSfx() {
        playSfx('lose.mp3');
    }

    function playMoveSfx() {
        if (!state.isSoundEnabled()) return;
        try {
            const ctx = window.AudioContext || window.webkitAudioContext;
            if (!ctx) return;
            const audioCtx = new ctx();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 620;
            gain.gain.value = 0.04;
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
            osc.stop(audioCtx.currentTime + 0.07);
        } catch (error) {}
    }

    function checkWinner(board) {
        for (const line of WIN_LINES) {
            const [a, b, c] = line;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return { winner: board[a], line };
            }
        }
        if (board.every((cell) => cell !== '')) {
            return { winner: null, line: null, draw: true };
        }
        return null;
    }

    function emptyCells(board) {
        return board
            .map((cell, index) => (cell === '' ? index : -1))
            .filter((index) => index >= 0);
    }

    function checkWinForMark(board, mark) {
        return WIN_LINES.some(([a, b, c]) => board[a] === mark && board[b] === mark && board[c] === mark);
    }

    function minimaxScore(board, depth, isMaximizing) {
        if (checkWinForMark(board, CPU)) return 10 - depth;
        if (checkWinForMark(board, PLAYER)) return depth - 10;
        if (emptyCells(board).length === 0) return 0;

        if (isMaximizing) {
            let best = -Infinity;
            for (const index of emptyCells(board)) {
                board[index] = CPU;
                best = Math.max(best, minimaxScore(board, depth + 1, false));
                board[index] = '';
            }
            return best;
        }

        let best = Infinity;
        for (const index of emptyCells(board)) {
            board[index] = PLAYER;
            best = Math.min(best, minimaxScore(board, depth + 1, true));
            board[index] = '';
        }
        return best;
    }

    function getRankedMoves(board) {
        const moves = [];
        for (const index of emptyCells(board)) {
            board[index] = CPU;
            const score = minimaxScore(board, 0, false);
            board[index] = '';
            moves.push({ index, score });
        }
        moves.sort((a, b) => b.score - a.score);
        return moves;
    }

    function findInstantWin(board, mark) {
        for (const index of emptyCells(board)) {
            board[index] = mark;
            const won = checkWinForMark(board, mark);
            board[index] = '';
            if (won) return index;
        }
        return -1;
    }

    function pickRandomMove(board, pool) {
        const choices = pool && pool.length ? pool : emptyCells(board);
        if (!choices.length) return -1;
        return choices[Math.floor(Math.random() * choices.length)];
    }

    function pickLenientCpuMove(board) {
        const free = emptyCells(board);
        if (!free.length) return -1;

        const ranked = getRankedMoves(board);
        const weakMoves = ranked.length > 1
            ? ranked.slice(Math.ceil(ranked.length / 2)).map((move) => move.index)
            : ranked.map((move) => move.index);

        const playerWin = findInstantWin(board, PLAYER);
        if (playerWin >= 0 && Math.random() < 0.2) {
            return playerWin;
        }

        const cpuWin = findInstantWin(board, CPU);
        if (cpuWin >= 0 && Math.random() < 0.45) {
            return cpuWin;
        }

        if (weakMoves.length > 0 && Math.random() < 0.75) {
            return pickRandomMove(board, weakMoves);
        }

        return pickRandomMove(board, free);
    }

    function pickStrictCpuMove(board) {
        const winNow = findInstantWin(board, CPU);
        if (winNow >= 0) return winNow;

        const block = findInstantWin(board, PLAYER);
        if (block >= 0) return block;

        const ranked = getRankedMoves(board);
        if (!ranked.length) return -1;

        if (Math.random() < CPU_OPTIMAL_CHANCE) {
            return ranked[0].index;
        }

        const alternatives = ranked.filter((move) => move.score >= ranked[0].score - 2);
        const pick = alternatives[Math.floor(Math.random() * alternatives.length)] || ranked[0];
        return pick.index;
    }

    function pickCpuMove(board) {
        if (state.cpuLenient) {
            return pickLenientCpuMove(board);
        }
        return pickStrictCpuMove(board);
    }

    function rollCpuDifficulty() {
        state.cpuLenient = Math.random() < CPU_LENIENT_ROUND_CHANCE;
    }

    function beginRoundStarter() {
        state.starter = nextGameStarter;
        nextGameStarter = nextGameStarter === 'player' ? 'cpu' : 'player';
    }

    async function playCpuTurn() {
        state.locked = true;
        cells.forEach((cell, cellIndex) => {
            if (!state.board[cellIndex]) cell.disabled = true;
        });
        setTurnActive(CPU);
        setStatus('Computer', 'Calculeaza mutarea...', null);
        setThinking(true);

        await new Promise((resolve) => window.setTimeout(resolve, CPU_THINK_MS));

        const cpuIndex = pickCpuMove(state.board);
        if (cpuIndex >= 0) {
            state.board[cpuIndex] = CPU;
            state.lastPlaced = cpuIndex;
            playMoveSfx();
            updateCell(cpuIndex);
        }

        setThinking(false);
        const result = checkWinner(state.board);

        if (result) {
            await endRound(result);
            return true;
        }

        state.locked = false;
        setTurnActive(PLAYER);
        setStatus('Mutarea ta', 'Selecteaza o patrata pe tabla', null);
        cells.forEach((cell, cellIndex) => {
            if (!state.board[cellIndex]) cell.disabled = state.isBlocked();
        });
        return false;
    }

    async function startCpuOpening() {
        setTurnActive(CPU);
        setStatus('Computer', 'Incepe runda', 'Asteapta prima mutare', null);
        state.locked = true;
        cells.forEach((cell) => { cell.disabled = true; });
        await playCpuTurn();
    }

    function createMarkElement(mark) {
        const node = document.createElement('span');
        node.className = `gb-xo-mark gb-xo-mark--${mark.toLowerCase()}`;
        node.setAttribute('aria-hidden', 'true');
        return node;
    }

    function setTurnActive(turn) {
        const you = $('#gbXoTurnYou');
        const cpu = $('#gbXoTurnCpu');
        if (you) you.classList.toggle('is-active', turn === PLAYER);
        if (cpu) cpu.classList.toggle('is-active', turn === CPU);
    }

    function setThinking(thinking) {
        $('#gbXoBoardWrap')?.classList.toggle('is-thinking', thinking);
    }

    function hideWinLine() {
        const svg = $('#gbXoWinLine');
        const line = svg?.querySelector('line');
        if (svg) svg.classList.remove('is-visible');
        if (line) {
            line.setAttribute('x1', '0');
            line.setAttribute('y1', '0');
            line.setAttribute('x2', '0');
            line.setAttribute('y2', '0');
        }
    }

    function showWinLine(winLine) {
        const lineIndex = WIN_LINES.findIndex(
            (line) => line[0] === winLine[0] && line[1] === winLine[1] && line[2] === winLine[2]
        );
        if (lineIndex < 0) return;

        const coords = LINE_COORDS[lineIndex];
        const svg = $('#gbXoWinLine');
        const line = svg?.querySelector('line');
        if (!svg || !line || !coords) return;

        line.setAttribute('x1', String(coords.x1));
        line.setAttribute('y1', String(coords.y1));
        line.setAttribute('x2', String(coords.x2));
        line.setAttribute('y2', String(coords.y2));
        svg.classList.add('is-visible');
    }

    function updateCell(index, { animate = true } = {}) {
        const cell = cells[index];
        if (!cell) return;

        const value = state.board[index];
        cell.disabled = state.locked || value !== '' || state.isBlocked();
        cell.classList.remove('is-x', 'is-o', 'is-filled', 'is-win');
        cell.innerHTML = '';

        if (!value) return;

        cell.classList.add('is-filled', value === PLAYER ? 'is-x' : 'is-o');
        const mark = createMarkElement(value);
        if (!animate) mark.style.animation = 'none';
        cell.appendChild(mark);
    }

    function highlightWinLine(winLine) {
        if (!winLine) return;
        const winSet = new Set(winLine);
        winLine.forEach((index) => {
            cells[index]?.classList.add('is-win');
        });
        showWinLine(winLine);
    }

    function buildBoard() {
        const boardNode = $('#gbXoBoard');
        if (!boardNode) return;

        boardNode.innerHTML = '';
        cells = [];

        for (let index = 0; index < 9; index += 1) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'gb-xo-cell';
            btn.dataset.index = String(index);
            btn.setAttribute('role', 'gridcell');
            btn.setAttribute('aria-label', `Casuta ${index + 1}`);
            btn.addEventListener('click', () => handleCellClick(index));
            boardNode.appendChild(btn);
            cells.push(btn);
        }
    }

    function renderBoard({ winLine = null, animateLast = true } = {}) {
        for (let index = 0; index < 9; index += 1) {
            const animate = animateLast && index === state.lastPlaced;
            updateCell(index, { animate });
        }
        if (winLine) highlightWinLine(winLine);
    }

    function setStatus(label, hint, type) {
        const node = $('#gbXoStatus');
        const labelNode = node?.querySelector('.gb-xo-status-label');
        const hintNode = node?.querySelector('.gb-xo-status-hint');
        if (!node) return;

        node.classList.remove('is-hidden', 'is-win', 'is-lose', 'is-draw');
        if (labelNode) labelNode.textContent = label || '';
        if (hintNode) hintNode.textContent = hint || '';

        if (!label && !hint) {
            node.classList.add('is-hidden');
            return;
        }

        if (type === 'win') node.classList.add('is-win');
        if (type === 'lose') node.classList.add('is-lose');
        if (type === 'draw') node.classList.add('is-draw');
    }

    function hideResultCard() {
        const card = $('#gbXoResult');
        if (!card) return;
        card.classList.add('is-hidden');
        card.classList.remove('is-win', 'is-lose', 'is-draw');
    }

    function showResultCard({ title, sub, type, icon }) {
        const card = $('#gbXoResult');
        const iconNode = $('#gbXoResultIcon');
        const titleNode = $('#gbXoResultTitle');
        const subNode = $('#gbXoResultSub');
        if (!card || !titleNode) return;

        hideResultCard();
        card.classList.remove('is-hidden');
        if (type) card.classList.add(type === 'win' ? 'is-win' : type === 'draw' ? 'is-draw' : 'is-lose');
        if (iconNode) iconNode.textContent = icon || '';
        titleNode.textContent = title || '';
        if (subNode) subNode.textContent = sub || '';
        setStatus('', '', null);
    }

    function updateOfferHint() {
        const prize = $('#gbXoOfferHint');
        const prizeValue = $('#gbXoPrizeValue');
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

    function resetGame() {
        state.board = Array(9).fill('');
        state.locked = false;
        state.lastPlaced = -1;
        rollCpuDifficulty();
        beginRoundStarter();
        hideWinLine();
        hideResultCard();
        setThinking(false);
        cells.forEach((cell) => {
            cell.classList.remove('is-x', 'is-o', 'is-filled', 'is-win');
            cell.innerHTML = '';
            cell.disabled = false;
        });

        if (state.starter === 'cpu') {
            window.setTimeout(() => {
                if (!state.open) return;
                startCpuOpening();
            }, 120);
            return;
        }

        setTurnActive(PLAYER);
        setStatus('Mutarea ta', 'Incepi tu — alege o patrata', null);
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
                        game_id: offer.gameId,
                    }),
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

    async function endRound(result) {
        state.locked = true;
        setThinking(false);
        setTurnActive('');
        cells.forEach((cell) => { cell.disabled = true; });

        if (result.winner === PLAYER) {
            playWinSfx();
            highlightWinLine(result.line);
            const refundData = await claimRefund(true);
            const refund = Number(refundData.refund_credits || 0);
            if (refund > 0) {
                state.onRefundApplied?.(refund, refundData.credits_balance);
            }
            showResultCard({
                type: 'win',
                icon: '✓',
                title: 'Victorie',
                sub: refund > 0
                    ? `Recuperare: +${state.formatCredits(refund)} LEI`
                    : 'Recuperare aplicata in sold',
            });
            finishOfferRound(true);
            return;
        }

        playLoseSfx();
        if (result.draw) {
            if (result.line) highlightWinLine(result.line);
            showResultCard({
                type: 'draw',
                icon: '=',
                title: 'Egalitate',
                sub: 'Tabla completa. Reincearca la urmatoarea sansa.',
            });
        } else {
            highlightWinLine(result.line);
            showResultCard({
                type: 'lose',
                icon: '×',
                title: 'Infrangere',
                sub: 'Computerul a inchis runda. Mai incearca.',
            });
        }
        await claimRefund(false);
        finishOfferRound(false);
    }

    async function handleCellClick(index) {
        if (state.locked || state.board[index] !== '' || state.isBlocked()) return;

        state.board[index] = PLAYER;
        state.lastPlaced = index;
        playMoveSfx();
        updateCell(index);

        let result = checkWinner(state.board);
        if (result) {
            await endRound(result);
            return;
        }

        const ended = await playCpuTurn();
        if (ended) return;
    }

    function setOpen(open) {
        const popup = $('#gbXoPopup');
        if (!popup) return;

        if (!open) {
            clearCloseTimer();
            stopSfx();
        }

        state.open = open;
        state.offerMode = Boolean(open && currentOffer());
        popup.classList.toggle('is-hidden', !open);
        popup.setAttribute('aria-hidden', open ? 'false' : 'true');

        const halfBtn = $('#halfButton');
        if (halfBtn) halfBtn.setAttribute('aria-expanded', open ? 'true' : 'false');

        if (open) {
            updateOfferHint();
            resetGame();
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

        if (!$('#gbXoPopup')) return;

        buildBoard();

        $('#gbXoClose')?.addEventListener('click', close);

        $('#gbXoPopup')?.addEventListener('click', (event) => {
            if (event.target === $('#gbXoPopup')?.querySelector('.gb-xo-backdrop')) {
                close();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && state.open) {
                close();
            }
        });
    }

    window.GoldenBrainXO = {
        init,
        open,
        close,
    };
}(window));
