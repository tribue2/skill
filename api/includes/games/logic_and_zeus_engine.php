<?php

declare(strict_types=1);

final class LogicAndZeusEngine
{
    public const LINE_OPTIONS = [5];

    private const PAYTABLE = [
        'zeu' => [5 => 500, 4 => 100, 3 => 10],
        'rega' => [5 => 100, 4 => 20, 3 => 5],
        'lup' => [5 => 100, 4 => 20, 3 => 5],
        'vultur' => [5 => 50, 4 => 15, 3 => 3],
        'a' => [5 => 25, 4 => 4, 3 => 1],
        'k' => [5 => 25, 4 => 4, 3 => 1],
        'q' => [5 => 25, 4 => 4, 3 => 1],
        'cupa' => [5 => 25, 4 => 4, 3 => 1],
    ];

    /** Ca „dollar” / „10” la Millionaire / Brain Way. */
    private const CUPA2_TOTAL_BET_PAY = [
        3 => 2,
        4 => 20,
        5 => 100,
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

    private const SCATTER_REEL_INDEXES = [0, 4];

    private static function mechanicalReelStrips(): array
    {
        static $strips = null;
        if ($strips !== null) {
            return $strips;
        }

        $path = dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'games' . DIRECTORY_SEPARATOR . 'logic-and-zeus' . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'reel-strips.json';
        if (!is_readable($path)) {
            throw new RuntimeException('Lipsa fisierului reel-strips.json pentru Fire Scatter.');
        }

        $decoded = json_decode((string) file_get_contents($path), true);
        if (!is_array($decoded) || !is_array($decoded['strips'] ?? null) || count($decoded['strips']) !== 5) {
            throw new RuntimeException('Fisier reel-strips.json invalid pentru Fire Scatter.');
        }

        foreach ($decoded['strips'] as $reelIndex => $strip) {
            if (!is_array($strip) || $strip === []) {
                throw new RuntimeException('Banda rolei ' . (int) $reelIndex . ' invalida in reel-strips.json.');
            }
        }

        $strips = $decoded['strips'];
        return $strips;
    }

    public static function normalizeLines(int $lines): int
    {
        return in_array($lines, self::LINE_OPTIONS, true) ? $lines : 5;
    }

    public static function stripLength(int $reelIndex): int
    {
        $strip = self::mechanicalReelStrips()[$reelIndex] ?? self::mechanicalReelStrips()[0];
        return count($strip);
    }

    public static function readMechanicalColumn(int $reelIndex, int $stopIndex): array
    {
        $strip = self::mechanicalReelStrips()[$reelIndex] ?? self::mechanicalReelStrips()[0];
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
        $lineBoard = self::applyScatterWildReels($board);

        foreach (array_slice(self::PAYLINES, 0, $lines) as $index => $lineRows) {
            $lineWin = self::evaluatePayline($lineBoard, $lineRows, $totalBet);
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

    private static function applyScatterWildReels(array $board): array
    {
        $lineBoard = $board;
        foreach (self::SCATTER_REEL_INDEXES as $reelIndex) {
            if (!isset($lineBoard[$reelIndex])) {
                continue;
            }
            foreach ($lineBoard[$reelIndex] as $row => $symbol) {
                if ($symbol === 'scatter') {
                    $lineBoard[$reelIndex][$row] = 'wild';
                }
            }
        }

        return $lineBoard;
    }

    private static function scatterPositions(array $board): array
    {
        $positions = [];
        foreach ($board as $reel => $column) {
            if (!in_array($reel, self::SCATTER_REEL_INDEXES, true)) {
                continue;
            }
            foreach ($column as $row => $symbol) {
                if ($symbol === 'scatter') {
                    $positions[] = $reel . '-' . $row;
                }
            }
        }

        return $positions;
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

        if ($target === null || $matched < 3) {
            return null;
        }

        if ($target === 'cupa2') {
            $multiplier = self::CUPA2_TOTAL_BET_PAY[$matched] ?? 0;
            if ($multiplier <= 0) {
                return null;
            }
            $payout = round($totalBet * $multiplier, 2);
        } else {
            $payKey = isset(self::PAYTABLE[$target]) ? $target : 'q';
            $multiplier = self::PAYTABLE[$payKey][$matched] ?? 0;
            if ($multiplier <= 0) {
                return null;
            }
            $payout = round($totalBet * $multiplier, 2);
        }

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
