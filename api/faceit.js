import { fetchJson, withApi } from "../lib/http.js";
import { parseSteamId } from "../lib/steam.js";

const FACEIT_API = "https://open.faceit.com/data/v4/players";
const LEETIFY_API = "https://api-public.cs-prod.leetify.com/v3/profile";

async function faceitLevelFromOfficialApi(steam64) {
  const apiKey = process.env.FACEIT_API_KEY;
  if (!apiKey) {
    return null;
  }

  for (const game of ["cs2", "csgo"]) {
    const result = await fetchJson(
      `${FACEIT_API}?game=${game}&game_player_id=${encodeURIComponent(steam64)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        retries: 2,
        timeoutMs: 6000,
      },
    );

    if (!result.ok) {
      continue;
    }

    const level =
      result.data.games?.cs2?.skill_level ??
      result.data.games?.csgo?.skill_level ??
      null;

    if (level != null) {
      return { rank: String(level), name: result.data.nickname ?? null };
    }
  }

  return null;
}

async function faceitLevelFromLeetify(steam64) {
  const headers = {};
  const apiKey = process.env.LEETIFY_API_KEY;

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const result = await fetchJson(
    `${LEETIFY_API}?steam64_id=${encodeURIComponent(steam64)}`,
    { headers, retries: 2, timeoutMs: 8000 },
  );

  if (!result.ok) {
    return null;
  }

  const level = result.data.ranks?.faceit;

  if (level == null || level <= 0) {
    return null;
  }

  return { rank: String(level), name: result.data.name ?? null };
}

export default withApi(async function handler(req, res) {
  const steam = parseSteamId(req.query.steamid);

  if (!steam) {
    return res.status(400).json({ error: "Valid steamid required" });
  }

  const official = await faceitLevelFromOfficialApi(steam.steam64);
  if (official) {
    return res.status(200).json(official);
  }

  const leetify = await faceitLevelFromLeetify(steam.steam64);
  if (leetify) {
    return res.status(200).json(leetify);
  }

  return res.status(404).json({ error: "FACEIT level not found" });
});
