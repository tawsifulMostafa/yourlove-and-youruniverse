const LEVEL_THRESHOLDS = {
  1: 0,
  2: 30,
  3: 80,
  4: 150,
  5: 240,
};

export const ETERNAL_MODE_UNLOCK_LEVEL = 10;

function getNextLevelRequirement(level) {
  return LEVEL_THRESHOLDS[level + 1] ?? 30 * level * level + 20;
}

function getLevelRequirement(level) {
  return LEVEL_THRESHOLDS[level] ?? 30 * (level - 1) * (level - 1) + 20;
}

export function getLoveLevel(letterCount, memoryCount) {
  const hiddenScore = letterCount * 10 + memoryCount * 20;
  let level = 1;

  while (hiddenScore >= getNextLevelRequirement(level)) {
    level += 1;
  }

  const currentLevelStart = getLevelRequirement(level);
  const nextLevelStart = getNextLevelRequirement(level);
  const progress =
    nextLevelStart === currentLevelStart
      ? 0
      : ((hiddenScore - currentLevelStart) / (nextLevelStart - currentLevelStart)) * 100;

  return {
    level,
    progress: Math.max(0, Math.min(100, progress)),
  };
}

export function isEternalModeUnlocked(letterCount, memoryCount) {
  return getLoveLevel(letterCount, memoryCount).level >= ETERNAL_MODE_UNLOCK_LEVEL;
}
