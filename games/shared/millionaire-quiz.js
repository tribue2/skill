(function (window) {
    'use strict';

    const OPTION_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D' };
    const ANSWER_TIMEOUT_SEC = 4;
    const CLOSE_AFTER_ANSWER_MS = 1000;
    const CLOSE_AFTER_CORRECT_MS = 5000;
    const QUIZ_MUSIC_VOLUME = 0.55;
    const QUIZ_SFX_VOLUME = 0.75;

    let quizMusic = null;
    let quizMusicUrlIndex = 0;
    let activeQuizSfx = null;

    const FALLBACK_QUESTIONS = [
        {
            id: 9001,
            text: 'Care este capitala Romaniei?',
            answers: [
                { key: 'a', text: 'Cluj-Napoca' },
                { key: 'b', text: 'Bucuresti' },
                { key: 'c', text: 'Timisoara' },
                { key: 'd', text: 'Iasi' },
            ],
            correct_option: 'b',
        },
        {
            id: 9002,
            text: 'Cate continente exista pe Pamant?',
            answers: [
                { key: 'a', text: '5' },
                { key: 'b', text: '6' },
                { key: 'c', text: '7' },
                { key: 'd', text: '8' },
            ],
            correct_option: 'c',
        },
        {
            id: 9003,
            text: 'Care este simbolul chimic al aurului?',
            answers: [
                { key: 'a', text: 'Ag' },
                { key: 'b', text: 'Au' },
                { key: 'c', text: 'Fe' },
                { key: 'd', text: 'Cu' },
            ],
            correct_option: 'b',
        },
    ];

    const state = {
        open: false,
        locked: false,
        question: null,
        offerMode: false,
        closeTimer: null,
        answerTimer: null,
        answerInterval: null,
        secondsLeft: 0,
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

    function currentOffer() {
        const offer = state.getOffer?.();
        if (!offer || !offer.active) return null;
        return offer;
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
        return [...new Set(urls)];
    }

    function getQuizMusicUrls() {
        return getTerminalSoundUrls('millionaire.mp3');
    }

    function ensureQuizMusic() {
        const urls = getQuizMusicUrls();
        if (!quizMusic) {
            quizMusic = new Audio(urls[quizMusicUrlIndex] || urls[0]);
            quizMusic.loop = true;
            quizMusic.preload = 'auto';
            quizMusic.volume = QUIZ_MUSIC_VOLUME;
            quizMusic.addEventListener('error', () => {
                if (quizMusicUrlIndex + 1 < urls.length) {
                    quizMusicUrlIndex += 1;
                    quizMusic.src = urls[quizMusicUrlIndex];
                    quizMusic.load();
                }
            });
        } else if (quizMusicUrlIndex < urls.length) {
            quizMusic.src = urls[quizMusicUrlIndex];
        }
        return quizMusic;
    }

    function playQuizMusic() {
        if (!state.isSoundEnabled()) return;
        try {
            quizMusicUrlIndex = 0;
            const urls = getQuizMusicUrls();
            if (quizMusic && urls[0]) {
                quizMusic.src = urls[0];
            }
            const audio = ensureQuizMusic();
            audio.currentTime = 0;
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {
                    if (quizMusicUrlIndex + 1 < urls.length) {
                        quizMusicUrlIndex += 1;
                        audio.src = urls[quizMusicUrlIndex];
                        audio.load();
                        audio.play().catch(() => {});
                    }
                });
            }
        } catch (error) {}
    }

    function stopQuizMusic() {
        if (!quizMusic) return;
        try {
            quizMusic.pause();
            quizMusic.currentTime = 0;
        } catch (error) {}
    }

    function stopQuizSfx() {
        if (!activeQuizSfx) return;
        try {
            activeQuizSfx.pause();
            activeQuizSfx.currentTime = 0;
        } catch (error) {}
        activeQuizSfx = null;
    }

    function stopAllQuizAudio() {
        stopQuizMusic();
        stopQuizSfx();
    }

    function playQuizSfx(fileName) {
        if (!state.isSoundEnabled()) return;
        try {
            stopAllQuizAudio();
            const urls = getTerminalSoundUrls(fileName);
            let urlIndex = 0;
            const audio = new Audio(urls[urlIndex]);
            activeQuizSfx = audio;
            audio.volume = QUIZ_SFX_VOLUME;
            audio.preload = 'auto';
            audio.addEventListener('ended', () => {
                if (activeQuizSfx === audio) {
                    activeQuizSfx = null;
                }
            });
            audio.addEventListener('error', () => {
                if (urlIndex + 1 < urls.length) {
                    urlIndex += 1;
                    audio.src = urls[urlIndex];
                    audio.load();
                    const retry = audio.play();
                    if (retry && typeof retry.catch === 'function') {
                        retry.catch(() => {});
                    }
                }
            });
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        } catch (error) {}
    }

    function playWinSfx() {
        if (!state.isSoundEnabled()) return;
        try {
            stopQuizMusic();
            const urls = getTerminalSoundUrls('next.mp3');
            let urlIndex = 0;
            const audio = new Audio(urls[urlIndex]);
            activeQuizSfx = audio;
            audio.volume = QUIZ_SFX_VOLUME;
            audio.preload = 'auto';
            audio.addEventListener('ended', () => {
                if (activeQuizSfx === audio) {
                    activeQuizSfx = null;
                }
            });
            audio.addEventListener('error', () => {
                if (urlIndex + 1 < urls.length) {
                    urlIndex += 1;
                    audio.src = urls[urlIndex];
                    audio.load();
                    const retry = audio.play();
                    if (retry && typeof retry.catch === 'function') {
                        retry.catch(() => {});
                    }
                }
            });
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        } catch (error) {}
    }

    function playLoseSfx() {
        playQuizSfx('lose.mp3');
    }

    async function fetchRandomQuestion() {
        const base = getTerminalApiBase();
        const headers = getTerminalHeaders();

        if (base && headers) {
            try {
                const response = await fetch(base + '/quiz.php?action=random', { headers });
                const data = await response.json();
                if (data.ok && data.question) {
                    return data.question;
                }
            } catch (error) {}
        }

        const fallback = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
        return {
            id: fallback.id,
            text: fallback.text,
            answers: fallback.answers.map((item) => ({ key: item.key, text: item.text })),
            _fallbackCorrect: fallback.correct_option,
        };
    }

    async function submitAnswer(questionId, option) {
        const offer = currentOffer();
        const base = getTerminalApiBase();
        const headers = getTerminalHeaders();

        if (offer && base && headers && offer.sessionId) {
            try {
                const response = await fetch(base + '/quiz.php', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        action: 'claim_refund',
                        question_id: questionId,
                        option,
                        session_id: offer.sessionId,
                        game_id: offer.gameId,
                    }),
                });
                const data = await response.json();
                if (data.ok) {
                    return data;
                }
            } catch (error) {}
        }

        if (base && headers && questionId < 9000) {
            try {
                const response = await fetch(base + '/quiz.php', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        action: 'check',
                        question_id: questionId,
                        option,
                    }),
                });
                const data = await response.json();
                if (data.ok) {
                    if (data.correct && offer) {
                        const refundCredits = Math.floor(Number(offer.betAmount || 0) / 2);
                        return {
                            ...data,
                            refund_credits: refundCredits,
                        };
                    }
                    return data;
                }
            } catch (error) {}
        }

        const fallback = FALLBACK_QUESTIONS.find((item) => item.id === questionId);
        const correctKey = fallback?.correct_option || state.question?._fallbackCorrect || 'a';
        const correctText = fallback?.answers.find((item) => item.key === correctKey)?.text || '';
        const correct = correctKey === option;
        const refundCredits = correct && offer ? Math.floor(Number(offer.betAmount || 0) / 2) : 0;

        return {
            ok: true,
            correct,
            correct_option: correctKey,
            correct_text: correctText,
            refund_credits: refundCredits,
        };
    }

    function setLoading(loading) {
        const node = $('#vergaQuizLoading');
        if (node) node.classList.toggle('is-hidden', !loading);
    }

    function setResult(message, type) {
        const node = $('#vergaQuizResult');
        const nextBtn = $('#vergaQuizNext');
        if (!node) return;
        node.textContent = message;
        node.classList.remove('is-hidden', 'is-win', 'is-lose');
        if (type === 'win') node.classList.add('is-win');
        if (type === 'lose') node.classList.add('is-lose');
        if (nextBtn) {
            nextBtn.classList.toggle('is-hidden', state.offerMode);
        }
    }

    function clearResult() {
        const node = $('#vergaQuizResult');
        const nextBtn = $('#vergaQuizNext');
        if (node) {
            node.textContent = '';
            node.classList.add('is-hidden');
            node.classList.remove('is-win', 'is-lose');
        }
        if (nextBtn) nextBtn.classList.add('is-hidden');
    }

    function updateOfferHint() {
        const hint = $('#vergaQuizOfferHint');
        const offer = currentOffer();
        if (!hint) return;
        if (offer && state.offerMode) {
            const refund = Math.floor(Number(offer.betAmount || 0) / 2);
            hint.textContent = `Ai ${ANSWER_TIMEOUT_SEC} secunde. Raspuns corect = 50% pariu (${state.formatCredits(refund)} LEI)`;
            hint.classList.remove('is-hidden');
        } else {
            hint.textContent = '';
            hint.classList.add('is-hidden');
        }
    }

    function updateTimerDisplay(seconds) {
        const node = $('#vergaQuizTimer');
        if (!node) return;
        if (state.offerMode && seconds > 0) {
            node.textContent = String(seconds);
            node.classList.remove('is-hidden');
            node.classList.toggle('is-urgent', seconds <= 1);
        } else {
            node.textContent = '';
            node.classList.add('is-hidden');
            node.classList.remove('is-urgent');
        }
    }

    function clearAnswerTimer() {
        if (state.answerTimer) {
            window.clearTimeout(state.answerTimer);
            state.answerTimer = null;
        }
        if (state.answerInterval) {
            window.clearInterval(state.answerInterval);
            state.answerInterval = null;
        }
        updateTimerDisplay(0);
    }

    function lockAllAnswers() {
        const allButtons = Array.from(document.querySelectorAll('#vergaQuizAnswers .verga-quiz-answer'));
        allButtons.forEach((btn) => {
            btn.disabled = true;
            btn.classList.add('is-dimmed');
        });
        return allButtons;
    }

    function startAnswerTimer() {
        clearAnswerTimer();
        if (!state.offerMode) return;

        state.secondsLeft = ANSWER_TIMEOUT_SEC;
        updateTimerDisplay(state.secondsLeft);

        state.answerInterval = window.setInterval(() => {
            state.secondsLeft -= 1;
            if (state.secondsLeft > 0) {
                updateTimerDisplay(state.secondsLeft);
            }
        }, 1000);

        state.answerTimer = window.setTimeout(() => {
            handleAnswerTimeout();
        }, ANSWER_TIMEOUT_SEC * 1000);
    }

    function finishOfferRound({ correct = false } = {}) {
        if (state.offerMode) {
            state.onOfferConsumed?.();
        }
        scheduleCloseAfterAnswer(correct);
    }

    function handleAnswerTimeout() {
        if (state.locked || !state.question || state.isBlocked()) return;

        state.locked = true;
        clearAnswerTimer();
        lockAllAnswers();
        playLoseSfx();
        setResult('Timp expirat!', 'lose');
        finishOfferRound();
    }

    function renderQuestion(question) {
        const questionNode = $('#vergaQuizQuestion');
        const answersNode = $('#vergaQuizAnswers');
        if (!questionNode || !answersNode || !question) return;

        questionNode.textContent = question.text;
        answersNode.innerHTML = '';

        question.answers.forEach((answer) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'verga-quiz-answer';
            btn.dataset.option = answer.key;
            btn.innerHTML = `
                <span class="verga-quiz-answer-key">${OPTION_LABELS[answer.key] || answer.key.toUpperCase()}</span>
                <span class="verga-quiz-answer-text">${answer.text}</span>
            `;
            btn.addEventListener('click', () => handleAnswerClick(answer.key, btn));
            answersNode.appendChild(btn);
        });
    }

    async function loadQuestion() {
        setLoading(true);
        clearResult();
        clearAnswerTimer();
        state.locked = false;
        updateOfferHint();

        const answersNode = $('#vergaQuizAnswers');
        const questionNode = $('#vergaQuizQuestion');
        if (answersNode) answersNode.innerHTML = '';
        if (questionNode) questionNode.textContent = '';

        try {
            state.question = await fetchRandomQuestion();
            renderQuestion(state.question);
            if (state.offerMode) {
                startAnswerTimer();
            }
        } catch (error) {
            if (questionNode) questionNode.textContent = 'Nu am putut incarca intrebarea.';
        } finally {
            setLoading(false);
        }
    }

    async function handleAnswerClick(option, buttonNode) {
        if (state.locked || !state.question || state.isBlocked()) return;

        state.locked = true;
        clearAnswerTimer();

        const allButtons = lockAllAnswers();
        buttonNode.classList.remove('is-dimmed');
        buttonNode.classList.add('is-selected');

        const result = await submitAnswer(state.question.id, option);
        const correctKey = result.correct_option;

        allButtons.forEach((btn) => {
            const key = btn.dataset.option;
            if (key === correctKey) {
                btn.classList.remove('is-dimmed');
                btn.classList.add('is-correct');
            } else if (key === option && !result.correct) {
                btn.classList.remove('is-dimmed');
                btn.classList.add('is-wrong');
            }
        });

        if (result.correct) {
            playWinSfx();
            const refund = Number(result.refund_credits || 0);
            if (refund > 0) {
                setResult(`Raspuns corect! +${state.formatCredits(refund)} LEI`, 'win');
                state.onRefundApplied?.(refund, result.credits_balance);
            } else {
                setResult('Raspuns corect! Bravo!', 'win');
            }
        } else {
            playLoseSfx();
            const correctLabel = OPTION_LABELS[correctKey] || correctKey.toUpperCase();
            const correctText = result.correct_text ? `: ${result.correct_text}` : '';
            setResult(`Raspuns gresit. Corect: ${correctLabel}${correctText}`, 'lose');
        }

        finishOfferRound({ correct: result.correct });
    }

    function clearCloseTimer() {
        if (state.closeTimer) {
            window.clearTimeout(state.closeTimer);
            state.closeTimer = null;
        }
    }

    function scheduleCloseAfterAnswer(correct = false) {
        clearCloseTimer();
        const delay = correct ? CLOSE_AFTER_CORRECT_MS : CLOSE_AFTER_ANSWER_MS;
        state.closeTimer = window.setTimeout(() => {
            state.closeTimer = null;
            close();
        }, delay);
    }

    function setOpen(open) {
        const popup = $('#vergaQuizPopup');
        if (!popup) return;

        if (!open) {
            clearCloseTimer();
            clearAnswerTimer();
            stopAllQuizAudio();
        }

        state.open = open;
        state.offerMode = Boolean(open && currentOffer());
        popup.classList.toggle('is-hidden', !open);
        popup.setAttribute('aria-hidden', open ? 'false' : 'true');

        const halfBtn = $('#halfButton');
        if (halfBtn) halfBtn.setAttribute('aria-expanded', open ? 'true' : 'false');

        if (open) {
            playQuizMusic();
            loadQuestion();
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

        const popup = $('#vergaQuizPopup');
        if (!popup) return;

        $('#vergaQuizClose')?.addEventListener('click', close);
        $('#vergaQuizNext')?.addEventListener('click', () => {
            if (!state.open || state.offerMode) return;
            loadQuestion();
        });

        popup.addEventListener('click', (event) => {
            if (event.target === popup.querySelector('.verga-quiz-backdrop')) {
                close();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && state.open) {
                close();
            }
        });
    }

    window.MillionaireQuiz = {
        init,
        open,
        close,
        reload: loadQuestion,
    };
}(window));
