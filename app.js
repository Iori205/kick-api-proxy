const state = { game: "cs" };
const $ = (selector) => document.querySelector(selector);

const tabs = document.querySelectorAll(".game-tab");
tabs.forEach((tab) => tab.addEventListener("click", () => {
  state.game = tab.dataset.game;
  tabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", String(active));
  });
}));

function showOnly(id) {
  ["empty-state", "loading", "error", "profile-card"].forEach((name) => $("#" + name).classList.toggle("hidden", name !== id));
}

function stat(label, value) {
  return `<div class="stat"><div class="stat-label">${label}</div><div class="stat-value">${value ?? "—"}</div></div>`;
}

function safe(value) {
  return String(value ?? "—").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function apiBase() {
  return "";
}

async function getJson(path) {
  const response = await fetch(`${apiBase()}${path}`, {
    headers: { Accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Player data could not be found");
  }
  return data;
}

$("#lookup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const steamid = $("#steamid").value.trim();
  if (!steamid) return;
  $(".search-button").disabled = true;
  showOnly("loading");

  try {
    const endpoint = `/api/${state.game === "dota" ? "mmr" : "rank"}?steamid=${encodeURIComponent(steamid)}`;
    let data;
    let faceit = null;

    if (state.game === "cs") {
      const results = await Promise.allSettled([
        getJson(endpoint),
        getJson(`/api/faceit?steamid=${encodeURIComponent(steamid)}`),
      ]);
      data = results[0].status === "fulfilled" ? results[0].value : null;
      faceit = results[1].status === "fulfilled" ? results[1].value : null;

      if (!data && !faceit) {
        throw new Error("Premier болон FACEIT level олдсонгүй");
      }
    } else {
      data = await getJson(endpoint);
    }

    const name = data?.name || faceit?.name || "Steam player";
    $("#avatar").textContent = name.charAt(0).toUpperCase();
    $("#player-name").textContent = name;
    $("#player-id").textContent = `Steam ID: ${steamid}`;
    $("#result-game").textContent = state.game === "dota" ? "DOTA 2 PROFILE" : "COUNTER-STRIKE PROFILE";
    if (state.game === "dota") {
      $("#stats-grid").innerHTML = stat("Medal", safe(data.rank)) + stat("MMR", safe(data.mmr)) + stat("Player", safe(name));
    } else {
      const cards = [];
      if (data?.rank) cards.push(stat("Premier rating", safe(data.rank)));
      if (faceit?.rank) cards.push(stat("FACEIT level", safe(faceit.rank)));
      cards.push(stat("Player", safe(name)));
      $("#stats-grid").innerHTML = cards.join("");
    }
    showOnly("profile-card");
  } catch (error) {
    $("#error").textContent = error.message;
    showOnly("error");
  } finally {
    $(".search-button").disabled = false;
  }
});
