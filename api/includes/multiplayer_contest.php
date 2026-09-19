<?php

const MP_ENTRY_OPTIONS = [50, 100, 200];
const MP_LOBBY_SECONDS = 60;
const MP_LOBBY_DISPLAY_MAX = 3;
const MP_LOBBY_MIN_PARTICIPANTS = 2;
const MP_CONTEST_SECONDS = 300;
const MP_SPINS_REQUIRED = 50;
const MP_SPIN_LEI = 1.0;

function termMpGetTier(float $entryFee): ?array
{
    $fee = termMpNormalizeEntryFee($entryFee);
    if ($fee <= 0) {
        return null;
    }
    $spinLei = 1.0;
    if (abs($fee - 50) < 0.001) {
        $spinLei = 0.5;
    } elseif (abs($fee - 100) < 0.001) {
        $spinLei = 1.0;
    } elseif (abs($fee - 200) < 0.001) {
        $spinLei = 2.0;
    }
    $spinReserveLei = termMpRoundMoney($spinLei * MP_SPINS_REQUIRED);
    return [
        'entry_fee' => $fee,
        'spin_lei' => $spinLei,
        'blitz_share_lei' => $fee,
        'spin_budget_lei' => $spinReserveLei,
        'spin_reserve_lei' => $spinReserveLei,
        'spins' => MP_SPINS_REQUIRED,
    ];
}

function termMpBuildEntryTiersList(): array
{
    $tiers = [];
    foreach (MP_ENTRY_OPTIONS as $fee) {
        $tier = termMpGetTier((float) $fee);
        if ($tier) {
            $tiers[] = $tier;
        }
    }
    return $tiers;
}

function termMpSpinLeiFromContest(array $contest): float
{
    $stored = (float) ($contest['spin_lei'] ?? 0);
    if ($stored > 0) {
        return $stored;
    }
    $tier = termMpGetTier((float) ($contest['entry_fee'] ?? 0));
    return $tier ? (float) $tier['spin_lei'] : MP_SPIN_LEI;
}

function termMpBuildContestTierSummary(array $contest, int $participantsCount = 2): array
{
    $fee = (float) ($contest['entry_fee'] ?? 0);
    $tier = termMpGetTier($fee) ?? [
        'entry_fee' => $fee,
        'spin_lei' => termMpSpinLeiFromContest($contest),
        'blitz_share_lei' => $fee,
        'spin_budget_lei' => termMpRoundMoney(termMpSpinLeiFromContest($contest) * MP_SPINS_REQUIRED),
        'spin_reserve_lei' => termMpRoundMoney(termMpSpinLeiFromContest($contest) * MP_SPINS_REQUIRED),
        'spins' => MP_SPINS_REQUIRED,
    ];
    $players = max(2, $participantsCount);
    $tier['estimated_blitz_prize'] = termMpRoundMoney($fee * $players);
    $tier['win_info'] = 'Castiga primul jucator care termina cele ' . MP_SPINS_REQUIRED
        . ' spinuri. Primeste potul Blitz plus castigurile din spinuri. Ceilalti pierd tot.';
    return $tier;
}

function termMpEnsureSchema(): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;

    try {
        $db = getDB();
        $col = $db->fetchOne("SHOW COLUMNS FROM stations LIKE 'multiplayer_prize_enabled'");
        if (!$col) {
            $db->query(
                'ALTER TABLE stations
                 ADD COLUMN multiplayer_prize_enabled tinyint(1) NOT NULL DEFAULT 0 AFTER is_active,
                 ADD COLUMN multiplayer_prize_amount decimal(12,2) NOT NULL DEFAULT 500.00 AFTER multiplayer_prize_enabled,
                 ADD COLUMN multiplayer_contribution_pct decimal(5,2) NOT NULL DEFAULT 10.00 AFTER multiplayer_prize_amount'
            );
        }

        $table = $db->fetchOne("SHOW TABLES LIKE 'station_multiplayer_contests'");
        if (!$table) {
            $db->query(
                "CREATE TABLE station_multiplayer_contests (
                  id bigint unsigned NOT NULL AUTO_INCREMENT,
                  station_id int unsigned NOT NULL,
                  entry_fee decimal(12,2) NOT NULL DEFAULT 0,
                  prize_amount decimal(12,2) NOT NULL DEFAULT 0,
                  contribution_pct decimal(5,2) NOT NULL DEFAULT 0,
                  pool_amount decimal(14,4) NOT NULL DEFAULT 0.0000,
                  status enum('lobby','active','won','draw','cancelled') NOT NULL DEFAULT 'lobby',
                  host_terminal_id int unsigned DEFAULT NULL,
                  winner_terminal_id int unsigned DEFAULT NULL,
                  prize_credits decimal(12,2) NOT NULL DEFAULT 0,
                  prize_paid_at datetime DEFAULT NULL,
                  result_type varchar(20) DEFAULT NULL,
                  lobby_ends_at datetime DEFAULT NULL,
                  contest_ends_at datetime DEFAULT NULL,
                  started_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  ended_at datetime DEFAULT NULL,
                  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_smc_station_status (station_id, status),
                  KEY idx_smc_winner (winner_terminal_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
            );
        } else {
            $statusCol = $db->fetchOne("SHOW COLUMNS FROM station_multiplayer_contests LIKE 'status'");
            if ($statusCol && strpos((string) ($statusCol['Type'] ?? ''), 'lobby') === false) {
                $db->query(
                    "ALTER TABLE station_multiplayer_contests
                     MODIFY COLUMN status enum('lobby','active','won','draw','cancelled') NOT NULL DEFAULT 'lobby'"
                );
            }
            $cols = [
                'entry_fee' => "ADD COLUMN entry_fee decimal(12,2) NOT NULL DEFAULT 0 AFTER station_id",
                'lobby_ends_at' => 'ADD COLUMN lobby_ends_at datetime DEFAULT NULL AFTER started_at',
                'contest_ends_at' => 'ADD COLUMN contest_ends_at datetime DEFAULT NULL AFTER lobby_ends_at',
                'host_terminal_id' => 'ADD COLUMN host_terminal_id int unsigned DEFAULT NULL AFTER contest_ends_at',
                'spin_lei' => 'ADD COLUMN spin_lei decimal(8,2) NOT NULL DEFAULT 1.00 AFTER entry_fee',
                'result_type' => 'ADD COLUMN result_type varchar(20) DEFAULT NULL AFTER prize_paid_at',
            ];
            foreach ($cols as $name => $sql) {
                if (!$db->fetchOne("SHOW COLUMNS FROM station_multiplayer_contests LIKE '{$name}'")) {
                    $db->query("ALTER TABLE station_multiplayer_contests {$sql}");
                }
            }
        }

        if (!$db->fetchOne("SHOW COLUMNS FROM stations LIKE 'mp_contest_revision'")) {
            $db->query(
                'ALTER TABLE stations ADD COLUMN mp_contest_revision bigint unsigned NOT NULL DEFAULT 0 AFTER multiplayer_contribution_pct'
            );
        }

        $contrib = $db->fetchOne("SHOW TABLES LIKE 'station_multiplayer_contributions'");
        if (!$contrib) {
            $db->query(
                "CREATE TABLE station_multiplayer_contributions (
                  id bigint unsigned NOT NULL AUTO_INCREMENT,
                  contest_id bigint unsigned NOT NULL,
                  terminal_id int unsigned NOT NULL,
                  entry_credits decimal(14,4) NOT NULL DEFAULT 0,
                  entry_charged tinyint(1) NOT NULL DEFAULT 0,
                  spin_budget_remaining decimal(14,4) NOT NULL DEFAULT 0,
                  spins_used int unsigned NOT NULL DEFAULT 0,
                  spins_required int unsigned NOT NULL DEFAULT 50,
                  contest_winnings_credits decimal(14,4) NOT NULL DEFAULT 0,
                  blitz_balance_credits decimal(14,4) NOT NULL DEFAULT 0,
                  is_qualified tinyint(1) NOT NULL DEFAULT 0,
                  joined_at datetime DEFAULT NULL,
                  bet_credits decimal(14,4) NOT NULL DEFAULT 0,
                  bet_money decimal(14,4) NOT NULL DEFAULT 0,
                  contribution_money decimal(14,4) NOT NULL DEFAULT 0,
                  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  UNIQUE KEY uq_smc_contest_terminal (contest_id, terminal_id),
                  KEY idx_smc_terminal (terminal_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
            );
        } else {
            $pCols = [
                'entry_credits' => 'ADD COLUMN entry_credits decimal(14,4) NOT NULL DEFAULT 0 AFTER terminal_id',
                'spin_budget_remaining' => 'ADD COLUMN spin_budget_remaining decimal(14,4) NOT NULL DEFAULT 0 AFTER entry_credits',
                'spins_used' => 'ADD COLUMN spins_used int unsigned NOT NULL DEFAULT 0 AFTER spin_budget_remaining',
                'spins_required' => 'ADD COLUMN spins_required int unsigned NOT NULL DEFAULT 50 AFTER spins_used',
                'contest_winnings_credits' => 'ADD COLUMN contest_winnings_credits decimal(14,4) NOT NULL DEFAULT 0 AFTER spins_required',
                'blitz_balance_credits' => 'ADD COLUMN blitz_balance_credits decimal(14,4) NOT NULL DEFAULT 0 AFTER contest_winnings_credits',
                'is_qualified' => 'ADD COLUMN is_qualified tinyint(1) NOT NULL DEFAULT 0 AFTER blitz_balance_credits',
                'joined_at' => 'ADD COLUMN joined_at datetime DEFAULT NULL AFTER is_qualified',
            ];
            foreach ($pCols as $name => $sql) {
                if (!$db->fetchOne("SHOW COLUMNS FROM station_multiplayer_contributions LIKE '{$name}'")) {
                    $db->query("ALTER TABLE station_multiplayer_contributions {$sql}");
                }
            }
            if (!$db->fetchOne("SHOW COLUMNS FROM station_multiplayer_contributions LIKE 'entry_charged'")) {
                $db->query(
                    'ALTER TABLE station_multiplayer_contributions ADD COLUMN entry_charged tinyint(1) NOT NULL DEFAULT 0 AFTER entry_credits'
                );
            }
            if (!$db->fetchOne("SHOW COLUMNS FROM station_multiplayer_contributions LIKE 'completed_at'")) {
                $db->query(
                    'ALTER TABLE station_multiplayer_contributions ADD COLUMN completed_at datetime DEFAULT NULL AFTER is_qualified'
                );
            }
        }

        $paidCol = $db->fetchOne("SHOW COLUMNS FROM station_multiplayer_contests LIKE 'prize_paid_at'");
        if (!$paidCol) {
            $db->query(
                'ALTER TABLE station_multiplayer_contests
                 ADD COLUMN prize_credits decimal(12,2) NOT NULL DEFAULT 0 AFTER winner_terminal_id,
                 ADD COLUMN prize_paid_at datetime DEFAULT NULL AFTER prize_credits'
            );
        }
        $winnerSpinCols = [
            'winner_spin_credits' => 'ADD COLUMN winner_spin_credits decimal(14,4) NOT NULL DEFAULT 0 AFTER prize_paid_at',
            'winner_spin_settled_at' => 'ADD COLUMN winner_spin_settled_at datetime DEFAULT NULL AFTER winner_spin_credits',
        ];
        foreach ($winnerSpinCols as $name => $sql) {
            if (!$db->fetchOne("SHOW COLUMNS FROM station_multiplayer_contests LIKE '{$name}'")) {
                $db->query("ALTER TABLE station_multiplayer_contests {$sql}");
            }
        }
    } catch (Throwable $e) {
        error_log('termMpEnsureSchema: ' . $e->getMessage());
    }
}

function termMpRoundMoney(float $value): float
{
    return round($value, 4);
}

function termMpFormatLei(float $value): string
{
    return number_format($value, 2, ',', '.');
}

function termMpNormalizeEntryFee($value): float
{
    $amount = (float) $value;
    foreach (MP_ENTRY_OPTIONS as $opt) {
        if (abs($amount - $opt) < 0.001) {
            return (float) $opt;
        }
    }
    return 0.0;
}

function termMpStationSettings(?array $station): array
{
    if (!$station) {
        return ['enabled' => false];
    }
    return [
        'enabled' => (int) ($station['multiplayer_prize_enabled'] ?? 0) === 1,
    ];
}

function termMpLoadStation(int $stationId): ?array
{
    if ($stationId <= 0) {
        return null;
    }
    termMpEnsureSchema();
    try {
        return getDB()->fetchOne('SELECT * FROM stations WHERE id = ? LIMIT 1', [$stationId]) ?: null;
    } catch (Throwable $e) {
        return null;
    }
}

function termMpBumpStationContestRevision(int $stationId): void
{
    if ($stationId <= 0) {
        return;
    }
    termMpEnsureSchema();
    try {
        getDB()->query(
            'UPDATE stations SET mp_contest_revision = mp_contest_revision + 1 WHERE id = ?',
            [$stationId]
        );
    } catch (Throwable $e) {
        error_log('termMpBumpStationContestRevision: ' . $e->getMessage());
    }
}

function termMpStationContestRevision(int $stationId): int
{
    if ($stationId <= 0) {
        return 0;
    }
    termMpEnsureSchema();
    $row = getDB()->fetchOne(
        'SELECT mp_contest_revision FROM stations WHERE id = ? LIMIT 1',
        [$stationId]
    );
    return (int) ($row['mp_contest_revision'] ?? 0);
}

function termMpContestStationMeta(int $stationId): array
{
    return [
        'station_id' => $stationId,
        'contest_revision' => termMpStationContestRevision($stationId),
    ];
}

function termMpLeiToCredits(array $terminal, float $lei): float
{
    $rate = termTerminalCreditRate($terminal);
    if ($rate <= 0) {
        $rate = 0.1;
    }
    return (float) floor($lei / $rate + 0.0001);
}

function termMpSpinCredits(array $terminal, ?float $spinLei = null): float
{
    $lei = ($spinLei !== null && $spinLei > 0) ? $spinLei : MP_SPIN_LEI;
    return termMpLeiToCredits($terminal, $lei);
}

function termMpSpinReserveCredits(array $terminal, float $entryFee): float
{
    $tier = termMpGetTier($entryFee);
    $spinLei = $tier ? (float) $tier['spin_lei'] : MP_SPIN_LEI;
    return termMpSpinCredits($terminal, $spinLei) * MP_SPINS_REQUIRED;
}

function termMpRequiredJoinCredits(array $terminal, float $entryFee): float
{
    return termMpLeiToCredits($terminal, $entryFee) + termMpSpinReserveCredits($terminal, $entryFee);
}

function termMpEngineClassForSlug(string $slug): ?string
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
    return ($class && class_exists($class)) ? $class : null;
}

