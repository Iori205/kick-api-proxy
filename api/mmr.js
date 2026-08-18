import { medalFromRankTier, mmrFromRankTier } from "../lib/dota.js";
import { withApi } from "../lib/http.js";
import { fetchDotaProfile } from "../lib/opendota.js";
import { parseSteamId } from "../lib/steam.js";

export default withApi(async function handler(req, res) {
  const steam = parseSteamId(req.query.steamid);

  if (!steam) {
    return res.status(400).json({ error: "Valid steamid required" });
  }

  const result = await fetchDotaProfile(steam.steam32);

  if (!result.data) {
    if (result.status === 404) {
      return res.status(404).json({ error: "Player not found" });
    }

    return res.status(502).json({ error: "MMR provider unavailable" });
  }

  const data = result.data;
  const medal = medalFromRankTier(data.rank_tier, data.leaderboard_rank);
  const mmr =
    data.solo_competitive_rank ??
    data.competitive_rank ??
    data.mmr_estimate?.estimate ??
    mmrFromRankTier(data.rank_tier);

  if (mmr == null && !medal) {
    return res.status(404).json({ error: "MMR not available for this player" });
  }

  return res.status(200).json({
    mmr: mmr != null ? String(mmr) : medal,
    rank: medal,
    name: data.profile?.personaname ?? null,
  });
});
