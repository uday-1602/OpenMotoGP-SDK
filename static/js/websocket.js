/* ══════════════════════════════════════════════════════════
   websocket.js — WebSocket connection manager
   Connects to the FastAPI telemetry stream, dispatches
   payload data to Leaderboard, Animator, and CircuitLoader.
   Depends on: circuit.js, animator.js, leaderboard.js
   ══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const WS_URL          = "ws://127.0.0.1:8080/ws/telemetry";
  const RECONNECT_DELAY = 3000;

  /* ── Status dot ─────────────────────────────────────────── */
  const statusDot = document.querySelector("header .pulse-dot");

  function setStatus(state) {
    const map = {
      connecting: { bg: "bg-yellow-400", title: "Connecting…"               },
      live:       { bg: "bg-green-500",  title: "LIVE – WebSocket connected" },
      error:      { bg: "bg-red-500",    title: "Disconnected – retrying…"   },
    };
    const cfg = map[state] || map.connecting;
    if (statusDot) {
      statusDot.className = "w-3 h-3 rounded-full pulse-dot " + cfg.bg;
      statusDot.title     = cfg.title;
    }
  }

  /* ── Main update dispatcher ─────────────────────────────── */
  function updateAll(rawData) {
    // 1. Parse leaderboard & get sorted entries back
    const result = Leaderboard.update(rawData);
    if (!result) return;
    const { entries, parseTime } = result;

    // 2. Update leader lap time & live sync for animator
    const leader = entries.find((e) => Number(e.pos) === 1);
    if (leader) {
      Animator.setLeaderLapSec(parseTime(leader.last_lap_time));
    }
    if (rawData.live_sync) {
      Animator.syncLiveState(rawData.live_sync);
    }

    // 3. Sync animator rider state
    Animator.syncRiders(entries);

    // 4. Ensure SVG dots exist for all riders
    Animator.ensureDots(entries);

    // 5. Kick off animation loop (idempotent)
    Animator.start();

    // 6. Load circuit map if circuit_id is present
    if (rawData.head?.circuit_id) {
      CircuitLoader.load(rawData.head.circuit_id);
    }
  }

  /* ── WebSocket lifecycle ────────────────────────────────── */
  let ws = null;

  function connect() {
    setStatus("connecting");
    console.info("[WS] Connecting → " + WS_URL);
    ws = new WebSocket(WS_URL);

    ws.addEventListener("open",  () => {
      setStatus("live");
      console.info("[WS] Connected.");
    });

    ws.addEventListener("message", (event) => {
      try   { updateAll(JSON.parse(event.data)); }
      catch (err) { console.error("[WS] Parse error:", err); }
    });

    ws.addEventListener("close", (event) => {
      setStatus("error");
      console.warn("[WS] Closed (code=" + event.code + "). Retrying in " + RECONNECT_DELAY + "ms…");
      setTimeout(connect, RECONNECT_DELAY);
    });

    ws.addEventListener("error", () => setStatus("error"));
  }

  /* ── Boot ───────────────────────────────────────────────── */
  function boot() {
    // Initialise CircuitLoader with DOM refs
    CircuitLoader.init({
      noCircuitMsg:     document.getElementById("no-circuit-msg"),
      circuitDisplayEl: document.getElementById("circuit-display-name"),
    });
    connect();
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", boot)
    : boot();
})();
