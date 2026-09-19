(function (global) {
    'use strict';

    function postToParent(type) {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: type }, '*');
        }
    }

    function bind() {
        var homeBtn = document.getElementById('gameHomeBtn');
        var cashOutBtn = document.getElementById('gameCashOutBtn');

        if (homeBtn) {
            homeBtn.addEventListener('click', function () {
                postToParent('skill-game-close');
            });
        }

        if (cashOutBtn) {
            cashOutBtn.addEventListener('click', function () {
                postToParent('skill-game-cash-out');
            });
        }
    }

    global.IqwinTerminalFooter = {
        bind: bind
    };
}(window));
