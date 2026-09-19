<?php

declare(strict_types=1);

final class DodgeBombEngine
{
    public const LINE_OPTIONS = [5];

    private const PAYING_REELS = 4;

    private const MULTIPLIER_REEL = 4;

    private const PAYTABLE = [
        'sapte' => [4 => 400, 3 => 20],
        'stea' => [4 => 60, 3 => 5],
        'pepene' => [4 => 80, 3 => 20],
        'strugure' => [4 => 80, 3 => 20],
        'pruna' => [4 => 40, 3 => 10],
        'portocala' => [4 => 40, 3 => 10],
        'lamaie' => [4 => 40, 3 => 10],
        'cireasa' => [4 => 20, 3 => 5, 2 => 2],
    ];

    private const PAYLINES = [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
        [2, 2, 2, 2, 2],
        [0, 1, 2, 1, 0],
        [2, 1, 0, 1, 2],
        [0, 0, 1, 2, 2],
        [2, 2, 1, 0, 0],
        [1, 0, 0, 0, 1],
        [1, 2, 2, 2, 1],
        [0, 1, 1, 1, 0],
    ];

    private const MECHANICAL_REEL_STRIPS = [
        [
            'cireasa', 'cireasa', 'strugure', 'lamaie', 'lamaie', 'pepene', 'portocala', 'portocala',
            'sapte', 'pruna', 'pruna', 'pepene', 'cireasa', 'cireasa', 'strugure', 'lamaie',
            'lamaie', 'portocala', 'portocala', 'stea', 'pruna', 'pruna', 'pepene', 'cireasa',
            'cireasa', 'lamaie', 'lamaie', 'strugure', 'portocala', 'portocala', 'sapte', 'pruna',
            'pruna', 'pepene', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'portocala', 'portocala',
            'strugure', 'pruna', 'pruna', 'pepene', 'sapte', 'cireasa', 'cireasa', 'lamaie',
            'lamaie', 'portocala', 'strugure', 'strugure', 'pruna', 'pruna', 'strugure', 'pepene',
            'stea', 'pepene', 'pepene',
        ],
        [
            'lamaie', 'lamaie', 'pepene', 'cireasa', 'cireasa', 'strugure', 'portocala', 'portocala',
            'sapte', 'pruna', 'pruna', 'pepene', 'lamaie', 'lamaie', 'cireasa', 'cireasa',
            'portocala', 'portocala', 'strugure', 'pruna', 'pruna', 'pepene', 'lamaie', 'lamaie',
            'cireasa', 'cireasa', 'sapte', 'portocala', 'portocala', 'pruna', 'pruna', 'strugure',
            'lamaie', 'lamaie', 'pepene', 'cireasa', 'cireasa', 'portocala', 'portocala', 'pruna',
            'pruna', 'stea', 'strugure', 'lamaie', 'lamaie', 'pepene', 'cireasa', 'cireasa',
            'portocala', 'portocala', 'pruna', 'strugure', 'sapte', 'strugure', 'lamaie', 'lamaie',
            'strugure', 'pepene', 'pepene', 'pepene',
        ],
        [
            'portocala', 'portocala', 'strugure', 'pruna', 'pruna', 'pepene', 'cireasa', 'cireasa',
            'sapte', 'lamaie', 'lamaie', 'pepene', 'portocala', 'portocala', 'pruna', 'pruna',
            'strugure', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'pepene', 'portocala', 'portocala',
            'pruna', 'pruna', 'stea', 'strugure', 'cireasa', 'cireasa', 'lamaie', 'lamaie',
            'portocala', 'portocala', 'pepene', 'pruna', 'pruna', 'sapte', 'cireasa', 'cireasa',
            'lamaie', 'lamaie', 'portocala', 'portocala', 'strugure', 'pruna', 'pruna', 'pepene',
            'cireasa', 'cireasa', 'lamaie', 'lamaie', 'portocala', 'strugure', 'strugure', 'pruna',
            'pruna', 'sapte', 'pepene', 'pepene', 'pepene',
        ],
        [
            'pruna', 'pruna', 'pepene', 'portocala', 'portocala', 'strugure', 'lamaie', 'lamaie',
            'sapte', 'cireasa', 'cireasa', 'pepene', 'pruna', 'pruna', 'portocala', 'portocala',
            'lamaie', 'lamaie', 'strugure', 'cireasa', 'cireasa', 'pepene', 'pruna', 'pruna',
            'portocala', 'portocala', 'sapte', 'lamaie', 'lamaie', 'cireasa', 'cireasa', 'strugure',
            'pruna', 'pruna', 'pepene', 'portocala', 'portocala', 'lamaie', 'lamaie', 'stea',
            'cireasa', 'cireasa', 'pruna', 'pruna', 'strugure', 'portocala', 'portocala', 'pepene',
            'lamaie', 'lamaie', 'cireasa', 'cireasa', 'pruna', 'strugure', 'strugure', 'portocala',
            'portocala', 'sapte', 'pepene', 'pepene', 'pepene',
        ],
        [
            'mult0', 'mult0', 'mult0', 'mult0', 'mult1',
            'mult0', 'mult0', 'mult0', 'mult0', 'mult2',
            'mult0', 'mult0', 'mult0', 'mult0', 'mult1',
            'mult0', 'mult0', 'mult0', 'mult0', 'mult2',
            'mult0', 'mult0', 'mult0', 'mult0', 'mult0', 'mult3',
        ],
    ];

