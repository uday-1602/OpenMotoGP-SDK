/* ══════════════════════════════════════════════════════════
   circuit.js — Circuit map loader
   Fetches SVG path data from the FastAPI backend REST endpoint
   and injects it into the live SVG canvas.
   Depends on: nothing (pure DOM + fetch)
   Exports (on window): window.CircuitLoader
   ══════════════════════════════════════════════════════════ */

const CircuitLoader = (function () {
  "use strict";

  const BACKEND_URL  = "http://127.0.0.1:8080";
  const CIRCUIT_CACHE = {};

  // Module-level references — set from outside via init()
  let _activeCircuit  = null;
  let _trackEl        = null;
  let _trackLength    = 0;
  let _noCircuitMsg   = null;
  let _circuitNameEl  = null;

  /* ── DOM element references ────────────────────────────── */
  const _bgImgEl = () => document.getElementById("circuit-bg-img");
  const _svgEl   = () => document.getElementById("circuit-svg");
  const _pathEl  = () => document.getElementById("track-path");

  /* ── Public API ───────────────────────────────────────── */
  function init({ noCircuitMsg, circuitDisplayEl }) {
    _noCircuitMsg  = noCircuitMsg;
    _circuitNameEl = circuitDisplayEl;
  }

  async function load(circuitId) {
    const cid = String(circuitId);

    // Cache hit: already fetched this circuit
    if (!CIRCUIT_CACHE[cid]) {
      try {
        const res = await fetch(BACKEND_URL + "/circuit/" + cid);
        if (!res.ok) throw new Error("Circuit " + cid + " not found in registry (HTTP " + res.status + ")");
        CIRCUIT_CACHE[cid] = await res.json();
      } catch (err) {
        console.error("[CircuitLoader]", err);
        if (_noCircuitMsg) _noCircuitMsg.classList.remove("hidden");
        return;
      }
    }

    const circuit = CIRCUIT_CACHE[cid];
    if (_noCircuitMsg) _noCircuitMsg.classList.add("hidden");

    // Nothing to do if this circuit is already rendered
    if (_activeCircuit && _activeCircuit.name === circuit.name) return;
    _activeCircuit = circuit;

    // Inject into DOM
    const bgImgEl = _bgImgEl();
    const svgEl   = _svgEl();
    const pathEl  = _pathEl();
    if (!svgEl || !pathEl || !bgImgEl) return;

    if (circuit.image_url) {
      bgImgEl.src = BACKEND_URL + circuit.image_url;
      bgImgEl.classList.remove("hidden");
    }

    svgEl.setAttribute("viewBox", circuit.viewBox);
    pathEl.setAttribute("d", circuit.path);

    // getTotalLength() needs a rendered element
    requestAnimationFrame(() => {
      _trackEl     = pathEl;
      _trackLength = pathEl.getTotalLength();
      
      console.info(
        "[CircuitLoader] Loaded: " + circuit.name +
        " | path length: " + _trackLength.toFixed(0) + "px"
      );
    });

    if (_circuitNameEl) _circuitNameEl.textContent = circuit.name.toUpperCase();
  }

  /* Getters used by the animation engine */
  function getActiveCircuit() { return _activeCircuit; }
  function getTrackEl()       { return _trackEl;       }
  function getTrackLength()   { return _trackLength;   }

  return { init, load, getActiveCircuit, getTrackEl, getTrackLength };
})();

window.CircuitLoader = CircuitLoader;
