import { fetchJson, withApi } from "../lib/http.js";
import { parseSteamId } from "../lib/steam.js";

const LEETIFY_API = "https://api-public.cs-prod.leetify.com/v3/profile";

export default withApi(async function handler(req, res) {
  const steam = parseSteamId(req.query.steamid);

  if (!steam) {
    return res.status(400).json({ error: "Valid steamid required" });
  }

  const headers = {};
  const apiKey = process.env.LEETIFY_API_KEY;

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const result = await fetchJson(
    `${LEETIFY_API}?steam64_id=${encodeURIComponent(steam.steam64)}`,
    { headers, retries: 2, timeoutMs: 8000 },
  );

  if (result.status === 404) {
    return res.status(404).json({ error: "Player not found" });
  }

  if (!result.ok) {
    return res.status(502).json({ error: "Rank provider unavailable" });
  }

  const premier = result.data.ranks?.premier;

  if (premier == null || premier <= 0) {
    return res
      .status(404)
      .json({ error: "Rank not available for this player" });
  }

  return res.status(200).json({
    rank: String(premier),
    name: result.data.name ?? null,
  });
});
