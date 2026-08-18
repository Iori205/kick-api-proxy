import { medalFromRankTier, mmrFromRankTier } from "../lib/dota.js";
import { withApi } from "../lib/http.js";
import { parseSteamId } from "../lib/steam.js";

const OPENDOTA_API = "https://api.opendota.com/api/players";

export default withApi(async function handler(req, res) {
  const steam = parseSteamId(req.query.steamid);

  if (!steam) {
    return res.status(400).json({ error: "Valid steamid required" });
  }

  const response = await fetch(`${OPENDOTA_API}/${steam.steam32}`, {
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) {
    return res.status(404).json({ error: "Player not found" });
  }

  if (!response.ok) {
    return res.status(502).json({ error: "MMR provider unavailable" });
  }

  const data = await response.json();
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