function termMpContestBetConfig(array $terminal, ?string $engineClass = null, ?float $spinLei = null): array
{
    $spinCost = termMpSpinCredits($terminal, $spinLei);
    $candidates = [5, 10, 20, 15, 1];
    $lineChoices = [];
    foreach ($candidates as $lines) {
        if ($engineClass && class_exists($engineClass) && method_exists($engineClass, 'normalizeLines')) {
            if ($engineClass::normalizeLines($lines) !== $lines) {
                continue;
            }
        }
        $lineChoices[] = $lines;
    }
    if (!$lineChoices) {
        $lineChoices = [5];
    }
    foreach ($lineChoices as $lines) {
        $betPerLine = termApiNormalizeCredits($spinCost / $lines);
        if ($betPerLine + 0.0001 < 0.1) {
            continue;
        }
        $total = termApiTotalBetCredits($betPerLine, $lines);
        if (termApiCreditsEqual($total, $spinCost)) {
            return [
                'bet_per_line' => $betPerLine,
                'lines' => $lines,
                'total_credits' => $spinCost,
            ];
        }
    }

    return [
        'bet_per_line' => termApiNormalizeCredits($spinCost),
        'lines' => 1,
        'total_credits' => $spinCost,
    ];
}

function termMpGetOpenContest(int $stationId): ?array
{
    if ($stationId <= 0) {
        return null;
    }
    termMpEnsureSchema();
    return getDB()->fetchOne(
        "SELECT * FROM station_multiplayer_contests
         WHERE station_id = ? AND status IN ('lobby','active')
         ORDER BY id DESC LIMIT 1",
        [$stationId]
    ) ?: null;
}

function termMpRefreshTerminalStationId(array $terminal): array
{
    $terminalId = (int) ($terminal['id'] ?? 0);
    if ($terminalId <= 0) {
        return $terminal;
    }
    termMpEnsureSchema();
    $fresh = getDB()->fetchOne(
        'SELECT station_id FROM terminals WHERE id = ? AND is_active = 1 LIMIT 1',
        [$terminalId]
    );
    if ($fresh && (int) ($fresh['station_id'] ?? 0) > 0) {
        $terminal['station_id'] = (int) $fresh['station_id'];
    }
    return $terminal;
}

function termMpGetOpenContestForViewer(?array $viewerTerminal, int $stationId = 0): ?array
{
    termMpEnsureSchema();
    $db = getDB();
    $terminalId = $viewerTerminal ? (int) ($viewerTerminal['id'] ?? 0) : 0;
    $resolvedStationId = $stationId > 0
        ? $stationId
        : ($viewerTerminal ? (int) ($viewerTerminal['station_id'] ?? 0) : 0);

    if ($terminalId > 0) {
        $row = $db->fetchOne(
            "SELECT c.* FROM station_multiplayer_contests c
             INNER JOIN terminals vt ON vt.id = ?
             WHERE c.status IN ('lobby','active')
               AND vt.station_id IS NOT NULL
               AND c.station_id = vt.station_id
             ORDER BY c.id DESC LIMIT 1",
            [$terminalId]
        );
        if ($row) {
            $contestStationId = (int) ($row['station_id'] ?? 0);
            if ($contestStationId > 0) {
                termMpTickStation($contestStationId);
            }
            return $db->fetchOne(
                'SELECT * FROM station_multiplayer_contests WHERE id = ? LIMIT 1',
                [(int) ($row['id'] ?? 0)]
            ) ?: null;
        }
    }

    if ($resolvedStationId > 0) {
        termMpTickStation($resolvedStationId);
        return termMpGetOpenContest($resolvedStationId);
    }

    return null;
}

function termMpGetParticipantRow(int $contestId, int $terminalId): ?array
{
    if ($contestId <= 0 || $terminalId <= 0) {
        return null;
    }
    return getDB()->fetchOne(
        'SELECT * FROM station_multiplayer_contributions WHERE contest_id = ? AND terminal_id = ? LIMIT 1',
        [$contestId, $terminalId]
    ) ?: null;
}

function termMpContestSpinWinAlreadyCredited(int $sessionId): bool
{
    if ($sessionId <= 0) {
        return false;
    }
    $row = getDB()->fetchOne(
        'SELECT id FROM terminal_transactions WHERE session_id = ? AND type = ? LIMIT 1',
        [$sessionId, 'win']
    );
    return !!$row;
}

function termMpGetContestContextForSpinEnd(array $terminal, array $session): ?array
{
    $active = termMpIsParticipantInActiveContest($terminal);
    if ($active) {
        return $active;
    }

    $terminalId = (int) ($terminal['id'] ?? 0);
    $stationId = (int) ($terminal['station_id'] ?? 0);
    $sessionStarted = strtotime((string) ($session['started_at'] ?? ''));
    $sessionBet = (float) ($session['credits_bet'] ?? 0);
    if ($terminalId <= 0 || $stationId <= 0 || !$sessionStarted || $sessionBet <= 0) {
        return null;
    }

    $contest = getDB()->fetchOne(
        "SELECT * FROM station_multiplayer_contests
         WHERE station_id = ?
         AND status = 'won'
         AND started_at IS NOT NULL
         AND ended_at IS NOT NULL
         AND UNIX_TIMESTAMP(started_at) <= ?
         AND UNIX_TIMESTAMP(ended_at) >= ?
         ORDER BY id DESC LIMIT 1",
        [$stationId, $sessionStarted, $sessionStarted]
    );
    if (!$contest) {
        return null;
    }

    $row = termMpGetParticipantRow((int) $contest['id'], $terminalId);
    if (!$row) {
        return null;
    }

    return [
        'contest' => $contest,
        'participant' => $row,
    ];
}

function termMpBuildMpDisplayRow(array $terminal, array $row, array $contest): array
{
    $contestEnd = strtotime((string) ($contest['contest_ends_at'] ?? ''));
    $secondsLeft = $contestEnd ? max(0, $contestEnd - time()) : 0;
    $blitzSold = termMpBlitzSoldCredits($row);
    return [
        'normal_balance' => round(termApiFetchCreditsBalanceById((int) ($terminal['id'] ?? 0)), 2),
        'blitz_sold' => round($blitzSold, 2),
        'blitz_balance' => round((float) ($row['blitz_balance_credits'] ?? 0), 2),
        'contest_winnings' => round((float) ($row['contest_winnings_credits'] ?? 0), 2),
        'spin_budget' => 0,
        'spins_used' => (int) ($row['spins_used'] ?? 0),
        'spins_required' => (int) ($row['spins_required'] ?? MP_SPINS_REQUIRED),
        'seconds_remaining' => $secondsLeft,
        'is_qualified' => (int) ($row['is_qualified'] ?? 0) === 1
            || (int) ($row['spins_used'] ?? 0) >= MP_SPINS_REQUIRED,
    ];
}

