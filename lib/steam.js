const STEAM64_BASE = 76561197960265728n;

export function parseSteamId(input) {
  const value = String(input ?? "").trim();

  if (/^\d{17}$/.test(value)) {
    return {
      steam64: value,
      steam32: String(BigInt(value) - STEAM64_BASE),
    };
  }

  if (/^\d{1,10}$/.test(value)) {
    return {
      steam32: value,
      steam64: String(BigInt(value) + STEAM64_BASE),
    };
  }

  return null;
}
