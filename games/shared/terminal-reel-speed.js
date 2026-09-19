(() => {
    const REEL_SCROLL_SPEED = 0.13125;
    const REEL_SPEED_BASE = 11.5;
    const REEL_SPEED_STEP = 1.15;

    function getReelSpinScrollSpeed(reelIndex, reelScrollMult = 1) {
        const index = Math.max(0, Number(reelIndex) || 0);
        const mult = Number(reelScrollMult) || 1;
        return (REEL_SPEED_BASE + index * REEL_SPEED_STEP) * mult * REEL_SCROLL_SPEED;
    }

    window.IqwinTerminalReelSpeed = {
        REEL_SCROLL_SPEED,
        REEL_SPEED_BASE,
        REEL_SPEED_STEP,
        getReelSpinScrollSpeed
    };
})();
