(function (global) {
    'use strict';

    var VISIBLE_BETS = 4;

    function create(options) {
        var startIndex = 0;
        var containerId = options.containerId || 'betBaseButtons';
        var prevId = options.prevId || 'betBasePrev';
        var nextId = options.nextId || 'betBaseNext';

        function clampStartIndex(values) {
            startIndex = Math.max(0, Math.min(startIndex, Math.max(0, values.length - VISIBLE_BETS)));
        }

        function ensureSelectedVisible(values, currentIndex) {
            if (currentIndex < startIndex) {
                startIndex = currentIndex;
            } else if (currentIndex >= startIndex + VISIBLE_BETS) {
                startIndex = currentIndex - VISIBLE_BETS + 1;
            }
            clampStartIndex(values);
        }

        function creditsToLei(credits) {
            var display = global.IqwinTerminalCreditsDisplay;
            if (display && typeof display.moneyForCredits === 'function') {
                return Math.round(display.moneyForCredits(Number(credits) || 0) * 100) / 100;
            }
            return Number(credits) || 0;
        }

        function getButtonDisplayValue(values, index) {
            var baseValue = values[index];
            var displayValue;
            if (typeof options.getDisplayValue === 'function') {
                displayValue = options.getDisplayValue(baseValue, index);
            } else {
                displayValue = baseValue;
            }
            if (options.displayAsLei !== false) {
                displayValue = creditsToLei(displayValue);
            }
            return displayValue;
        }

        function render(renderOptions) {
            var container = document.getElementById(containerId);
            if (!container || typeof options.getValues !== 'function') {
                return;
            }

            var values = options.getValues();
            var currentIndex = typeof options.getIndex === 'function' ? options.getIndex() : 0;
            var locked = typeof options.isLocked === 'function' ? options.isLocked() : false;
            var syncSelection = !renderOptions || renderOptions.syncSelection !== false;

            if (syncSelection) {
                ensureSelectedVisible(values, currentIndex);
            } else {
                clampStartIndex(values);
            }

            container.innerHTML = '';
            var end = Math.min(startIndex + VISIBLE_BETS, values.length);
            for (var i = startIndex; i < end; i += 1) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'slot-bet-btn' + (i === currentIndex ? ' active' : '');
                btn.dataset.betIndex = String(i);
                btn.disabled = locked;
                btn.innerHTML =
                    '<span class="slot-bet-label">LEI</span>' +
                    '<span class="slot-bet-value">' + options.formatValue(getButtonDisplayValue(values, i)) + '</span>' +
                    '<span class="slot-bet-sublabel"></span>';
                btn.addEventListener('click', function () {
                    var index = Number(this.dataset.betIndex);
                    if (typeof options.isLocked === 'function' && options.isLocked()) {
                        return;
                    }
                    if (typeof options.setIndex === 'function') {
                        options.setIndex(index);
                    }
                    ensureSelectedVisible(options.getValues(), index);
                    render({ syncSelection: false });
                    if (typeof options.onChange === 'function') {
                        options.onChange();
                    }
                });
                container.appendChild(btn);
            }

            var prevBtn = document.getElementById(prevId);
            var nextBtn = document.getElementById(nextId);
            if (prevBtn) {
                prevBtn.disabled = locked || startIndex <= 0;
            }
            if (nextBtn) {
                nextBtn.disabled = locked || startIndex + VISIBLE_BETS >= values.length;
            }
        }

        function bind() {
            var prevBtn = document.getElementById(prevId);
            var nextBtn = document.getElementById(nextId);
            if (prevBtn) {
                prevBtn.addEventListener('click', function () {
                    if (typeof options.isLocked === 'function' && options.isLocked()) {
                        return;
                    }
                    if (startIndex <= 0) {
                        return;
                    }
                    startIndex -= 1;
                    render({ syncSelection: false });
                });
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', function () {
                    if (typeof options.isLocked === 'function' && options.isLocked()) {
                        return;
                    }
                    var values = options.getValues();
                    if (startIndex >= values.length - VISIBLE_BETS) {
                        return;
                    }
                    startIndex += 1;
                    render({ syncSelection: false });
                });
            }
        }

        return {
            render: render,
            bind: bind
        };
    }

    function totalCreditsToDisplayLei(totalCredits) {
        var total = Number(totalCredits) || 0;
        var display = global.IqwinTerminalCreditsDisplay;
        if (display && typeof display.moneyForCredits === 'function') {
            return Math.round(display.moneyForCredits(total) * 100) / 100;
        }
        var rate = display && typeof display.getCreditRate === 'function'
            ? display.getCreditRate()
            : 0.1;
        return Math.round(total * rate * 100) / 100;
    }

    function isTotalBetLeiBlockedForLines(totalCredits, lines) {
        if (Number(lines) !== 5) {
            return false;
        }
        return Math.abs(totalCreditsToDisplayLei(totalCredits) - 1.5) < 0.01;
    }

    global.IqwinTerminalBetButtons = {
        create: create,
        VISIBLE_BETS: VISIBLE_BETS,
        totalCreditsToDisplayLei: totalCreditsToDisplayLei,
        isTotalBetLeiBlockedForLines: isTotalBetLeiBlockedForLines,
        isDisplayLeiBlockedForLines: isTotalBetLeiBlockedForLines
    };
}(window));
