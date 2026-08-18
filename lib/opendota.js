import { fetchJson } from "./http.js";

const OPENDOTA_API = "https://api.opendota.com/api/players";
const STRATZ_API = "https://api.stratz.com/graphql";

const STRATZ_QUERY = `
  query PlayerRank($id: Long!) {
    player(steamAccountId: $id) {
      steamAccount {
        name
        seasonRank
        seasonLeaderboardRank
      }
    }
  }
`;

export async function fetchDotaProfile(steam32) {
  const apiKey = process.env.OPENDOTA_API_KEY;
  const url = apiKey
    ? `${OPENDOTA_API}/${steam32}?api_key=${encodeURIComponent(apiKey)}`
    : `${OPENDOTA_API}/${steam32}`;

  const result = await fetchJson(url, {
    retries: 2,
    timeoutMs: 3000,
    retryDelayMs: 200,
  });

  if (result.ok) {
    return { data: normalizeOpenDota(result.data), status: 200 };
  }

  if (result.status === 404) {
    return { data: null, status: 404 };
  }

  const stratz = await fetchFromStratz(steam32);
  if (stratz) {
    return { data: stratz, status: 200 };
  }

  return { data: null, status: result.status || 502 };
}

async function fetchFromStratz(steam32) {
  const apiKey = process.env.STRATZ_API_KEY;
  if (!apiKey) {
    return null;
  }

  const result = await fetchJson(STRATZ_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      query: STRATZ_QUERY,
      variables: { id: Number(steam32) },
    },
    retries: 1,
    timeoutMs: 2500,
  });

  if (!result.ok) {
    return null;
  }

  const account = result.data?.data?.player?.steamAccount;
  if (!account?.seasonRank) {
    return null;
  }

  return {
    rank_tier: account.seasonRank,
    leaderboard_rank: account.seasonLeaderboardRank ?? null,
    solo_competitive_rank: null,
    competitive_rank: null,
    mmr_estimate: null,
    profile: { personaname: account.name ?? null },
  };
}

function normalizeOpenDota(data) {
  return {
    rank_tier: data.rank_tier,
    leaderboard_rank: data.leaderboard_rank,
    solo_competitive_rank: data.solo_competitive_rank,
    competitive_rank: data.competitive_rank,
    mmr_estimate: data.mmr_estimate,
    profile: data.profile,
  };
}
