(function (global) {
    'use strict';

    var celebratedOverlayIds = {};
    var appliedBalanceByContest = {};
    var overlayEl = null;
    var hideTimer = null;
    var countTimer = null;
    var epicAudio = null;
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

    function markMpWinSeen(contestId) {
        var id = Number(contestId) || 0;
        if (!id) return;
        celebratedOverlayIds[id] = true;
        var ids = loadSeenMpWinIds();
        if (ids.indexOf(id) === -1) {
            ids.push(id);
        }
        try {
            sessionStorage.setItem(MP_WIN_SEEN_KEY, JSON.stringify(ids.slice(-30)));
        } catch (e2) {}
    }

    function hasSeenMpWin(contestId) {
        var id = Number(contestId) || 0;
        if (!id) return false;
        if (celebratedOverlayIds[id]) return true;
        return loadSeenMpWinIds().indexOf(id) !== -1;
    }

    (function hydrateSeenMpWins() {
        loadSeenMpWinIds().forEach(function (id) {
            celebratedOverlayIds[id] = true;
        });
    }());

    function formatCredits(value) {
        var n = Math.max(0, Math.round(Number(value) || 0));
        return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function soundCandidates() {
        var list = [];
        try {
            list.push(new URL('../shared/sounds/jackpot.mp3', window.location.href).href);
        } catch (e) {}
        try {
            list.push(new URL('../../games/shared/sounds/jackpot.mp3', window.location.href).href);
        } catch (e2) {}
        list.push('../shared/sounds/jackpot.mp3');
        list.push('../shared/sounds/hugewin.mp3');
        return list;
    }

    function stopEpicSound() {
        if (!epicAudio) return;
        try {
            epicAudio.pause();
            epicAudio.currentTime = 0;
        } catch (e) {}
        epicAudio = null;
    }

    function playEpicSound() {
        stopEpicSound();
        var files = soundCandidates();
        var idx = 0;

        function tryNext() {
            if (idx >= files.length) return;
            var url = files[idx];
            idx += 1;
            try {
                epicAudio = new Audio(url);
                epicAudio.volume = 0.92;
                epicAudio.play().catch(tryNext);
                window.setTimeout(stopEpicSound, 12000);
            } catch (e) {
                tryNext();
            }
        }

        tryNext();
    }

    function ensureOverlay() {
        if (overlayEl) return overlayEl;
        overlayEl = document.createElement('div');
        overlayEl.className = 'iqwin-mp-win-overlay';
        overlayEl.hidden = true;
        overlayEl.innerHTML =
            '<div class="iqwin-mp-win-backdrop" aria-hidden="true"></div>' +
            '<div class="iqwin-mp-win-fx" aria-hidden="true">' +
            '<span class="iqwin-mp-win-burst"></span>' +
            '<span class="iqwin-mp-win-burst iqwin-mp-win-burst--b"></span>' +
            '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' +
            '<i></i><i></i><i></i><i></i>' +
            '</div>' +
            '<div class="iqwin-mp-win-card">' +
            '<p class="iqwin-mp-win-kicker">PREMIU MULTIPLAYER</p>' +
            '<h2 class="iqwin-mp-win-title">CÂȘTIGĂTOR BLITZ</h2>' +
            '<p class="iqwin-mp-win-you">AI CÂȘTIGAT!</p>' +
            '<p class="iqwin-mp-win-prize" id="iqwinMpWinPrize">0</p>' +
            '<p class="iqwin-mp-win-credits" id="iqwinMpWinCredits"></p>' +
            '<p class="iqwin-mp-win-sub">Premiul a intrat pe sold și la Ultimul câștig.</p>' +
            '</div>';
        document.body.appendChild(overlayEl);

        if (!document.getElementById('iqwinMpWinStyle11')) {
            var oldStyle = document.getElementById('iqwinMpWinStyle');
            if (oldStyle) {
                oldStyle.remove();
            }
            var style = document.createElement('style');
            style.id = 'iqwinMpWinStyle11';
            style.textContent = [
                '.iqwin-mp-win-overlay{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:3vh 3vw;',
                'background:transparent;pointer-events:none}',
                '.iqwin-mp-win-overlay[hidden]{display:none!important}',
                '.iqwin-mp-win-backdrop{position:absolute;inset:0;z-index:0;',
                'background:radial-gradient(ellipse 80% 60% at 50% 40%,rgba(255,190,60,.14) 0%,transparent 62%),',
                'linear-gradient(180deg,rgba(4,6,14,.88) 0%,rgba(8,10,18,.94) 100%);',
                'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity .4s ease}',
                '.iqwin-mp-win-overlay.is-on .iqwin-mp-win-backdrop{opacity:1}',
                '.iqwin-mp-win-overlay.is-on .iqwin-mp-win-fx{z-index:1}',
                '.iqwin-mp-win-overlay.is-on .iqwin-mp-win-card{animation:iqwinMpContentIn .85s cubic-bezier(.22,1,.36,1) both}',
                '.iqwin-mp-win-overlay.is-on .iqwin-mp-win-burst{animation:iqwinMpBurst 1.25s ease-out both}',
                '.iqwin-mp-win-overlay.is-on .iqwin-mp-win-fx i{animation:iqwinMpSpark 2s ease-out both}',
                '.iqwin-mp-win-fx{position:absolute;inset:0;overflow:hidden;pointer-events:none}',
                '.iqwin-mp-win-burst{position:absolute;left:50%;top:44%;width:min(88vw,720px);height:min(88vw,720px);',
                'transform:translate(-50%,-50%) scale(.2);border-radius:50%;opacity:0;',
                'background:radial-gradient(circle,rgba(255,230,140,.28) 0%,rgba(255,170,30,.08) 36%,transparent 68%)}',
                '.iqwin-mp-win-burst--b{width:min(110vw,920px);height:min(110vw,920px);',
                'background:radial-gradient(circle,rgba(255,210,90,.14) 0%,transparent 60%)}',
                '.iqwin-mp-win-fx i{position:absolute;left:50%;top:46%;width:10px;height:10px;border-radius:50%;',
                'background:#ffe59a;box-shadow:0 0 14px rgba(255,220,120,.95);opacity:0}',
                '.iqwin-mp-win-fx i:nth-child(3){--dx:-210px;--dy:-150px;--d:.04s}',
                '.iqwin-mp-win-fx i:nth-child(4){--dx:190px;--dy:-160px;--d:.08s;background:#ffd060}',
                '.iqwin-mp-win-fx i:nth-child(5){--dx:-250px;--dy:30px;--d:.12s}',
                '.iqwin-mp-win-fx i:nth-child(6){--dx:240px;--dy:20px;--d:.16s;background:#fff2c4}',
                '.iqwin-mp-win-fx i:nth-child(7){--dx:-120px;--dy:180px;--d:.1s}',
                '.iqwin-mp-win-fx i:nth-child(8){--dx:130px;--dy:190px;--d:.14s;background:#ffb84a}',
                '.iqwin-mp-win-fx i:nth-child(9){--dx:-280px;--dy:-50px;--d:.18s}',
                '.iqwin-mp-win-fx i:nth-child(10){--dx:280px;--dy:-60px;--d:.2s}',
                '.iqwin-mp-win-fx i:nth-child(11){--dx:-50px;--dy:-210px;--d:.06s;background:#fff6d0}',
                '.iqwin-mp-win-fx i:nth-child(12){--dx:40px;--dy:220px;--d:.22s}',
                '.iqwin-mp-win-fx i:nth-child(13){--dx:-170px;--dy:120px;--d:.15s}',
                '.iqwin-mp-win-fx i:nth-child(14){--dx:200px;--dy:110px;--d:.11s;background:#ffcc66}',
                '.iqwin-mp-win-fx i:nth-child(15){--dx:-230px;--dy:160px;--d:.19s}',
                '.iqwin-mp-win-fx i:nth-child(16){--dx:220px;--dy:-120px;--d:.13s}',
                '.iqwin-mp-win-fx i:nth-child(17){--dx:70px;--dy:-190px;--d:.09s;background:#ffe9a0}',
                '.iqwin-mp-win-fx i:nth-child(18){--dx:-80px;--dy:200px;--d:.21s}',
                '.iqwin-mp-win-card{position:relative;z-index:2;width:min(960px,94vw);text-align:center;',
                'padding:clamp(12px,2vh,28px);background:transparent;border:none;box-shadow:none}',
                '.iqwin-mp-win-card::before{content:"";position:absolute;left:50%;top:50%;width:min(86vw,680px);',
                'height:min(52vh,440px);transform:translate(-50%,-50%);',
                'background:radial-gradient(ellipse at center,rgba(255,200,80,.16) 0%,transparent 72%);',
                'animation:iqwinMpAura 3.4s ease-in-out infinite;pointer-events:none;z-index:-1}',
                '.iqwin-mp-win-card::after{content:"";position:absolute;left:50%;top:50%;width:min(78vw,580px);',
                'height:min(78vw,580px);transform:translate(-50%,-50%);border:1px solid rgba(255,210,90,.2);',
                'border-radius:50%;animation:iqwinMpRingSpin 14s linear infinite;pointer-events:none;z-index:-1}',
                '.iqwin-mp-win-kicker{margin:0;font:800 clamp(.9rem,2.2vh,1.15rem)/1.2 Manrope,sans-serif;',
                'letter-spacing:.32em;color:#f6e2a0;text-shadow:0 0 16px rgba(0,0,0,.85)}',
                '.iqwin-mp-win-title{margin:14px 0 0;font:900 clamp(2rem,7vh,3.8rem)/.95 Cinzel,serif;',
                'letter-spacing:.2em;color:#ffe9a0;text-shadow:0 0 24px rgba(0,0,0,.85),0 0 48px rgba(255,200,60,.55);',
                'animation:iqwinMpBlitzShimmer 2.8s ease-in-out infinite}',
                '.iqwin-mp-win-you{margin:10px 0 0;font:800 clamp(1.3rem,3.8vh,2.2rem)/1.1 Manrope,sans-serif;',
                'letter-spacing:.14em;color:#fff8df;text-shadow:0 0 16px rgba(0,0,0,.85)}',
                '.iqwin-mp-win-prize{margin:18px 0 0;font:900 clamp(3rem,11vh,6.8rem)/1 Cinzel,serif;color:#ffd45c;',
                'text-shadow:0 0 22px rgba(0,0,0,.9),0 0 50px rgba(255,190,40,.6)}',
                '.iqwin-mp-win-credits{margin:8px 0 0;font:800 clamp(1rem,2.8vh,1.5rem)/1.2 Manrope,sans-serif;',
                'letter-spacing:.08em;color:rgba(255,244,210,.95);text-shadow:0 0 12px rgba(0,0,0,.8)}',
                '.iqwin-mp-win-sub{margin:16px 0 0;font:700 clamp(.95rem,2.2vh,1.25rem)/1.35 Manrope,sans-serif;',
                'color:rgba(255,244,210,.95);text-shadow:0 0 16px rgba(0,0,0,.85)}',
                '@keyframes iqwinMpContentIn{from{opacity:0;transform:translateY(18px) scale(.96)}',
                'to{opacity:1;transform:translateY(0) scale(1)}}',
                '@keyframes iqwinMpAura{0%,100%{opacity:.65;transform:translate(-50%,-50%) scale(1)}',
                '50%{opacity:1;transform:translate(-50%,-50%) scale(1.06)}}',
                '@keyframes iqwinMpRingSpin{from{transform:translate(-50%,-50%) rotate(0deg);opacity:.35}',
                '50%{opacity:.55}to{transform:translate(-50%,-50%) rotate(360deg);opacity:.35}}',
                '@keyframes iqwinMpBlitzShimmer{0%,100%{filter:brightness(1);color:#ffe9a0}',
                '50%{filter:brightness(1.18);color:#fff4c8}}',
                '@keyframes iqwinMpBurst{0%{opacity:0;transform:translate(-50%,-50%) scale(.15)}',
                '30%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.3)}}',
                '@keyframes iqwinMpSpark{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}',
                '18%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.15)}}'
            ].join('');
            document.head.appendChild(style);
        }
        return overlayEl;
    }

    function animatePrize(lei, totalCredits, spinCredits, spinLei, totalLei) {
        var prizeNode = document.getElementById('iqwinMpWinPrize');
        var creditsNode = document.getElementById('iqwinMpWinCredits');
        if (!prizeNode) return;

        if (countTimer) window.clearInterval(countTimer);
        var blitzLei = Math.max(0, Math.round(Number(lei) || 0));
        var spinWin = Math.max(0, Math.round(Number(spinCredits) || 0));
        var spinMoney = Number(spinLei) || 0;
        if (!(spinMoney > 0) && spinWin > 0 && global.IqwinTerminalCreditsDisplay && typeof global.IqwinTerminalCreditsDisplay.moneyForCredits === 'function') {
            spinMoney = global.IqwinTerminalCreditsDisplay.moneyForCredits(spinWin);
        }
        var totalMoney = Number(totalLei) || 0;
        if (!(totalMoney > 0)) {
            if (global.IqwinTerminalCreditsDisplay && typeof global.IqwinTerminalCreditsDisplay.moneyForCredits === 'function') {
                totalMoney = global.IqwinTerminalCreditsDisplay.moneyForCredits(Number(totalCredits) || 0);
            }
            if (!(totalMoney > 0)) {
                totalMoney = blitzLei + spinMoney;
            }
        }
        var displayTarget = totalMoney > 0 ? Math.round(totalMoney) : blitzLei;
        var current = 0;
        var steps = 28;
        var step = Math.max(1, Math.ceil(displayTarget / steps));
        var tick = 0;

        if (creditsNode) {
            if (spinMoney > 0 && blitzLei > 0) {
                creditsNode.textContent = 'Premiu Blitz: ' + blitzLei.toLocaleString('ro-RO') + ' LEI · Castig spinuri: ' + spinMoney.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' LEI';
            } else if (spinMoney > 0) {
                creditsNode.textContent = 'Castig spinuri: ' + spinMoney.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' LEI';
            } else if (blitzLei > 0) {
                creditsNode.textContent = 'Premiu Blitz: ' + blitzLei.toLocaleString('ro-RO') + ' LEI';
            } else {
                creditsNode.textContent = 'Total pe sold: ' + totalMoney.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' LEI';
            }
        }

        if (!(displayTarget > 0)) {
            prizeNode.textContent = '0 LEI';
            return;
        }

        prizeNode.textContent = '0 LEI';
        countTimer = window.setInterval(function () {
            tick += 1;
            current = Math.min(displayTarget, current + step);
            prizeNode.textContent = current.toLocaleString('ro-RO') + ' LEI';
            if (current >= displayTarget || tick > steps + 5) {
                prizeNode.textContent = displayTarget.toLocaleString('ro-RO') + ' LEI';
                window.clearInterval(countTimer);
                countTimer = null;
            }
        }, 40);
    }

    function showOverlay(totalCredits, prizeLei, spinCredits, spinLei, totalLei) {
        var el = ensureOverlay();
        el.classList.remove('is-on');
        void el.offsetWidth;
        el.hidden = false;
        el.classList.add('is-on');
        animatePrize(prizeLei, totalCredits, spinCredits, spinLei, totalLei);
        if (hideTimer) window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(function () {
            el.hidden = true;
            el.classList.remove('is-on');
            stopEpicSound();
        }, 11000);
    }

    function applyLastWin(credits) {
        var amount = Math.max(0, Number(credits) || 0);
        if (!(amount > 0)) return;

        if (global.IqwinTerminalCreditsDisplay && typeof global.IqwinTerminalCreditsDisplay.updateLastWin === 'function') {
            global.IqwinTerminalCreditsDisplay.updateLastWin(amount);
        } else {
            var lastWin = document.getElementById('lastWinValue');
            if (lastWin) {
                lastWin.textContent = formatCredits(amount);
                lastWin.classList.remove('is-forfeited');
            }
        }

        var panel = document.querySelector('.boss-crown-last-win.terminal-stat-panel')
            || document.querySelector('.terminal-stat-panel:has(#lastWinValue)');
        if (panel) {
            panel.classList.add('is-golden-bubble-win');
            window.setTimeout(function () {
                panel.classList.remove('is-golden-bubble-win');
            }, 3500);
        }
    }

    function applyBalance(credits) {
        if (typeof credits !== 'number') return;
        if (global.IqwinTerminalCreditsDisplay && typeof global.IqwinTerminalCreditsDisplay.updateBalance === 'function') {
            global.IqwinTerminalCreditsDisplay.updateBalance(credits);
        }
        try {
            if (global.parent && global.parent !== global) {
                global.parent.postMessage({ type: 'skill-game-credits', credits: credits }, '*');
            }
        } catch (e) {}
    }

    function celebrate(win, balance, options) {
        if (!win) return;
        if (win.result_type === 'forfeit' || win.is_forfeit) return;
        if (win.result_type !== 'winner' || !win.winner_terminal_id) return;
        var opts = options || {};
        var id = Number(win.contest_id) || 0;
        var alreadySeen = id ? hasSeenMpWin(id) : false;
        if (alreadySeen && !opts.force) {
            return;
        }

        if (global.IqwinContestMode && typeof global.IqwinContestMode.beginResultPause === 'function') {
            global.IqwinContestMode.beginResultPause({
                recent_win: win,
                mode: 'won',
                contest_id: id
            });
        }

        var isSelf = !!win.is_self;
        var prizeCredits = Number(win.credits_awarded) || 0;
        var spinCredits = Number(win.spin_winnings_credits) || 0;
        var totalCredits = Number(win.total_credits_awarded) || (prizeCredits + spinCredits);
        var totalLei = Number(win.total_lei_awarded) || 0;

        if (isSelf) {
            applyLastWin(totalCredits);
            var resolvedBalance = typeof balance === 'number'
                ? balance
                : (typeof win.credits_balance === 'number' ? Number(win.credits_balance) : null);
            if (resolvedBalance !== null) {
                applyBalance(resolvedBalance);
                if (id) appliedBalanceByContest[id] = resolvedBalance;
            }

            showOverlay(totalCredits, win.prize_amount, spinCredits, win.spin_winnings_lei, totalLei);
            if (id) {
                markMpWinSeen(id);
            }
            playEpicSound();

            try {
                if (global.parent && global.parent !== global) {
                    global.parent.postMessage({
                        type: 'iqwin-mp-win',
                        win: win,
                        credits_balance: resolvedBalance,
                        play_sound: false
                    }, '*');
                }
            } catch (e) {}
            return;
        }

        if (id) {
            markMpWinSeen(id);
        }

        try {
            if (global.parent && global.parent !== global) {
                global.parent.postMessage({
                    type: 'iqwin-mp-win',
                    win: win,
                    credits_balance: balance,
                    play_sound: false
                }, '*');
            }
        } catch (e) {}
    }

    function handlePayload(data) {
        if (!data || !data.ok || !data.contest || !data.contest.recent_win) return;
        var win = data.contest.recent_win;
        if (win.result_type === 'forfeit' || win.is_forfeit) return;
        if (win.result_type !== 'winner' || !win.winner_terminal_id) return;
        var winId = Number(win.contest_id) || 0;
        if (winId && hasSeenMpWin(winId)) return;
        celebrate(win, data.credits_balance);
    }

    var originalFetch = global.fetch;
    if (typeof originalFetch === 'function') {
        global.fetch = function () {
            var args = arguments;
            return originalFetch.apply(global, args).then(function (response) {
                try {
                    var input = args[0];
                    var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
                    if (url && url.indexOf('/session.php') !== -1 && response && response.ok) {
                        response.clone().json().then(handlePayload).catch(function () {});
                    }
                } catch (e) {}
                return response;
            });
        };
    }

    global.IqwinMultiplayerWin = {
        celebrate: celebrate,
        handlePayload: handlePayload,
        playEpicSound: playEpicSound,
        stopEpicSound: stopEpicSound
    };
}(window));
