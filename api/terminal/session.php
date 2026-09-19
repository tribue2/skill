<?php

require_once __DIR__ . '/../includes/terminal_api.php';
require_once __DIR__ . '/../includes/multiplayer_contest.php';
require_once __DIR__ . '/../includes/top_display_state.php';

foreach (['verga_gold_engine.php', 'boss_crown_engine.php', 'dodge_bomb_engine.php', 'logic_and_zeus_engine.php', 'forty_burn_hot_engine.php', 'intelligent_book_engine.php'] as $engineFileName) {
    $engineFile = __DIR__ . '/../includes/games/' . $engineFileName;
    if (is_file($engineFile)) {
        require_once $engineFile;
    }
}

function termApiSkillSlotEngineClass(string $slug): ?string
{
    $map = [
        'verga-gold' => 'VergaGoldEngine',
        'boss-crown' => 'BossCrownEngine',
        'dodge-bomb' => 'DodgeBombEngine',
        'logic-and-zeus' => 'LogicAndZeusEngine',
        '40-burn-hot' => 'FortyBurnHotEngine',
        'intelligent-book' => 'IntelligentBookEngine',
    ];

    $class = $map[$slug] ?? null;
    if ($class && class_exists($class)) {
        return $class;
    }

    return null;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Terminal-Code, X-Terminal-Secret');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    termJson(['ok' => false, 'message' => 'Metoda invalida.'], 405);
}

