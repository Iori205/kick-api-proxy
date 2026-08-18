const MEDALS = [
  "",
  "Herald",
  "Guardian",
  "Crusader",
  "Archon",
  "Legend",
  "Ancient",
  "Divine",
  "Immortal",
];

export function medalFromRankTier(rankTier, leaderboardRank) {
  if (!rankTier) {
    return null;
  }

  const medal = Math.floor(rankTier / 10);
  const stars = rankTier % 10;
  const name = MEDALS[medal];

  if (!name) {
    return null;
  }

  if (medal >= 8) {
    return leaderboardRank ? `Immortal #${leaderboardRank}` : "Immortal";
  }

  return stars > 0 ? `${name} ${stars}` : name;
}

export function mmrFromRankTier(rankTier) {
  if (!rankTier) {
    return null;
  }

  const medal = Math.floor(rankTier / 10);
  const stars = Math.max(rankTier % 10, 1);

  if (medal >= 8) {
    return 5620;
  }

  if (medal < 1) {
    return null;
  }

  return (medal - 1) * 770 + stars * 154;
}
