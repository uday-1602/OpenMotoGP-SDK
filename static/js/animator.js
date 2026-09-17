/* ══════════════════════════════════════════════════════════
   animator.js — 60fps SVG rider dot animation engine
   Dead-reckoning algorithm:
     leaderPhase advances at 1 full lap / leaderLapSec seconds.
     Each rider's phase = leaderPhase − (gapSec / leaderLapSec).
     getPointAtLength(phase × trackLength) gives the SVG x,y.
   Depends on: circuit.js (CircuitLoader)
   Exports (on window): window.Animator
   ══════════════════════════════════════════════════════════ */

const Animator = (function () {
  "use strict";

  /* ── Animation state & Reload Persistence ──────────────── */
  const savedPhase = parseFloat(sessionStorage.getItem("motogp_leader_phase"));
  const savedTs    = parseFloat(sessionStorage.getItem("motogp_phase_ts"));
  let leaderLapSec  = 91.0;
  let leaderPhase   = 0.0;

  // If page was just reloaded, restore phase plus elapsed seconds so riders DO NOT jump to start!
  if (!isNaN(savedPhase) && !isNaN(savedTs)) {
    const elapsed = Math.max(0, (Date.now() - savedTs) / 1000);
    leaderPhase = (savedPhase + elapsed / leaderLapSec) % 1.0;
  }

  let lastAnimTs    = 0;
  let lastSavedTs   = 0;
  let started       = false;
  let hasReceivedSync = false;

  /* ── TV Broadcast Delay Offset (persisted in localStorage) ── */
  let syncOffsetSec = parseFloat(localStorage.getItem("motogp_sync_offset") || "0");

  /* Per-rider state: riderId → { gapSec, onPit, isOut } */
  const riderState = {};

  /* ── SVG rider dot layer ───────────────────────────────── */
  const getRiderLayer = () => document.getElementById("rider-layer");

  /* ── Rider state sync (called from leaderboard engine) ─── */
  function syncRiders(entries) {
    entries.forEach((e) => {
      riderState[String(e.rider_id)] = {
        gapSec : parseFloat(e.gap_first) || 0,
        onPit  : !!e.on_pit,
        isOut  : Number(e.pos) <= 0,
        color  : e.color ? "#" + e.color : "#ffffff",
        number : e.rider_number ?? e.rider?.legacy_id ?? "?",
      };
    });
  }

  /* ── Ensure every rider has an SVG <g> element ─────────── */
  function ensureDots(entries) {
    const layer = getRiderLayer();
    if (!layer) return;
    const NS = "http://www.w3.org/2000/svg";

    entries.forEach((e) => {
      const riderId = String(e.rider_id);
      const color   = e.color ? "#" + e.color : "#ffffff";
      const number  = String(e.rider_number ?? e.rider?.legacy_id ?? "?");

      if (document.getElementById("rg-" + riderId)) return; // already exists

      const g = document.createElementNS(NS, "g");
      g.setAttribute("id", "rg-" + riderId);

      // Outer halo
      const halo = document.createElementNS(NS, "circle");
      halo.setAttribute("r",    "9");
      halo.setAttribute("fill", color);
      halo.setAttribute("opacity", "0.25");
      halo.setAttribute("filter", "url(#rider-glow)");

      // Core dot
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r",    "5");
      dot.setAttribute("fill", color);
      dot.setAttribute("filter", "url(#rider-glow)");

      // Rider number label
      const label = document.createElementNS(NS, "text");
      label.setAttribute("x",           "8");
      label.setAttribute("y",           "4");
      label.setAttribute("font-size",   "8");
      label.setAttribute("fill",        "#fff");
      label.setAttribute("font-family", "JetBrains Mono, monospace");
      label.setAttribute("font-weight", "700");
      label.textContent = number;

      g.appendChild(halo);
      g.appendChild(dot);
      g.appendChild(label);
      layer.appendChild(g);
    });
  }

  /* ── Update leader lap time ──────────────────────────── */
  function setLeaderLapSec(sec) {
    if (sec && sec > 60) leaderLapSec = sec;
  }

  /* ── Curvature Physics Engine ──────────────────────────── */
  let speedLUT = null;
  let lastTrackEl = null;

  function generateSpeedLUT(trackEl, trackLength) {
    const numSamples = 600; // Even higher resolution
    const step = trackLength / numSamples;
    const points = [];
    for (let i = 0; i <= numSamples; i++) {
      points.push(trackEl.getPointAtLength(i * step));
    }

    // 1. Raw corner minimum speeds using True Radius of Curvature (V ∝ √R)
    const rawSpeeds = [];
    for (let i = 0; i < numSamples; i++) {
      const pPrev = points[i === 0 ? numSamples - 1 : i - 1];
      const pCurr = points[i];
      const pNext = points[(i + 1) % numSamples];

      const a1 = Math.atan2(pCurr.y - pPrev.y, pCurr.x - pPrev.x);
      const a2 = Math.atan2(pNext.y - pCurr.y, pNext.x - pCurr.x);
      let angleDiff = Math.abs(a2 - a1);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

      // Calculate radius of curvature (R = ds / dTheta)
      const radius = angleDiff > 0.001 ? (step / angleDiff) : 10000;
      
      // Physics: Max cornering speed is proportional to the square root of the radius.
      const rawSpeed = 0.08 * Math.sqrt(radius);
      const speed = Math.max(0.08, Math.min(1.0, rawSpeed)); 
      
      rawSpeeds.push(speed);
    }

    // 2. Physics Pass: Look-ahead braking & acceleration
    const finalSpeeds = [...rawSpeeds];
    // MotoGP bikes have insane acceleration and braking. 
    // They brake extremely late and hard, and hit top speed quickly.
    const maxDecel = 0.045; // Hard, late braking
    const maxAccel = 0.035; // Fierce acceleration

    // Braking pass (propagate slow speeds backwards so they brake before the corner)
    for (let pass = 0; pass < 2; pass++) {
      for (let i = numSamples - 1; i >= 0; i--) {
        const next = (i + 1) % numSamples;
        finalSpeeds[i] = Math.min(finalSpeeds[i], finalSpeeds[next] + maxDecel);
      }
    }

    // Acceleration pass (propagate slow speeds forwards so they drive out of the corner)
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < numSamples; i++) {
        const prev = i === 0 ? numSamples - 1 : i - 1;
        finalSpeeds[i] = Math.min(finalSpeeds[i], finalSpeeds[prev] + maxAccel);
      }
    }

    // 3. Integrate dt = ds / v to get cumulative time
    let totalTime = 0;
    const timeMap = [0];
    for (let i = 0; i < numSamples; i++) {
      totalTime += step / finalSpeeds[i];
      timeMap.push(totalTime);
    }

    // Normalize time to 0.0 - 1.0 phase
    for (let i = 0; i <= numSamples; i++) timeMap[i] /= totalTime;

    speedLUT = { numSamples, step, timeMap };
  }

  function getDistanceForPhase(phase, trackLength) {
    if (!speedLUT) return phase * trackLength;

    const map = speedLUT.timeMap;
    let idx = 0;
    while (idx < speedLUT.numSamples && map[idx + 1] < phase) idx++;
    
    if (idx >= speedLUT.numSamples) return trackLength;

    const t0 = map[idx], t1 = map[idx + 1];
    const fraction = (phase - t0) / (t1 - t0);
    const d0 = idx * speedLUT.step, d1 = (idx + 1) * speedLUT.step;
    return d0 + fraction * (d1 - d0);
  }

  /* ── Main animation loop ─────────────────────────────── */
  function animate(ts) {
    requestAnimationFrame(animate);

    const trackEl     = CircuitLoader.getTrackEl();
    const trackLength = CircuitLoader.getTrackLength();
    if (!trackEl || trackLength === 0) return;

    // Generate LUT once per circuit
    if (trackEl !== lastTrackEl) {
      generateSpeedLUT(trackEl, trackLength);
      lastTrackEl = trackEl;
    }

    const dt = lastAnimTs ? Math.min((ts - lastAnimTs) / 1000, 0.1) : 0;
    lastAnimTs = ts;

    leaderPhase = (leaderPhase + dt / leaderLapSec) % 1.0;

    // Persist leaderPhase every 400ms so any reload preserves exact track position
    if (ts - lastSavedTs > 400) {
      sessionStorage.setItem("motogp_leader_phase", leaderPhase);
      sessionStorage.setItem("motogp_phase_ts", Date.now());
      lastSavedTs = ts;
    }

    Object.entries(riderState).forEach(([riderId, rd]) => {
      const g = document.getElementById("rg-" + riderId);
      if (!g) return;

      if (rd.isOut) {
        g.setAttribute("visibility", "hidden");
        return;
      }
      g.setAttribute("visibility", "visible");

      const activeCircuit = CircuitLoader.getActiveCircuit();
      if (rd.onPit && activeCircuit) {
        // Fallback pit lane positioning (since we removed our drawn box, we just use arbitrary coords or hide them)
        g.setAttribute("visibility", "hidden"); 
        return;
      }

      const gapFrac = Math.min(rd.gapSec / leaderLapSec, 0.999);
      const phase   = ((leaderPhase - gapFrac) % 1.0 + 1.0) % 1.0;
      
      // Use Physics LUT instead of linear distance
      let dist = getDistanceForPhase(phase, trackLength);
      
      // Reverse direction if circuit is anticlockwise
      if (activeCircuit && activeCircuit.direction === "anticlockwise") {
        dist = trackLength - dist;
      }
      
      const pt = trackEl.getPointAtLength(dist);
      g.setAttribute("transform", "translate(" + pt.x.toFixed(1) + "," + pt.y.toFixed(1) + ")");
    });
  }

  /* ── TV Broadcast Sync Controls ────────────────────────── */
  function updateSyncUI() {
    const display = document.getElementById("sync-offset-display");
    if (display) {
      const sign = syncOffsetSec > 0 ? "+" : "";
      display.textContent = sign + syncOffsetSec.toFixed(1) + "s";
    }
  }

  function adjustSyncOffset(delta) {
    syncOffsetSec = Math.round((syncOffsetSec + delta) * 10) / 10;
    localStorage.setItem("motogp_sync_offset", syncOffsetSec);
    updateSyncUI();

    // Immediately shift leaderPhase so dots visually move right away!
    const phaseShift = delta / leaderLapSec;
    leaderPhase = ((leaderPhase + phaseShift) % 1.0 + 1.0) % 1.0;
    sessionStorage.setItem("motogp_leader_phase", leaderPhase);
    sessionStorage.setItem("motogp_phase_ts", Date.now());
    console.info(`[Animator] Sync offset adjusted: ${syncOffsetSec}s (leaderPhase=${leaderPhase.toFixed(3)})`);
  }

  function resetSyncOffset() {
    const delta = -syncOffsetSec;
    syncOffsetSec = 0;
    localStorage.setItem("motogp_sync_offset", 0);
    updateSyncUI();

    const phaseShift = delta / leaderLapSec;
    leaderPhase = ((leaderPhase + phaseShift) % 1.0 + 1.0) % 1.0;
    sessionStorage.setItem("motogp_leader_phase", leaderPhase);
    sessionStorage.setItem("motogp_phase_ts", Date.now());
    console.info(`[Animator] Sync offset reset to 0s`);
  }

  // Turn landmarks for Misano (phase mapping)
  const MISANO_TURNS = {
    1: 0.12, 2: 0.16, 3: 0.20, 4: 0.32, 5: 0.36, 6: 0.40,
    7: 0.44, 8: 0.52, 9: 0.58, 10: 0.65, 11: 0.72, 12: 0.76,
    13: 0.80, 14: 0.88, 15: 0.93, 16: 0.98
  };

  function syncToTurn(turnNum) {
    const target = MISANO_TURNS[turnNum] ?? 0.65;
    let diff = target - leaderPhase;
    if (diff > 0.5) diff -= 1.0;
    if (diff < -0.5) diff += 1.0;
    
    // Convert phase diff to seconds
    const deltaSec = diff * leaderLapSec;
    adjustSyncOffset(deltaSec);
    console.info(`[Animator] Synced leader to Turn ${turnNum} (phase=${target})`);
  }

  function initSyncControls() {
    updateSyncUI();
    const btnSub5 = document.getElementById("btn-sync-sub-5");
    const btnSub1 = document.getElementById("btn-sync-sub-1");
    const btnAdd1 = document.getElementById("btn-sync-add-1");
    const btnAdd5 = document.getElementById("btn-sync-add-5");
    const btnReset = document.getElementById("btn-sync-reset");
    const btnT10   = document.getElementById("btn-sync-t10");

    if (btnSub5) btnSub5.onclick = (e) => { e.preventDefault(); adjustSyncOffset(-5); };
    if (btnSub1) btnSub1.onclick = (e) => { e.preventDefault(); adjustSyncOffset(-1); };
    if (btnAdd1) btnAdd1.onclick = (e) => { e.preventDefault(); adjustSyncOffset(1); };
    if (btnAdd5) btnAdd5.onclick = (e) => { e.preventDefault(); adjustSyncOffset(5); };
    if (btnReset) btnReset.onclick = (e) => { e.preventDefault(); resetSyncOffset(); };
    if (btnT10)   btnT10.onclick   = (e) => { e.preventDefault(); syncToTurn(10); };
  }

  // Ensure controls are hooked up immediately on script execution & DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSyncControls);
  } else {
    initSyncControls();
  }

  /* ── Live Telemetry Synchronization ───────────────────── */
  function syncLiveState(liveSync) {
    if (!liveSync) return;
    if (liveSync.leader_lap_sec && liveSync.leader_lap_sec > 45) {
      leaderLapSec = liveSync.leader_lap_sec;
    }

    // Target phase in current lap + user broadcast delay offset
    const offsetPhase = syncOffsetSec / leaderLapSec;
    const targetPhase = ((liveSync.leader_phase + offsetPhase) % 1.0 + 1.0) % 1.0;

    if (!hasReceivedSync && isNaN(savedPhase)) {
      // First boot with no saved state: snap directly to target phase
      leaderPhase = targetPhase;
      hasReceivedSync = true;
    } else {
      hasReceivedSync = true;
      // Drift compensation: gently pull towards live telemetry target
      let diff = targetPhase - leaderPhase;
      if (diff > 0.5) diff -= 1.0;
      if (diff < -0.5) diff += 1.0;

      // Smooth error correction
      if (Math.abs(diff) > 0.005) {
        leaderPhase = (leaderPhase + diff * 0.08) % 1.0;
        if (leaderPhase < 0) leaderPhase += 1.0;
      }
    }
  }

  /* ── Start (idempotent) ──────────────────────────────── */
  function start() {
    if (started) return;
    started = true;
    initSyncControls();
    requestAnimationFrame(animate);
  }

  return { syncRiders, ensureDots, setLeaderLapSec, syncLiveState, adjustSyncOffset, resetSyncOffset, syncToTurn, start };
})();

window.Animator = Animator;