function termMpCountParticipants(int $contestId): int
{
    $row = getDB()->fetchOne(
        'SELECT COUNT(*) AS c FROM station_multiplayer_contributions WHERE contest_id = ?',
        [$contestId]
    );
    return (int) ($row['c'] ?? 0);
}

function termMpRefundParticipant(int $contestId, int $terminalId, float $entryCredits): void
{
    if ($entryCredits <= 0) {
        return;
    }
    $balance = termApiAdjustCreditsBalance($terminalId, $entryCredits);
    getDB()->insert('terminal_transactions', [
        'terminal_id' => $terminalId,
        'session_id' => null,
        'type' => 'win',
        'amount_credits' => $entryCredits,
        'amount_money' => 0,
        'balance_after' => $balance,
        'notes' => json_encode([
            'multiplayer_refund' => true,
            'contest_id' => $contestId,
        ], JSON_UNESCAPED_UNICODE),
    ]);
}

function termMpJoinContestWithFee(array $terminal, float $entryFee): array
{
    termApiRequireBalanceUnderCap($terminal);

    termMpEnsureSchema();
    $terminal = termMpRefreshTerminalStationId($terminal);
    $stationId = (int) ($terminal['station_id'] ?? 0);
    $terminalId = (int) ($terminal['id'] ?? 0);
    if ($stationId <= 0 || $terminalId <= 0) {
        throw new RuntimeException('Terminal invalid.');
    }

    $station = termMpLoadStation($stationId);
    $settings = termMpStationSettings($station);
    if (!$settings['enabled']) {
        throw new RuntimeException('Multiplayer nu este activat.');
    }

    $entryFee = termMpNormalizeEntryFee($entryFee);
    if ($entryFee <= 0) {
        throw new RuntimeException('Alege suma de intrare: 50, 100 sau 200 LEI.');
    }

    termMpTickStation($stationId);

    $open = termMpGetOpenContestForViewer($terminal, $stationId);
    $db = getDB();

    if ($open && ($open['status'] ?? '') === 'active') {
        throw new RuntimeException('Concursul este deja in desfasurare.');
    }

    if ($open && ($open['status'] ?? '') === 'lobby') {
        $openFee = (float) ($open['entry_fee'] ?? 0);
        if (abs($openFee - $entryFee) > 0.001) {
            throw new RuntimeException('Suma de intrare trebuie sa fie ' . termMpFormatLei($openFee) . ' LEI.');
        }
        $existing = termMpGetParticipantRow((int) $open['id'], $terminalId);
        if ($existing) {
            return termMpBuildPayloadForTerminal($terminal);
        }
        termMpRegisterParticipant($terminal, $open, $entryFee);
        termMpBumpStationContestRevision($stationId);
        return termMpBuildPayloadForTerminal($terminal);
    }

    $entryCredits = termMpLeiToCredits($terminal, $entryFee);
    $requiredCredits = termMpRequiredJoinCredits($terminal, $entryFee);
    $balance = termApiCreditsBalance($terminal);
    if ($balance + 0.0001 < $requiredCredits) {
        $tier = termMpGetTier($entryFee);
        $spinReserveLei = $tier ? (float) ($tier['spin_reserve_lei'] ?? 0) : 0;
        throw new RuntimeException(
            'Sold insuficient. Ai nevoie de '
            . termMpFormatLei($entryFee + $spinReserveLei)
            . ' LEI (intrare + ' . MP_SPINS_REQUIRED . ' spinuri).'
        );
    }

    $now = time();
    $lobbyEnds = date('Y-m-d H:i:s', $now + MP_LOBBY_SECONDS);

    $tier = termMpGetTier($entryFee);
    $spinLei = $tier ? (float) $tier['spin_lei'] : MP_SPIN_LEI;

    $contestId = (int) $db->insert('station_multiplayer_contests', [
        'station_id' => $stationId,
        'entry_fee' => $entryFee,
        'spin_lei' => $spinLei,
        'prize_amount' => 0,
        'contribution_pct' => 0,
        'pool_amount' => 0,
        'status' => 'lobby',
        'host_terminal_id' => $terminalId,
        'lobby_ends_at' => $lobbyEnds,
        'started_at' => date('Y-m-d H:i:s', $now),
    ]);

    if ($contestId <= 0) {
        throw new RuntimeException('Nu am putut crea concursul.');
    }

    $contest = $db->fetchOne('SELECT * FROM station_multiplayer_contests WHERE id = ? LIMIT 1', [$contestId]);
    termMpRegisterParticipant($terminal, $contest, $entryFee);

    termMpBumpStationContestRevision($stationId);

    return termMpBuildPayloadForTerminal($terminal);
}

function termMpRegisterParticipant(array $terminal, array $contest, float $entryFee): void
{
    $db = getDB();
    $contestId = (int) ($contest['id'] ?? 0);
    $terminalId = (int) ($terminal['id'] ?? 0);
    if ($contestId <= 0 || $terminalId <= 0) {
        throw new RuntimeException('Concurs invalid.');
    }

    $existing = termMpGetParticipantRow($contestId, $terminalId);
    if ($existing) {
        return;
    }

    $entryCredits = termMpLeiToCredits($terminal, $entryFee);
    $requiredCredits = termMpRequiredJoinCredits($terminal, $entryFee);
    $balance = termApiCreditsBalance($terminal);
    if ($balance + 0.0001 < $requiredCredits) {
        $tier = termMpGetTier($entryFee);
        $spinReserveLei = $tier ? (float) ($tier['spin_reserve_lei'] ?? 0) : 0;
        throw new RuntimeException(
            'Sold insuficient. Ai nevoie de '
            . termMpFormatLei($entryFee + $spinReserveLei)
            . ' LEI (intrare + ' . MP_SPINS_REQUIRED . ' spinuri).'
        );
    }

    $db->insert('station_multiplayer_contributions', [
        'contest_id' => $contestId,
        'terminal_id' => $terminalId,
        'entry_credits' => 0,
        'entry_charged' => 0,
        'spin_budget_remaining' => 0,
        'spins_used' => 0,
        'spins_required' => MP_SPINS_REQUIRED,
        'contest_winnings_credits' => 0,
        'blitz_balance_credits' => 0,
        'is_qualified' => 0,
        'joined_at' => date('Y-m-d H:i:s'),
        'bet_credits' => 0,
        'bet_money' => 0,
        'contribution_money' => 0,
    ]);
}

function termMpChargeParticipant(array $terminal, array $contest, int $contestId, int $terminalId): void
{
    $row = termMpGetParticipantRow($contestId, $terminalId);
    if (!$row || (int) ($row['entry_charged'] ?? 0) === 1) {
        return;
    }

    $entryFee = (float) ($contest['entry_fee'] ?? 0);
    $entryCredits = termMpLeiToCredits($terminal, $entryFee);
    $spinReserve = termMpSpinReserveCredits($terminal, $entryFee);

    $balance = termApiCreditsBalance($terminal);
    if ($balance + 0.0001 < $entryCredits + $spinReserve) {
        $tier = termMpGetTier($entryFee);
        $spinReserveLei = $tier ? (float) ($tier['spin_reserve_lei'] ?? 0) : 0;
        throw new RuntimeException(
            'Sold insuficient. Ai nevoie de '
            . termMpFormatLei($entryFee + $spinReserveLei)
            . ' LEI (intrare + ' . MP_SPINS_REQUIRED . ' spinuri).'
        );
    }

    $balance = termApiAdjustCreditsBalance($terminalId, -$entryCredits);
    getDB()->insert('terminal_transactions', [
        'terminal_id' => $terminalId,
        'session_id' => null,
        'type' => 'bet',
        'amount_credits' => $entryCredits,
        'amount_money' => round($entryFee, 2),
        'balance_after' => $balance,
        'notes' => json_encode([
            'multiplayer_entry' => true,
            'contest_id' => $contestId,
            'entry_lei' => round($entryFee, 2),
        ], JSON_UNESCAPED_UNICODE),
    ]);
    if (function_exists('termPlayVisitOnActivity')) {
        termPlayVisitOnActivity($terminalId, (float) $balance, ['bets' => 1]);
    }

    getDB()->query(
        'UPDATE station_multiplayer_contributions
         SET entry_credits = ?, spin_budget_remaining = 0, entry_charged = 1, contribution_money = ?
         WHERE contest_id = ? AND terminal_id = ?',
        [$entryCredits, $entryFee, $contestId, $terminalId]
    );
}

function termMpManualStartLobby(array $terminal): array
{
    termMpEnsureSchema();
    $stationId = (int) ($terminal['station_id'] ?? 0);
    $terminalId = (int) ($terminal['id'] ?? 0);
    if ($stationId <= 0 || $terminalId <= 0) {
        throw new RuntimeException('Terminal invalid.');
    }

    termMpTickStation($stationId);
    $open = termMpGetOpenContest($stationId);
    if (!$open) {
        throw new RuntimeException('Nu exista lobby activ.');
    }
    if (($open['status'] ?? '') === 'active') {
        return termMpBuildPayloadForTerminal($terminal);
    }
    if (($open['status'] ?? '') !== 'lobby') {
        throw new RuntimeException('Nu exista lobby activ.');
    }

    $contestId = (int) ($open['id'] ?? 0);
    if (!termMpGetParticipantRow($contestId, $terminalId)) {
        throw new RuntimeException('Nu esti inscris in acest lobby.');
    }

    if (termMpCountParticipants($contestId) < MP_LOBBY_MIN_PARTICIPANTS) {
        throw new RuntimeException('Sunt necesari minim ' . MP_LOBBY_MIN_PARTICIPANTS . ' concurenti.');
    }

    if (!termMpCommitLobby($open)) {
        $fresh = getDB()->fetchOne('SELECT status, result_type FROM station_multiplayer_contests WHERE id = ? LIMIT 1', [$contestId]);
        if (($fresh['status'] ?? '') === 'active') {
            return termMpBuildPayloadForTerminal($terminal);
        }
        if (($fresh['status'] ?? '') === 'cancelled') {
            throw new RuntimeException('Concursul a fost anulat — un concurent nu are sold suficient pentru start.');
        }
        throw new RuntimeException('Nu am putut porni concursul.');
    }

    termMpBumpStationContestRevision($stationId);

    return termMpBuildPayloadForTerminal($terminal);
}