    public static function normalizeLines(int $lines): int
    {
        return in_array($lines, self::LINE_OPTIONS, true) ? $lines : 5;
    }

    public static function stripLength(int $reelIndex): int
    {
        $strip = self::MECHANICAL_REEL_STRIPS[$reelIndex] ?? self::MECHANICAL_REEL_STRIPS[0];
        return count($strip);
    }

    public static function readMechanicalColumn(int $reelIndex, int $stopIndex): array
    {
        $strip = self::MECHANICAL_REEL_STRIPS[$reelIndex] ?? self::MECHANICAL_REEL_STRIPS[0];
        $length = count($strip);
        $top = (($stopIndex % $length) + $length) % $length;

        return [
            $strip[$top % $length],
            $strip[($top + 1) % $length],
            $strip[($top + 2) % $length],
        ];
    }

    public static function buildBoardFromStops(array $reelStops): array
    {
        $board = [];
        for ($reel = 0; $reel < 5; $reel += 1) {
            $board[$reel] = self::readMechanicalColumn($reel, (int) $reelStops[$reel]);
        }

        return $board;
    }

    public static function validateReelStops(array $reelStops): ?string
    {
        if (count($reelStops) !== 5) {
            return 'Pozitii role invalide.';
        }

        foreach ($reelStops as $reelIndex => $stopIndex) {
            if (!is_int($stopIndex) && !ctype_digit((string) $stopIndex)) {
                return 'Pozitii role invalide.';
            }
            $stop = (int) $stopIndex;
            if ($stop < 0 || $stop >= self::stripLength((int) $reelIndex)) {
                return 'Pozitii role invalide.';
            }
        }

        return null;
    }

    public static function parseReelStops($raw): ?array
    {
        if (!is_array($raw)) {
            return null;
        }

        $stops = [];
        for ($reel = 0; $reel < 5; $reel += 1) {
            if (!array_key_exists($reel, $raw) && !array_key_exists((string) $reel, $raw)) {
                return null;
            }
            $value = $raw[$reel] ?? $raw[(string) $reel];
            if (!is_numeric($value)) {
                return null;
            }
            $stops[$reel] = (int) $value;
        }

        return $stops;
    }

    public static function evaluateBoard(array $board, float $betPerLine, int $lines): array
    {
        $betPerLine = max(0.01, round($betPerLine, 2));
        $totalBet = round($betPerLine * $lines, 2);
        $lines = self::normalizeLines($lines);
        $wins = [];
        $cancelledLines = [];
        $total = 0;

        foreach (array_slice(self::PAYLINES, 0, $lines) as $index => $lineRows) {
            $lineResult = self::evaluatePayline($board, $lineRows, $totalBet, $index + 1);
            if ($lineResult === null) {
                continue;
            }
            if (!empty($lineResult['cancelled'])) {
                $cancelledLines[] = $lineResult['cancelled'];
                continue;
            }
            $total += $lineResult['payout'];
            $wins[] = $lineResult['win'];
        }

        $starWin = self::evaluateStarScatter($board, $totalBet);
        if ($starWin !== null) {
            $total += $starWin['payout'];
            $wins[] = $starWin;
        }

        return [
            'wins' => $wins,
            'cancelled_lines' => $cancelledLines,
            'total' => round($total, 2),
        ];
    }

