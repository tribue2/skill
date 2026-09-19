(function () {
    const PENDING_KEY = 'iqwin_pending_round_sync';
    const RETRY_DELAYS = [400, 800, 1600, 3200, 6400, 10000];
    const PREPARE_ATTEMPTS = 12;
    const PREPARE_GAP_MS = 1200;
    const backgroundRetryTimers = new Map();

    function sleep(ms) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, ms);
        });
    }

    function getCredentials() {
        const storage = localStorage.getItem('skill_terminal_credentials');
        const server = localStorage.getItem('skill_terminal_server');
        if (!storage || !server) {
            return null;
        }
        try {
            return {
                credentials: JSON.parse(storage),
                base: server.replace(/\/$/, '') + '/api/terminal'
            };
        } catch (error) {
            return null;
        }
    }

    function readPendingStore() {
        try {
            const raw = sessionStorage.getItem(PENDING_KEY);
            if (!raw) {
                return {};
            }
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function writePendingStore(store) {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(store || {}));
    }

    function pendingKey(gameId, sessionId) {
        return `${gameId}:${sessionId}`;
    }

    function savePendingRound(payload) {
        if (!payload?.gameId || !payload?.sessionId) {
            return;
        }
        const store = readPendingStore();
        store[pendingKey(payload.gameId, payload.sessionId)] = {
            gameId: payload.gameId,
            sessionId: payload.sessionId,
            reelStops: payload.reelStops,
            stripLengths: payload.stripLengths || null,
            creditsWon: payload.creditsWon,
            skillStopUsed: Boolean(payload.skillStopUsed),
            displayWin: payload.displayWin,
            createdAt: payload.createdAt || Date.now()
        };
        writePendingStore(store);
    }

    function clearPendingRound(gameId, sessionId) {
        if (!gameId || !sessionId) {
            return;
        }
        const store = readPendingStore();
        delete store[pendingKey(gameId, sessionId)];
        writePendingStore(store);
    }

    function listPendingRounds(gameId) {
        const store = readPendingStore();
        return Object.values(store)
            .filter((entry) => entry && (!gameId || Number(entry.gameId) === Number(gameId)))
            .sort((left, right) => Number(left.createdAt || 0) - Number(right.createdAt || 0));
    }

    function hasPendingRounds(gameId) {
        return listPendingRounds(gameId).length > 0;
    }

    function reelStopsComplete(reelStops) {
        return Array.isArray(reelStops)
            && reelStops.length >= 5
            && reelStops.every((stop) => stop !== null && stop !== undefined);
    }

    function isRetryableStatus(status) {
        return !status || status >= 500 || status === 408 || status === 429;
    }

    function applySessionContestPayload(data, onBalance) {
        if (!data || typeof data !== 'object') {
            return;
        }
        if (typeof onBalance === 'function' && data.credits_balance !== undefined) {
            onBalance(Number(data.credits_balance));
        }
        if (window.IqwinContestMode && typeof window.IqwinContestMode.applyMpDisplay === 'function' && data.mp_display) {
            window.IqwinContestMode.applyMpDisplay(data.mp_display);
        }
        if (window.IqwinContestMode && typeof window.IqwinContestMode.refreshWaitingState === 'function') {
            window.IqwinContestMode.refreshWaitingState();
        }
        if (data.contest && window.IqwinContestMode && typeof window.IqwinContestMode.applyContestUi === 'function') {
            window.IqwinContestMode.applyContestUi(data.contest);
        }
    }

    async function requestRoundEnd(options) {
        const auth = getCredentials();
        if (!auth) {
            return { ok: false, message: 'Terminal indisponibil.', retryable: false };
        }

        let response = null;
        try {
            response = await fetch(`${auth.base}/session.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Terminal-Code': auth.credentials.terminal_code,
                    'X-Terminal-Secret': auth.credentials.api_secret
                },
                body: JSON.stringify({
                    action: 'end',
                    game_id: options.gameId,
                    session_id: options.sessionId,
                    reel_stops: options.reelStops,
                    strip_lengths: options.stripLengths || null,
                    credits_won: options.creditsWon,
                    skill_stop_used: options.skillStopUsed
                })
            });
        } catch (error) {
            return { ok: false, message: 'Eroare sincronizare runda.', retryable: true };
        }

        let data = null;
        try {
            data = await response.json();
        } catch (error) {
            data = { ok: false, message: 'Eroare sincronizare runda.' };
        }

        if (data?.ok) {
            applySessionContestPayload(data, options.onBalance);
            clearPendingRound(options.gameId, options.sessionId);
            return data;
        }

        const message = data?.message || 'Eroare sincronizare runda.';
        const status = response?.status || 0;
        if (status === 409 || data?.recovered) {
            applySessionContestPayload(data, options.onBalance);
            clearPendingRound(options.gameId, options.sessionId);
            return {
                ok: true,
                recovered: true,
                credits_won: Number(data?.credits_won || 0),
                display_win: Number(data?.display_win ?? 0),
                credits_balance: data?.credits_balance,
                message
            };
        }

        // Only drop pending on known permanent validation failures.
        // Do NOT treat every 4xx as a dropped win — that zeroed real payouts.
        const dropCode = String(data?.code || '');
        const permanentDrop = dropCode === 'invalid_reel_stops'
            || dropCode === 'strip_mismatch'
            || status === 404
            || /pozitii role invalide|pozitii role lipsa|sesiune invalida|sesiune corupta/i.test(String(message));
        if (permanentDrop) {
            clearPendingRound(options.gameId, options.sessionId);
            if (data?.session_closed || status === 404 || /pozitii role|sesiune/i.test(String(message))) {
                void forceCloseOpenSession(options.gameId, options.sessionId);
            }
            return {
                ok: true,
                recovered: true,
                dropped: true,
                credits_won: 0,
                display_win: 0,
                credits_balance: data?.credits_balance,
                message
            };
        }

        return {
            ok: false,
            message,
            retryable: isRetryableStatus(status),
            status,
            code: data?.code || null
        };
    }

    async function syncRoundEnd(options, attempt = 0) {
        const result = await requestRoundEnd(options);
        if (result?.ok) {
            return result;
        }
        if (result?.retryable && attempt < RETRY_DELAYS.length) {
            await sleep(RETRY_DELAYS[attempt]);
            return syncRoundEnd(options, attempt + 1);
        }
        return result;
    }

    function renderLastWin(node, amount, formatDisplayAmount, options = {}) {
        if (!node || typeof formatDisplayAmount !== 'function') {
            return;
        }
        node.classList.remove('is-forfeited', 'is-pending-sync');
        if (options.forfeit) {
            node.classList.add('is-forfeited');
        }
        node.textContent = formatDisplayAmount(Math.max(0, Number(amount) || 0));
    }

    function notifyWinRecovered(params, amount) {
        if (!(amount > 0)) {
            return;
        }
        if (typeof params.onWinRecovered === 'function') {
            params.onWinRecovered(amount);
            return;
        }
        if (typeof params.onLastWin === 'function') {
            params.onLastWin(amount);
        }
    }

    function clearAllPendingRounds(gameId) {
        if (!gameId) {
            writePendingStore({});
            return;
        }
        const store = readPendingStore();
        Object.keys(store).forEach((key) => {
            if (Number(store[key]?.gameId) === Number(gameId)) {
                delete store[key];
            }
        });
        writePendingStore(store);
    }

    async function flushPendingRound(params) {
        const entries = listPendingRounds(params.gameId);
        if (!entries.length) {
            return { ok: true, credited: 0 };
        }

        let credited = 0;
        let lastResult = null;
        for (const entry of entries) {
            const sync = await syncRoundEnd({
                gameId: entry.gameId,
                sessionId: entry.sessionId,
                reelStops: entry.reelStops,
                stripLengths: entry.stripLengths || null,
                creditsWon: entry.creditsWon,
                skillStopUsed: entry.skillStopUsed,
                onBalance: params.onBalance
            });
            lastResult = sync;
            if (sync?.ok) {
                if (!sync.dropped) {
                    const amount = Number(sync.credits_won || entry.displayWin || 0);
                    credited += amount;
                    notifyWinRecovered(params, amount);
                }
            } else if (!sync?.retryable) {
                clearPendingRound(entry.gameId, entry.sessionId);
                void forceCloseOpenSession(entry.gameId, entry.sessionId);
            }
        }

        return {
            ok: !hasPendingRounds(params.gameId),
            credited,
            lastResult
        };
    }

    function scheduleBackgroundRetry(params) {
        const gameId = Number(params?.gameId || 0);
        if (!gameId || !hasPendingRounds(gameId)) {
            return;
        }
        if (backgroundRetryTimers.has(gameId)) {
            return;
        }

        const tick = async () => {
            if (!hasPendingRounds(gameId)) {
                clearInterval(backgroundRetryTimers.get(gameId));
                backgroundRetryTimers.delete(gameId);
                if (typeof params.onPendingCleared === 'function') {
                    params.onPendingCleared();
                }
                return;
            }
            const result = await flushPendingRound(params);
            if (result.credited > 0 && typeof params.onProcessingMessage === 'function') {
                params.onProcessingMessage('');
            }
            if (result.ok) {
                clearInterval(backgroundRetryTimers.get(gameId));
                backgroundRetryTimers.delete(gameId);
                if (typeof params.onPendingCleared === 'function') {
                    params.onPendingCleared();
                }
            }
        };

        const timerId = window.setInterval(() => {
            void tick();
        }, 3000);
        backgroundRetryTimers.set(gameId, timerId);
        void tick();
    }

    async function prepareForNewSpin(params) {
        if (!hasPendingRounds(params.gameId)) {
            return { ready: true, credited: 0 };
        }

        const contestSpin = window.IqwinContestMode
            && typeof window.IqwinContestMode.isActive === 'function'
            && window.IqwinContestMode.isActive();

        if (contestSpin) {
            if (!hasPendingRounds(params.gameId)) {
                return { ready: true, credited: 0 };
            }
            if (typeof params.onProcessingMessage === 'function') {
                params.onProcessingMessage('Se valideaza castigul...');
            }
            const result = await flushPendingRound(params);
            if (typeof params.onProcessingMessage === 'function') {
                params.onProcessingMessage(result.ok ? '' : 'Se valideaza castigul...');
            }
            return { ready: result.ok, credited: result.credited || 0, blocked: !result.ok };
        }

        if (typeof params.onProcessingMessage === 'function') {
            params.onProcessingMessage('Se proceseaza plata castigului anterior...');
        }

        let credited = 0;
        for (let attempt = 0; attempt < PREPARE_ATTEMPTS; attempt += 1) {
            const result = await flushPendingRound(params);
            credited += Number(result.credited || 0);
            if (result.ok) {
                if (typeof params.onProcessingMessage === 'function') {
                    params.onProcessingMessage('');
                }
                return { ready: true, credited };
            }
            await sleep(PREPARE_GAP_MS);
        }

        scheduleBackgroundRetry(params);
        return { ready: false, credited, blocked: true };
    }

    async function settleRound(params) {
        const {
            gameId,
            getSessionId,
            setSessionId,
            reelStops,
            winAmount,
            creditedWin: initialCreditedWin,
            skillStopUsed,
            forfeitWin,
            lastWinNode,
            formatDisplayAmount,
            onBalance,
            showMessage,
            loadCredits
        } = params;

        let creditedWin = initialCreditedWin;
        const sessionId = typeof getSessionId === 'function' ? getSessionId() : null;
        const stopsValid = typeof params.validateStops === 'function'
            ? params.validateStops(reelStops)
            : reelStopsComplete(reelStops);

        if (!stopsValid) {
            if (typeof showMessage === 'function') {
                showMessage('Eroare sincronizare runda.');
            }
            if (typeof loadCredits === 'function') {
                await loadCredits();
            }
            return { creditedWin: 0, syncOk: false, sessionId, pending: false };
        }

        const contestSpin = window.IqwinContestMode
            && typeof window.IqwinContestMode.isActive === 'function'
            && window.IqwinContestMode.isActive();
        const shouldPersist = winAmount > 0 && skillStopUsed && !forfeitWin && sessionId;
        if (shouldPersist) {
            savePendingRound({
                gameId,
                sessionId,
                reelStops,
                stripLengths: params.stripLengths || null,
                creditsWon: winAmount,
                skillStopUsed: true,
                displayWin: winAmount,
                createdAt: Date.now()
            });
            if (typeof showMessage === 'function' && !contestSpin) {
                showMessage('Se valideaza castigul...');
            }
        }

        const sync = await syncRoundEnd({
            gameId,
            sessionId,
            reelStops,
            stripLengths: params.stripLengths || null,
            creditsWon: creditedWin,
            skillStopUsed,
            onBalance
        });

        if (sync?.ok) {
            if (sync.dropped) {
                if (typeof showMessage === 'function') {
                    showMessage(sync.message || 'Sincronizare runda esuata. Reincearca spinul.');
                }
                if (typeof loadCredits === 'function') {
                    await loadCredits();
                }
                renderLastWin(lastWinNode, 0, formatDisplayAmount, {});
                return {
                    creditedWin: 0,
                    syncOk: false,
                    sessionId,
                    pending: false,
                    dropped: true
                };
            }
            creditedWin = Number(sync.credits_won || 0);
            const serverDisplayWin = Number(sync.display_win ?? 0);
            if (skillStopUsed && !forfeitWin && serverDisplayWin > creditedWin + 0.001) {
                creditedWin = serverDisplayWin;
            }
            if (skillStopUsed && !forfeitWin && creditedWin <= 0 && serverDisplayWin > 0) {
                creditedWin = serverDisplayWin;
            }
            if (sync.session_id && typeof setSessionId === 'function') {
                setSessionId(sync.session_id);
            }
            renderLastWin(lastWinNode, creditedWin, formatDisplayAmount, {
                forfeit: forfeitWin && creditedWin <= 0
            });
            if (typeof showMessage === 'function') {
                showMessage('');
            }
            return {
                creditedWin,
                syncOk: true,
                sessionId: typeof getSessionId === 'function' ? getSessionId() : sessionId,
                pending: false
            };
        }

        if (shouldPersist) {
            if (typeof showMessage === 'function') {
                showMessage(contestSpin ? 'Se valideaza castigul...' : 'Plata castigului in curs...');
            }
            scheduleBackgroundRetry({
                gameId,
                onBalance,
                onLastWin: (amount) => {
                    renderLastWin(lastWinNode, amount, formatDisplayAmount, {});
                },
                onWinRecovered: params.onWinRecovered,
                onProcessingMessage: showMessage,
                onPendingCleared: () => {
                    if (typeof showMessage === 'function') {
                        showMessage('');
                    }
                }
            });
        } else if (winAmount <= 0) {
            renderLastWin(lastWinNode, 0, formatDisplayAmount, {});
            if (typeof showMessage === 'function') {
                showMessage('');
            }
        } else {
            renderLastWin(lastWinNode, 0, formatDisplayAmount, { forfeit: true });
        }

        if (typeof loadCredits === 'function') {
            await loadCredits();
        }

        return {
            creditedWin: 0,
            syncOk: false,
            sessionId,
            pending: shouldPersist
        };
    }

    async function forceCloseOpenSession(gameId, sessionId) {
        const auth = getCredentials();
        if (!auth || !sessionId) {
            return false;
        }
        try {
            const response = await fetch(`${auth.base}/session.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Terminal-Code': auth.credentials.terminal_code,
                    'X-Terminal-Secret': auth.credentials.api_secret
                },
                body: JSON.stringify({
                    action: 'force_close',
                    game_id: gameId,
                    session_id: sessionId
                })
            });
            const data = await response.json();
            return Boolean(data?.ok);
        } catch (error) {
            return false;
        }
    }

    async function handleOpenSessionConflict(params, openSessionId) {
        if (window.IqwinContestMode && window.IqwinContestMode.isActive() && openSessionId) {
            const closed = await forceCloseOpenSession(params.gameId, openSessionId);
            if (closed) {
                return true;
            }
        }
        const prepared = await prepareForNewSpin(params);
        if (prepared.ready) {
            return true;
        }
        if (hasPendingRounds(params.gameId)) {
            return false;
        }
        if (openSessionId) {
            return forceCloseOpenSession(params.gameId, openSessionId);
        }
        return false;
    }

    async function ensurePendingFlushed(params) {
        const prepared = await prepareForNewSpin(params);
        return Boolean(prepared.ready);
    }

    window.IqwinTerminalRoundSync = {
        savePendingRound,
        clearPendingRound,
        clearAllPendingRounds,
        hasPendingRounds,
        syncRoundEnd,
        settleRound,
        flushPendingRound,
        prepareForNewSpin,
        scheduleBackgroundRetry,
        ensurePendingFlushed,
        handleOpenSessionConflict,
        renderLastWin
    };
})();