function termMpCommitLobby(array $contest): bool
{
    $contestId = (int) ($contest['id'] ?? 0);
    if ($contestId <= 0) {
        return false;
    }

    $db = getDB();
    $fresh = $db->fetchOne('SELECT * FROM station_multiplayer_contests WHERE id = ? LIMIT 1', [$contestId]);
    if (!$fresh || ($fresh['status'] ?? '') !== 'lobby') {
        return ($fresh['status'] ?? '') === 'active';
    }

    $participants = $db->fetchAll(
        'SELECT terminal_id, entry_charged FROM station_multiplayer_contributions WHERE contest_id = ? ORDER BY terminal_id ASC',
        [$contestId]
    );
    if (count($participants) < MP_LOBBY_MIN_PARTICIPANTS) {
        return false;
    }

    $entryFee = (float) ($fresh['entry_fee'] ?? 0);
    $chargedThisRun = [];

    try {
        foreach ($participants as $row) {
            if ((int) ($row['entry_charged'] ?? 0) === 1) {
                continue;
            }
            $terminalId = (int) ($row['terminal_id'] ?? 0);
            $terminal = $db->fetchOne('SELECT * FROM terminals WHERE id = ? LIMIT 1', [$terminalId]);
            if (!$terminal) {
                throw new RuntimeException('Terminal negasit.');
            }
            termMpChargeParticipant($terminal, $fresh, $contestId, $terminalId);
            $chargedThisRun[] = $terminalId;
        }
    } catch (Throwable $e) {
        foreach ($chargedThisRun as $terminalId) {
            $row = termMpGetParticipantRow($contestId, $terminalId);
            termMpRefundParticipant($contestId, $terminalId, (float) ($row['entry_credits'] ?? 0));
            $db->query(
                'UPDATE station_multiplayer_contributions
                 SET entry_credits = 0, spin_budget_remaining = 0, entry_charged = 0, contribution_money = 0
                 WHERE contest_id = ? AND terminal_id = ?',
                [$contestId, $terminalId]
            );
        }
        termMpCancelLobby($fresh, 'cancelled');
        return false;
    }

    $entryFee = (float) ($fresh['entry_fee'] ?? 0);
    $poolAmount = termMpRoundMoney($entryFee * count($participants));
    $endsAt = date('Y-m-d H:i:s', time() + MP_CONTEST_SECONDS);
    $updated = $db->query(
        "UPDATE station_multiplayer_contests
         SET status = 'active', contest_ends_at = ?, pool_amount = ?, prize_amount = ?, started_at = NOW()
         WHERE id = ? AND status = 'lobby'",
        [$endsAt, $poolAmount, $poolAmount, $contestId]
    );
    if ((int) $updated->rowCount() < 1) {
        return ($db->fetchOne('SELECT status FROM station_multiplayer_contests WHERE id = ? LIMIT 1', [$contestId])['status'] ?? '') === 'active';
    }

    termMpBumpStationContestRevision((int) ($fresh['station_id'] ?? 0));

    return true;
}

function termMpCancelLobby(array $contest, string $resultType = 'cancelled'): void
{
    $contestId = (int) ($contest['id'] ?? 0);
    if ($contestId <= 0) {
        return;
    }
    $stationId = (int) ($contest['station_id'] ?? 0);
    $db = getDB();
    $db->query(
        "UPDATE station_multiplayer_contests SET status = 'cancelled', ended_at = NOW(), result_type = ? WHERE id = ? AND status = 'lobby'",
        [$resultType, $contestId]
    );
    $rows = $db->fetchAll(
        'SELECT terminal_id, entry_credits, entry_charged FROM station_multiplayer_contributions WHERE contest_id = ?',
        [$contestId]
    );
    foreach ($rows as $row) {
        if ((int) ($row['entry_charged'] ?? 0) !== 1) {
            continue;
        }
        termMpRefundParticipant($contestId, (int) $row['terminal_id'], (float) ($row['entry_credits'] ?? 0));
    }
    if ($stationId <= 0) {
        $stationId = (int) (getDB()->fetchOne('SELECT station_id FROM station_multiplayer_contests WHERE id = ? LIMIT 1', [$contestId])['station_id'] ?? 0);
    }
    termMpBumpStationContestRevision($stationId);
}

function termMpTickStation(int $stationId): void
{
    if ($stationId <= 0) {
        return;
    }
    termMpEnsureSchema();
    $contest = termMpGetOpenContest($stationId);
    if (!$contest) {
        return;
    }
    $status = (string) ($contest['status'] ?? '');
    $now = time();
    if ($status === 'lobby') {
        $lobbyEnd = strtotime((string) ($contest['lobby_ends_at'] ?? ''));
        if ($lobbyEnd && $now >= $lobbyEnd) {
            termMpActivateLobby($contest);
        }
        return;
    }
    if ($status === 'active') {
        termMpTryEarlyFinalizeContest((int) ($contest['id'] ?? 0));
        $contest = termMpGetOpenContest($stationId);
        if (!$contest || ($contest['status'] ?? '') !== 'active') {
            return;
        }
        $contestEnd = strtotime((string) ($contest['contest_ends_at'] ?? ''));
        if ($contestEnd && $now >= $contestEnd) {
            termMpFinalizeContest($contest);
        }
    }
}

function termMpActivateLobby(array $contest): void
{
    $contestId = (int) ($contest['id'] ?? 0);
    $count = termMpCountParticipants($contestId);

    if ($count < MP_LOBBY_MIN_PARTICIPANTS) {
        termMpCancelLobby($contest, 'cancelled');
        return;
    }

    termMpCommitLobby($contest);
}

function termMpIsParticipantInActiveContest(array $terminal): ?array
{
    $stationId = (int) ($terminal['station_id'] ?? 0);
    $terminalId = (int) ($terminal['id'] ?? 0);
    if ($stationId <= 0 || $terminalId <= 0) {
        return null;
    }
    termMpTickStation($stationId);
    $contest = termMpGetOpenContest($stationId);
    if (!$contest || ($contest['status'] ?? '') !== 'active') {
        return null;
    }
    $row = termMpGetParticipantRow((int) $contest['id'], $terminalId);
    if (!$row) {
        return null;
    }
    return [
        'contest' => $contest,
        'participant' => $row,
    ];
}

function termMpProcessContestSpinStart(array $terminal, int $gameId, ?string $engineClass = null): array
{
    $ctx = termMpIsParticipantInActiveContest($terminal);
    if (!$ctx) {
        throw new RuntimeException('Nu esti in concurs activ.');
    }
    $contest = $ctx['contest'];
    $participant = $ctx['participant'];
    $contestId = (int) $contest['id'];
    $terminalId = (int) $terminal['id'];
    $betConfig = termMpContestBetConfig($terminal, $engineClass, termMpSpinLeiFromContest($contest));
    $spinCost = (float) ($betConfig['total_credits'] ?? termMpSpinCredits($terminal, termMpSpinLeiFromContest($contest)));
    $betPerLine = (float) ($betConfig['bet_per_line'] ?? $spinCost);
    $contestLines = (int) ($betConfig['lines'] ?? 10);
    $spinLei = termMpSpinLeiFromContest($contest);
    $spinsUsed = (int) ($participant['spins_used'] ?? 0);

    if ($spinsUsed >= MP_SPINS_REQUIRED) {
        throw new RuntimeException('Ai terminat cele 50 de spinuri din concurs.');
    }

    $balance = termApiCreditsBalance($terminal);
    if ($balance + 0.0001 < $spinCost) {
        throw new RuntimeException('Sold normal insuficient pentru spin.');
    }

    $db = getDB();
    $balance = termApiAdjustCreditsBalance($terminalId, -$spinCost);
    $db->insert('terminal_transactions', [
        'terminal_id' => $terminalId,
        'session_id' => null,
        'type' => 'bet',
        'amount_credits' => $spinCost,
        'amount_money' => round($spinLei, 2),
        'balance_after' => $balance,
        'notes' => json_encode([
            'contest_spin' => true,
            'contest_id' => $contestId,
        ], JSON_UNESCAPED_UNICODE),
    ]);
    if (function_exists('termPlayVisitOnActivity')) {
        termPlayVisitOnActivity($terminalId, (float) $balance, ['bets' => 1]);
    }
    $db->query(
        'UPDATE station_multiplayer_contributions
         SET spins_used = spins_used + 1,
             bet_credits = bet_credits + ?,
             bet_money = bet_money + ?
         WHERE contest_id = ? AND terminal_id = ?',
        [$spinCost, $spinLei, $contestId, $terminalId]
    );

    termApiCloseIdleGameSessions($terminalId);
    $sessionId = (int) $db->insert('game_sessions', [
        'terminal_id' => $terminalId,
        'game_id' => $gameId,
        'credits_in' => termApiStoreBetPerLine($betPerLine),
        'credits_out' => $contestLines,
        'credits_bet' => $spinCost,
        'started_at' => date('Y-m-d H:i:s'),
    ]);

    $fresh = termMpGetParticipantRow($contestId, $terminalId);
    if ($fresh && (int) ($fresh['spins_used'] ?? 0) >= MP_SPINS_REQUIRED) {
        termMpMarkParticipantSpinsComplete($contestId, $terminalId);
        termMpTryEarlyFinalizeContest($contestId);
        $fresh = termMpGetParticipantRow($contestId, $terminalId);
    }

    return [
        'session_id' => $sessionId,
        'spin_cost' => $spinCost,
        'bet_per_line' => $betPerLine,
        'lines' => $contestLines,
        'participant' => $fresh,
        'contest' => $contest,
    ];
}

function termMpBlitzSoldCredits(array $row): float
{
    return (float) ($row['blitz_balance_credits'] ?? 0);
}

function termMpResolveSpinWinCredits(float $displayWin, bool $skillStopUsed, bool $inContest): float
{
    if ($displayWin <= 0 || !$skillStopUsed) {
        return 0.0;
    }
    return termApiNormalizeCredits($displayWin);
}

function termMpBuildSessionMpDisplay(array $terminal, ?array $session = null): ?array
{
    if ($session) {
        $ctx = termMpGetContestContextForSpinEnd($terminal, $session);
        if (!$ctx) {
            $ctx = termMpIsParticipantInActiveContest($terminal);
        }
        if ($ctx) {
            $fresh = termMpGetParticipantRow((int) $ctx['contest']['id'], (int) ($terminal['id'] ?? 0));
            if ($fresh) {
                return termMpBuildMpDisplayRow($terminal, $fresh, $ctx['contest']);
            }
        }
    }

    $contestPayload = termMpBuildPayloadForTerminal($terminal);
    $participant = $contestPayload['participant'] ?? null;
    if ($participant) {
        return [
            'normal_balance' => round(termApiFetchCreditsBalanceById((int) ($terminal['id'] ?? 0)), 2),
            'blitz_sold' => round((float) ($participant['blitz_sold'] ?? 0), 2),
            'blitz_balance' => round((float) ($participant['blitz_balance'] ?? 0), 2),
            'contest_winnings' => round((float) ($participant['contest_winnings'] ?? 0), 2),
            'spin_budget' => round((float) ($participant['spin_budget'] ?? 0), 2),
            'spins_used' => (int) ($participant['spins_used'] ?? 0),
            'spins_required' => (int) ($participant['spins_required'] ?? MP_SPINS_REQUIRED),
            'seconds_remaining' => (int) ($participant['seconds_remaining'] ?? 0),
            'is_qualified' => !empty($participant['is_qualified']),
        ];
    }

    return null;
}

