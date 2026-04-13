const LEVEL_THRESHOLDS = {
  1: 0,
  2: 30,
  3: 80,
  4: 150,
  5: 240,
};

export const ETERNAL_MODE_UNLOCK_LEVEL = 10;

const LOVE_LEVEL_TIERS = [
  {
    key: "first-spark",
    name: "First Spark",
    minLevel: 1,
    maxLevel: 3,
    rewardCopy: "Keep sharing together to unlock this warmer night theme.",
  },
  {
    key: "growing-bond",
    name: "Growing Bond",
    minLevel: 4,
    maxLevel: 6,
    rewardCopy: "Your shared world is starting to feel more personal.",
  },
  {
    key: "deeply-connected",
    name: "Deeply Connected",
    minLevel: 7,
    maxLevel: 9,
    rewardCopy: "You are close to unlocking the deeper Eternal glow.",
  },
  {
    key: "eternal-bond",
    name: "Eternal Bond",
    minLevel: 10,
    maxLevel: Infinity,
    rewardCopy: "A deeper glow for your shared world.",
  },
];

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

export function getLoveLevelTier(level) {
  return LOVE_LEVEL_TIERS.find(
    (tier) => level >= tier.minLevel && level <= tier.maxLevel
  ) ?? LOVE_LEVEL_TIERS[0];
}
