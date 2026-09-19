(function (window) {
    'use strict';

    const ZONE_COUNT = 16;
    const GREEN_COUNT = 8;
    const LAP_DURATION_MS = 2000;
    const MAX_LOOPS = 5;
    const STOP_WINDOW_MS = LAP_DURATION_MS * MAX_LOOPS;
    const CLOSE_AFTER_WIN_MS = 5000;
    const CLOSE_AFTER_LOSE_MS = 2200;
    const SFX_VOLUME = 0.75;
    const AIRPLANE_VIEW_W = 51;
    const AIRPLANE_VIEW_H = 48;
    const AIRPLANE_ANCHOR_Y = 0.3;
    const AIRPLANE_DRAW_SCALE = 1.08;

    let canvas = null;
    let ctx = null;
    let animationId = null;
    let pathPoints = [];
    let airplaneImage = null;
    let airplanePath = null;
    let activeSfx = null;
    let activeFlightSfx = null;
    let contrailParticles = [];

    const state = {
        open: false,
        locked: false,
        offerMode: false,
        zones: [],
        flightStart: 0,
        stopDeadline: 0,
        stopped: false,
        currentZoneIndex: 0,
        stopSnapshot: null,
        lastRenderedFlight: null,
        closeTimer: null,
        timeoutTimer: null,
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

    function secureRandomInt(max) {
        if (max <= 0) return 0;
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            const buf = new Uint32Array(1);
            const limit = Math.floor(4294967296 / max) * max;
            let value = 0;
            do {
                window.crypto.getRandomValues(buf);
                value = buf[0];
            } while (value >= limit);
            return value % max;
        }
        return Math.floor(Math.random() * max);
    }

    function shuffle(list) {
        const copy = list.slice();
        for (let index = copy.length - 1; index > 0; index -= 1) {
            const swap = secureRandomInt(index + 1);
            [copy[index], copy[swap]] = [copy[swap], copy[index]];
        }
        return copy;
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

    function getTerminalSoundUrls(fileName) {
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
        urls.push(new URL(`/sounds/${fileName}`, window.location.origin).href);
        return [...new Set(urls)];
    }

    function stopFlightSfx() {
        if (!activeFlightSfx) return;
        try {
            activeFlightSfx.pause();
            activeFlightSfx.currentTime = 0;
        } catch (error) {}
        activeFlightSfx = null;
    }

    function startFlightSfx() {
        if (!state.isSoundEnabled()) return;
        stopFlightSfx();
        try {
            const urls = getTerminalSoundUrls('avion.mp3');
            let urlIndex = 0;
            const audio = new Audio(urls[urlIndex]);
            activeFlightSfx = audio;
            audio.volume = SFX_VOLUME;
            audio.loop = true;
            audio.preload = 'auto';
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
            const urls = getTerminalSoundUrls(fileName);
            let urlIndex = 0;
            const audio = new Audio(urls[urlIndex]);
            activeSfx = audio;
            audio.volume = SFX_VOLUME;
            audio.preload = 'auto';
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
        playSfx('next.mp3');
    }

    function playLoseSfx() {
        playSfx('lose.mp3');
    }

    function buildZones() {
        const types = shuffle([
            ...Array(GREEN_COUNT).fill('green'),
            ...Array(ZONE_COUNT - GREEN_COUNT).fill('red'),
        ]);
        return types.map((type) => ({ type }));
    }

    function airplaneRenderRadius() {
        return 22 * canvasScale() * AIRPLANE_DRAW_SCALE;
    }

    function getAirplaneAssetUrl() {
        const script = document.querySelector('script[src*="dodge-bomb-aviator.js"]');
        if (script && script.src) {
            return script.src.replace(/[^/]+$/, 'assets/jet-airplane.svg');
        }
        return '../shared/assets/jet-airplane.svg';
    }

    function ensureAirplanePath() {
        if (airplanePath) return;
        airplanePath = new Path2D('m25.21488,3.93375c-0.44355,0 -0.84275,0.18332 -1.17933,0.51592c-0.33397,0.33267 -0.61055,0.80884 -0.84275,1.40377c-0.45922,1.18911 -0.74362,2.85964 -0.89755,4.86085c-0.15655,1.99729 -0.18263,4.32223 -0.11741,6.81118c-5.51835,2.26427 -16.7116,6.93857 -17.60916,7.98223c-1.19759,1.38937 -0.81143,2.98095 -0.32874,4.03902l18.39971,-3.74549c0.38616,4.88048 0.94192,9.7138 1.42461,13.50099c-1.80032,0.52703 -5.1609,1.56679 -5.85232,2.21255c-0.95496,0.88711 -0.95496,3.75718 -0.95496,3.75718l7.53,-0.61316c0.17743,1.23545 0.28701,1.95767 0.28701,1.95767l0.01304,0.06557l0.06002,0l0.13829,0l0.0574,0l0.01043,-0.06557c0,0 0.11218,-0.72222 0.28961,-1.95767l7.53164,0.61316c0,0 0,-2.87006 -0.95496,-3.75718c-0.69044,-0.64577 -4.05363,-1.68813 -5.85133,-2.21516c0.48009,-3.77545 1.03061,-8.58921 1.42198,-13.45404l18.18207,3.70115c0.48009,-1.05806 0.86881,-2.64965 -0.32617,-4.03902c-0.88969,-1.03062 -11.81147,-5.60054 -17.39409,-7.89352c0.06524,-2.52287 0.04175,-4.88024 -0.1148,-6.89989l0,-0.00476c-0.15655,-1.99844 -0.44094,-3.6683 -0.90277,-4.8561c-0.22699,-0.59493 -0.50356,-1.07111 -0.83754,-1.40377c-0.33658,-0.3326 -0.73578,-0.51592 -1.18194,-0.51592l0,0l-0.00001,0l0,0z');
    }

    function loadAirplaneAsset() {
        ensureAirplanePath();
        if (airplaneImage) return;
        const img = new Image();
        img.onload = () => {
            airplaneImage = img;
            if (state.open) renderFrame(performance.now());
        };
        img.src = getAirplaneAssetUrl();
    }

    function buildPathPoints(width, height) {
        const padX = width * 0.035;
        const planeRadius = airplaneRenderRadius();
        const hudReserve = Math.max(96, height * 0.24);
        const padTop = hudReserve + planeRadius * 0.55;
        const padBottom = height * 0.1 + planeRadius * 0.35;
        const usableW = width - padX * 2;
        const usableH = height - padTop - padBottom;
        const step = usableW / (ZONE_COUNT - 1);
        return Array.from({ length: ZONE_COUNT }, (_, index) => {
            const ratio = 0.44 + 0.2 * Math.abs(Math.sin((index / (ZONE_COUNT - 1)) * Math.PI * 1.75));
            return {
                x: padX + step * index,
                y: padTop + usableH * ratio,
            };
        });
    }

    function pathStepWidth() {
        if (pathPoints.length < 2) return 28;
        return pathPoints[1].x - pathPoints[0].x;
    }

    function zoneChipMetrics() {
        const scale = canvasScale();
        const step = pathStepWidth();
        const chipSize = Math.max(8, Math.min(step * 0.46, 10.5 * scale));
        const chipLift = chipSize + Math.max(6 * scale, step * 0.22);
        return {
            scale,
            step,
            chipSize,
            chipRadius: Math.max(2, chipSize * 0.24),
            chipLift,
        };
    }

    function zoneIndexFromPosition(position) {
        if (!pathPoints.length) return 0;
        let best = 0;
        let bestDist = Infinity;
        pathPoints.forEach((point, index) => {
            const dist = Math.abs(position.x - point.x);
            if (dist < bestDist) {
                bestDist = dist;
                best = index;
            }
        });
        return best;
    }

    function lapProgressAtTime(now) {
        const elapsed = Math.max(0, now - state.flightStart);
        return (elapsed % LAP_DURATION_MS) / LAP_DURATION_MS;
    }

    function rocketPosition(progress) {
        if (!pathPoints.length) return { x: 0, y: 0 };
        const scaled = progress * (pathPoints.length - 1);
        const left = Math.floor(scaled);
        const right = Math.min(pathPoints.length - 1, left + 1);
        const mix = scaled - left;
        const start = pathPoints[left];
        const end = pathPoints[right];
        return {
            x: start.x + (end.x - start.x) * mix,
            y: start.y + (end.y - start.y) * mix,
        };
    }

    function zoneIndexFromProgress(progress) {
        return zoneIndexFromPosition(rocketPosition(progress));
    }

    function snapFlightToZone(flight) {
        const index = zoneIndexFromPosition(flight.position);
        const point = pathPoints[index];
        if (!point) return { ...flight, index };
        const metrics = zoneChipMetrics();
        return {
            progress: flight.progress,
            index,
            position: {
                x: point.x,
                y: point.y + metrics.chipLift * 0.16,
            },
        };
    }

    function getFlightState(now) {
        const progress = lapProgressAtTime(now);
        const index = zoneIndexFromProgress(progress);
        return {
            progress,
            position: rocketPosition(progress),
            index,
        };
    }

    function buildFlightSnapshot(progress) {
        const position = rocketPosition(progress);
        return {
            progress,
            position,
            index: zoneIndexFromPosition(position),
        };
    }

    function freezeFlightAt(now) {
        return buildFlightSnapshot(lapProgressAtTime(now));
    }

    function getDisplayedFlightSnapshot() {
        if (state.lastRenderedFlight) {
            return {
                progress: state.lastRenderedFlight.progress,
                position: {
                    x: state.lastRenderedFlight.position.x,
                    y: state.lastRenderedFlight.position.y,
                },
                index: state.lastRenderedFlight.index,
            };
        }
        return freezeFlightAt(performance.now());
    }

    function flightProgress(now) {
        return lapProgressAtTime(now);
    }

    function currentLoopNumber(now) {
        const elapsed = Math.max(0, now - state.flightStart);
        return Math.min(MAX_LOOPS, Math.floor(elapsed / LAP_DURATION_MS) + 1);
    }

    function canvasScale() {
        if (!canvas) return 1;
        return Math.max(0.75, canvas.width / 720);
    }

    function drawGrid(width, height) {
        const scale = canvasScale();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = Math.max(1, scale);
        for (let index = 1; index < ZONE_COUNT; index += 1) {
            const x = (width / ZONE_COUNT) * index;
            ctx.beginPath();
            ctx.setLineDash([4 * scale, 8 * scale]);
            ctx.moveTo(x, 12 * scale);
            ctx.lineTo(x, height - 12 * scale);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }

    function zoneTitle(type) {
        return type === 'green' ? 'Zona verde' : 'Zona rosie';
    }

    function drawZoneMarkers(activeIndex) {
        const metrics = zoneChipMetrics();
        const { chipSize, chipRadius, chipLift } = metrics;
        pathPoints.forEach((point, index) => {
            const zone = state.zones[index];
            if (!zone) return;
            const isActive = index === activeIndex;
            const isGreen = zone.type === 'green';
            const chipX = point.x - chipSize / 2;
            const chipY = point.y - chipLift;
            ctx.fillStyle = isGreen ? 'rgba(34, 197, 94, 0.92)' : 'rgba(239, 68, 68, 0.92)';
            if (!isActive) ctx.fillStyle = isGreen ? 'rgba(34, 197, 94, 0.42)' : 'rgba(239, 68, 68, 0.42)';
            if (isActive) {
                ctx.shadowColor = isGreen ? 'rgba(34, 197, 94, 0.55)' : 'rgba(239, 68, 68, 0.55)';
                ctx.shadowBlur = 8 * metrics.scale;
            }
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(chipX, chipY, chipSize, chipSize, chipRadius);
            } else {
                ctx.rect(chipX, chipY, chipSize, chipSize);
            }
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }

    function rocketHeading(progress) {
        const eps = 0.004;
        const p1 = rocketPosition(Math.max(0, progress - eps));
        const p2 = rocketPosition(Math.min(1, progress + eps));
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        if (Math.hypot(dx, dy) < 0.001) {
            dx = 1;
            dy = 0;
        }
        return Math.atan2(dx, -dy);
    }

    function clearContrailParticles() {
        contrailParticles = [];
    }

    function exhaustWorldPoint(position, heading, localY) {
        return {
            x: position.x - localY * Math.sin(heading),
            y: position.y + localY * Math.cos(heading),
        };
    }

    function spawnContrailParticle(exhaust, heading, intensity) {
        const spread = (Math.random() - 0.5) * 0.35;
        const speed = (0.8 + Math.random() * 1.6) * intensity;
        const dir = heading + Math.PI / 2 + spread;
        contrailParticles.push({
            x: exhaust.x + (Math.random() - 0.5) * 1.5,
            y: exhaust.y + (Math.random() - 0.5) * 1.5,
            vx: Math.cos(dir) * speed,
            vy: Math.sin(dir) * speed,
            life: 0.42 + Math.random() * 0.18,
            decay: 0.045 + Math.random() * 0.035,
            size: 1.1 + Math.random() * 1.6,
        });
    }

    function updateContrailParticles(exhaust, heading, intensity) {
        const spawnCount = state.stopped ? 0 : 1;
        for (let index = 0; index < spawnCount; index += 1) {
            spawnContrailParticle(exhaust, heading, intensity);
        }
        contrailParticles = contrailParticles.filter((particle) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.94;
            particle.vy *= 0.94;
            particle.life -= particle.decay;
            particle.size *= 0.955;
            return particle.life > 0 && particle.size > 0.25;
        });
        if (contrailParticles.length > 35) {
            contrailParticles.splice(0, contrailParticles.length - 35);
        }
    }

    function drawContrailParticles(scale) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        contrailParticles.forEach((particle) => {
            const alpha = particle.life * 0.58;
            const radius = particle.size * scale;
            const gradient = ctx.createRadialGradient(
                particle.x,
                particle.y,
                0,
                particle.x,
                particle.y,
                radius
            );
            gradient.addColorStop(0, `rgba(240, 249, 255, ${alpha})`);
            gradient.addColorStop(0.4, `rgba(125, 211, 252, ${alpha})`);
            gradient.addColorStop(0.8, `rgba(56, 189, 248, ${alpha * 0.25})`);
            gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    function drawTailGlow(now, intensity, unit) {
        const pulse = 0.84 + 0.16 * Math.sin(now * 0.032);
        ctx.save();
        ctx.translate(0, AIRPLANE_VIEW_H * unit * 0.68);
        ctx.globalCompositeOperation = 'lighter';
        [-2.8, 2.8].forEach((offsetX) => {
            const gradient = ctx.createRadialGradient(offsetX, 0, 0, offsetX, 0, 4.2 * intensity);
            gradient.addColorStop(0, `rgba(224, 242, 254, ${0.9 * pulse})`);
            gradient.addColorStop(0.55, `rgba(56, 189, 248, ${0.42 * pulse})`);
            gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(offsetX, 0, 3.2 * intensity, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    function drawAirplaneDetails(isGreen) {
        ctx.fillStyle = '#0c4a6e';
        ctx.beginPath();
        ctx.ellipse(25.5, 11.2, 2.15, 3.5, 0.06, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(186, 230, 253, 0.92)';
        ctx.beginPath();
        ctx.ellipse(24.7, 10.1, 0.88, 1.38, -0.42, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isGreen ? '#15803d' : '#b91c1c';
        ctx.fillRect(21.2, 17.4, 8.6, 1.75);
        ctx.fillStyle = isGreen ? '#4ade80' : '#f87171';
        ctx.fillRect(21.2, 18.85, 8.6, 0.62);

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(25.5, 4.6, 0.95, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fillRect(22.5, 8.5, 2.2, 14);
    }

    function drawAirplaneSprite(isGreen, unit) {
        const drawW = AIRPLANE_VIEW_W * unit;
        const drawH = AIRPLANE_VIEW_H * unit;
        const left = -drawW / 2;
        const top = -drawH * AIRPLANE_ANCHOR_Y;

        ctx.save();
        ctx.shadowColor = isGreen ? 'rgba(34, 197, 94, 0.38)' : 'rgba(239, 68, 68, 0.38)';
        ctx.shadowBlur = 9 * canvasScale();

        ctx.save();
        ctx.translate(left, top);
        ctx.scale(unit, unit);

        ensureAirplanePath();
        if (airplanePath) {
            const bodyGrad = ctx.createLinearGradient(6, 4, 45, 42);
            bodyGrad.addColorStop(0, '#bfdbfe');
            bodyGrad.addColorStop(0.18, '#f8fafc');
            bodyGrad.addColorStop(0.48, '#60a5fa');
            bodyGrad.addColorStop(0.72, '#2563eb');
            bodyGrad.addColorStop(1, '#1e3a8a');
            ctx.fillStyle = bodyGrad;
            ctx.strokeStyle = '#1e3a8a';
            ctx.lineWidth = 0.5;
            ctx.fill(airplanePath);
            ctx.stroke(airplanePath);

            const shineGrad = ctx.createLinearGradient(0, 0, 51, 48);
            shineGrad.addColorStop(0, 'rgba(255,255,255,0.28)');
            shineGrad.addColorStop(0.45, 'rgba(255,255,255,0.06)');
            shineGrad.addColorStop(1, 'rgba(15,23,42,0.18)');
            ctx.fillStyle = shineGrad;
            ctx.fill(airplanePath);
        }

        drawAirplaneDetails(isGreen);
        ctx.restore();
        ctx.restore();
    }

    function drawAirplane(flight, now) {
        if (!flight) return;
        const scale = canvasScale();
        const position = flight.position;
        const progress = typeof flight.progress === 'number' ? flight.progress : 0;
        const heading = rocketHeading(progress);
        const zone = state.zones[flight.index];
        const isGreen = zone?.type === 'green';
        const intensity = state.stopped ? 0.55 : 1;
        const unit = scale * AIRPLANE_DRAW_SCALE;
        const exhaustOffset = AIRPLANE_VIEW_H * unit * 0.68;

        const exhaust = exhaustWorldPoint(position, heading, exhaustOffset);
        updateContrailParticles(exhaust, heading, intensity);
        drawContrailParticles(scale);

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(heading);
        drawAirplaneSprite(isGreen, unit);
        drawTailGlow(now, intensity, unit);
        ctx.restore();
    }

    function renderFrame(now) {
        if (!canvas || !ctx) return;
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0b1220');
        gradient.addColorStop(1, '#05070f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        drawGrid(width, height);

        const flight = state.stopSnapshot
            || (!state.stopped && state.flightStart ? getFlightState(now) : null);
        if (flight) {
            state.currentZoneIndex = flight.index;
            if (!state.stopSnapshot && !state.stopped) {
                state.lastRenderedFlight = {
                    progress: flight.progress,
                    position: { x: flight.position.x, y: flight.position.y },
                    index: flight.index,
                    frameTime: now,
                };
            }
        }

        const activeIndex = state.currentZoneIndex;
        const airplane = flight || null;
        drawZoneMarkers(activeIndex);
        if (airplane) {
            drawAirplane(airplane, now);
        }

        const hud = $('#dbAviatorMultiplier');
        const hint = $('#dbAviatorHint');
        const loopNode = $('#dbAviatorLoop');
        const zone = state.zones[state.currentZoneIndex];
        if (hud && zone) {
            hud.textContent = zoneTitle(zone.type);
            hud.classList.toggle('is-green', zone.type === 'green');
            hud.classList.toggle('is-red', zone.type === 'red');
        }
        if (hint && !state.stopped && !state.locked) {
            const leftMs = Math.max(0, state.stopDeadline - now);
            hint.textContent = leftMs > 0 ? 'apasă STOP!' : 'timp expirat';
        }
        if (loopNode && !state.stopped && state.flightStart) {
            loopNode.textContent = `Runda ${currentLoopNumber(now)} / ${MAX_LOOPS}`;
        }

        updateZoneStrip();

        if (state.open && !state.stopped) {
            animationId = window.requestAnimationFrame(renderFrame);
        }
    }

    function updateZoneStrip() {
        const strip = $('#dbAviatorZones');
        if (!strip) return;
        strip.querySelectorAll('.db-aviator-zone-chip').forEach((chip, index) => {
            const zone = state.zones[index];
            chip.classList.toggle('is-active', index === state.currentZoneIndex);
            chip.classList.toggle('is-green', zone?.type === 'green');
            chip.classList.toggle('is-red', zone?.type === 'red');
            chip.classList.toggle('is-passed', index < state.currentZoneIndex && !state.stopped);
        });
    }

    function renderZoneStrip() {
        const strip = $('#dbAviatorZones');
        if (!strip) return;
        strip.innerHTML = state.zones.map((zone, index) => `
            <span class="db-aviator-zone-chip ${zone.type === 'green' ? 'is-green' : 'is-red'}" data-index="${index}" aria-label="${zoneTitle(zone.type)} ${index + 1}"></span>
        `).join('');
    }

    function updateOfferHint() {
        const prize = $('#dbAviatorOfferHint');
        const prizeValue = $('#dbAviatorPrizeValue');
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

    function updateTimerRing(now) {
        const ring = $('#dbAviatorTimer');
        if (!ring) return;
        const left = Math.max(0, state.stopDeadline - now);
        const ratio = left / STOP_WINDOW_MS;
        ring.style.setProperty('--db-aviator-timer-ratio', String(ratio));
        ring.textContent = String(Math.ceil(left / 1000));
    }

    function clearTimers() {
        if (state.closeTimer) {
            window.clearTimeout(state.closeTimer);
            state.closeTimer = null;
        }
        if (state.timeoutTimer) {
            window.clearTimeout(state.timeoutTimer);
            state.timeoutTimer = null;
        }
        if (animationId) {
            window.cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function setStopEnabled(enabled) {
        const stopBtn = $('#dbAviatorStop');
        if (stopBtn) stopBtn.disabled = !enabled;
    }

    function hideResult() {
        const result = $('#dbAviatorResult');
        if (result) result.classList.add('is-hidden');
    }

    function showResult(type, title, sub) {
        const result = $('#dbAviatorResult');
        const icon = $('#dbAviatorResultIcon');
        const titleNode = $('#dbAviatorResultTitle');
        const subNode = $('#dbAviatorResultSub');
        if (!result) return;
        result.classList.remove('is-hidden', 'is-win', 'is-lose');
        result.classList.add(type === 'win' ? 'is-win' : 'is-lose');
        if (icon) icon.textContent = type === 'win' ? '✓' : '×';
        if (titleNode) titleNode.textContent = title;
        if (subNode) subNode.textContent = sub;
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

    function scheduleClose(won) {
        if (state.closeTimer) {
            window.clearTimeout(state.closeTimer);
            state.closeTimer = null;
        }
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

    async function finishRound(won, reason, zoneIndex = state.currentZoneIndex) {
        state.locked = true;
        state.stopped = true;
        setStopEnabled(false);
        stopFlightSfx();
        if (state.timeoutTimer) {
            window.clearTimeout(state.timeoutTimer);
            state.timeoutTimer = null;
        }
        state.currentZoneIndex = zoneIndex;
        if (state.flightStart && !state.stopSnapshot) {
            state.stopSnapshot = snapFlightToZone(getDisplayedFlightSnapshot());
            state.currentZoneIndex = state.stopSnapshot.index;
        }
        renderFrame(performance.now());
        updateZoneStrip();

        if (won) {
            playWinSfx();
            const refundData = await claimRefund(true);
            const refund = Number(refundData.refund_credits || 0);
            if (refund > 0) {
                state.onRefundApplied?.(refund, refundData.credits_balance);
            }
            showResult('win', 'Zona verde', refund > 0
                ? `Recuperare: +${state.formatCredits(refund)} LEI`
                : 'Recuperare aplicata in sold');
            finishOfferRound(true);
            return;
        }

        playLoseSfx();
        const zone = state.zones[state.currentZoneIndex];
        const loseTitle = reason === 'timeout' ? 'Timp expirat' : 'Zona rosie';
        const loseSub = reason === 'timeout'
            ? 'Nu ai apasat STOP in 10 secunde.'
            : 'Ai oprit pe zona rosie.';
        showResult('lose', loseTitle, loseSub);
        await claimRefund(false);
        finishOfferRound(false);
    }

    let stopHandledByPointer = false;

    function handleStopPointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        stopHandledByPointer = true;
        handleStopInteraction(event);
    }

    function handleStopClick(event) {
        if (stopHandledByPointer) {
            stopHandledByPointer = false;
            event.preventDefault();
            return;
        }
        handleStopInteraction(event);
    }

    function handleStopInteraction(event) {
        event.preventDefault();
        if (state.locked || state.stopped || !state.open || !state.flightStart) return;

        if (animationId) {
            window.cancelAnimationFrame(animationId);
            animationId = null;
        }

        const captureNow = state.lastRenderedFlight?.frameTime ?? performance.now();
        if (captureNow > state.stopDeadline) {
            finishRound(false, 'timeout');
            return;
        }

        state.stopped = true;
        const flight = snapFlightToZone(getDisplayedFlightSnapshot());
        state.stopSnapshot = flight;
        state.currentZoneIndex = flight.index;
        stopFlightSfx();
        renderFrame(captureNow);
        updateZoneStrip();

        const zone = state.zones[flight.index];
        finishRound(zone?.type === 'green', zone?.type === 'green' ? 'green' : 'red', flight.index);
    }

    function resizeCanvas() {
        if (!canvas) return;
        const wrap = canvas.parentElement;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const width = Math.max(520, Math.floor(rect.width));
        const height = Math.max(320, Math.floor(rect.height));
        canvas.width = width;
        canvas.height = height;
        pathPoints = buildPathPoints(width, height);
    }

    function beginFlight() {
        state.flightStart = performance.now();
        state.stopDeadline = state.flightStart + STOP_WINDOW_MS;
        resizeCanvas();
        renderFrame(state.flightStart);
        setStopEnabled(true);
        startFlightSfx();

        state.timeoutTimer = window.setTimeout(() => {
            if (state.locked || state.stopped) return;
            const flight = snapFlightToZone(getDisplayedFlightSnapshot());
            state.stopSnapshot = flight;
            state.currentZoneIndex = flight.index;
            finishRound(false, 'timeout', flight.index);
        }, STOP_WINDOW_MS);

        const timerLoop = () => {
            if (!state.open || state.stopped || state.locked) return;
            updateTimerRing(performance.now());
            window.requestAnimationFrame(timerLoop);
        };
        window.requestAnimationFrame(timerLoop);
    }

    function startRound() {
        clearTimers();
        stopSfx();
        stopFlightSfx();
        hideResult();
        state.zones = buildZones();
        state.locked = false;
        state.stopped = false;
        state.currentZoneIndex = 0;
        state.stopSnapshot = null;
        state.lastRenderedFlight = null;
        state.flightStart = 0;
        clearContrailParticles();
        renderZoneStrip();
        setStopEnabled(false);
        stopHandledByPointer = false;
        const loopNode = $('#dbAviatorLoop');
        if (loopNode) loopNode.textContent = `Runda 1 / ${MAX_LOOPS}`;
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(beginFlight);
        });
    }

    function setOpen(open) {
        const popup = $('#dbAviatorPopup');
        if (!popup) return;

        if (!open) {
            clearTimers();
            stopSfx();
            stopFlightSfx();
            state.zones = [];
            state.currentZoneIndex = 0;
            state.stopSnapshot = null;
            state.lastRenderedFlight = null;
            state.flightStart = 0;
            clearContrailParticles();
        }

        state.open = open;
        state.offerMode = Boolean(open && currentOffer());
        popup.classList.toggle('is-hidden', !open);
        popup.setAttribute('aria-hidden', open ? 'false' : 'true');

        const halfBtn = $('#halfButton');
        if (halfBtn) halfBtn.setAttribute('aria-expanded', open ? 'true' : 'false');

        if (open) {
            updateOfferHint();
            startRound();
        }
    }

    function close() {
        setOpen(false);
    }

    function open() {
        if (state.isBlocked()) return;
        if (!currentOffer()) return;
        if (state.open) {
            startRound();
            return;
        }
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

        canvas = $('#dbAviatorCanvas');
        ctx = canvas ? canvas.getContext('2d') : null;
        if (!$('#dbAviatorPopup')) return;

        loadAirplaneAsset();

        $('#dbAviatorClose')?.addEventListener('click', close);
        $('#dbAviatorStop')?.addEventListener('pointerdown', handleStopPointerDown);
        $('#dbAviatorStop')?.addEventListener('click', handleStopClick);
        $('.db-aviator-backdrop')?.addEventListener('click', close);
        window.addEventListener('resize', () => {
            if (!state.open) return;
            resizeCanvas();
            renderFrame(performance.now());
        });
    }

    window.DodgeBombAviator = {
        init,
        open,
        close,
    };
}(window));
