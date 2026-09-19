<?php

require_once __DIR__ . '/../includes/terminal_api.php';
require_once __DIR__ . '/../includes/multiplayer_contest.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Terminal-Code, X-Terminal-Secret');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $terminal = termApiRequireTerminal();
    termApiUpdateHeartbeat($terminal);

    $method = $_SERVER['REQUEST_METHOD'];
    $body = $method === 'POST' ? termApiReadJsonBody() : [];
    $action = trim((string) ($body['action'] ?? $_GET['action'] ?? 'random'));

    if ($action === 'claim_refund' || $action === 'claim_refund_xo') {
        if (termMpIsParticipantInActiveContest($terminal)) {
            termJson(['ok' => false, 'message' => 'Mini-jocul de recuperare nu este disponibil in concurs.'], 422);
        }
    }

    if ($action === 'random') {
        $question = getDB()->fetchOne(
            'SELECT id, question, answer_a, answer_b, answer_c, answer_d, difficulty
             FROM quiz_questions
             WHERE is_active = 1
             ORDER BY RAND()
             LIMIT 1'
        );

        if (!$question) {
            termJson(['ok' => false, 'message' => 'Nu exista intrebari disponibile.'], 404);
        }

        termJson([
            'ok' => true,
            'question' => [
                'id' => (int) $question['id'],
                'text' => $question['question'],
                'answers' => [
                    ['key' => 'a', 'text' => $question['answer_a']],
                    ['key' => 'b', 'text' => $question['answer_b']],
                    ['key' => 'c', 'text' => $question['answer_c']],
                    ['key' => 'd', 'text' => $question['answer_d']],
                ],
                'difficulty' => (int) $question['difficulty'],
            ],
        ]);
    }

    if ($action === 'check' || $action === 'claim_refund') {
        $questionId = (int) ($body['question_id'] ?? 0);
        $selected = strtolower(trim((string) ($body['option'] ?? '')));

        if ($questionId <= 0 || !in_array($selected, ['a', 'b', 'c', 'd'], true)) {
            termJson(['ok' => false, 'message' => 'Date invalide.'], 422);
        }

        $question = getDB()->fetchOne(
            'SELECT id, correct_option, answer_a, answer_b, answer_c, answer_d
             FROM quiz_questions
             WHERE id = ? AND is_active = 1
             LIMIT 1',
            [$questionId]
        );

        if (!$question) {
            termJson(['ok' => false, 'message' => 'Intrebarea nu a fost gasita.'], 404);
        }

        $correct = $question['correct_option'] === $selected;
        $correctKey = $question['correct_option'];
        $correctText = $question['answer_' . $correctKey];

        if ($action === 'check') {
            termJson([
                'ok' => true,
                'correct' => $correct,
                'correct_option' => $correctKey,
                'correct_text' => $correctText,
            ]);
        }

        if (!$correct) {
            termJson([
                'ok' => true,
                'correct' => false,
                'correct_option' => $correctKey,
                'correct_text' => $correctText,
                'refund_credits' => 0,
            ]);
        }

        $sessionId = (int) ($body['session_id'] ?? 0);
        $gameId = (int) ($body['game_id'] ?? 0);

        if ($sessionId <= 0 || $gameId <= 0) {
            termJson(['ok' => false, 'message' => 'Sesiune invalida pentru recuperare.'], 422);
        }

        $db = getDB();
        $session = $db->fetchOne(
            'SELECT gs.*, g.slug
             FROM game_sessions gs
             INNER JOIN games g ON g.id = gs.game_id
             WHERE gs.id = ? AND gs.terminal_id = ? AND gs.game_id = ? AND gs.ended_at IS NOT NULL
             LIMIT 1',
            [$sessionId, (int) $terminal['id'], $gameId]
        );

        if (!$session) {
            termJson(['ok' => false, 'message' => 'Runda invalida pentru recuperare.'], 404);
        }

        if (termApiNormalizeCredits($session['credits_won'] ?? 0) > 0) {
            termJson(['ok' => false, 'message' => 'Recuperarea 50/50 este doar pentru rundele fara castig.'], 422);
        }

        if (termApiNormalizeCredits($session['quiz_refund_credits'] ?? 0) > 0) {
            termJson(['ok' => false, 'message' => 'Recuperarea 50/50 a fost deja folosita.'], 409);
        }

        $totalBet = termApiNormalizeCredits($session['credits_bet'] ?? 0);
        if ($totalBet <= 0) {
            termJson(['ok' => false, 'message' => 'Pariu invalid pentru recuperare.'], 422);
        }

        $refundCredits = termApiNormalizeCredits($totalBet / 2);
        if ($refundCredits <= 0) {
            termJson(['ok' => false, 'message' => 'Suma de recuperat prea mica.'], 422);
        }

        $balance = termApiAdjustCreditsBalance((int) $terminal['id'], $refundCredits);

        $db->insert('terminal_transactions', [
            'terminal_id' => (int) $terminal['id'],
            'session_id' => $sessionId,
            'type' => 'adjustment',
            'amount_credits' => $refundCredits,
            'amount_money' => 0,
            'balance_after' => $balance,
            'notes' => json_encode([
                'quiz_refund' => true,
                'question_id' => $questionId,
                'bet_credits' => $totalBet,
            ], JSON_UNESCAPED_UNICODE),
        ]);

        $db->update('game_sessions', [
            'quiz_refund_credits' => $refundCredits,
        ], 'id = :id AND terminal_id = :terminal_id', [
            'id' => $sessionId,
            'terminal_id' => (int) $terminal['id'],
        ]);

        $db->update('terminals', [
            'credits_balance' => $balance,
        ], 'id = :id', ['id' => (int) $terminal['id']]);

        termJson([
            'ok' => true,
            'correct' => true,
            'correct_option' => $correctKey,
            'correct_text' => $correctText,
            'refund_credits' => $refundCredits,
            'credits_balance' => $balance,
        ]);
    }

    if ($action === 'claim_refund_xo') {
        $won = filter_var($body['won'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (!$won) {
            termJson([
                'ok' => true,
                'correct' => false,
                'refund_credits' => 0,
            ]);
        }

        $sessionId = (int) ($body['session_id'] ?? 0);
        $gameId = (int) ($body['game_id'] ?? 0);

        if ($sessionId <= 0 || $gameId <= 0) {
            termJson(['ok' => false, 'message' => 'Sesiune invalida pentru recuperare.'], 422);
        }

        $db = getDB();
        $session = $db->fetchOne(
            'SELECT gs.*, g.slug
             FROM game_sessions gs
             INNER JOIN games g ON g.id = gs.game_id
             WHERE gs.id = ? AND gs.terminal_id = ? AND gs.game_id = ? AND gs.ended_at IS NOT NULL
             LIMIT 1',
            [$sessionId, (int) $terminal['id'], $gameId]
        );

        if (!$session) {
            termJson(['ok' => false, 'message' => 'Runda invalida pentru recuperare.'], 404);
        }

        if (termApiNormalizeCredits($session['credits_won'] ?? 0) > 0) {
            termJson(['ok' => false, 'message' => 'Recuperarea 50/50 este doar pentru rundele fara castig.'], 422);
        }

        if (termApiNormalizeCredits($session['quiz_refund_credits'] ?? 0) > 0) {
            termJson(['ok' => false, 'message' => 'Recuperarea 50/50 a fost deja folosita.'], 409);
        }

        $totalBet = termApiNormalizeCredits($session['credits_bet'] ?? 0);
        if ($totalBet <= 0) {
            termJson(['ok' => false, 'message' => 'Pariu invalid pentru recuperare.'], 422);
        }

        $refundCredits = termApiNormalizeCredits($totalBet / 2);
        if ($refundCredits <= 0) {
            termJson(['ok' => false, 'message' => 'Suma de recuperat prea mica.'], 422);
        }

        $balance = termApiAdjustCreditsBalance((int) $terminal['id'], $refundCredits);

        $db->insert('terminal_transactions', [
            'terminal_id' => (int) $terminal['id'],
            'session_id' => $sessionId,
            'type' => 'adjustment',
            'amount_credits' => $refundCredits,
            'amount_money' => 0,
            'balance_after' => $balance,
            'notes' => json_encode([
                'xo_refund' => true,
                'bet_credits' => $totalBet,
            ], JSON_UNESCAPED_UNICODE),
        ]);

        $db->update('game_sessions', [
            'quiz_refund_credits' => $refundCredits,
        ], 'id = :id AND terminal_id = :terminal_id', [
            'id' => $sessionId,
            'terminal_id' => (int) $terminal['id'],
        ]);

        $db->update('terminals', [
            'credits_balance' => $balance,
        ], 'id = :id', ['id' => (int) $terminal['id']]);

        termJson([
            'ok' => true,
            'correct' => true,
            'refund_credits' => $refundCredits,
            'credits_balance' => $balance,
        ]);
    }

    termJson(['ok' => false, 'message' => 'Actiune necunoscuta.'], 400);
} catch (Exception $e) {
    termJson(['ok' => false, 'message' => 'Eroare server quiz.'], 500);
}
