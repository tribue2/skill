(function (global) {
    'use strict';

    var VIDEO_FILE = 'fire.mp4';
    var PLAYBACK_RATE = 0.25;
    var hosts = [];
    var reducedMotion = false;

    function resolveVideoUrl() {
        var path = String(global.location.pathname || '');
        if (/\/games\//.test(path)) {
            return new URL('../../sounds/' + VIDEO_FILE, global.location.href).href;
        }
        return new URL('../sounds/' + VIDEO_FILE, global.location.href).href;
    }

    function isBlitzLive() {
        return document.body && document.body.classList.contains('is-blitz-contest-live');
    }

    function findMenuParent() {
        return document.querySelector('.verga-side-panel-bg')
            || document.querySelector('.verga-side-panel');
    }

    function createHost(parent, role) {
        var wrap = document.createElement('div');
        wrap.className = 'blitz-fire-bg';
        wrap.setAttribute('data-blitz-fire-role', role);
        wrap.setAttribute('aria-hidden', 'true');

        var video = document.createElement('video');
        video.className = 'blitz-fire-bg__video';
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = true;
        video.preload = 'auto';
        video.defaultPlaybackRate = PLAYBACK_RATE;
        video.playbackRate = PLAYBACK_RATE;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.src = resolveVideoUrl();

        wrap.appendChild(video);
        parent.insertBefore(wrap, parent.firstChild || null);

        return { wrap: wrap, video: video, role: role, parent: parent };
    }

    function ensureHostOnParent(parent, role) {
        if (!parent) {
            return null;
        }

        var existing = parent.querySelector(':scope > .blitz-fire-bg[data-blitz-fire-role="' + role + '"]');
        if (existing) {
            var vid = existing.querySelector('video');
            if (vid) {
                vid.playbackRate = PLAYBACK_RATE;
                vid.defaultPlaybackRate = PLAYBACK_RATE;
            }
            return { wrap: existing, video: vid, role: role, parent: parent };
        }

        return createHost(parent, role);
    }

    function removeOrphanFireHosts() {
        var menuParent = findMenuParent();
        document.querySelectorAll('.blitz-fire-bg[data-blitz-fire-role="menu"]').forEach(function (el) {
            if (menuParent && el.parentElement !== menuParent) {
                el.remove();
            }
        });
        var lobbyParent = document.querySelector('.frame-grid');
        document.querySelectorAll('.blitz-fire-bg[data-blitz-fire-role="lobby"]').forEach(function (el) {
            if (lobbyParent && el.parentElement !== lobbyParent) {
                el.remove();
            }
        });
    }

    function registerHosts() {
        removeOrphanFireHosts();
        hosts = [];
        var lobby = ensureHostOnParent(document.querySelector('.frame-grid'), 'lobby');
        var menu = ensureHostOnParent(findMenuParent(), 'menu');
        if (lobby) {
            hosts.push(lobby);
        }
        if (menu) {
            hosts.push(menu);
        }
    }

    function playVideo(video) {
        if (!video || reducedMotion) {
            return;
        }
        video.playbackRate = PLAYBACK_RATE;
        video.defaultPlaybackRate = PLAYBACK_RATE;
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {});
        }
    }

    function pauseVideo(video) {
        if (!video) {
            return;
        }
        try {
            video.pause();
        } catch (e) {}
    }

    function sync() {
        if (!hosts.length) {
            registerHosts();
        }

        var active = isBlitzLive() && !reducedMotion;

        hosts.forEach(function (host) {
            if (!host.wrap || !host.parent || !host.parent.isConnected) {
                return;
            }
            host.wrap.classList.toggle('is-active', active);
            if (active) {
                playVideo(host.video);
            } else {
                pauseVideo(host.video);
            }
        });
    }

    function onReady() {
        if (global.matchMedia) {
            var mq = global.matchMedia('(prefers-reduced-motion: reduce)');
            reducedMotion = mq.matches;
            if (typeof mq.addEventListener === 'function') {
                mq.addEventListener('change', function () {
                    reducedMotion = mq.matches;
                    sync();
                });
            } else if (typeof mq.addListener === 'function') {
                mq.addListener(function () {
                    reducedMotion = mq.matches;
                    sync();
                });
            }
        }

        registerHosts();

        if (document.body) {
            new MutationObserver(sync).observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        sync();

        global.setTimeout(sync, 400);
        global.setTimeout(registerHosts, 1200);
        global.setTimeout(sync, 1300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }

    global.IqwinBlitzFireBg = { sync: sync, registerHosts: registerHosts };
})(window);
