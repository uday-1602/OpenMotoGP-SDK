/* ══════════════════════════════════════════════════════════
   leaderboard.js — Leaderboard table renderer
   Parses the PulseLive livetiming-lite WebSocket payload and
   renders the classified leaderboard HTML table rows.
   Depends on: nothing (pure DOM)
   Exports (on window): window.Leaderboard
   ══════════════════════════════════════════════════════════ */

const Leaderboard = (function () {
  "use strict";

  /* ── DOM references ────────────────────────────────────── */
  const _tbody     = () => document.querySelector("#leaderboard-table tbody");
  const _lapBadge  = () => document.querySelector("#leaderboard-table")
                            ?.closest("section")
                            ?.querySelector("span.font-label-caps");
  const _headerEl      = () => document.querySelector("header div.font-label-caps");
  const _sessionBadge  = () => document.getElementById("session-status-badge");

  /* ── Utilities ─────────────────────────────────────────── */

  /** Parse "1'47.792" → 107.792 seconds. Returns null on failure. */
  function parseTime(t) {
    if (!t || typeof t !== "string") return null;
    const m = t.match(/^(\d+)'(\d+\.\d+)$/);
    return m ? parseInt(m[1], 10) * 60 + parseFloat(m[2]) : null;
  }

  /** Build tyre badge HTML for one compound code (S / M / H). */
  function tyreBadge(code) {
    const map = {
      S: { border: "border-red-500",    bg: "bg-red-500/20",    text: "text-red-500"    },
      M: { border: "border-yellow-500", bg: "bg-yellow-500/20", text: "text-yellow-500" },
      H: { border: "border-white/50",   bg: "bg-white/10",      text: "text-white"      },
    };
    const c = map[code] || map["H"];
    return (
      '<span class="w-4 h-4 rounded-sm border ' + c.border + " " + c.bg +
      ' text-[10px] flex items-center justify-center ' + c.text + '">' + code + "</span>"
    );
  }

  const RIDER_NUMBERS = {
    // Ducati Lenovo Team (Red)
    "1":  "static/numbers/num_63.png",  // Bagnaia #1 / #63
    "63": "static/numbers/num_63.png",  // Francesco Bagnaia
    "93": "static/numbers/num_93.png",  // Marc Marquez

    // Aprilia Racing (Black)
    "72": "static/numbers/num_72.png",  // Marco Bezzecchi
    "89": "static/numbers/num_89.png",  // Jorge Martin

    // BK8 Gresini Racing (Light Blue)
    "73": "static/numbers/num_73.png",  // Alex Marquez
    "54": "static/numbers/num_54.png",  // Fermin Aldeguer

    // Red Bull KTM Factory (Orange)
    "37": "static/numbers/num_37.png",  // Pedro Acosta
    "31": "static/numbers/num_37.png",  // Pedro Acosta (alt)
    "33": "static/numbers/num_33.png",  // Brad Binder

    // Tech3 KTM (Orange)
    "12": "static/numbers/num_12.png",  // Maverick Viñales
    "23": "static/numbers/num_23.png",  // Enea Bastianini

    // Trackhouse Racing (Blue & Yellow)
    "25": "static/numbers/num_25.png",  // Raul Fernandez
    "79": "static/numbers/num_79.png",  // Ai Ogura

    // Monster Energy Yamaha (Blue)
    "20": "static/numbers/num_20.png",  // Fabio Quartararo
    "42": "static/numbers/num_42.png",  // Alex Rins

    // Pramac Yamaha (Purple)
    "7":  "static/numbers/num_7.png",   // Toprak Razgatlioglu
    "07": "static/numbers/num_7.png",
    "43": "static/numbers/num_43.png",  // Jack Miller

    // VR46 Racing (Fluo Yellow)
    "49": "static/numbers/num_49.png",  // Fabio Di Giannantonio
    "21": "static/numbers/num_21.png",  // Franco Morbidelli

    // Honda HRC Factory (Red / Orange)
    "10": "static/numbers/num_10.png",  // Luca Marini
    "36": "static/numbers/num_36.png",  // Joan Mir

    // LCR Honda (Green / White)
    "5":  "static/numbers/num_5.png",   // Johann Zarco
    "05": "static/numbers/num_5.png",
    "11": "static/numbers/num_11.png",  // Diogo Moreira
  };

  const RIDER_STYLES = {
    // Ducati Lenovo (Red)
    "1":  { team: "#cc0000", teamName: "Ducati Lenovo Team", num: "color: #fff; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 1px #cc0000; text-shadow: 2px 2px 0px #000;" },
    "63": { team: "#cc0000", teamName: "Ducati Lenovo Team", num: "color: #1a1a1a; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1.5px #cc0000; text-shadow: 1px 1px 0px #fff;" },
    "93": { team: "#cc0000", teamName: "Ducati Lenovo Team", num: "color: #e50014; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 1px #fff; font-style: italic; font-weight: 900;" },

    // Aprilia Racing (Black / Red)
    "72": { team: "#cc0000", teamName: "Aprilia Racing", num: "color: #ff6600; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 1px #000;" },
    "89": { team: "#6c00ff", teamName: "Aprilia Racing", num: "color: #fff; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1.5px #6c00ff; text-shadow: 1px 1px 0px #000;" },

    // Gresini Racing (Light Blue)
    "73": { team: "#89b4e6", teamName: "BK8 Gresini Racing", num: "color: #2b5497; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1px #fff;" },
    "54": { team: "#89b4e6", teamName: "BK8 Gresini Racing", num: "color: #f7e000; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1px #000;" },

    // KTM Factory (Orange)
    "37": { team: "#ff6600", teamName: "Red Bull KTM Factory", num: "color: #fff; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 1.5px #ff6600;" },
    "31": { team: "#ff6600", teamName: "Red Bull KTM Factory", num: "color: #fff; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 1.5px #ff6600;" },
    "33": { team: "#ff6600", teamName: "Red Bull KTM Factory", num: "color: #fff; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 1px #ff6600; text-shadow: 1px 1px 0px #000;" },

    // Tech3 KTM (Orange / Black)
    "12": { team: "#ff6600", teamName: "Tech3 KTM", num: "color: #e50014; font-family: 'Impact', sans-serif; text-shadow: 1px 1px 0px #fff;" },
    "23": { team: "#ff6600", teamName: "Tech3 KTM", num: "color: #f70094; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1px #fff;" },

    // Trackhouse Racing (Blue & Yellow)
    "25": { team: "#002868", teamName: "Trackhouse Racing", num: "color: #fff; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 1.5px #002868;" },
    "79": { team: "#002868", teamName: "Trackhouse Racing", num: "color: #0099ff; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1px #fff;" },

    // Yamaha Factory (Blue)
    "20": { team: "#002f6c", teamName: "Monster Energy Yamaha", num: "color: #e50014; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1px #002f6c; font-style: italic;" },
    "42": { team: "#002f6c", teamName: "Monster Energy Yamaha", num: "color: #d1d5db; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1.5px #e50014;" },

    // Pramac Yamaha (Purple / Blue)
    "7":  { team: "#5b2c86", teamName: "Pramac Yamaha", num: "color: #e50014; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1px #fff;" },
    "07": { team: "#5b2c86", teamName: "Pramac Yamaha", num: "color: #e50014; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1px #fff;" },
    "43": { team: "#5b2c86", teamName: "Pramac Yamaha", num: "color: #002f6c; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 1.5px #fff;" },

    // VR46 Racing (Fluo Yellow)
    "49": { team: "#e4f000", teamName: "Pertamina Enduro VR46", num: "color: #1a1a1a; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1px #e4f000;" },
    "21": { team: "#e4f000", teamName: "Pertamina Enduro VR46", num: "color: #00e676; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 1px #000;" },

    // Honda Factory (Red / Orange)
    "10": { team: "#ff4d00", teamName: "Honda HRC Castrol", num: "color: #ff4d00; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 1px #fff;" },
    "36": { team: "#ff4d00", teamName: "Honda HRC Castrol", num: "color: #e6ff00; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1px #002f6c;" },

    // LCR Honda (Green / White)
    "5":  { team: "#007a3d", teamName: "LCR Honda", num: "color: #fff; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 1px #007a3d;" },
    "05": { team: "#007a3d", teamName: "LCR Honda", num: "color: #fff; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 1px #007a3d;" },
    "11": { team: "#007a3d", teamName: "LCR Honda", num: "color: #e6ff00; font-family: 'Impact', sans-serif; -webkit-text-stroke: 1px #000;" },

    "default": { team: "#666666", teamName: "Independent", num: "color: #fff; font-weight: bold; font-family: 'JetBrains Mono', monospace;" }
  };

  /** Build one table <tr> for a classification entry. */
  function buildRow(entry, isLeader) {
    let pos   = entry.pos ?? entry.position ?? entry.order ?? "--";
    let isOut = false;

    if (Number(pos) <= 0) {
      pos   = entry.status_name || "OUT";
      isOut = true;
    }

    const numStr = String(entry.rider_number ?? entry.rider?.legacy_id ?? entry.number ?? "--");
    const styleData = RIDER_STYLES[numStr] || RIDER_STYLES["default"];

    let name = entry.rider_shortname
      ?? (entry.rider_name && entry.rider_surname
          ? entry.rider_name[0] + ". " + entry.rider_surname
          : null)
      ?? entry.rider?.full_name ?? entry.name ?? "UNKNOWN";
    name = name.toUpperCase();

    let gap = entry.gap_first ?? entry.gap ?? entry.gap_to_leader ?? null;
    if (isOut) {
      gap = entry.status_name || "DNF";
    } else if (pos == 1 || isLeader || gap === "0.000" || gap === "0") {
      gap = "LEADER";
    } else if (gap && !gap.startsWith("+") && !isNaN(parseFloat(gap))) {
      gap = "+" + gap;
    } else if (!gap) {
      gap = entry.time ?? entry.status_name ?? "--";
    }

    const ft      = entry.front_tyre ?? entry.tyre_front;
    const rt      = entry.rear_tyre  ?? entry.tyre_rear;
    const tyreHtml = (ft && rt)
      ? tyreBadge(ft) + tyreBadge(rt)
      : '<span class="text-tertiary text-[10px] opacity-60">N/A</span>';

    // 2026 Hover styling mapped to team color
    const baseColor = entry.color ? "#" + entry.color : styleData.team;
    const colorStyle = 'style="border-left-color: ' + baseColor + ';"';

    const posCls = (pos == 1 || isLeader) ? "text-primary-container font-bold text-lg"
                 : isOut                  ? "text-tertiary opacity-60"
                 : "font-semibold";
    const gapCls = (pos == 1 || isLeader) ? "text-secondary-container font-bold font-data-md"
                 : isOut                  ? "text-tertiary opacity-60"
                 : "font-data-md";
    const rowCls = isOut ? "opacity-40 grayscale" : "hover:bg-white/5 transition-all duration-200 ease-out";

    // Render the high-precision extracted rider number graphic directly
    let numGraphic = `<span style="${styleData.num}">${numStr}</span>`;
    const numUrl = RIDER_NUMBERS[numStr];
    if (numUrl) {
      numGraphic = `
        <div class="inline-flex items-center justify-center">
           <img src="${numUrl}" 
                class="h-7 w-auto max-w-[56px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] transition-transform duration-200 hover:scale-125 cursor-pointer" 
                alt="#${numStr}" 
                title="${name} #${numStr}">
        </div>
      `;
    }

    return (
      '<tr class="table-row-hover border-b border-white/5 cursor-pointer border-l-[3px] border-transparent ' +
      rowCls + '" ' + colorStyle + ">" +
      '<td class="py-3 px-4 ' + posCls + '">' + pos + "</td>" +
      '<td class="py-3 px-2 text-center text-base">' + numGraphic + "</td>" +
      '<td class="py-3 px-4 font-bold tracking-wider text-sm" style="font-family: \'Syncopate\', sans-serif;">' + name + "</td>" +
      '<td class="py-3 px-4 text-right ' + gapCls + '">' + gap + "</td>" +
      '<td class="py-3 px-4 text-center"><div class="flex justify-center gap-1">' +
      tyreHtml + "</div></td></tr>"
    );
  }

  /* ── Payload normaliser ────────────────────────────────── */
  function extractEntries(data) {
    if (!data) return null;
    if (Array.isArray(data))                              return data;
    if (Array.isArray(data.classification))              return data.classification;
    if (Array.isArray(data.riders))                      return data.riders;
    if (Array.isArray(data.timingData?.classification))  return data.timingData.classification;
    if (data.rider  && typeof data.rider  === "object")  return Object.values(data.rider);
    if (data.riders && typeof data.riders === "object")  return Object.values(data.riders);
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key]) && data[key].length > 0) return data[key];
    }
    return null;
  }

  /* ── Public: full update from a raw WS payload ─────────── */
  function update(rawData) {
    const entries = extractEntries(rawData);
    if (!entries || entries.length === 0) {
      console.warn("[Leaderboard] No entries in payload.", rawData);
      return null;
    }

    // Sort: classified by position, DNF to bottom
    entries.sort((a, b) => {
      let pA = Number(a.pos ?? a.position ?? a.order ?? 999);
      let pB = Number(b.pos ?? b.position ?? b.order ?? 999);
      if (pA <= 0) pA = 999;
      if (pB <= 0) pB = 999;
      return pA - pB;
    });

    // Render rows
    const tbody = _tbody();
    if (tbody) tbody.innerHTML = entries.map((e, i) => buildRow(e, i === 0)).join("");

    // Update lap counter
    const first    = entries[0];
    const lap      = first?.num_lap ?? first?.last_lap ?? rawData?.head?.lap;
    const totalLap = rawData?.head?.num_laps ?? rawData?.total_laps;
    const badge    = _lapBadge();
    if (lap && badge) badge.textContent = "L " + lap + (totalLap ? "/" + totalLap : "");

    // Update header event name
    if (rawData.head) {
      const h         = rawData.head;
      const headerEl  = _headerEl();
      const sessionEl = _sessionBadge();

      if (headerEl && h.event_tv_name) {
        headerEl.textContent = h.event_tv_name.toUpperCase() + " · " + (h.category || "MOTOGP");
      }
      if (sessionEl && h.session_status_name) {
        const s = h.session_status_name;
        sessionEl.textContent = s === "F" ? "FINISHED" : s === "L" ? "LIVE" : s;
        sessionEl.className = [
          "font-label-caps text-label-caps text-xs px-2 py-1 rounded",
          s === "F"
            ? "bg-tertiary-container/20 text-tertiary"
            : "bg-primary-container/20 text-primary-container animate-pulse",
        ].join(" ");
      }
    }

    return { entries, parseTime };
  }

  return { update, extractEntries, parseTime };
})();

window.Leaderboard = Leaderboard;