try {
$terminal = termApiRequireTerminal();
$body = termApiReadJsonBody();

$gameId = (int) ($body['game_id'] ?? 0);
$action = trim((string) ($body['action'] ?? 'end'));

if ($action === 'force_close') {
    $sessionId = (int) ($body['session_id'] ?? 0);
    if ($sessionId <= 0) {
        termJson(['ok' => false, 'message' => 'Sesiune invalida.'], 422);
    }

    $session = getDB()->fetchOne(
        'SELECT id, ended_at FROM game_sessions WHERE id = ? AND terminal_id = ? LIMIT 1',
        [$sessionId, (int) $terminal['id']]
    );

    if (!$session) {
        termJson(['ok' => false, 'message' => 'Sesiune invalida.'], 404);
    }

    if (empty($session['ended_at'])) {
        getDB()->update('game_sessions', [
            'credits_won' => 0,
            'ended_at' => date('Y-m-d H:i:s'),
        ], 'id = :id AND terminal_id = :terminal_id', [
            'id' => $sessionId,
            'terminal_id' => (int) $terminal['id'],
        ]);
    }

    termJson([
        'ok' => true,
        'credits_balance' => termApiCreditsBalance($terminal),
    ]);
}

if ($action === 'close') {
    termApiCloseAllOpenGameSessions((int) $terminal['id']);

    $sessionId = (int) ($body['session_id'] ?? 0);
    if ($sessionId > 0) {
        $session = getDB()->fetchOne(
            'SELECT id, ended_at FROM game_sessions WHERE id = ? AND terminal_id = ? LIMIT 1',
            [$sessionId, (int) $terminal['id']]
        );

        if ($session && empty($session['ended_at'])) {
            getDB()->update('game_sessions', [
                'ended_at' => date('Y-m-d H:i:s'),
            ], 'id = :id AND terminal_id = :terminal_id', [
                'id' => $sessionId,
                'terminal_id' => (int) $terminal['id'],
            ]);
        }
    }

    termTopDisplaySetLobby((int) ($terminal['id'] ?? 0));

    termJson([
        'ok' => true,
        'credits_balance' => termApiCreditsBalance($terminal),
    ]);
}

if ($action === 'golden_bubble_bonus') {
    $db = getDB();
    $prizeCredits = termApiNormalizeCredits($body['prize_credits'] ?? 0);

    if ($prizeCredits <= 0) {
        termJson(['ok' => false, 'message' => 'Premiu invalid.'], 422);
    }

    $bonusGameId = (int) ($body['game_id'] ?? 0);
    $terminalId = (int) $terminal['id'];
    $balance = termApiAdjustCreditsBalance($terminalId, $prizeCredits);

    $db->insert('terminal_transactions', [
        'terminal_id' => (int) $terminal['id'],
        'session_id' => null,
        'type' => 'win',
        'amount_credits' => $prizeCredits,
        'amount_money' => 0,
        'balance_after' => $balance,
        'notes' => json_encode([
            'golden_bubble' => true,
            'game_id' => $bonusGameId,
        ], JSON_UNESCAPED_UNICODE),
    ]);

    $db->update('terminals', [
        'credits_balance' => $balance,
    ], 'id = :id', ['id' => (int) $terminal['id']]);

    termJson([
        'ok' => true,
        'credits_balance' => $balance,
        'prize_credits' => $prizeCredits,
    ]);
}

$game = getDB()->fetchOne('SELECT * FROM games WHERE id = ? LIMIT 1', [$gameId]);
if (
    !$game
    || $game['status'] !== 'active'
    || (int) ($game['is_visible'] ?? 1) !== 1
    || (int) ($game['is_frozen'] ?? 0) === 1
) {
    termJson(['ok' => false, 'message' => 'Joc indisponibil.'], 404);
}

$db = getDB();
$engineClass = termApiSkillSlotEngineClass((string) ($game['slug'] ?? ''));
$isValidatedGame = $engineClass !== null;

if ($action === 'start') {
    if ($isValidatedGame) {
        $betPerLine = termApiParseBetPerLine($body['bet'] ?? 0);
        $lines = $engineClass::normalizeLines((int) ($body['lines'] ?? 0));

        if ($betPerLine <= 0) {
            termApiCloseIdleGameSessions((int) $terminal['id']);

            $sessionId = (int) $db->insert('game_sessions', [
                'terminal_id' => (int) $terminal['id'],
                'game_id' => $gameId,
                'started_at' => date('Y-m-d H:i:s'),
            ]);

            // Dual-kiosk: top-display e pe alt profil Chrome — marcheaza jocul pe server
            // ca poll-ul sa iasa imediat din logo, inainte de HTML-ul paytable.
            termTopDisplaySetGame(
                (int) ($terminal['id'] ?? 0),
                (string) ($game['slug'] ?? ''),
                (string) ($game['title'] ?? '')
            );

            termJson([
                'ok' => true,
                'session_id' => $sessionId,
                'credits_balance' => termApiCreditsBalance($terminal),
                'validated' => true,
                'preview' => true,
                'contest' => termMpBuildPayloadForTerminal($terminal),
            ]);
        }

        $mpCtx = termMpIsParticipantInActiveContest($terminal);
        if ($mpCtx) {
            try {
                $spin = termMpProcessContestSpinStart($terminal, $gameId, $engineClass);
                $participant = $spin['participant'] ?? [];
                $contest = termMpBuildPayloadForTerminal($terminal);
                $blitzSold = (float) ($participant['blitz_balance_credits'] ?? 0);
                termJson([
                    'ok' => true,
                    'session_id' => (int) $spin['session_id'],
                    'credits_balance' => termApiCreditsBalance($terminal),
                    'validated' => true,
                    'contest_spin' => true,
                    'contest' => $contest,
                    'mp_display' => [
                        'normal_balance' => termApiFetchCreditsBalanceById((int) $terminal['id']),
                        'blitz_sold' => round($blitzSold, 2),
                        'blitz_balance' => round((float) ($participant['blitz_balance_credits'] ?? 0), 2),
                        'contest_winnings' => round((float) ($participant['contest_winnings_credits'] ?? 0), 2),
                        'spin_budget' => 0,
                        'spins_used' => (int) ($participant['spins_used'] ?? 0),
                        'spins_required' => MP_SPINS_REQUIRED,
                        'seconds_remaining' => max(0, (int) ($contest['contest_seconds_remaining'] ?? 0)),
                        'is_qualified' => (int) ($participant['spins_used'] ?? 0) >= MP_SPINS_REQUIRED,
                    ],
                    'fixed_bet_credits' => (float) ($spin['spin_cost'] ?? termMpSpinCredits($terminal)),
                    'bet_per_line' => (float) ($spin['bet_per_line'] ?? 0),
                    'lines' => (int) ($spin['lines'] ?? 0),
                    'contest_bet_per_line' => (float) ($spin['bet_per_line'] ?? 0),
                    'contest_lines' => (int) ($spin['lines'] ?? 0),
                ]);
            } catch (RuntimeException $e) {
                termJson(['ok' => false, 'message' => $e->getMessage()], 422);
            }
        }

        $minBet = 0.1;
        $maxBet = max($minBet, (float) ($game['max_bet'] ?? 5000));
        $totalBet = termApiTotalBetCredits($betPerLine, $lines);

        if ($betPerLine < $minBet || $betPerLine > $maxBet) {
            termJson(['ok' => false, 'message' => 'Pariu invalid.'], 422);
        }

        if ($totalBet <= 0) {
            termJson(['ok' => false, 'message' => 'Pariu invalid.'], 422);
        }

        $creditRate = termTerminalCreditRate($terminal);
        if ($totalBet < termApiMinTotalBetCredits()) {
            $minLei = round(termApiMinTotalBetCredits() * $creditRate, 2);
            termJson(['ok' => false, 'message' => 'Miza minima este ' . number_format($minLei, 2, ',', '.') . ' LEI.'], 422);
        }

        if ($totalBet > termApiMaxTotalBetCredits()) {
            $maxLei = round(termApiMaxTotalBetCredits() * $creditRate, 2);
            termJson(['ok' => false, 'message' => 'Miza maxima este ' . number_format($maxLei, 2, ',', '.') . ' LEI.'], 422);
        }

        $balance = termApiCreditsBalance($terminal);
        if ($balance < $totalBet) {
            termJson(['ok' => false, 'message' => 'Sold insuficient.'], 422);
        }

        termApiRequireBalanceUnderCap($terminal);

        $terminalId = (int) $terminal['id'];

        $openSession = $db->fetchOne(
            'SELECT id FROM game_sessions
             WHERE terminal_id = ?
               AND game_id = ?
               AND ended_at IS NULL
               AND credits_bet > 0
             ORDER BY id DESC
             LIMIT 1',
            [$terminalId, $gameId]
        );

        if ($openSession) {
            termJson([
                'ok' => false,
                'message' => 'Runda anterioara neincheiata.',
                'open_session_id' => (int) $openSession['id'],
                'code' => 'open_session',
            ], 409);
        }

        $balance = termApiAdjustCreditsBalance($terminalId, -$totalBet);
        termApiCloseIdleGameSessions($terminalId);

        $sessionId = (int) $db->insert('game_sessions', [
            'terminal_id' => (int) $terminal['id'],
            'game_id' => $gameId,
            'credits_in' => termApiStoreBetPerLine($betPerLine),
            'credits_out' => $lines,
            'credits_bet' => $totalBet,
            'started_at' => date('Y-m-d H:i:s'),
        ]);

        $db->insert('terminal_transactions', [
            'terminal_id' => (int) $terminal['id'],
            'session_id' => $sessionId,
            'type' => 'bet',
            'amount_credits' => $totalBet,
            'amount_money' => 0,
            'balance_after' => $balance,
        ]);

        $db->update('terminals', [
            'credits_balance' => $balance,
        ], 'id = :id', ['id' => (int) $terminal['id']]);

        try {
            termMpApplyBet($terminal, $totalBet);
        } catch (Throwable $e) {
            error_log('session.php multiplayer bet: ' . $e->getMessage());
        }
        $contest = termMpBuildPayloadForSessionResponse($terminal, null);

        $balance = termApiFetchCreditsBalanceById((int) $terminal['id']);
        termPlayVisitOnActivity($terminalId, (float) $balance, ['bets' => 1]);

        termJson([
            'ok' => true,
            'session_id' => $sessionId,
            'credits_balance' => $balance,
            'validated' => true,
            'bet_per_line' => $betPerLine,
            'lines' => $lines,
            'total_bet_credits' => $totalBet,
            'contest' => $contest,
        ]);
    }

    $sessionId = $db->insert('game_sessions', [
        'terminal_id' => (int) $terminal['id'],
        'game_id' => $gameId,
        'started_at' => date('Y-m-d H:i:s'),
    ]);

    termJson([
        'ok' => true,
        'session_id' => (int) $sessionId,
        'credits_balance' => termApiCreditsBalance($terminal),
        'validated' => false,
    ]);
}

$sessionId = (int) ($body['session_id'] ?? 0);

if ($isValidatedGame) {
    if ($sessionId <= 0) {
        termJson(['ok' => false, 'message' => 'Sesiune invalida.'], 422);
    }

    $session = $db->fetchOne(
        'SELECT * FROM game_sessions WHERE id = ? AND terminal_id = ? AND game_id = ? LIMIT 1',
        [$sessionId, (int) $terminal['id'], $gameId]
    );

    if (!$session) {
        termJson(['ok' => false, 'message' => 'Sesiune invalida.'], 404);
    }

    $betPerLine = termApiBetPerLineFromStored((int) ($session['credits_in'] ?? 0));
    $lines = $engineClass::normalizeLines((int) ($session['credits_out'] ?? 0));
    $totalBet = termApiNormalizeCredits($session['credits_bet'] ?? 0);
    $expectedTotal = termApiTotalBetCredits($betPerLine, $lines);

    if ($betPerLine <= 0 || $lines <= 0 || !termApiCreditsEqual($totalBet, $expectedTotal)) {
        termJson(['ok' => false, 'message' => 'Sesiune corupta.'], 422);
    }

    $reelStops = $engineClass::parseReelStops($body['reel_stops'] ?? null);
    if ($reelStops === null) {
        if (empty($session['ended_at'])) {
            $db->update('game_sessions', [
                'credits_won' => 0,
                'ended_at' => date('Y-m-d H:i:s'),
            ], 'id = :id AND terminal_id = :terminal_id', [
                'id' => $sessionId,
                'terminal_id' => (int) $terminal['id'],
            ]);
        }
        termJson([
            'ok' => false,
            'message' => 'Pozitii role lipsa.',
            'session_closed' => true,
            'code' => 'invalid_reel_stops',
        ], 422);
    }

    $evaluation = $engineClass::evaluateRound($betPerLine, $lines, $reelStops);
    if (empty($evaluation['ok'])) {
        // Strip length / stop mismatch (e.g. client cache vs server strips) must not
        // leave the session open — otherwise the terminal locks on pending payout sync.
        if (empty($session['ended_at'])) {
            $db->update('game_sessions', [
                'credits_won' => 0,
                'ended_at' => date('Y-m-d H:i:s'),
            ], 'id = :id AND terminal_id = :terminal_id', [
                'id' => $sessionId,
                'terminal_id' => (int) $terminal['id'],
            ]);
        }
        termJson([
            'ok' => false,
            'message' => $evaluation['message'] ?? 'Runda invalida.',
            'session_closed' => true,
            'code' => 'invalid_reel_stops',
        ], 422);
    }

    $displayWin = termApiNormalizeCredits($evaluation['total'] ?? 0);
    $skillStopUsed = array_key_exists('skill_stop_used', $body)
        && filter_var($body['skill_stop_used'], FILTER_VALIDATE_BOOLEAN);
    $terminalId = (int) $terminal['id'];
    $mpCtx = termMpGetContestContextForSpinEnd($terminal, $session);
    $inContest = !!$mpCtx;
    $creditsWon = termMpResolveSpinWinCredits($displayWin, $skillStopUsed, $inContest);
    $sessionExtras = termMpBuildSessionEndExtras($terminal, $session);

    $existingWinTx = $db->fetchOne(
        'SELECT amount_credits FROM terminal_transactions WHERE session_id = ? AND type = ? LIMIT 1',
        [$sessionId, 'win']
    );
    if ($existingWinTx && !$inContest) {
        $paidWin = termApiNormalizeCredits($existingWinTx['amount_credits'] ?? 0);
        termJson(array_merge([
            'ok' => true,
            'session_id' => $sessionId,
            'credits_balance' => termApiCreditsBalance($terminal),
            'credits_won' => $paidWin,
            'display_win' => max($displayWin, $paidWin),
            'skill_stop_used' => $skillStopUsed,
            'validated' => true,
            'recovered' => true,
        ], $sessionExtras));
    }

    $storedWin = termApiNormalizeCredits($session['credits_won'] ?? 0);
    if (!empty($session['ended_at'])) {
        if ($inContest && $creditsWon > 0 && !termMpContestSpinWinAlreadyCredited($sessionId)) {
            termMpProcessContestSpinWin($terminal, $sessionId, $creditsWon, $session);
            $storedWin = max($storedWin, $creditsWon);
            $sessionExtras = termMpBuildSessionEndExtras($terminal, $session);
        }

        if ($storedWin > 0 || ($inContest && ($displayWin > 0 || $creditsWon > 0))) {
            termJson(array_merge([
                'ok' => true,
                'session_id' => $sessionId,
                'credits_balance' => termApiFetchCreditsBalanceById($terminalId),
                'credits_won' => max($storedWin, $creditsWon),
                'display_win' => max($displayWin, $storedWin, $creditsWon),
                'skill_stop_used' => $skillStopUsed,
                'validated' => true,
                'recovered' => true,
            ], $sessionExtras));
        }

        if ($creditsWon > 0 && $storedWin <= 0) {
            if ($inContest) {
                termMpProcessContestSpinWin($terminal, $sessionId, $creditsWon, $session);
                $balance = termApiFetchCreditsBalanceById($terminalId);
                $db->update('game_sessions', [
                    'credits_won' => $creditsWon,
                ], 'id = :id AND terminal_id = :terminal_id', [
                    'id' => $sessionId,
                    'terminal_id' => (int) $terminal['id'],
                ]);
                $db->update('terminals', [
                    'credits_balance' => $balance,
                ], 'id = :id', ['id' => (int) $terminal['id']]);
                termJson(array_merge([
                    'ok' => true,
                    'session_id' => $sessionId,
                    'credits_balance' => $balance,
                    'credits_won' => $creditsWon,
                    'display_win' => $displayWin,
                    'skill_stop_used' => $skillStopUsed,
                    'validated' => true,
                    'late_pay' => true,
                ], termMpBuildSessionEndExtras($terminal, $session)));
            } elseif ($skillStopUsed) {
                $balance = termApiAdjustCreditsBalance($terminalId, $creditsWon);
                $db->insert('terminal_transactions', [
                    'terminal_id' => $terminalId,
                    'session_id' => $sessionId,
                    'type' => 'win',
                    'amount_credits' => $creditsWon,
                    'amount_money' => 0,
                    'balance_after' => $balance,
                    'notes' => json_encode([
                        'reel_stops' => $reelStops,
                        'late_pay' => true,
                    ], JSON_UNESCAPED_UNICODE),
                ]);
                $db->update('game_sessions', [
                    'credits_won' => $creditsWon,
                ], 'id = :id AND terminal_id = :terminal_id', [
                    'id' => $sessionId,
                    'terminal_id' => (int) $terminal['id'],
                ]);
                $db->update('terminals', [
                    'credits_balance' => $balance,
                ], 'id = :id', ['id' => (int) $terminal['id']]);

                termJson(array_merge([
                    'ok' => true,
                    'session_id' => $sessionId,
                    'credits_balance' => $balance,
                    'credits_won' => $creditsWon,
                    'display_win' => $displayWin,
                    'skill_stop_used' => $skillStopUsed,
                    'validated' => true,
                    'late_pay' => true,
                ], $sessionExtras));
            }
        }

        termJson(['ok' => false, 'message' => 'Runda deja inchisa.'], 409);
    }

    if ($creditsWon > 0) {
        if ($inContest) {
            termMpProcessContestSpinWin($terminal, $sessionId, $creditsWon, $session);
        } else {
            $balance = termApiAdjustCreditsBalance($terminalId, $creditsWon);
            $db->insert('terminal_transactions', [
                'terminal_id' => $terminalId,
                'session_id' => $sessionId,
                'type' => 'win',
                'amount_credits' => $creditsWon,
                'amount_money' => 0,
                'balance_after' => $balance,
                'notes' => json_encode(['reel_stops' => $reelStops], JSON_UNESCAPED_UNICODE),
            ]);
        }
    } elseif ($inContest) {
        termMpProcessContestSpinWin($terminal, $sessionId, 0, $session);
    }

    $db->update('game_sessions', [
        'credits_won' => $creditsWon,
        'ended_at' => date('Y-m-d H:i:s'),
    ], 'id = :id AND terminal_id = :terminal_id', [
        'id' => $sessionId,
        'terminal_id' => (int) $terminal['id'],
    ]);

    $contestPayload = termMpBuildPayloadForSessionResponse($terminal, $session);
    $mpDisplay = termMpBuildSessionMpDisplay($terminal, $session);

    $balance = termApiFetchCreditsBalanceById($terminalId);
    $recentWin = is_array($contestPayload['recent_win'] ?? null) ? $contestPayload['recent_win'] : null;
    if ($recentWin && !empty($recentWin['is_self']) && isset($recentWin['credits_balance'])) {
        $balance = max($balance, (float) $recentWin['credits_balance']);
    }

    $db->update('terminals', [
        'credits_balance' => $balance,
    ], 'id = :id', ['id' => (int) $terminal['id']]);

    termPlayVisitOnActivity((int) $terminal['id'], (float) $balance);

    termJson(array_merge([
        'ok' => true,
        'session_id' => $sessionId,
        'credits_balance' => $balance,
        'credits_won' => $creditsWon,
        'display_win' => $displayWin,
        'skill_stop_used' => $skillStopUsed,
        'validated' => true,
        'contest' => $contestPayload,
        'mp_display' => $mpDisplay,
        'balance_cap' => termApiBalanceCapPayload($terminal),
    ]));
}

$creditsBet = termApiNormalizeCredits($body['credits_bet'] ?? 0);
$creditsWon = termApiNormalizeCredits($body['credits_won'] ?? 0);
$balance = termApiCreditsBalance($terminal);

$contest = null;
if ($creditsBet > 0) {
    $balance = termApiNormalizeCredits($balance - $creditsBet);
    $db->insert('terminal_transactions', [
        'terminal_id' => (int) $terminal['id'],
        'session_id' => $sessionId ?: null,
        'type' => 'bet',
        'amount_credits' => $creditsBet,
        'amount_money' => 0,
        'balance_after' => $balance,
    ]);
}

if ($creditsWon > 0) {
    $balance = termApiNormalizeCredits($balance + $creditsWon);
    $db->insert('terminal_transactions', [
        'terminal_id' => (int) $terminal['id'],
        'session_id' => $sessionId ?: null,
        'type' => 'win',
        'amount_credits' => $creditsWon,
        'amount_money' => 0,
        'balance_after' => $balance,
    ]);
}

if ($sessionId > 0) {
    $db->update('game_sessions', [
        'credits_bet' => $creditsBet,
        'credits_won' => $creditsWon,
        'ended_at' => date('Y-m-d H:i:s'),
    ], 'id = :id AND terminal_id = :terminal_id', [
        'id' => $sessionId,
        'terminal_id' => (int) $terminal['id'],
    ]);
} else {
    $sessionId = (int) $db->insert('game_sessions', [
        'terminal_id' => (int) $terminal['id'],
        'game_id' => $gameId,
        'credits_bet' => $creditsBet,
        'credits_won' => $creditsWon,
        'ended_at' => date('Y-m-d H:i:s'),
    ]);
}

$db->update('terminals', [
    'credits_balance' => $balance,
], 'id = :id', ['id' => (int) $terminal['id']]);

if ($creditsBet > 0) {
    try {
        $contest = termMpApplyBet($terminal, $creditsBet);
    } catch (Throwable $e) {
        error_log('session.php multiplayer legacy bet: ' . $e->getMessage());
    }
}
if (!$contest) {
    $contest = termMpBuildPayloadForTerminal($terminal);
}

$balance = termMpResolveTerminalCreditsBalance($terminal, is_array($contest) ? $contest : null);
termPlayVisitOnActivity((int) $terminal['id'], (float) $balance, $creditsBet > 0 ? ['bets' => 1] : []);

termJson([
    'ok' => true,
    'session_id' => $sessionId,
    'credits_balance' => $balance,
    'validated' => false,
    'contest' => $contest,
]);
} catch (Throwable $e) {
    error_log('session.php: ' . $e->getMessage());
    termJson(['ok' => false, 'message' => 'Eroare server sesiune.'], 500);
}
