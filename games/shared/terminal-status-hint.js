(function (global) {
    'use strict';

    var FORFEIT_MESSAGE = 'Castigul nu a fost acordat deoarece nu au fost oprite toate cele 5 role. Opreste fiecare rola sau apasa Opreste toate pentru creditare.';
    var FORFEIT_POPUP_MS = 3000;

    var MESSAGES = {
        idle: 'Apasa START pentru a incepe runda',
        spinning: 'Pentru creditarea castigului, opreste toate cele 5 role sau apasa Opreste toate',
        forfeit: FORFEIT_MESSAGE
    };

    var forfeitHideTimer = null;

    function getFrame() {
        return document.getElementById('terminalStatusFrame');
    }

    function getTextNode() {
        return document.getElementById('terminalStatusText');
    }

    function applyState(stateKey) {
        var frame = getFrame();
        var textNode = getTextNode();
        if (!textNode) {
            return;
        }
        textNode.textContent = MESSAGES[stateKey] || MESSAGES.idle;
        if (!frame) {
            return;
        }
        var classKey = stateKey === 'spinning' ? 'active' : stateKey;
        frame.classList.remove('is-idle', 'is-active', 'is-spinning', 'is-forfeit', 'is-message');
        frame.classList.add('is-' + classKey);
    }

    function getReelsHost() {
        return document.querySelector('.verga-reels-led-inner')
            || document.querySelector('.verga-reels-led-frame')
            || document.querySelector('.boss-crown-machine')
            || document.getElementById('gameReels')
            || document.body;
    }

    function ensureForfeitPopup() {
        var host = getReelsHost();
        var popup = document.getElementById('terminalForfeitPopup');
        if (popup) {
            if (popup.parentNode !== host) {
                host.appendChild(popup);
            }
            return popup;
        }

        popup = document.createElement('div');
        popup.id = 'terminalForfeitPopup';
        popup.className = 'terminal-forfeit-popup';
        popup.setAttribute('aria-live', 'assertive');
        popup.setAttribute('role', 'alertdialog');
        popup.innerHTML =
            '<div class="terminal-forfeit-popup__backdrop" aria-hidden="true"></div>' +
            '<div class="terminal-forfeit-popup__card">' +
                '<strong class="terminal-forfeit-popup__title">Castig neacordat</strong>' +
                '<p class="terminal-forfeit-popup__text" id="terminalForfeitPopupText"></p>' +
            '</div>';
        host.appendChild(popup);
        return popup;
    }

    function hideForfeitPopup() {
        if (forfeitHideTimer) {
            window.clearTimeout(forfeitHideTimer);
            forfeitHideTimer = null;
        }
        var popup = document.getElementById('terminalForfeitPopup');
        if (!popup) {
            return;
        }
        popup.classList.remove('is-visible');
    }

    function showForfeitPopup() {
        var popup = ensureForfeitPopup();
        var textNode = document.getElementById('terminalForfeitPopupText');
        if (textNode) {
            textNode.textContent = FORFEIT_MESSAGE;
        }
        if (forfeitHideTimer) {
            window.clearTimeout(forfeitHideTimer);
            forfeitHideTimer = null;
        }
        popup.classList.remove('is-visible');
        void popup.offsetWidth;
        popup.classList.add('is-visible');
        forfeitHideTimer = window.setTimeout(function () {
            forfeitHideTimer = null;
            hideForfeitPopup();
            applyState('idle');
        }, FORFEIT_POPUP_MS);
    }

    function setMessage(text, options) {
        var frame = getFrame();
        var textNode = getTextNode();
        if (!textNode || !text) {
            return;
        }
        textNode.textContent = text;
        if (!frame) {
            return;
        }
        frame.classList.remove('is-idle', 'is-active', 'is-forfeit', 'is-message');
        if (options && options.forfeit) {
            frame.classList.add('is-idle');
            showForfeitPopup();
            return;
        }
        if (options && options.active) {
            frame.classList.add('is-active');
            return;
        }
        frame.classList.add('is-message');
    }

    global.IqwinTerminalStatusHint = {
        setIdle: function () {
            hideForfeitPopup();
            applyState('idle');
        },
        setSpinning: function () {
            hideForfeitPopup();
            applyState('spinning');
        },
        setForfeit: function () {
            applyState('idle');
            showForfeitPopup();
        },
        getForfeitMessage: function () {
            return FORFEIT_MESSAGE;
        },
        setMessage: setMessage
    };
}(window));
