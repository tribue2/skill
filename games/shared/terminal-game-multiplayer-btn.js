(function (global) {
    'use strict';

    function isMpParticipant(contest) {
        if (!contest || typeof contest !== 'object') {
            return false;
        }
        return contest.is_participant === true || contest.is_participant === 1;
    }

    function isMpLobbyInvite(contest) {
        if (!contest || typeof contest !== 'object') {
            return false;
        }
        if (contest.lobby_invite === true) {
            return true;
        }
        if (contest.lobby_open === true && !isMpParticipant(contest)) {
            return true;
        }
        return String(contest.mode || '') === 'lobby' && !isMpParticipant(contest);
    }

    function updateButton(contest) {
        var btn = document.getElementById('gameMultiplayerBtn');
        var label = document.getElementById('gameMultiplayerBtnLabel');
        if (!btn) {
            return;
        }

        var available = !!(contest && contest.available);
        var enabled = !!(contest && contest.enabled);
        var mode = contest ? String(contest.mode || '') : '';

        if (!available) {
            btn.hidden = true;
            btn.disabled = true;
            btn.classList.remove('is-live', 'is-lobby-invite');
            if (label) label.textContent = 'MULTIPLAYER';
            return;
        }

        btn.hidden = false;
        btn.classList.remove('is-live', 'is-lobby-invite');

        if (mode === 'lobby') {
            btn.classList.add('is-live');
            if (isMpParticipant(contest)) {
                btn.disabled = true;
                if (label) label.textContent = 'ASTEPTAM...';
            } else {
                btn.classList.add('is-lobby-invite');
                btn.disabled = false;
                if (label) label.textContent = 'INTRA IN BLITZ';
            }
            btn.setAttribute('aria-label', isMpParticipant(contest) ? 'Concurs Blitz in asteptare' : 'Concurs Blitz deschis');
            return;
        }

        if (isMpLobbyInvite(contest)) {
            btn.classList.add('is-live', 'is-lobby-invite');
            btn.disabled = false;
            if (label) label.textContent = 'INTRA IN BLITZ';
            btn.setAttribute('aria-label', 'Concurs Blitz deschis');
            return;
        }

        if (enabled && mode === 'contest') {
            btn.classList.add('is-live');
            btn.disabled = true;
            if (label) label.textContent = 'BLITZ ON';
            btn.setAttribute('aria-label', 'Concurs Blitz activ');
            return;
        }

        btn.classList.remove('is-live');
        btn.disabled = false;
        if (label) label.textContent = 'MULTIPLAYER';
        btn.setAttribute('aria-label', 'Porneste Multiplayer');
    }

    function requestMultiplayer() {
        try {
            if (global.parent && global.parent !== global) {
                global.parent.postMessage({ type: 'iqwin-game-multiplayer-request' }, '*');
            }
        } catch (e) {}
    }

    function bind() {
        var btn = document.getElementById('gameMultiplayerBtn');
        if (!btn) {
            return;
        }
        btn.addEventListener('click', function () {
            if (btn.disabled || btn.hidden) {
                return;
            }
            requestMultiplayer();
        });

        window.addEventListener('message', function (event) {
            if (!event.data) {
                return;
            }
            if (event.data.type === 'iqwin-contest-state') {
                updateButton(event.data.contest || null);
            }
        }, true);
    }

    global.IqwinGameMultiplayerBtn = {
        bind: bind,
        update: updateButton,
        request: requestMultiplayer
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
}(window));
