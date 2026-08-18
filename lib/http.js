export function withApi(handler) {
  return async function apiHandler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      return await handler(req, res);
    } catch {
      return res.status(500).json({ error: "API request failed" });
    }
  };
}
