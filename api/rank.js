const LEETIFY_API = "https://api-public.cs-prod.leetify.com/v3/profile";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { steamid } = req.query;

  if (!steamid || !/^\d{17}$/.test(String(steamid))) {
    return res.status(400).json({ error: "Valid 17-digit steamid required" });
  }

  const headers = { Accept: "application/json" };
  const apiKey = process.env.LEETIFY_API_KEY;

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(
      `${LEETIFY_API}?steam64_id=${encodeURIComponent(steamid)}`,
      { headers },
    );

    if (response.status === 404) {
      return res.status(404).json({ error: "Player not found" });
    }

    if (!response.ok) {
      return res.status(502).json({ error: "Rank provider unavailable" });
    }

    const data = await response.json();
    const premier = data.ranks?.premier;

    if (premier == null || premier <= 0) {
      return res.status(404).json({ error: "Rank not available for this player" });
    }

    return res.status(200).json({
      rank: String(premier),
      name: data.name,
    });
  } catch {
    return res.status(500).json({ error: "API request failed" });
  }
}
