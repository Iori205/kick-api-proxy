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

export async function fetchJson(url, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    retries = 3,
    timeoutMs = 6000,
    retryDelayMs = 400,
  } = options;

  let lastStatus = 502;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        body: body != null ? JSON.stringify(body) : undefined,
        headers: {
          Accept: "application/json",
          "User-Agent": "kick-api-proxy/1.0",
          ...(body != null ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timer);
      lastStatus = response.status;

      if (response.status === 404) {
        return { ok: false, status: 404, data: null };
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("application/json")) {
        if (attempt < retries - 1) {
          await sleep(retryDelayMs * (attempt + 1));
          continue;
        }
        return { ok: false, status: response.status || 502, data: null };
      }

      return {
        ok: true,
        status: response.status,
        data: await response.json(),
      };
    } catch {
      clearTimeout(timer);
      if (attempt < retries - 1) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
    }
  }

  return { ok: false, status: lastStatus, data: null };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
