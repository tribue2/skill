/**
 * Logic And Zeus — Maze recovery mini-game.
 * Procedural maze via recursive backtracking (perfect maze, unique solution).
 * Inspired by open-source implementations: codebox/mazes, Sri-Krishna-V/Smaze (MIT).
 */
(function (window) {
    'use strict';

    const MAZE_COLS = 7;
    const MAZE_ROWS = 7;
    const TIME_LIMIT_SEC = 10;
    const CLOSE_AFTER_WIN_MS = 5000;
    const CLOSE_AFTER_LOSE_MS = 2200;
    const MOVE_COOLDOWN_MS = 85;
    const DRAG_MOVE_COOLDOWN_MS = 70;
    const DRAG_HIT_SCALE = 0.62;
    const DRAG_STEP_MS = 42;
    const DRAG_DIR_THRESHOLD = 0.14;

    let canvas = null;
    let ctx = null;
    let animationFrame = null;
    let moveCooldownUntil = 0;
    let dragState = null;
    let resizeObserver = null;
    let pointerTarget = null;

    const game = {
        cells: [],
        cols: MAZE_COLS,
        rows: MAZE_ROWS,
        player: { x: 0, y: 0 },
        goal: { x: MAZE_COLS - 1, y: MAZE_ROWS - 1 },
        startedAt: 0,
        ended: false,
        won: false,
    };

    const state = {
        open: false,
        locked: false,
        offerMode: false,
        closeTimer: null,
        keyHandler: null,
        resizeHandler: null,
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

    function playMoveSfx() {
        if (!state.isSoundEnabled()) return;
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const audioCtx = new Ctx();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = 480;
            gain.gain.value = 0.035;
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            osc.stop(audioCtx.currentTime + 0.06);
        } catch (error) {}
    }

    /** Recursive backtracking — generates a new perfect maze each call. */
    function generateMaze(cols, rows) {
        const grid = [];
        for (let y = 0; y < rows; y += 1) {
            grid[y] = [];
            for (let x = 0; x < cols; x += 1) {
                grid[y][x] = { n: true, e: true, s: true, w: true, visited: false };
            }
        }

        const shuffle = (items) => {
            const list = items.slice();
            for (let i = list.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [list[i], list[j]] = [list[j], list[i]];
            }
            return list;
        };

        const neighbors = (x, y) => {
            const list = [];
            if (y > 0) list.push({ x, y: y - 1, dir: 'n' });
            if (x < cols - 1) list.push({ x: x + 1, y, dir: 'e' });
            if (y < rows - 1) list.push({ x, y: y + 1, dir: 's' });
            if (x > 0) list.push({ x: x - 1, y, dir: 'w' });
            return shuffle(list);
        };

        const removeWall = (x, y, dir) => {
            const cell = grid[y][x];
            if (dir === 'n') {
                cell.n = false;
                grid[y - 1][x].s = false;
            } else if (dir === 'e') {
                cell.e = false;
                grid[y][x + 1].w = false;
            } else if (dir === 's') {
                cell.s = false;
                grid[y + 1][x].n = false;
            } else if (dir === 'w') {
                cell.w = false;
                grid[y][x - 1].e = false;
            }
        };

        const carve = (x, y) => {
            grid[y][x].visited = true;
            for (const next of neighbors(x, y)) {
                if (!grid[next.y][next.x].visited) {
                    removeWall(x, y, next.dir);
                    carve(next.x, next.y);
                }
            }
        };

        carve(0, 0);

        for (let y = 0; y < rows; y += 1) {
            for (let x = 0; x < cols; x += 1) {
                delete grid[y][x].visited;
            }
        }

        return grid;
    }

    function canMove(x, y, dir) {
        const cell = game.cells[y]?.[x];
        if (!cell) return false;
        return !cell[dir];
    }

    function tryMove(dir, { fromDrag = false } = {}) {
        if (game.ended || state.locked) return false;
        const now = Date.now();
        const cooldown = fromDrag ? DRAG_MOVE_COOLDOWN_MS : MOVE_COOLDOWN_MS;
        if (now < moveCooldownUntil) return false;

        const { x, y } = game.player;
        let nx = x;
        let ny = y;

        if (dir === 'n' && canMove(x, y, 'n')) ny -= 1;
        else if (dir === 'e' && canMove(x, y, 'e')) nx += 1;
        else if (dir === 's' && canMove(x, y, 's')) ny += 1;
        else if (dir === 'w' && canMove(x, y, 'w')) nx -= 1;
        else return false;

        game.player = { x: nx, y: ny };
        moveCooldownUntil = now + cooldown;
        playMoveSfx();
        updateHud();

        if (nx === game.goal.x && ny === game.goal.y) {
            endGame(true);
        }
        return true;
    }

    function getPlayerScreenPos(metrics) {
        const { cellSize, offsetX, offsetY } = metrics;
        return {
            x: offsetX + game.player.x * cellSize + cellSize / 2,
            y: offsetY + game.player.y * cellSize + cellSize / 2,
            r: cellSize * DRAG_HIT_SCALE,
        };
    }

    function clientToCanvas(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function isOnPlayer(cx, cy, metrics) {
        const player = getPlayerScreenPos(metrics);
        const dx = cx - player.x;
        const dy = cy - player.y;
        if ((dx * dx + dy * dy) <= (player.r * player.r)) return true;

        const { cellSize, offsetX, offsetY } = metrics;
        const cellX = Math.floor((cx - offsetX) / cellSize);
        const cellY = Math.floor((cy - offsetY) / cellSize);
        return cellX === game.player.x && cellY === game.player.y;
    }

    function directionFromPlayer(cx, cy, metrics) {
        const player = getPlayerScreenPos(metrics);
        const dx = cx - player.x;
        const dy = cy - player.y;
        const threshold = metrics.cellSize * DRAG_DIR_THRESHOLD;
        if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'e' : 'w';
        }
        return dy > 0 ? 's' : 'n';
    }

    function processDragPointer(clientX, clientY) {
        const metrics = getCanvasMetrics();
        if (!metrics) return;
        const pos = clientToCanvas(clientX, clientY);
        dragState.pointerX = pos.x;
        dragState.pointerY = pos.y;
        const dir = directionFromPlayer(pos.x, pos.y, metrics);
        if (dir) tryMove(dir, { fromDrag: true });
    }

    function getCanvasMetrics() {
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const size = Math.min(rect.width, rect.height);
        const pad = Math.max(8, size * 0.04);
        const inner = size - pad * 2;
        const cellSize = inner / Math.max(game.cols, game.rows);
        const offsetX = (rect.width - cellSize * game.cols) / 2;
        const offsetY = (rect.height - cellSize * game.rows) / 2;
        return { dpr, rect, cellSize, offsetX, offsetY, pad };
    }

    function resizeCanvas() {
        if (!canvas || !ctx) return;
        const metrics = getCanvasMetrics();
        if (!metrics) return;
        const { dpr, rect } = metrics;
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawMaze();
    }

    function drawMaze() {
        if (!canvas || !ctx) return;
        const metrics = getCanvasMetrics();
        if (!metrics) return;

        const { rect, cellSize, offsetX, offsetY } = metrics;
        const w = rect.width;
        const h = rect.height;

        ctx.clearRect(0, 0, w, h);

        const bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0, '#0c0a18');
        bg.addColorStop(0.5, '#14102a');
        bg.addColorStop(1, '#080610');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const floorGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.5, w * 0.55);
        floorGrad.addColorStop(0, 'rgba(255, 196, 64, 0.06)');
        floorGrad.addColorStop(1, 'rgba(255, 196, 64, 0)');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(offsetX, offsetY, cellSize * game.cols, cellSize * game.rows);

        for (let y = 0; y < game.rows; y += 1) {
            for (let x = 0; x < game.cols; x += 1) {
                const cell = game.cells[y][x];
                const px = offsetX + x * cellSize;
                const py = offsetY + y * cellSize;

                ctx.fillStyle = (x + y) % 2 === 0 ? 'rgba(22, 18, 42, 0.92)' : 'rgba(18, 14, 36, 0.88)';
                ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

                ctx.strokeStyle = 'rgba(255, 196, 64, 0.88)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                ctx.lineCap = 'round';

                ctx.beginPath();
                if (cell.n) {
                    ctx.moveTo(px, py);
                    ctx.lineTo(px + cellSize, py);
                }
                if (cell.e) {
                    ctx.moveTo(px + cellSize, py);
                    ctx.lineTo(px + cellSize, py + cellSize);
                }
                if (cell.s) {
                    ctx.moveTo(px, py + cellSize);
                    ctx.lineTo(px + cellSize, py + cellSize);
                }
                if (cell.w) {
                    ctx.moveTo(px, py);
                    ctx.lineTo(px, py + cellSize);
                }
                ctx.stroke();
            }
        }

        const gx = offsetX + game.goal.x * cellSize + cellSize / 2;
        const gy = offsetY + game.goal.y * cellSize + cellSize / 2;
        const goalR = cellSize * 0.32;
        const goalGlow = ctx.createRadialGradient(gx, gy, 0, gx, gy, goalR * 1.8);
        goalGlow.addColorStop(0, 'rgba(74, 222, 128, 0.55)');
        goalGlow.addColorStop(1, 'rgba(74, 222, 128, 0)');
        ctx.fillStyle = goalGlow;
        ctx.beginPath();
        ctx.arc(gx, gy, goalR * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(gx, gy, goalR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const px = offsetX + game.player.x * cellSize + cellSize / 2;
        const py = offsetY + game.player.y * cellSize + cellSize / 2;
        const isDragging = Boolean(dragState);
        let drawX = px;
        let drawY = py;
        if (isDragging && Number.isFinite(dragState.pointerX) && Number.isFinite(dragState.pointerY)) {
            const maxOffset = cellSize * 0.34;
            drawX = px + Math.max(-maxOffset, Math.min(maxOffset, dragState.pointerX - px));
            drawY = py + Math.max(-maxOffset, Math.min(maxOffset, dragState.pointerY - py));
        }
        const pr = cellSize * 0.32;
        const playerGlow = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, pr * 2.2);
        playerGlow.addColorStop(0, 'rgba(255, 196, 64, 0.7)');
        playerGlow.addColorStop(1, 'rgba(255, 196, 64, 0)');
        ctx.fillStyle = playerGlow;
        ctx.beginPath();
        ctx.arc(drawX, drawY, pr * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffc440';
        ctx.beginPath();
        ctx.arc(drawX, drawY, isDragging ? pr * 1.12 : pr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isDragging ? '#ffffff' : '#fff8e7';
        ctx.lineWidth = isDragging ? 2 : 1.2;
        ctx.stroke();
    }

    function tickLoop() {
        if (!state.open || game.ended) return;
        drawMaze();
        updateTimer();
        animationFrame = window.requestAnimationFrame(tickLoop);
    }

    function formatTime(seconds) {
        const s = Math.max(0, Math.floor(seconds));
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${String(r).padStart(2, '0')}`;
    }

    function updateTimer() {
        const node = $('#lzMazeTimer');
        if (!node || game.ended) return;
        const elapsed = (Date.now() - game.startedAt) / 1000;
        const remaining = TIME_LIMIT_SEC - elapsed;
        node.textContent = formatTime(remaining);
        node.classList.toggle('is-low', remaining <= 3);
        if (remaining <= 0) {
            endGame(false);
        }
    }

    function updateHud() {
        const status = $('#lzMazeStatus');
        if (!status || game.ended) return;
        const label = status.querySelector('.lz-maze-status-label');
        const hint = status.querySelector('.lz-maze-status-hint');
        if (label) label.textContent = 'Navigheaza';
        if (hint) hint.textContent = 'Tine apasat pe cerc si trage spre dreapta/jos (sau sagetile)';
    }

    function setStatus(label, hint, type) {
        const node = $('#lzMazeStatus');
        const labelNode = node?.querySelector('.lz-maze-status-label');
        const hintNode = node?.querySelector('.lz-maze-status-hint');
        if (!node) return;
        node.classList.remove('is-hidden', 'is-win', 'is-lose');
        if (labelNode) labelNode.textContent = label || '';
        if (hintNode) hintNode.textContent = hint || '';
        if (!label && !hint) node.classList.add('is-hidden');
        if (type === 'win') node.classList.add('is-win');
        if (type === 'lose') node.classList.add('is-lose');
    }

    function hideResultCard() {
        const card = $('#lzMazeResult');
        if (!card) return;
        card.classList.add('is-hidden');
        card.classList.remove('is-win', 'is-lose');
    }

    function showResultCard({ title, sub, type, icon }) {
        const card = $('#lzMazeResult');
        const iconNode = $('#lzMazeResultIcon');
        const titleNode = $('#lzMazeResultTitle');
        const subNode = $('#lzMazeResultSub');
        if (!card || !titleNode) return;
        hideResultCard();
        card.classList.remove('is-hidden');
        if (type) card.classList.add(type === 'win' ? 'is-win' : 'is-lose');
        if (iconNode) iconNode.textContent = icon || '';
        titleNode.textContent = title || '';
        if (subNode) subNode.textContent = sub || '';
        setStatus('', '', null);
    }

    function updateOfferHint() {
        const prize = $('#lzMazeOfferHint');
        const prizeValue = $('#lzMazePrizeValue');
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

    async function endGame(won) {
        if (game.ended) return;
        game.ended = true;
        game.won = won;
        state.locked = true;

        if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }

        drawMaze();
        $('#lzMazeCanvasWrap')?.classList.toggle('is-won', won);
        $('#lzMazeCanvasWrap')?.classList.toggle('is-lost', !won);

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
                title: 'Labirint completat',
                sub: refund > 0
                    ? `Recuperare: +${state.formatCredits(refund)} LEI`
                    : 'Recuperare aplicata in sold',
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
            sub: 'Nu ai ajuns la iesire. Mai incearca la urmatoarea sansa.',
        });
        finishOfferRound(false);
    }

    function resetGame() {
        game.cells = generateMaze(game.cols, game.rows);
        game.player = { x: 0, y: 0 };
        game.goal = { x: game.cols - 1, y: game.rows - 1 };
        game.startedAt = Date.now();
        game.ended = false;
        game.won = false;
        state.locked = false;
        moveCooldownUntil = 0;
        dragState = null;

        hideResultCard();
        $('#lzMazeCanvasWrap')?.classList.remove('is-won', 'is-lost');
        updateOfferHint();
        updateHud();
        setStatus('Labirint nou', 'Tine apasat pe cercul auriu si trage spre iesire', null);

        const timer = $('#lzMazeTimer');
        if (timer) {
            timer.textContent = formatTime(TIME_LIMIT_SEC);
            timer.classList.remove('is-low');
        }

        resizeCanvas();
        window.requestAnimationFrame(() => {
            resizeCanvas();
        });
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(tickLoop);
    }

    function bindResizeObserver() {
        const wrap = $('#lzMazeCanvasWrap');
        if (!wrap || typeof ResizeObserver === 'undefined') return;
        if (resizeObserver) resizeObserver.disconnect();
        resizeObserver = new ResizeObserver(() => {
            if (state.open) resizeCanvas();
        });
        resizeObserver.observe(wrap);
    }

    function handleKeyDown(event) {
        if (!state.open || game.ended) return;
        const key = event.key;
        if (key === 'ArrowUp' || key === 'w' || key === 'W') {
            event.preventDefault();
            tryMove('n');
        } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
            event.preventDefault();
            tryMove('e');
        } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
            event.preventDefault();
            tryMove('s');
        } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
            event.preventDefault();
            tryMove('w');
        }
    }

    function bindPointerDrag() {
        const wrap = $('#lzMazeCanvasWrap');
        pointerTarget = wrap || canvas;
        if (!pointerTarget || !canvas) return;

        pointerTarget.style.touchAction = 'none';
        canvas.style.touchAction = 'none';

        const endDrag = (event) => {
            if (!dragState || dragState.pointerId !== event.pointerId) return;
            dragState = null;
            $('#lzMazeCanvasWrap')?.classList.remove('is-dragging');
            try {
                pointerTarget.releasePointerCapture(event.pointerId);
            } catch (error) {}
        };

        pointerTarget.addEventListener('pointerdown', (event) => {
            if (game.ended || !state.open) return;
            if (event.button !== 0 && event.pointerType === 'mouse') return;
            const metrics = getCanvasMetrics();
            if (!metrics) return;
            const pos = clientToCanvas(event.clientX, event.clientY);
            if (!isOnPlayer(pos.x, pos.y, metrics)) return;

            event.preventDefault();
            event.stopPropagation();
            dragState = {
                pointerId: event.pointerId,
                lastStepAt: 0,
                pointerX: pos.x,
                pointerY: pos.y,
            };
            $('#lzMazeCanvasWrap')?.classList.add('is-dragging');
            try {
                pointerTarget.setPointerCapture(event.pointerId);
            } catch (error) {}
            processDragPointer(event.clientX, event.clientY);
        });

        pointerTarget.addEventListener('pointermove', (event) => {
            if (!dragState || dragState.pointerId !== event.pointerId) return;
            event.preventDefault();
            const now = performance.now();
            if (now - dragState.lastStepAt < DRAG_STEP_MS) {
                const pos = clientToCanvas(event.clientX, event.clientY);
                dragState.pointerX = pos.x;
                dragState.pointerY = pos.y;
                return;
            }
            dragState.lastStepAt = now;
            processDragPointer(event.clientX, event.clientY);
        });

        pointerTarget.addEventListener('pointerup', endDrag);
        pointerTarget.addEventListener('pointercancel', endDrag);
        pointerTarget.addEventListener('lostpointercapture', () => {
            dragState = null;
            $('#lzMazeCanvasWrap')?.classList.remove('is-dragging');
        });
    }

    function bindTouchPad() {
        const pad = $('#lzMazePad');
        if (!pad) return;
        pad.querySelectorAll('[data-dir]').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                tryMove(btn.dataset.dir || '');
            });
        });
    }

    function setOpen(open) {
        const popup = $('#lzMazePopup');
        if (!popup) return;

        if (!open) {
            clearCloseTimer();
            stopSfx();
            if (animationFrame) {
                window.cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
        }

        state.open = open;
        state.offerMode = Boolean(open && currentOffer());
        popup.classList.toggle('is-hidden', !open);
        popup.setAttribute('aria-hidden', open ? 'false' : 'true');

        const halfBtn = $('#halfButton');
        if (halfBtn) halfBtn.setAttribute('aria-expanded', open ? 'true' : 'false');

        if (open) {
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

        if (!$('#lzMazePopup')) return;

        canvas = $('#lzMazeCanvas');
        ctx = canvas?.getContext('2d') || null;

        bindPointerDrag();
        bindTouchPad();
        bindResizeObserver();

        $('#lzMazeClose')?.addEventListener('click', close);

        $('#lzMazePopup')?.addEventListener('click', (event) => {
            if (event.target === $('#lzMazePopup')?.querySelector('.lz-maze-backdrop')) {
                close();
            }
        });

        if (state.keyHandler) {
            document.removeEventListener('keydown', state.keyHandler);
        }
        state.keyHandler = handleKeyDown;
        document.addEventListener('keydown', state.keyHandler);

        if (state.resizeHandler) {
            window.removeEventListener('resize', state.resizeHandler);
        }
        state.resizeHandler = () => {
            if (state.open) resizeCanvas();
        };
        window.addEventListener('resize', state.resizeHandler);

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && state.open) {
                close();
            }
        });
    }

    window.LogicZeusMaze = {
        init,
        open,
        close,
    };
}(window));