    public static function evaluateRound(float $betPerLine, int $lines, array $reelStops): array
    {
        $error = self::validateReelStops($reelStops);
        if ($error !== null) {
            return ['ok' => false, 'message' => $error];
        }

        $board = self::buildBoardFromStops($reelStops);
        $result = self::evaluateBoard($board, $betPerLine, $lines);

        return [
            'ok' => true,
            'board' => $board,
            'wins' => $result['wins'],
            'cancelled_lines' => $result['cancelled_lines'],
            'total' => $result['total'],
        ];
    }

    private static function symbolMultiplier(string $symbol): int
    {
        if (preg_match('/^mult(\d+)$/', $symbol, $matches)) {
            return max(0, (int) $matches[1]);
        }

        return 1;
    }

    private static function evaluateStarScatter(array $board, float $totalBet): ?array
    {
        $starPositions = [];
        for ($reel = 0; $reel < self::PAYING_REELS; $reel += 1) {
            for ($row = 0; $row < 3; $row += 1) {
                if (($board[$reel][$row] ?? '') === 'stea') {
                    $starPositions[] = $reel . '-' . $row;
                    break;
                }
            }
        }

        $starCount = count($starPositions);
        if ($starCount < 3) {
            return null;
        }

        $multiplier = (float) (self::PAYTABLE['stea'][min(4, $starCount)] ?? 0);
        if ($multiplier <= 0) {
            return null;
        }

        $payout = round($totalBet * $multiplier, 2);
        if ($payout <= 0) {
            return null;
        }

        return [
            'line' => 0,
            'symbol' => 'stea',
            'count' => $starCount,
            'payout' => $payout,
            'positions' => $starPositions,
        ];
    }

    private static function evaluatePayline(array $board, array $lineRows, float $totalBet, int $lineNumber): ?array
    {
        $target = null;
        $positions = [];

        for ($reel = 0; $reel < self::PAYING_REELS; $reel += 1) {
            $symbol = $board[$reel][$lineRows[$reel]] ?? 'cireasa';
            if ($symbol === 'stea') {
                break;
            }
            if ($target === null) {
                $target = $symbol;
                $positions[] = $reel . '-' . $lineRows[$reel];
                continue;
            }
            if ($symbol !== $target) {
                break;
            }
            $positions[] = $reel . '-' . $lineRows[$reel];
        }

        if ($target === null) {
            $target = 'sapte';
        }

        $count = count($positions);
        $baseMultiplier = (float) (self::PAYTABLE[$target][$count] ?? 0);
        if ($baseMultiplier <= 0) {
            return null;
        }

        $multiplierPosition = self::MULTIPLIER_REEL . '-' . $lineRows[self::MULTIPLIER_REEL];
        $reelSymbol = $board[self::MULTIPLIER_REEL][$lineRows[self::MULTIPLIER_REEL]] ?? 'mult2';
        $winMultiplier = self::symbolMultiplier($reelSymbol);

        if ($winMultiplier <= 0) {
            $blockedPositions = $positions;
            $blockedPositions[] = $multiplierPosition;

            return [
                'cancelled' => [
                    'line' => $lineNumber,
                    'symbol' => $target,
                    'count' => $count,
                    'base_multiplier' => $baseMultiplier,
                    'win_multiplier' => 0,
                    'payout' => 0,
                    'positions' => $blockedPositions,
                    'reason' => 'bomb',
                ],
            ];
        }

        $payout = round($totalBet * $baseMultiplier * $winMultiplier, 2);
        if ($payout <= 0) {
            return null;
        }

        $winPositions = $positions;
        $winPositions[] = $multiplierPosition;

        return [
            'payout' => $payout,
            'win' => [
                'line' => $lineNumber,
                'symbol' => $target,
                'count' => $count,
                'base_multiplier' => $baseMultiplier,
                'win_multiplier' => $winMultiplier,
                'payout' => $payout,
                'positions' => $winPositions,
            ],
        ];
    }
}
