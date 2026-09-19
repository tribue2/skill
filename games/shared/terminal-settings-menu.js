(function (global) {
    'use strict';

    var ARROW_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';

    var SPEED_LABELS = {
        normal: 'Normal',
        rapid: 'Rapid',
        turbo: 'Turbo'
    };

    function bind(options) {
        var slider = document.getElementById('terminalVolumeSlider');
        var volumeValue = document.getElementById('terminalVolumeValue');
        var volumeToggle = document.getElementById('terminalVolumeToggle');
        var volumePopover = document.getElementById('terminalVolumePopover');
        var volumeWrap = document.querySelector('.terminal-footer-volume');
        var speedBar = document.getElementById('terminalSpeedBar');
        var speedLabel = document.getElementById('terminalSpeedLabel');
        var speedOrder = options.speedOrder || ['normal', 'rapid', 'turbo'];
        var forcedSpeed = options.forceSpeed !== undefined ? options.forceSpeed : 'rapid';
        var hideSpeedBar = options.hideSpeedBar !== false;

        function closeVolumePopover() {
            if (!volumePopover || !volumeToggle) {
                return;
            }
            volumePopover.hidden = true;
            volumeToggle.setAttribute('aria-expanded', 'false');
        }

        function openVolumePopover() {
            if (!volumePopover || !volumeToggle) {
                return;
            }
            volumePopover.hidden = false;
            volumeToggle.setAttribute('aria-expanded', 'true');
            refreshVolumeUI();
        }

        function applySpeedUI() {
            if (!speedBar || typeof options.getSpeed !== 'function') {
                return;
            }
            var current = options.getSpeed();
            var idx = speedOrder.indexOf(current);
            if (idx < 0) {
                idx = 0;
            }
            var activeCount = idx + 1;
            var buttons = speedBar.querySelectorAll('.terminal-speed-btn');
            for (var i = 0; i < buttons.length; i += 1) {
                buttons[i].classList.toggle('active', i < activeCount);
            }
            speedBar.classList.toggle('is-turbo', current === 'turbo');
            if (speedLabel) {
                speedLabel.textContent = SPEED_LABELS[current] || SPEED_LABELS.normal;
            }
            speedBar.setAttribute('aria-label', 'Viteza: ' + (SPEED_LABELS[current] || SPEED_LABELS.normal));
            speedBar.title = SPEED_LABELS[current] || SPEED_LABELS.normal;
        }

        function refreshVolumeUI() {
            if (!slider || typeof options.getVolume !== 'function') {
                return;
            }
            var volume = Math.max(0, Math.min(100, Math.round(Number(options.getVolume()) || 0)));
            slider.value = String(volume);
            if (volumeValue) {
                volumeValue.textContent = String(volume);
            }
            if (volumeToggle) {
                volumeToggle.classList.toggle('is-muted', volume <= 0);
            }
        }

        function refreshLockState() {
            var locked = typeof options.isLocked === 'function' ? options.isLocked() : false;
            if (slider) {
                slider.disabled = locked;
            }
            if (volumeToggle) {
                volumeToggle.disabled = locked;
            }
            if (locked) {
                closeVolumePopover();
            }
            if (speedBar) {
                speedBar.style.pointerEvents = locked ? 'none' : '';
                speedBar.style.opacity = locked ? '0.45' : '';
            }
            var infoBtn = document.getElementById('infoButton');
            if (infoBtn) {
                infoBtn.disabled = locked;
            }
        }

        function refresh() {
            refreshVolumeUI();
            applySpeedUI();
            refreshLockState();
        }

        function cycleSpeed() {
            if (typeof options.isLocked === 'function' && options.isLocked()) {
                return;
            }
            if (typeof options.getSpeed !== 'function' || typeof options.setSpeed !== 'function') {
                return;
            }
            var idx = speedOrder.indexOf(options.getSpeed());
            if (idx < 0) {
                idx = 0;
            }
            idx = (idx + 1) % speedOrder.length;
            options.setSpeed(speedOrder[idx]);
            applySpeedUI();
            if (typeof options.onSpeedChange === 'function') {
                options.onSpeedChange(speedOrder[idx]);
            }
        }

        if (volumeToggle && volumePopover) {
            volumeToggle.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (volumeToggle.disabled) {
                    return;
                }
                if (volumePopover.hidden) {
                    openVolumePopover();
                } else {
                    closeVolumePopover();
                }
            });

            document.addEventListener('click', function (event) {
                if (!volumePopover || volumePopover.hidden) {
                    return;
                }
                if (volumeWrap && volumeWrap.contains(event.target)) {
                    return;
                }
                closeVolumePopover();
            });

            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    closeVolumePopover();
                }
            });
        }

        if (slider) {
            slider.addEventListener('input', function () {
                var volume = Math.max(0, Math.min(100, Number(slider.value) || 0));
                if (typeof options.setVolume === 'function') {
                    options.setVolume(volume);
                }
                if (typeof options.setSoundEnabled === 'function') {
                    options.setSoundEnabled(volume > 0);
                }
                refreshVolumeUI();
            });
            slider.addEventListener('click', function (event) {
                event.stopPropagation();
            });
        }

        if (speedBar) {
            speedBar.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (hideSpeedBar || forcedSpeed) {
                    return;
                }
                cycleSpeed();
            });
        }

        if (forcedSpeed && typeof options.setSpeed === 'function') {
            options.setSpeed(forcedSpeed);
        }

        if (hideSpeedBar && speedBar) {
            speedBar.hidden = true;
            speedBar.style.display = 'none';
            var speedWrap = speedBar.closest('.terminal-speed-inline');
            if (speedWrap) {
                speedWrap.classList.add('is-speed-hidden');
            }
        }

        refresh();

        return {
            refresh: refresh,
            close: closeVolumePopover
        };
    }

    global.IqwinTerminalSettings = {
        bind: bind,
        arrowSvg: ARROW_SVG
    };
}(window));
