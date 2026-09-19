<?php

declare(strict_types=1);

final class FortyBurnHotEngine
{
    public const LINE_OPTIONS = [10];

    public const REEL_ROWS = 4;

    private const PAYTABLE = [
        'sapte' => [5 => 300, 4 => 20, 3 => 4],
        'pepene' => [5 => 50, 4 => 10, 3 => 1],
        'strugure' => [5 => 50, 4 => 10, 3 => 1],
        'clopotel' => [5 => 20, 4 => 5, 3 => 1],
        'pruna' => [5 => 10, 4 => 3, 3 => 1],
        'portocala' => [5 => 10, 4 => 3, 3 => 1],
        'lamaie' => [5 => 10, 4 => 3, 3 => 1],
        'cireasa' => [5 => 10, 4 => 3, 3 => 1],
    ];

    private const PAYLINES = [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
        [2, 2, 2, 2, 2],
        [3, 3, 3, 3, 3],
        [0, 1, 2, 1, 0],
        [3, 2, 1, 2, 3],
        [0, 0, 1, 2, 2],
        [3, 3, 2, 1, 1],
        [1, 0, 0, 0, 1],
        [2, 3, 3, 3, 2],
        [0, 1, 1, 1, 0],
        [3, 2, 2, 2, 3],
        [1, 0, 1, 2, 1],
        [2, 3, 2, 1, 2],
        [0, 1, 0, 1, 0],
        [3, 2, 3, 2, 3],
        [1, 1, 0, 1, 1],
        [2, 2, 3, 2, 2],
        [0, 2, 0, 2, 0],
        [3, 1, 3, 1, 3],
        [0, 2, 3, 2, 0],
        [3, 1, 0, 1, 3],
        [0, 0, 2, 3, 3],
        [3, 3, 1, 0, 0],
        [1, 2, 3, 2, 1],
        [2, 1, 0, 1, 2],
        [0, 3, 0, 3, 0],
        [3, 0, 3, 0, 3],
        [1, 3, 1, 3, 1],
        [2, 0, 2, 0, 2],
        [0, 1, 2, 3, 3],
        [3, 2, 1, 0, 0],
        [1, 0, 2, 3, 1],
        [2, 3, 1, 0, 2],
        [0, 2, 2, 2, 0],
        [3, 1, 1, 1, 3],
        [1, 2, 2, 2, 1],
        [2, 1, 1, 1, 2],
        [0, 3, 2, 1, 0],
        [3, 0, 1, 2, 3],
    ];

    private const WILD_REEL_INDEXES = [1, 2, 3];

    private const REEL_STRIP_1_5 = ['cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'clopotel', 'clopotel', 'clopotel', 'pepene', 'pepene', 'strugure', 'strugure', 'sapte', 'sapte', 'stea', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'clopotel', 'clopotel', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'stea', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'stea', 'sapte', 'sapte', 'clopotel', 'clopotel', 'pepene', 'pepene', 'strugure', 'strugure'];

    private const REEL_STRIP_2 = ['coroana', 'coroana', 'coroana', 'coroana', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'clopotel', 'clopotel', 'clopotel', 'pepene', 'pepene', 'strugure', 'strugure', 'sapte', 'sapte', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'clopotel', 'clopotel', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'clopotel', 'clopotel', 'sapte', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'coroana', 'coroana', 'coroana', 'coroana'];

    private const REEL_STRIP_3 = ['coroana', 'coroana', 'coroana', 'coroana', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'clopotel', 'clopotel', 'clopotel', 'pepene', 'pepene', 'strugure', 'strugure', 'sapte', 'sapte', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'clopotel', 'clopotel', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'lamaie', 'lamaie', 'lamaie', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'cireasa', 'cireasa', 'cireasa', 'clopotel', 'clopotel', 'sapte', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'coroana', 'coroana', 'coroana', 'coroana'];

    private const REEL_STRIP_4 = ['coroana', 'coroana', 'coroana', 'coroana', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'clopotel', 'clopotel', 'clopotel', 'pepene', 'pepene', 'strugure', 'strugure', 'sapte', 'sapte', 'coroana', 'coroana', 'coroana', 'coroana', 'portocala', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'pruna', 'cireasa', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'lamaie', 'clopotel', 'clopotel', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'portocala', 'portocala', 'portocala', 'pruna', 'pruna', 'pruna', 'cireasa', 'cireasa', 'cireasa', 'lamaie', 'lamaie', 'lamaie', 'clopotel', 'clopotel', 'sapte', 'sapte', 'pepene', 'pepene', 'strugure', 'strugure', 'coroana', 'coroana', 'coroana', 'coroana'];


    private const MECHANICAL_REEL_STRIPS = [
        self::REEL_STRIP_1_5,
        self::REEL_STRIP_2,
        self::REEL_STRIP_3,
        self::REEL_STRIP_4,
        self::REEL_STRIP_1_5,
    ];

    public static function normalizeLines(int $lines): int
    {
        return in_array($lines, self::LINE_OPTIONS, true) ? $lines : 10;
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
            $strip[($top + 3) % $length],
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
        $total = 0;
        foreach (array_slice(self::PAYLINES, 0, $lines) as $index => $lineRows) {
            $lineWin = self::evaluatePayline($board, $lineRows, $totalBet);
            if ($lineWin === null) {
                continue;
            }
            $total += $lineWin['payout'];
            $wins[] = [
                'line' => $index + 1,
                'symbol' => $lineWin['symbol'],
                'count' => $lineWin['count'],
                'payout' => $lineWin['payout'],
                'positions' => $lineWin['positions'],
            ];
        }

        return [
            'wins' => $wins,
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
            'total' => $result['total'],
        ];
    }

    private static function isWildSymbol(string $symbol): bool
    {
        return $symbol === 'coroana';
    }

    private static function evaluatePayline(array $board, array $lineRows, float $totalBet): ?array
    {
        $symbols = [];
        for ($reel = 0; $reel < 5; $reel += 1) {
            $symbols[] = $board[$reel][$lineRows[$reel]] ?? '';
        }

        $target = null;
        foreach ($symbols as $symbol) {
            if (!self::isWildSymbol($symbol)) {
                $target = $symbol;
                break;
            }
        }

        $matched = 0;
        foreach ($symbols as $symbol) {
            if (self::isWildSymbol($symbol)) {
                $matched += 1;
                continue;
            }
            if ($target === null) {
                $target = $symbol;
                $matched += 1;
                continue;
            }
            if ($symbol === $target) {
                $matched += 1;
                continue;
            }
            break;
        }

        $minMatch = 3;
        if ($target === null || $matched < $minMatch) {
            return null;
        }

        $multiplier = self::PAYTABLE[$target][$matched] ?? 0;
        if ($multiplier <= 0) {
            return null;
        }

        $payout = round($totalBet * $multiplier, 2);
        if ($payout <= 0) {
            return null;
        }

        $positions = [];
        for ($reel = 0; $reel < $matched; $reel += 1) {
            $positions[] = $reel . '-' . $lineRows[$reel];
        }

        return [
            'symbol' => $target,
            'count' => $matched,
            'payout' => $payout,
            'positions' => $positions,
        ];
    }
}
