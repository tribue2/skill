(() => {
    function formatMultiplierLine(pays, formatEntry) {
        return Object.keys(pays || {})
            .map(Number)
            .sort((a, b) => b - a)
            .map((count) => {
                const formatted = String(formatEntry(count, pays[count]) ?? '');
                const match = formatted.match(/^(\d+)\s*[-–:]\s*(.+)$/);
                if (match) {
                    return `<span class="terminal-info-pay-line"><em>${match[1]}</em><b>${match[2]}</b></span>`;
                }
                return `<span class="terminal-info-pay-line"><em>${count}</em><b>${formatted}</b></span>`;
            })
            .join('');
    }

    function renderPayCard(options = {}) {
        const {
            imageSrc,
            alt = '',
            label,
            pays = null,
            formatEntry = (count, multiplier) => `${count} - ${multiplier}x bet`,
            notes = null,
            notesLayout = 'stack',
            wild = false,
            wildAnimated = false,
            symbolScale = 1
        } = options;

        let payoutHtml = '';
        if (pays) {
            payoutHtml = `<div class="terminal-info-pay-lines">${formatMultiplierLine(pays, formatEntry)}</div>`;
        } else if (Array.isArray(notes) && notes.length) {
            const noteClass = notesLayout === 'spread'
                ? 'terminal-info-pay-lines terminal-info-pay-lines--note terminal-info-pay-lines--note-spread'
                : 'terminal-info-pay-lines terminal-info-pay-lines--note';
            payoutHtml = `<div class="${noteClass}">${notes.map((note) => `<span class="terminal-info-pay-line"><b>${note}</b></span>`).join('')}</div>`;
        }

        const scaleValue = Number(symbolScale);
        const frameStyle = Number.isFinite(scaleValue) && scaleValue !== 1
            ? ` style="--symbol-scale:${scaleValue}"`
            : '';

        return `<article class="terminal-info-pay-card${wild ? ' terminal-info-pay-card--wild' : ''}${wildAnimated ? ' terminal-info-pay-card--wild-animated' : ''}">
            <div class="terminal-info-pay-card__symbol"><span class="terminal-info-pay-card__symbol-frame"${frameStyle}><img src="${imageSrc}" alt="${alt}"></span></div>
            <div class="terminal-info-pay-card__panel">
                <strong class="terminal-info-pay-card__label">${label}</strong>
                ${payoutHtml}
            </div>
        </article>`;
    }

    function renderPaylineGrid(lineIndex, pattern, reelRows = 3) {
        const cols = pattern.length;
        const cells = [];
        for (let row = 0; row < reelRows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
                const active = pattern[col] === row;
                cells.push(`<span class="terminal-info-payline__cell${active ? ' is-active' : ''}"></span>`);
            }
        }
        return `<div class="terminal-info-payline" aria-label="Linia ${lineIndex + 1}">
            <span class="terminal-info-payline__num">${lineIndex + 1}</span>
            <div class="terminal-info-payline__grid terminal-info-payline__grid--${reelRows}r" style="--payline-cols:${cols}; --payline-rows:${reelRows};">${cells.join('')}</div>
        </div>`;
    }

    function renderIqwinCard(options = {}) {
        const { lettersHtml, title, payText, note } = options;
        return `<div class="terminal-info-pages__iqwin-card">
            <div class="terminal-info-pages__iqwin-letters">${lettersHtml}</div>
            <div>
                <strong>${title}</strong>
                <em>${payText}</em>
                <span>${note}</span>
            </div>
        </div>`;
    }

    function renderRulesParagraphs(paragraphs) {
        return `<div class="terminal-info-pages__rules">${paragraphs.map((text) => `<p>${text}</p>`).join('')}</div>`;
    }

    function renderBetLimits(minTotal, maxTotal) {
        return `<div class="terminal-info-pages__bet-limits">
            <span>PARIU MINIM: ${minTotal} LEI</span>
            <span>PARIU MAXIM: ${maxTotal} LEI</span>
        </div>`;
    }

    function creditsToLei(credits, roundBet) {
        const round = typeof roundBet === 'function'
            ? roundBet
            : (value) => Math.round((Number(value) || 0) * 100) / 100;
        const display = window.IqwinTerminalCreditsDisplay;
        if (display && typeof display.moneyForCredits === 'function') {
            return round(display.moneyForCredits(credits));
        }
        // Fallback: 1 RON = 1 LEI pe sold → rate 0.1 (10 credite = 1 LEI)
        return round((Number(credits) || 0) * 0.1);
    }

    function getBetLimits(options = {}) {
        const {
            betBaseValues = [],
            minTotalBet = 5,
            maxTotalBet = 20,
            lineOptions = [],
            totalBetForBase,
            formatBalanceNumber,
            roundBet
        } = options;

        const minLines = lineOptions[0] ?? 1;
        const minBase = betBaseValues.find((value) => totalBetForBase(value) >= minTotalBet) ?? betBaseValues[0];
        const minTotalCredits = roundBet((Math.round(minBase * 100) * minLines) / 100);
        // min/max din joc sunt în credite; pe ecran se afișează LEI (ex. 5→0,50 / 20→2,00)
        return {
            minTotal: formatBalanceNumber(creditsToLei(minTotalCredits, roundBet)),
            maxTotal: formatBalanceNumber(creditsToLei(maxTotalBet, roundBet))
        };
    }

    function page(title, lead, content, options = {}) {
        const brandTitle = options.brandTitle ? String(options.brandTitle) : '';
        const pageType = options.pageType ? ` terminal-info-pages__page--${options.pageType}` : '';
        const brandHtml = brandTitle
            ? `<div class="terminal-info-pages__brand" aria-hidden="true">
                <span class="terminal-info-pages__brand-line"></span>
                <span class="terminal-info-pages__brand-title">${brandTitle}</span>
                <span class="terminal-info-pages__brand-line"></span>
            </div>`
            : '';

        return `<section class="terminal-info-pages__page${pageType}">
            ${brandHtml}
            <h2 class="terminal-info-pages__title">${title}</h2>
            <p class="terminal-info-pages__lead">${lead}</p>
            <div class="terminal-info-pages__content">${content}</div>
        </section>`;
    }

    function symbolsPage(options = {}) {
        const {
            brandTitle = '',
            lead,
            cards = [],
            extras = '',
            layout = 'wrap',
            firstRowCount = null,
            rowSplits = null,
            cardLayout = 'split'
        } = options;

        let gridHtml = '';
        if (layout === 'book') {
            const row1 = cards.slice(0, 6);
            const row2 = cards.slice(6);
            const renderBookRow = (rowCards, modifier) => {
                if (!rowCards.length) return '';
                return `<div class="terminal-info-pages__book-row terminal-info-pages__book-row--${modifier}">${rowCards.join('')}</div>`;
            };
            const specialsHtml = extras
                ? `<div class="terminal-info-pages__book-specials">${extras}</div>`
                : '';
            gridHtml = `<div class="terminal-info-pages__book-grid">${renderBookRow(row1, 'primary')}${renderBookRow(row2, 'secondary')}${specialsHtml}</div>`;
        } else if (layout === 'rows') {
            let rowGroups;
            if (Array.isArray(rowSplits) && rowSplits.length > 0) {
                rowGroups = [];
                let offset = 0;
                rowSplits.forEach((count) => {
                    const size = Math.max(0, Math.floor(Number(count) || 0));
                    if (size <= 0) return;
                    rowGroups.push(cards.slice(offset, offset + size));
                    offset += size;
                });
                if (offset < cards.length) {
                    rowGroups.push(cards.slice(offset));
                }
            } else {
                const splitAt = firstRowCount == null
                    ? Math.ceil(cards.length / 2)
                    : Math.max(1, Math.min(cards.length - 1, firstRowCount));
                rowGroups = [cards.slice(0, splitAt), cards.slice(splitAt)];
            }
            const rowModifiers = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary'];
            gridHtml = rowGroups.map((rowCards, index) => {
                if (!rowCards.length) return '';
                const modifier = rowModifiers[index] || `row-${index + 1}`;
                return `<div class="terminal-info-pages__symbol-row terminal-info-pages__symbol-row--${modifier} terminal-info-pages__symbol-row--n${rowCards.length}">${rowCards.join('')}</div>`;
            }).join('');
        } else {
            const densityClass = cards.length >= 11
                ? ' terminal-info-pages__symbol-grid--many'
                : (cards.length >= 9 ? ' terminal-info-pages__symbol-grid--moderate' : '');
            gridHtml = `<div class="terminal-info-pages__symbol-grid${densityClass}" data-pay-cards="${cards.length}">${cards.join('')}</div>`;
        }

        const boardClass = [
            layout === 'book' ? 'terminal-info-pages__symbols-board--book' : '',
            layout === 'rows' ? 'terminal-info-pages__symbols-board--rows' : '',
            cardLayout === 'stack' ? 'terminal-info-pages__symbols-board--stack-cards' : ''
        ].filter(Boolean).join(' ');

        const board = `<div class="terminal-info-pages__symbols-board${boardClass ? ` ${boardClass}` : ''}">
            ${gridHtml}
            ${layout !== 'book' && extras ? `<div class="terminal-info-pages__symbols-extras">${extras}</div>` : ''}
        </div>`;

        return page('Reguli joc', lead, board, {
            brandTitle,
            pageType: 'symbols'
        });
    }

    function linesPage(options = {}) {
        const {
            lead,
            paylines = [],
            reelRows = 3,
            rules = [],
            betLimits = null,
            paylinesClass = 'terminal-info-pages__paylines--all'
        } = options;

        const paylineHtml = paylines.map((pattern, index) => renderPaylineGrid(index, pattern, reelRows)).join('');
        const rulesHtml = rules.length ? renderRulesParagraphs(rules) : '';
        const limitsHtml = betLimits
            ? renderBetLimits(betLimits.minTotal, betLimits.maxTotal)
            : '';

        return page(
            'Linii de plata',
            lead,
            `<div class="terminal-info-pages__paylines ${paylinesClass}">${paylineHtml}</div>${rulesHtml}${limitsHtml}`,
            { pageType: 'lines' }
        );
    }

    function miniGamePage(options = {}) {
        const {
            title,
            lead,
            badgeHtml,
            paragraphs = [],
            leftAlign = true
        } = options;

        const bodyClass = leftAlign ? ' terminal-info-pages__rules--left' : '';
        const rules = `<div class="terminal-info-pages__rules${bodyClass}">${paragraphs.map((text) => `<p>${text}</p>`).join('')}</div>`;

        return page(
            title,
            lead,
            `<div class="terminal-info-pages__xo-hero">${badgeHtml}${rules}</div>`,
            { pageType: 'minigame' }
        );
    }

    function skillPage(options = {}) {
        const {
            gameTitle,
            lead,
            mainCardTitle = 'Joc principal',
            mainCardText,
            miniCardTitle,
            miniCardText,
            footerText
        } = options;

        return page(
            'Joc de abilitate',
            lead,
            `<div class="terminal-info-pages__skill-grid">
                <article class="terminal-info-pages__skill-card">
                    <strong>${mainCardTitle}</strong>
                    <p>${mainCardText}</p>
                </article>
                <article class="terminal-info-pages__skill-card">
                    <strong>${miniCardTitle}</strong>
                    <p>${miniCardText}</p>
                </article>
            </div>
            ${renderRulesParagraphs([footerText])}`,
            { pageType: 'skill' }
        );
    }

    function renderPaytableGridPanel(rows = []) {
        if (!rows.length) return '';

        const head = `<div class="terminal-info-pay-grid__head">
            <span class="terminal-info-pay-grid__col-symbol">Simbol</span>
            <span class="terminal-info-pay-grid__col-pay">5</span>
            <span class="terminal-info-pay-grid__col-pay">4</span>
            <span class="terminal-info-pay-grid__col-pay">3</span>
        </div>`;

        return `<div class="terminal-info-pay-grid">${head}${renderPaytableGridRows(rows)}</div>`;
    }

    function renderPaytableMatrixRow(options = {}) {
        return renderPaytableGridPanel([options]);
    }

    function renderPaytableGridRows(rows = []) {
        return rows.map((row) => {
            const {
                imageSrc,
                alt = '',
                label,
                pays = {},
                symbolScale = 1
            } = row;
            const scaleValue = Number(symbolScale);
            const frameStyle = Number.isFinite(scaleValue) && scaleValue !== 1
                ? ` style="--symbol-scale:${scaleValue}"`
                : '';
            const payCells = [5, 4, 3].map((count) => {
                const multiplier = pays[count];
                const text = multiplier != null && multiplier !== '' ? `${multiplier}x` : '—';
                return `<span class="terminal-info-pay-grid__pay">${text}</span>`;
            }).join('');

            return `<div class="terminal-info-pay-grid__row">
                <div class="terminal-info-pay-grid__symbol">
                    <span class="terminal-info-pay-grid__symbol-frame"${frameStyle}><img src="${imageSrc}" alt="${alt}"></span>
                    <span class="terminal-info-pay-grid__label">${label}</span>
                </div>
                ${payCells}
            </div>`;
        }).join('');
    }

    function paytableMatrixPage(options = {}) {
        const {
            brandTitle = '',
            lead = '',
            caption = '',
            rows = [],
            splitAt = 6,
            footerHtml = ''
        } = options;

        const splitIndex = Math.max(1, Math.min(rows.length - 1, splitAt));
        const leftRows = rows.slice(0, splitIndex);
        const rightRows = rows.slice(splitIndex);
        const headCell = `<div class="terminal-info-pay-grid__head">
            <span class="terminal-info-pay-grid__col-symbol">Simbol</span>
            <span class="terminal-info-pay-grid__col-pay">5</span>
            <span class="terminal-info-pay-grid__col-pay">4</span>
            <span class="terminal-info-pay-grid__col-pay">3</span>
        </div>`;
        const captionHtml = caption
            ? `<p class="terminal-info-pay-matrix__caption">${caption}</p>`
            : '';
        const board = `<div class="terminal-info-pay-matrix-board">
            ${captionHtml}
            <div class="terminal-info-pay-table">
                <div class="terminal-info-pay-split terminal-info-pay-split--head">
                    ${headCell}
                    ${headCell}
                </div>
                <div class="terminal-info-pay-split terminal-info-pay-split--body">
                    <div class="terminal-info-pay-grid terminal-info-pay-grid--body">${renderPaytableGridRows(leftRows)}</div>
                    <div class="terminal-info-pay-grid terminal-info-pay-grid--body">${renderPaytableGridRows(rightRows)}</div>
                </div>
                ${footerHtml}
            </div>
        </div>`;

        return page('Tabel plati', lead, board, {
            brandTitle,
            pageType: 'symbols'
        });
    }

    function iqwinPage(options = {}) {
        const {
            brandTitle = '',
            title = 'IQWIN',
            lead = '',
            lettersHtml,
            payText,
            note
        } = options;

        const content = `<div class="terminal-info-pages__iqwin-page">${renderIqwinCard({
            lettersHtml,
            title,
            payText,
            note
        })}</div>`;

        return page(title, lead, content, {
            brandTitle,
            pageType: 'iqwin'
        });
    }

    function xoBadge() {
        return `<div class="terminal-info-pages__xo-badge" aria-hidden="true">
            <span class="terminal-info-pages__xo-mark terminal-info-pages__xo-mark--x">X</span>
            <span class="terminal-info-pages__xo-mark terminal-info-pages__xo-mark--o">O</span>
        </div>`;
    }

    function textBadge(label, symbol = '?') {
        return `<div class="terminal-info-pages__xo-badge" aria-hidden="true">
            <span class="terminal-info-pages__xo-mark terminal-info-pages__xo-mark--x">${symbol}</span>
            <span class="terminal-info-pages__text-badge-label">${label}</span>
        </div>`;
    }

    function pageTypeFromEl(page) {
        const className = String(page && page.className || '');
        if (className.indexOf('page--iqwin') !== -1) return 'iqwin';
        if (className.indexOf('page--lines') !== -1) return 'lines';
        if (className.indexOf('page--minigame') !== -1) return 'minigame';
        if (className.indexOf('page--skill') !== -1) return 'skill';
        if (className.indexOf('page--symbols') !== -1) return 'symbols';
        return 'info';
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Pagina 1 = tabel plati; paginile 2..N → o singură pagină „Reguli & info”.
     * Folosit atât în joc (popup Info), cât și pe top-display.
     */
    function collapseToTwoPages(html) {
        const raw = String(html || '').trim();
        if (!raw || raw.indexOf('terminal-info-pages__page') === -1) {
            return raw;
        }
        if (raw.indexOf('terminal-info-pages__page--digest') !== -1) {
            return raw;
        }

        try {
            const doc = new DOMParser().parseFromString('<div id="iqwin-info-root">' + raw + '</div>', 'text/html');
            const root = doc.getElementById('iqwin-info-root');
            if (!root) {
                return raw;
            }

            const pageEls = Array.from(root.querySelectorAll('.terminal-info-pages__page'));
            if (pageEls.length <= 1) {
                return raw;
            }

            const first = pageEls[0];
            const rest = pageEls.slice(1);
            const sections = rest.map((pageEl) => {
                const type = pageTypeFromEl(pageEl);
                const title = (pageEl.querySelector('.terminal-info-pages__title') || {}).textContent || 'Info';
                const leadEl = pageEl.querySelector('.terminal-info-pages__lead');
                const contentEl = pageEl.querySelector('.terminal-info-pages__content');
                const lead = (type === 'minigame' || type === 'iqwin') && leadEl
                    ? leadEl.innerHTML
                    : '';
                let content = contentEl ? contentEl.innerHTML : '';

                if (type === 'skill' && contentEl) {
                    const grid = contentEl.querySelector('.terminal-info-pages__skill-grid');
                    content = grid ? grid.outerHTML : content;
                }

                if (type === 'lines' && contentEl) {
                    const paylines = contentEl.querySelector('.terminal-info-pages__paylines');
                    const limits = contentEl.querySelector('.terminal-info-pages__bet-limits');
                    const rules = contentEl.querySelector('.terminal-info-pages__rules');
                    let rulesHtml = '';
                    if (rules) {
                        const paras = Array.from(rules.querySelectorAll('p')).slice(0, 2);
                        if (paras.length) {
                            rulesHtml = `<div class="terminal-info-pages__rules">${paras.map((p) => p.outerHTML).join('')}</div>`;
                        }
                    }
                    content = `${paylines ? paylines.outerHTML : ''}${rulesHtml}${limits ? limits.outerHTML : ''}`;
                }

                return `<article class="terminal-info-pages__digest-card terminal-info-pages__digest-card--${type}">
                    <header class="terminal-info-pages__digest-card-head">
                        <strong>${escapeHtml(title.trim())}</strong>
                        ${lead ? `<p>${lead}</p>` : ''}
                    </header>
                    <div class="terminal-info-pages__digest-card-body">${content}</div>
                </article>`;
            }).join('');

            const digest = doc.createElement('section');
            digest.className = 'terminal-info-pages__page terminal-info-pages__page--digest';
            digest.innerHTML = `<h2 class="terminal-info-pages__title">Reguli &amp; info</h2>
                <div class="terminal-info-pages__content">
                    <div class="terminal-info-pages__digest-grid" data-sections="${rest.length}">${sections}</div>
                </div>`;

            rest.forEach((pageEl) => pageEl.remove());
            if (first.nextSibling) {
                root.insertBefore(digest, first.nextSibling);
            } else {
                root.appendChild(digest);
            }

            return root.innerHTML;
        } catch (error) {
            return raw;
        }
    }

    function compose(pages) {
        return collapseToTwoPages(pages.filter(Boolean).join(''));
    }

    window.IqwinTerminalInfoPagesContent = {
        formatMultiplierLine,
        renderPayCard,
        renderPaylineGrid,
        renderIqwinCard,
        renderRulesParagraphs,
        renderBetLimits,
        getBetLimits,
        renderPaytableMatrixRow,
        paytableMatrixPage,
        iqwinPage,
        page,
        symbolsPage,
        linesPage,
        miniGamePage,
        skillPage,
        xoBadge,
        textBadge,
        collapseToTwoPages,
        compose
    };
})();