function termMpBuildSessionEndExtras(array $terminal, ?array $session = null): array
{
    $contestPayload = termMpBuildPayloadForSessionResponse($terminal, $session);
    return [
        'contest' => $contestPayload,
        'mp_display' => termMpBuildSessionMpDisplay($terminal, $session),
    ];
}

function termMpBuildPayloadForSessionResponse(array $terminal, ?array $session = null): array
{
    $payload = termMpBuildPayloadForTerminal($terminal);
    $inContest = false;

    if ($session) {
        $ctx = termMpGetContestContextForSpinEnd($terminal, $session);
        if (!$ctx) {
            $ctx = termMpIsParticipantInActiveContest($terminal);
        }
        $inContest = !!$ctx;
    } else {
        $mode = (string) ($payload['mode'] ?? '');
        $inContest = !empty($payload['enabled']) && $mode === 'contest';
    }

    if ($inContest) {
        return $payload;
    }

    unset($payload['recent_win']);
    unset($payload['participant']);
    $mode = (string) ($payload['mode'] ?? '');
    if ($mode === 'won' || $mode === 'forfeit' || $mode === 'draw') {
        $payload['mode'] = 'ready';
        $payload['enabled'] = false;
    }

    return $payload;
}

function termMpProcessContestSpinWin(array $terminal, int $sessionId, float $creditsWon, ?array $session = null): bool
{
    $ctx = $session ? termMpGetContestContextForSpinEnd($terminal, $session) : null;
    if (!$ctx) {
        $ctx = termMpIsParticipantInActiveContest($terminal);
    }
    if (!$ctx) {
        return false;
    }

    $contestId = (int) $ctx['contest']['id'];
    $terminalId = (int) $terminal['id'];
    $credited = max(0.0, termApiNormalizeCredits($creditsWon));

    if ($sessionId > 0 && $credited > 0 && termMpContestSpinWinAlreadyCredited($sessionId)) {
        return true;
    }

    if ($credited > 0) {
        $db = getDB();
        $pdo = $db->getConnection();
        $pdo->beginTransaction();
        try {
            if ($sessionId > 0 && termMpContestSpinWinAlreadyCredited($sessionId)) {
                $pdo->commit();
                return true;
            }
            $db->query(
                'UPDATE station_multiplayer_contributions
                 SET blitz_balance_credits = blitz_balance_credits + ?,
                     contest_winnings_credits = contest_winnings_credits + ?
                 WHERE contest_id = ? AND terminal_id = ?',
                [$credited, $credited, $contestId, $terminalId]
            );
            $db->insert('terminal_transactions', [
                'terminal_id' => $terminalId,
                'session_id' => $sessionId > 0 ? $sessionId : null,
                'type' => 'win',
                'amount_credits' => $credited,
                'amount_money' => 0,
                'balance_after' => termApiFetchCreditsBalanceById($terminalId),
                'notes' => json_encode([
                    'contest_blitz_win' => true,
                    'contest_id' => $contestId,
                ], JSON_UNESCAPED_UNICODE),
            ]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log('termMpProcessContestSpinWin contest ' . $contestId . ' session ' . $sessionId . ': ' . $e->getMessage());
            return false;
        }
    }

    $participant = termMpGetParticipantRow($contestId, $terminalId);
    if ($participant && (int) ($participant['spins_used'] ?? 0) >= MP_SPINS_REQUIRED) {
        termMpMarkParticipantSpinsComplete($contestId, $terminalId);
    }

    $contestRow = getDB()->fetchOne(
        'SELECT status FROM station_multiplayer_contests WHERE id = ? LIMIT 1',
        [$contestId]
    );
    if ($contestRow && ($contestRow['status'] ?? '') === 'active') {
        termMpTryEarlyFinalizeContest($contestId);
    }

    return true;
}

function termMpMarkParticipantSpinsComplete(int $contestId, int $terminalId): void
{
    if ($contestId <= 0 || $terminalId <= 0) {
        return;
    }
    getDB()->query(
        'UPDATE station_multiplayer_contributions
         SET is_qualified = 1, completed_at = COALESCE(completed_at, NOW())
         WHERE contest_id = ? AND terminal_id = ?
         AND spins_used >= ?',
        [$contestId, $terminalId, MP_SPINS_REQUIRED]
    );
}

function termMpContestHasFinisher(int $contestId): bool
{
    if ($contestId <= 0) {
        return false;
    }
    $row = getDB()->fetchOne(
        'SELECT id FROM station_multiplayer_contributions
         WHERE contest_id = ? AND spins_used >= ? AND completed_at IS NOT NULL
         LIMIT 1',
        [$contestId, MP_SPINS_REQUIRED]
    );
    return !!$row;
}

function termMpTryEarlyFinalizeContest(int $contestId): void
{
    if ($contestId <= 0) {
        return;
    }
    $finisher = getDB()->fetchOne(
        'SELECT terminal_id FROM station_multiplayer_contributions
         WHERE contest_id = ? AND spins_used >= ? AND completed_at IS NOT NULL
         ORDER BY completed_at ASC, terminal_id ASC
         LIMIT 1',
        [$contestId, MP_SPINS_REQUIRED]
    );
    if (!$finisher) {
        return;
    }
    $contest = getDB()->fetchOne(
        "SELECT * FROM station_multiplayer_contests WHERE id = ? AND status = 'active' LIMIT 1",
        [$contestId]
    );
    if (!$contest) {
        return;
    }
    termMpFinalizeContest($contest);
}

function termMpFinalizeContest(array $contest): void
{
    $contestId = (int) ($contest['id'] ?? 0);
    if ($contestId <= 0) {
        return;
    }
    termMpEnsureSchema();
    $db = getDB();

    $fresh = $db->fetchOne('SELECT * FROM station_multiplayer_contests WHERE id = ? LIMIT 1', [$contestId]);
    if (!$fresh) {
        return;
    }

    $status = (string) ($fresh['status'] ?? '');
    if ($status === 'won') {
        termMpEnsureWinnerPaid($contestId);
        return;
    }
    if ($status !== 'active') {
        return;
    }

    if (empty($fresh['ended_at'])) {
        $claimed = $db->query(
            "UPDATE station_multiplayer_contests SET ended_at = NOW() WHERE id = ? AND status = 'active' AND ended_at IS NULL",
            [$contestId]
        );
        if ((int) $claimed->rowCount() < 1) {
            $fresh = $db->fetchOne('SELECT * FROM station_multiplayer_contests WHERE id = ? LIMIT 1', [$contestId]);
            if (!$fresh || ($fresh['status'] ?? '') !== 'active') {
                if ($fresh && ($fresh['status'] ?? '') === 'won') {
                    termMpEnsureWinnerPaid($contestId);
                }
                return;
            }
            if (empty($fresh['ended_at'])) {
                return;
            }
        }
    }

    $db->query(
        'UPDATE station_multiplayer_contributions
         SET is_qualified = 1, completed_at = COALESCE(completed_at, NOW())
         WHERE contest_id = ? AND spins_used >= ?',
        [$contestId, MP_SPINS_REQUIRED]
    );

    $participants = $db->fetchAll(
        'SELECT * FROM station_multiplayer_contributions WHERE contest_id = ?',
        [$contestId]
    );

    $qualified = array_values(array_filter($participants, static function ($row) {
        return (int) ($row['is_qualified'] ?? 0) === 1;
    }));

    if (count($qualified) === 0) {
        $db->query(
            "UPDATE station_multiplayer_contests SET status = 'cancelled', result_type = 'forfeit' WHERE id = ? AND status = 'active'",
            [$contestId]
        );
        termMpBumpStationContestRevision((int) ($fresh['station_id'] ?? 0));
        return;
    }

    usort($qualified, static function ($a, $b) {
        $aDone = (string) ($a['completed_at'] ?? '');
        $bDone = (string) ($b['completed_at'] ?? '');
        if ($aDone !== '' && $bDone !== '') {
            $cmp = strcmp($aDone, $bDone);
            if ($cmp !== 0) {
                return $cmp;
            }
        } elseif ($aDone !== '') {
            return -1;
        } elseif ($bDone !== '') {
            return 1;
        }
        return (int) ($a['terminal_id'] ?? 0) <=> (int) ($b['terminal_id'] ?? 0);
    });

    $winnerId = (int) ($qualified[0]['terminal_id'] ?? 0);
    $db->query(
        "UPDATE station_multiplayer_contests SET status = 'won', winner_terminal_id = ?, result_type = 'winner' WHERE id = ? AND status = 'active'",
        [$winnerId, $contestId]
    );

    $freshContest = $db->fetchOne('SELECT * FROM station_multiplayer_contests WHERE id = ? LIMIT 1', [$contestId]);
    if (!$freshContest || ($freshContest['status'] ?? '') !== 'won') {
        return;
    }

    $prizeLei = termMpResolveContestPrizeLei($freshContest, count($participants));
    termMpPayWinnerPrize($contestId, $winnerId, $prizeLei);

    foreach ($participants as $row) {
        $terminalId = (int) ($row['terminal_id'] ?? 0);
        if ($terminalId <= 0 || $terminalId === $winnerId) {
            continue;
        }
        termMpForfeitParticipantSpinWinnings($contestId, $terminalId);
    }

    termMpEnsureWinnerPaid($contestId);
    termMpBumpStationContestRevision((int) ($fresh['station_id'] ?? 0));
}

function termMpForfeitParticipantSpinWinnings(int $contestId, int $terminalId): void
{
    if ($contestId <= 0 || $terminalId <= 0) {
        return;
    }
    getDB()->query(
        'UPDATE station_multiplayer_contributions
         SET blitz_balance_credits = 0, contest_winnings_credits = 0
         WHERE contest_id = ? AND terminal_id = ?',
        [$contestId, $terminalId]
    );
}

function termMpSettleParticipantSpinWinnings(int $contestId, int $terminalId, float $credits): float
{
    if ($contestId <= 0 || $terminalId <= 0) {
        return 0.0;
    }
    $freshRow = termMpGetParticipantRow($contestId, $terminalId);
    $credited = max(0.0, termApiNormalizeCredits($credits));
    if ($freshRow) {
        $credited = termMpParticipantSpinWinningsCredits($freshRow);
        if ($credited <= 0) {
            $credited = max(0.0, termApiNormalizeCredits($freshRow['blitz_balance_credits'] ?? $credits));
        }
    }
    if ($credited <= 0) {
        return 0.0;
    }
    termMpPersistWinnerSpinCredits($contestId, $credited);
    $db = getDB();
    $balance = termApiAdjustCreditsBalance($terminalId, $credited);
    $db->insert('terminal_transactions', [
        'terminal_id' => $terminalId,
        'session_id' => null,
        'type' => 'win',
        'amount_credits' => $credited,
        'amount_money' => 0,
        'balance_after' => $balance,
        'notes' => json_encode([
            'multiplayer_blitz_balance' => true,
            'contest_id' => $contestId,
            'blitz_winnings' => true,
        ], JSON_UNESCAPED_UNICODE),
    ]);
    $db->query(
        'UPDATE station_multiplayer_contributions
         SET blitz_balance_credits = 0, contest_winnings_credits = 0
         WHERE contest_id = ? AND terminal_id = ?',
        [$contestId, $terminalId]
    );
    return $credited;
}

function termMpResolveContestPrizeLei(array $contest, int $participantsCount = 0): float
{
    $prizeLei = (float) ($contest['pool_amount'] ?? 0);
    if ($prizeLei <= 0) {
        $prizeLei = (float) ($contest['prize_amount'] ?? 0);
    }
    if ($prizeLei <= 0) {
        $entryFee = (float) ($contest['entry_fee'] ?? 0);
        $players = max(2, $participantsCount);
        $prizeLei = termMpRoundMoney($entryFee * $players);
    }
    return max(0.0, $prizeLei);
}

function termMpParticipantSpinWinningsCredits(?array $participantRow): float
{
    if (!$participantRow) {
        return 0.0;
    }
    $contestWinnings = (float) ($participantRow['contest_winnings_credits'] ?? 0);
    $blitzBalance = (float) ($participantRow['blitz_balance_credits'] ?? 0);
    return max(0.0, termApiNormalizeCredits(max($contestWinnings, $blitzBalance)));
}

function termMpSumContestSpinWinsFromTransactions(int $contestId, int $terminalId): float
{
    if ($contestId <= 0 || $terminalId <= 0) {
        return 0.0;
    }
    $rows = getDB()->fetchAll(
        "SELECT amount_credits, notes FROM terminal_transactions
         WHERE terminal_id = ? AND type = 'win' AND notes LIKE ?
         ORDER BY id ASC",
        [$terminalId, '%"contest_id":' . $contestId . '%']
    );
    $total = 0.0;
    foreach ($rows as $row) {
        $notes = json_decode((string) ($row['notes'] ?? ''), true);
        if (!is_array($notes) || (int) ($notes['contest_id'] ?? 0) !== $contestId) {
            continue;
        }
        if (empty($notes['contest_blitz_win']) && empty($notes['multiplayer_blitz_balance'])) {
            continue;
        }
        $total += (float) ($row['amount_credits'] ?? 0);
    }

    return max(0.0, termApiNormalizeCredits($total));
}

function termMpResolveWinnerSpinCredits(int $contestId, int $winnerId, ?array $contest = null): float
{
    if ($contestId <= 0 || $winnerId <= 0) {
        return 0.0;
    }
    $db = getDB();
    if (!$contest) {
        $contest = $db->fetchOne(
            'SELECT winner_spin_credits FROM station_multiplayer_contests WHERE id = ? LIMIT 1',
            [$contestId]
        ) ?: [];
    }
    $stored = (float) ($contest['winner_spin_credits'] ?? 0);
    if ($stored > 0) {
        return $stored;
    }
    $participantRow = termMpGetParticipantRow($contestId, $winnerId);
    $fromParticipant = termMpParticipantSpinWinningsCredits($participantRow);
    if ($fromParticipant > 0) {
        return $fromParticipant;
    }

    return termMpSumContestSpinWinsFromTransactions($contestId, $winnerId);
}

function termMpPersistWinnerSpinCredits(int $contestId, float $credits): void
{
    if ($contestId <= 0 || $credits <= 0) {
        return;
    }
    getDB()->query(
        'UPDATE station_multiplayer_contests
         SET winner_spin_credits = ?
         WHERE id = ? AND winner_spin_credits <= 0',
        [round($credits, 2), $contestId]
    );
}

function termMpMarkWinnerSpinSettled(int $contestId, float $credits): void
{
    if ($contestId <= 0) {
        return;
    }
    getDB()->query(
        'UPDATE station_multiplayer_contests
         SET winner_spin_settled_at = COALESCE(winner_spin_settled_at, NOW()),
             winner_spin_credits = CASE WHEN winner_spin_credits > 0 THEN winner_spin_credits ELSE ? END
         WHERE id = ?',
        [round(max(0.0, $credits), 2), $contestId]
    );
}

function termMpWinnerSpinSettleAlreadyDone(int $contestId, int $terminalId): bool
{
    if ($contestId <= 0 || $terminalId <= 0) {
        return false;
    }
    $rows = getDB()->fetchAll(
        "SELECT notes FROM terminal_transactions
         WHERE terminal_id = ? AND type = 'win' AND notes LIKE ?",
        [$terminalId, '%"contest_id":' . $contestId . '%']
    );
    foreach ($rows as $row) {
        $notes = json_decode((string) ($row['notes'] ?? ''), true);
        if (!is_array($notes) || (int) ($notes['contest_id'] ?? 0) !== $contestId) {
            continue;
        }
        if (!empty($notes['multiplayer_blitz_balance']) || !empty($notes['forced_settle'])) {
            return true;
        }
    }

    return false;
}

function termMpEnsureWinnerPaid(int $contestId): void
{
    if ($contestId <= 0) {
        return;
    }
    termMpEnsureSchema();
    $db = getDB();
    $contest = $db->fetchOne(
        "SELECT * FROM station_multiplayer_contests WHERE id = ? AND status = 'won' LIMIT 1",
        [$contestId]
    );
    if (!$contest) {
        return;
    }

    $winnerId = (int) ($contest['winner_terminal_id'] ?? 0);
    if ($winnerId <= 0) {
        return;
    }

    $participantsCount = termMpCountParticipants($contestId);
    $prizeLei = termMpResolveContestPrizeLei($contest, $participantsCount);

    if ($prizeLei > 0 && empty($contest['prize_paid_at'])) {
        termMpPayWinnerPrize($contestId, $winnerId, $prizeLei);
        $contest = $db->fetchOne('SELECT * FROM station_multiplayer_contests WHERE id = ? LIMIT 1', [$contestId]) ?: $contest;
    }

    $spinCredits = termMpResolveWinnerSpinCredits($contestId, $winnerId, $contest);
    termMpPersistWinnerSpinCredits($contestId, $spinCredits);

    $prizeDone = $prizeLei <= 0 || !empty($contest['prize_paid_at']);
    $spinDone = !empty($contest['winner_spin_settled_at']);
    if ($prizeDone && $spinDone) {
        return;
    }

    if (!$spinDone) {
        $spinCredits = termMpResolveWinnerSpinCredits($contestId, $winnerId, $contest);
        $winnerRow = termMpGetParticipantRow($contestId, $winnerId);
        $remaining = termMpParticipantSpinWinningsCredits($winnerRow);
        if ($remaining > 0) {
            termMpSettleParticipantSpinWinnings($contestId, $winnerId, $remaining);
            termMpMarkWinnerSpinSettled($contestId, max($spinCredits, $remaining));
        } elseif ($spinCredits > 0) {
            if (termMpWinnerSpinSettleAlreadyDone($contestId, $winnerId)) {
                termMpMarkWinnerSpinSettled($contestId, $spinCredits);
            } else {
                termMpForceSettleWinnerSpinWinnings($contestId, $winnerId, $spinCredits);
            }
        } else {
            termMpMarkWinnerSpinSettled($contestId, 0);
        }
        $contest = $db->fetchOne('SELECT * FROM station_multiplayer_contests WHERE id = ? LIMIT 1', [$contestId]) ?: $contest;
    }

    if ($prizeLei > 0 && empty($contest['prize_paid_at'])) {
        termMpPayWinnerPrize($contestId, $winnerId, $prizeLei);
    }
}

function termMpForceSettleWinnerSpinWinnings(int $contestId, int $winnerTerminalId, float $credits): float
{
    if ($contestId <= 0 || $winnerTerminalId <= 0) {
        return 0.0;
    }
    $db = getDB();
    $contest = $db->fetchOne(
        'SELECT winner_spin_settled_at FROM station_multiplayer_contests WHERE id = ? LIMIT 1',
        [$contestId]
    );
    if (!$contest) {
        return 0.0;
    }
    if (!empty($contest['winner_spin_settled_at']) && termMpWinnerSpinSettleAlreadyDone($contestId, $winnerTerminalId)) {
        return 0.0;
    }

    $credited = max(0.0, termApiNormalizeCredits($credits));
    if ($credited <= 0) {
        termMpMarkWinnerSpinSettled($contestId, 0);
        return 0.0;
    }

    $balance = termApiAdjustCreditsBalance($winnerTerminalId, $credited);
    $db->insert('terminal_transactions', [
        'terminal_id' => $winnerTerminalId,
        'session_id' => null,
        'type' => 'win',
        'amount_credits' => $credited,
        'amount_money' => 0,
        'balance_after' => $balance,
        'notes' => json_encode([
            'multiplayer_blitz_balance' => true,
            'contest_id' => $contestId,
            'blitz_winnings' => true,
            'forced_settle' => true,
        ], JSON_UNESCAPED_UNICODE),
    ]);
    $db->query(
        'UPDATE station_multiplayer_contributions
         SET blitz_balance_credits = 0, contest_winnings_credits = 0
         WHERE contest_id = ? AND terminal_id = ?',
        [$contestId, $winnerTerminalId]
    );
    termMpMarkWinnerSpinSettled($contestId, $credited);

    return $credited;
}

function termMpPayWinnerPrize(int $contestId, int $winnerTerminalId, float $prizeAmount): float
{
    if ($contestId <= 0 || $winnerTerminalId <= 0 || $prizeAmount <= 0) {
        return 0.0;
    }
    termMpEnsureSchema();
    $db = getDB();
    $winner = $db->fetchOne('SELECT * FROM terminals WHERE id = ? LIMIT 1', [$winnerTerminalId]);
    if (!$winner) {
        return 0.0;
    }
    $rate = termTerminalCreditRate($winner);
    if ($rate <= 0) {
        $rate = 0.1;
    }
    $credits = termMpLeiToCredits($winner, $prizeAmount);
    if ($credits < 1 && $prizeAmount > 0) {
        $credits = 1.0;
    }

    $alreadyPaid = $db->fetchOne(
        'SELECT prize_paid_at, prize_credits FROM station_multiplayer_contests WHERE id = ? LIMIT 1',
        [$contestId]
    );
    if (!empty($alreadyPaid['prize_paid_at'])) {
        return (float) ($alreadyPaid['prize_credits'] ?? 0);
    }

    $balance = termApiAdjustCreditsBalance($winnerTerminalId, $credits);
    $claimed = $db->query(
        'UPDATE station_multiplayer_contests SET prize_credits = ?, prize_paid_at = ? WHERE id = ? AND prize_paid_at IS NULL',
        [$credits, date('Y-m-d H:i:s'), $contestId]
    );
    if ((int) $claimed->rowCount() < 1) {
        termApiAdjustCreditsBalance($winnerTerminalId, -$credits);
        return 0.0;
    }
    $db->insert('terminal_transactions', [
        'terminal_id' => $winnerTerminalId,
        'session_id' => null,
        'type' => 'win',
        'amount_credits' => $credits,
        'amount_money' => round($prizeAmount, 2),
        'balance_after' => $balance,
        'notes' => json_encode([
            'multiplayer_prize' => true,
            'contest_id' => $contestId,
            'prize_lei' => round($prizeAmount, 2),
        ], JSON_UNESCAPED_UNICODE),
    ]);
    return $credits;
}

function termMpRecentWinPayload(?array $recent, ?array $viewerTerminal = null): ?array
{
    if (!$recent) {
        return null;
    }
    $resultType = (string) ($recent['result_type'] ?? '');
    $status = (string) ($recent['status'] ?? '');
    $contestId = (int) $recent['id'];
    $winnerId = (int) ($recent['winner_terminal_id'] ?? 0) ?: null;
    $viewerId = $viewerTerminal ? (int) ($viewerTerminal['id'] ?? 0) : 0;

    if ($resultType === 'forfeit') {
        return [
            'contest_id' => $contestId,
            'result_type' => 'forfeit',
            'is_forfeit' => true,
            'ended_at' => $recent['ended_at'] ?? null,
            'message' => 'Terminalele au pierdut — niciun terminal nu a terminat cele 50 de spinuri in timpul de 5 minute al concursului.',
        ];
    }

    if ($resultType === 'cancelled' || ($status === 'cancelled' && !$winnerId)) {
        return null;
    }

    if ($resultType === 'draw' || $status === 'draw') {
        return [
            'contest_id' => $contestId,
            'result_type' => 'draw',
            'is_draw' => true,
            'ended_at' => $recent['ended_at'] ?? null,
            'message' => 'Egalitate — premiul a fost returnat participantilor.',
        ];
    }

    if (!$winnerId || $resultType !== 'winner') {
        return null;
    }

    termMpEnsureWinnerPaid($contestId);

    $freshContest = getDB()->fetchOne(
        'SELECT prize_credits, winner_spin_credits, prize_paid_at, winner_spin_settled_at FROM station_multiplayer_contests WHERE id = ? LIMIT 1',
        [$contestId]
    ) ?: [];
    $spinWinnings = (float) ($freshContest['winner_spin_credits'] ?? 0);
    if ($spinWinnings <= 0) {
        $spinWinnings = termMpResolveWinnerSpinCredits($contestId, $winnerId, $freshContest);
    }

    $prizeCredits = (float) ($freshContest['prize_credits'] ?? $recent['prize_credits'] ?? 0);
    $rate = $viewerTerminal ? termTerminalCreditRate($viewerTerminal) : 0.1;
    $viewerBalance = null;
    $payoutComplete = !empty($freshContest['prize_paid_at']) && !empty($freshContest['winner_spin_settled_at']);
    if ($viewerId > 0 && $viewerId === $winnerId) {
        $viewerBalance = round(termApiFetchCreditsBalanceById($winnerId), 2);
    }

    return [
        'contest_id' => $contestId,
        'prize_amount' => (float) ($recent['pool_amount'] ?? $recent['prize_amount'] ?? 0),
        'credits_awarded' => $prizeCredits,
        'spin_winnings_credits' => round($spinWinnings, 2),
        'spin_winnings_lei' => round($spinWinnings * $rate, 2),
        'total_credits_awarded' => round($prizeCredits + $spinWinnings, 2),
        'total_lei_awarded' => round((float) ($recent['pool_amount'] ?? $recent['prize_amount'] ?? 0) + ($spinWinnings * $rate), 2),
        'credits_balance' => $viewerBalance,
        'payout_complete' => $payoutComplete,
        'winner_terminal_id' => $winnerId,
        'winner_name' => (string) ($recent['winner_name'] ?? 'Terminal'),
        'ended_at' => $recent['ended_at'] ?? null,
        'is_self' => $winnerId && $viewerId > 0 && $winnerId === $viewerId,
        'result_type' => 'winner',
    ];
}

function termMpParticipantPayload(?array $participant, ?array $contest, ?array $terminal = null): ?array
{
    if (!$participant || !$contest) {
        return null;
    }
    $contestEnd = strtotime((string) ($contest['contest_ends_at'] ?? ''));
    $secondsLeft = $contestEnd ? max(0, $contestEnd - time()) : 0;
    $rateTerminal = $terminal ?: ['credit_rate' => 0.1];
    $spinLei = termMpSpinLeiFromContest($contest);
    $betConfig = termMpContestBetConfig($rateTerminal, null, $spinLei);
    $entryFee = (float) ($contest['entry_fee'] ?? 0);
    $spinReserveLei = termMpRoundMoney(termMpSpinLeiFromContest($contest) * MP_SPINS_REQUIRED);
    return [
        'spin_budget' => 0,
        'spin_reserve_lei' => $spinReserveLei,
        'spin_reserve_credits' => termMpSpinReserveCredits($rateTerminal, $entryFee),
        'blitz_balance' => round((float) ($participant['blitz_balance_credits'] ?? 0), 2),
        'contest_winnings' => round((float) ($participant['contest_winnings_credits'] ?? 0), 2),
        'spins_used' => (int) ($participant['spins_used'] ?? 0),
        'spins_required' => (int) ($participant['spins_required'] ?? MP_SPINS_REQUIRED),
        'is_qualified' => (int) ($participant['is_qualified'] ?? 0) === 1,
        'seconds_remaining' => $secondsLeft,
        'spin_lei' => $spinLei,
        'fixed_spin_credits' => termMpSpinCredits($rateTerminal, $spinLei),
        'contest_bet_per_line' => (float) ($betConfig['bet_per_line'] ?? 0),
        'contest_lines' => (int) ($betConfig['lines'] ?? 0),
        'blitz_sold' => round((float) ($participant['blitz_balance_credits'] ?? 0), 2),
        'normal_balance' => $terminal ? round(termApiFetchCreditsBalanceById((int) ($terminal['id'] ?? 0)), 2) : 0,
    ];
}

function termMpBuildLeaderboard(int $contestId, ?array $viewerTerminal, float $entryFee): array
{
    $db = getDB();
    $rows = $db->fetchAll(
        'SELECT c.*, t.name AS terminal_name
         FROM station_multiplayer_contributions c
         LEFT JOIN terminals t ON t.id = c.terminal_id
         WHERE c.contest_id = ?
         ORDER BY
           CASE WHEN c.completed_at IS NOT NULL THEN 0 ELSE 1 END,
           c.spins_used DESC,
           c.completed_at ASC,
           c.terminal_id ASC
         LIMIT 3',
        [$contestId]
    );
    $contest = $db->fetchOne('SELECT * FROM station_multiplayer_contests WHERE id = ? LIMIT 1', [$contestId]);
    $winnerId = (int) ($contest['winner_terminal_id'] ?? 0);
    $entries = [];
    $rank = 1;
    foreach ($rows as $row) {
        $winnings = (float) ($row['blitz_balance_credits'] ?? 0);
        $blitzSold = termMpBlitzSoldCredits($row);
        $displayRate = $viewerTerminal ? termTerminalCreditRate($viewerTerminal) : 0.1;
        $spinsUsed = (int) ($row['spins_used'] ?? 0);
        $progressPct = min(100, (int) floor(($spinsUsed / MP_SPINS_REQUIRED) * 100));
        $entries[] = [
            'terminal_id' => (int) $row['terminal_id'],
            'name' => (string) ($row['terminal_name'] ?? ('Terminal ' . (int) $row['terminal_id'])),
            'contribution_money' => round($blitzSold * $displayRate, 2),
            'bet_money' => round($blitzSold * $displayRate, 2),
            'contest_winnings' => round($winnings, 2),
            'contest_winnings_lei' => round($winnings * $displayRate, 2),
            'blitz_balance' => round($winnings, 2),
            'blitz_sold' => round($blitzSold, 2),
            'spins_used' => $spinsUsed,
            'spins_required' => MP_SPINS_REQUIRED,
            'progress_pct' => $progressPct,
            'rank' => $rank,
            'is_self' => $viewerTerminal ? ((int) ($viewerTerminal['id'] ?? 0) === (int) $row['terminal_id']) : false,
            'is_winner' => $winnerId > 0 && (int) $row['terminal_id'] === $winnerId,
            'is_qualified' => (int) ($row['is_qualified'] ?? 0) === 1,
        ];
        $rank++;
    }
    return $entries;
}

function termMpResolveTerminalCreditsBalance(array $terminal, ?array $contestPayload = null): float
{
    $terminalId = (int) ($terminal['id'] ?? 0);
    $balance = termApiFetchCreditsBalanceById($terminalId);
    $recentWin = is_array($contestPayload['recent_win'] ?? null) ? $contestPayload['recent_win'] : null;
    if ($recentWin && !empty($recentWin['is_self']) && isset($recentWin['credits_balance'])) {
        return max($balance, (float) $recentWin['credits_balance']);
    }

    return $balance;
}

function termMpBuildPayloadForTerminal(array $terminal): array
{
    termMpRecoverPendingWinnerPayouts($terminal);
    $terminal = termMpRefreshTerminalStationId($terminal);
    $stationId = (int) ($terminal['station_id'] ?? 0);
    return termMpBuildPayloadForStation($stationId, $terminal);
}

function termMpRecoverPendingWinnerPayouts(?array $viewerTerminal): void
{
    if (!$viewerTerminal) {
        return;
    }
    $terminalId = (int) ($viewerTerminal['id'] ?? 0);
    $stationId = (int) ($viewerTerminal['station_id'] ?? 0);
    if ($terminalId <= 0) {
        return;
    }
    termMpEnsureSchema();
    $db = getDB();

    if ($stationId > 0) {
        $stuck = $db->fetchOne(
            "SELECT * FROM station_multiplayer_contests
             WHERE station_id = ? AND status = 'active' AND ended_at IS NOT NULL
             ORDER BY id DESC LIMIT 1",
            [$stationId]
        );
        if ($stuck) {
            termMpFinalizeContest($stuck);
        }
    }

    $pending = $db->fetchOne(
        "SELECT c.id
         FROM station_multiplayer_contests c
         LEFT JOIN station_multiplayer_contributions p
           ON p.contest_id = c.id AND p.terminal_id = c.winner_terminal_id
         WHERE c.winner_terminal_id = ? AND c.status = 'won'
           AND (
             c.prize_paid_at IS NULL
             OR c.winner_spin_settled_at IS NULL
             OR COALESCE(p.blitz_balance_credits, 0) > 0
             OR COALESCE(p.contest_winnings_credits, 0) > 0
           )
         ORDER BY c.id DESC LIMIT 1",
        [$terminalId]
    );
    if ($pending) {
        termMpEnsureWinnerPaid((int) $pending['id']);
    }
}

function termMpBuildPayloadForStation(int $stationId, ?array $viewerTerminal = null): array
{
    termMpEnsureSchema();
    $disabled = ['enabled' => false, 'available' => false, 'mode' => 'off'];

    if ($viewerTerminal) {
        $viewerTerminal = termMpRefreshTerminalStationId($viewerTerminal);
        if ($stationId <= 0) {
            $stationId = (int) ($viewerTerminal['station_id'] ?? 0);
        }
    }

    $open = termMpGetOpenContestForViewer($viewerTerminal, $stationId);
    if ($open && $stationId <= 0) {
        $stationId = (int) ($open['station_id'] ?? 0);
    }

    if ($stationId <= 0) {
        return $disabled;
    }

    if (!$open) {
        termMpTickStation($stationId);
    }

    $station = termMpLoadStation($stationId);
    $settings = termMpStationSettings($station);
    if (!$settings['enabled']) {
        return $disabled;
    }

    $ready = [
        'enabled' => false,
        'available' => true,
        'mode' => 'ready',
        'entry_options' => MP_ENTRY_OPTIONS,
        'entry_tiers' => termMpBuildEntryTiersList(),
        'win_info' => 'Castiga primul jucator care termina cele ' . MP_SPINS_REQUIRED
            . ' spinuri. Primeste potul Blitz plus castigurile din spinuri. Ceilalti pierd tot.',
    ];

    $db = getDB();
    $recent = $db->fetchOne(
        "SELECT c.*, t.name AS winner_name
         FROM station_multiplayer_contests c
         LEFT JOIN terminals t ON t.id = c.winner_terminal_id
         WHERE c.station_id = ? AND c.status IN ('won','draw','cancelled')
         ORDER BY c.id DESC LIMIT 1",
        [$stationId]
    );

    if (!$open) {
        $open = termMpGetOpenContest($stationId);
    }

    if (!$open) {
        if ($recent && !empty($recent['ended_at'])) {
            $endedTs = strtotime((string) $recent['ended_at']);
            if ($endedTs && (time() - $endedTs) <= 120) {
                $recentPayload = termMpRecentWinPayload($recent, $viewerTerminal);
                if ($recentPayload) {
                    $recentType = (string) ($recentPayload['result_type'] ?? '');
                    $ready['recent_win'] = $recentPayload;
                    $ready['mode'] = $recentType === 'forfeit' ? 'forfeit' : ($recentType === 'draw' ? 'draw' : 'won');
                    $ready['contest_id'] = (int) $recent['id'];
                    $ready['prize_amount'] = round((float) ($recent['pool_amount'] ?? 0), 2);
                    $ready['terminals'] = termMpBuildLeaderboard((int) $recent['id'], $viewerTerminal, (float) ($recent['entry_fee'] ?? 0));
                    $ready['terminals_count'] = count($ready['terminals']);
                }
            }
        }
        return array_merge($ready, termMpContestStationMeta($stationId));
    }

    $status = (string) ($open['status'] ?? '');
    $entryFee = (float) ($open['entry_fee'] ?? 0);
    $contestId = (int) ($open['id'] ?? 0);
    $viewerId = $viewerTerminal ? (int) ($viewerTerminal['id'] ?? 0) : 0;
    $participant = $viewerId > 0 ? termMpGetParticipantRow($contestId, $viewerId) : null;

    $lobbyEnd = strtotime((string) ($open['lobby_ends_at'] ?? ''));
    $contestEnd = strtotime((string) ($open['contest_ends_at'] ?? ''));
    $now = time();

    if ($status === 'lobby') {
        $lobbySeconds = $lobbyEnd ? max(0, $lobbyEnd - $now) : 0;
        $participantsCount = termMpCountParticipants($contestId);
        $isParticipant = !!$participant;
        $entryCharged = $participant ? ((int) ($participant['entry_charged'] ?? 0) === 1) : false;
        $tier = termMpBuildContestTierSummary($open, $participantsCount);
        $estimatedPool = termMpRoundMoney($entryFee * max(1, $participantsCount));
        return [
            'enabled' => true,
            'available' => true,
            'mode' => 'lobby',
            'lobby_open' => true,
            'contest_id' => $contestId,
            'entry_fee' => round($entryFee, 2),
            'entry_options' => MP_ENTRY_OPTIONS,
            'entry_tiers' => termMpBuildEntryTiersList(),
            'tier' => $tier,
            'spin_lei' => (float) ($tier['spin_lei'] ?? termMpSpinLeiFromContest($open)),
            'win_info' => $tier['win_info'] ?? '',
            'lobby_seconds_remaining' => $lobbySeconds,
            'participants_count' => $participantsCount,
            'lobby_display_max' => MP_LOBBY_DISPLAY_MAX,
            'lobby_min_participants' => MP_LOBBY_MIN_PARTICIPANTS,
            'lobby_can_start' => $isParticipant && $participantsCount >= MP_LOBBY_MIN_PARTICIPANTS,
            'is_participant' => $isParticipant,
            'entry_charged' => $entryCharged,
            'lobby_invite' => !$isParticipant,
            'estimated_pool' => $estimatedPool,
            'pool_amount' => $estimatedPool,
            'prize_amount' => $estimatedPool,
            'terminals' => termMpBuildLeaderboard($contestId, $viewerTerminal, $entryFee),
            'terminals_count' => $participantsCount,
            'rules' => [
                'Concursul porneste cu butonul Porneste (minim 2) sau la expirarea timpului.',
                'Soldul se scade doar la start concurs, nu la deschidere lobby.',
                'Intrare: ' . termMpFormatLei($entryFee) . ' LEI in pot Blitz (100%). '
                    . MP_SPINS_REQUIRED . ' spinuri x ' . termMpFormatLei((float) ($tier['spin_lei'] ?? 1))
                    . ' LEI din soldul normal.',
                $tier['win_info'] ?? '',
            ],
            'server_time' => date('c'),
        ] + termMpContestStationMeta($stationId);
    }

    $secondsLeft = $contestEnd ? max(0, $contestEnd - $now) : 0;
    $totalSeconds = MP_CONTEST_SECONDS;
    $progressPct = min(100, (int) floor((($totalSeconds - $secondsLeft) / $totalSeconds) * 100));

    $tier = termMpBuildContestTierSummary($open, termMpCountParticipants($contestId));
    $hasFinisher = termMpContestHasFinisher($contestId);
    $selfSpinsComplete = $participant && (int) ($participant['spins_used'] ?? 0) >= MP_SPINS_REQUIRED;

    return [
        'enabled' => true,
        'available' => true,
        'mode' => 'contest',
        'contest_id' => $contestId,
        'entry_fee' => round($entryFee, 2),
        'spin_lei' => termMpSpinLeiFromContest($open),
        'tier' => $tier,
        'win_info' => $tier['win_info'] ?? '',
        'prize_amount' => round((float) ($open['pool_amount'] ?? 0), 2),
        'pool_amount' => round((float) ($open['pool_amount'] ?? 0), 2),
        'contest_seconds_remaining' => $hasFinisher ? 0 : $secondsLeft,
        'contest_seconds_total' => $totalSeconds,
        'contest_has_finisher' => $hasFinisher,
        'self_spins_complete' => $selfSpinsComplete,
        'progress_pct' => $hasFinisher ? 100 : $progressPct,
        'terminals' => termMpBuildLeaderboard($contestId, $viewerTerminal, $entryFee),
        'terminals_count' => termMpCountParticipants($contestId),
        'is_participant' => !!$participant,
        'participant' => termMpParticipantPayload($participant, $open, $viewerTerminal),
        'server_time' => date('c'),
        'rules' => [
            'Concurs Blitz: 5 minute, ' . MP_SPINS_REQUIRED . ' spinuri x '
                . termMpFormatLei(termMpSpinLeiFromContest($open)) . ' LEI din soldul normal.',
            'Castiga primul jucator care termina cele ' . MP_SPINS_REQUIRED . ' spinuri.',
            'Concursul se incheie imediat ce un jucator termina cele ' . MP_SPINS_REQUIRED . ' spinuri.',
            $tier['win_info'] ?? '',
        ],
    ] + termMpContestStationMeta($stationId);
}

function termMpApplyBet(array $terminal, float $betCredits): ?array
{
    return termMpBuildPayloadForTerminal($terminal);
}

function termMpStartContest(int $stationId, array $settings): ?array
{
    return termMpGetOpenContest($stationId);
}

function termMpGetActiveContest(int $stationId): ?array
{
    return termMpGetOpenContest($stationId);
}

function termMpCancelActiveContests(int $stationId): void
{
    if ($stationId <= 0) {
        return;
    }
    termMpEnsureSchema();
    try {
        $db = getDB();
        $openRows = $db->fetchAll(
            "SELECT * FROM station_multiplayer_contests WHERE station_id = ? AND status IN ('lobby','active')",
            [$stationId]
        );
        foreach ($openRows as $row) {
            if (($row['status'] ?? '') === 'lobby') {
                termMpCancelLobby($row, 'cancelled');
            } else {
                $db->query(
                    "UPDATE station_multiplayer_contests SET status = 'cancelled', ended_at = NOW() WHERE id = ? AND status = 'active'",
                    [(int) ($row['id'] ?? 0)]
                );
            }
        }
    } catch (Throwable $e) {
        error_log('termMpCancelActiveContests: ' . $e->getMessage());
    }
}

function termMpCompleteContest(array $contest): void
{
    termMpFinalizeContest($contest);
}
