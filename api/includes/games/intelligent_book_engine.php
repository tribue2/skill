<?php

declare(strict_types=1);

final class IntelligentBookEngine
{
    public const LINE_OPTIONS = [5];

    private const PAYTABLE = [
        'zeu' => [5 => 500, 4 => 100, 3 => 20],
        'coif' => [5 => 200, 4 => 80, 3 => 15],
        'house' => [5 => 150, 4 => 40, 3 => 10],
        'bug' => [5 => 150, 4 => 40, 3 => 10],
        'vas' => [5 => 120, 4 => 30, 3 => 8],
        'symbo' => [5 => 120, 4 => 30, 3 => 8],
        'a' => [5 => 30, 4 => 10, 3 => 5],
        'k' => [5 => 25, 4 => 10, 3 => 5],
        'q' => [5 => 20, 4 => 10, 3 => 5],
        'j' => [5 => 20, 4 => 10, 3 => 5],
        'ten' => [5 => 20, 4 => 10, 3 => 5],
    ];

    private const IQWIN_LINE_SEQUENCE = ['iq_i', 'iq_q2', 'iq_w', 'iq_i', 'iq_n'];

    private const IQWIN_SYMBOLS = ['iq_i', 'iq_q2', 'iq_w', 'iq_n'];

    private const IQWIN_LINE_PAY = 500;

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

    private const REEL_SYMBOL_MIN_DISTANCE = 3;

    private const MECHANICAL_REEL_STRIPS = [
        ['coif', 'bug', 'symbo', 'a', 'k', 'q', 'a', 'ten', 'house', 'vas', 'a', 'k', 'q', 'ten', 'a', 'bug', 'vas', 'house', 'coif', 'bug', 'symbo', 'iq_i', 'k', 'q', 'zeu', 'a', 'house', 'vas', 'zeu', 'k', 'q', 'j', 'ten'],
        ['iq_q2', 'q', 'k', 'j', 'bug', 'symbo', 'q', 'wild', 'a', 'k', 'q', 'j', 'wild', 'ten', 'house', 'bug', 'vas', 'wild', 'house', 'k', 'q', 'j', 'wild', 'bug', 'symbo', 'coif', 'ten', 'wild', 'k', 'q', 'zeu', 'vas', 'j', 'zeu'],
        ['bug', 'k', 'q', 'symbo', 'k', 'iq_w', 'a', 'k', 'vas', 'q', 'ten', 'zeu', 'a', 'bug', 'vas', 'house', 'k', 'zeu', 'q', 'symbo', 'j', 'ten', 'coif', 'a', 'k', 'vas', 'q', 'house', 'j', 'ten'],
        ['k', 'q', 'a', 'k', 'q', 'j', 'zeu', 'a', 'iq_i', 'k', 'q', 'j', 'bug', 'symbo', 'ten', 'wild', 'a', 'k', 'q', 'j', 'vas', 'ten', 'house', 'a', 'k', 'q', 'j', 'bug', 'ten', 'coif'],
        ['k', 'q', 'symbo', 'k', 'iq_n', 'a', 'k', 'q', 'j', 'vas', 'ten', 'house', 'a', 'k', 'q', 'j', 'bug', 'ten', 'coif', 'a', 'k', 'q', 'j', 'ten', 'a', 'zeu', 'k', 'q', 'j', 'ten'],
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
        return $symbol === 'wild';
    }

    private static function isIqwinSymbol(string $symbol): bool
    {
        return in_array($symbol, self::IQWIN_SYMBOLS, true);
    }

    private static function canWildSubstituteForTarget(?string $target): bool
    {
        return $target !== null && !self::isIqwinSymbol($target);
    }

    /**
     * @param list<string> $symbols
     * @return array{target: ?string, matched: int}
     */
    private static function countPaylineMatches(array $symbols): array
    {
        $target = null;
        $matched = 0;
        $pendingWilds = 0;

        foreach ($symbols as $symbol) {
            if (self::isWildSymbol($symbol)) {
                if ($target === null) {
                    $pendingWilds += 1;
                } elseif (self::canWildSubstituteForTarget($target)) {
                    $matched += 1;
                } else {
                    break;
                }
                continue;
            }

            if ($target === null) {
                $target = $symbol;
                $matched = self::isIqwinSymbol($target) ? 1 : $pendingWilds + 1;
                $pendingWilds = 0;
                continue;
            }

            if ($symbol === $target) {
                $matched += 1;
                continue;
            }
            break;
        }

        return ['target' => $target, 'matched' => $matched];
    }

    private static function evaluateIqwinLine(array $board, array $lineRows, float $totalBet): ?array
    {
        for ($reel = 0; $reel < 5; $reel += 1) {
            if (($board[$reel][$lineRows[$reel]] ?? '') !== self::IQWIN_LINE_SEQUENCE[$reel]) {
                return null;
            }
        }

        $payout = round($totalBet * self::IQWIN_LINE_PAY, 2);
        if ($payout <= 0) {
            return null;
        }

        $positions = [];
        for ($reel = 0; $reel < 5; $reel += 1) {
            $positions[] = $reel . '-' . $lineRows[$reel];
        }

        return [
            'symbol' => 'iqwin',
            'count' => 5,
            'payout' => $payout,
            'positions' => $positions,
        ];
    }

    private static function evaluatePayline(array $board, array $lineRows, float $totalBet): ?array
    {
        $iqwinWin = self::evaluateIqwinLine($board, $lineRows, $totalBet);
        if ($iqwinWin !== null) {
            return $iqwinWin;
        }

        $symbols = [];
        for ($reel = 0; $reel < 5; $reel += 1) {
            $symbols[] = $board[$reel][$lineRows[$reel]] ?? '';
        }

        ['target' => $target, 'matched' => $matched] = self::countPaylineMatches($symbols);

        if ($target === null || $matched < 3 || self::isIqwinSymbol($target)) {
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
