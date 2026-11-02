/* Dashboard de una página por curso (1240 x 958 px lógicos). Porte de
   page() del generador de referencia: mismas medidas y colores.
   Entrada: {nombre, corte, convocatoria, m, prev, nps, usaNps, logoSrc, uclxSrc, santSrc}
   m / prev: métricas {insc,beca,plat,falta,act,inact,b1..b4,fin}; prev puede ser null.
   nps: {promotores,pasivos,detractores} o null. */
(function(root, factory){
  if(typeof module === "object" && module.exports) module.exports = factory(require("./metricas.js"));
  else root.ReporteDashboard = factory(root.ReporteMetricas);
})(typeof self !== "undefined" ? self : this, function(M){

  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmt = n => Number(n).toLocaleString("en-US");
  const SHADOW = "box-shadow:0 4px 16px rgba(30,20,80,0.06);";
  const CHIP_BASE = "display:inline-block;font-size:12px;font-weight:700;padding:2px 9px;border-radius:10px;white-space:nowrap;";

  // Dona con SVG (dos círculos con stroke-dasharray, color fijo; nada de conic-gradient).
  function ring(p, size, th, col, track){
    const r = (size - th) / 2, c = 2 * 3.14159265 * r, f = c * p / 100;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '" style="position:absolute;inset:0;">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + track + '" stroke-width="' + th + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="' + th + '" stroke-dasharray="' + f.toFixed(2) + " " + (c - f).toFixed(2) + '" transform="rotate(-90 ' + size / 2 + " " + size / 2 + ')"/></svg>';
  }

  // d: {tipo, subio, texto} de ReporteMetricas.chip*, o null
  function chipHtml(d, dark){
    if(!d) return "";
    let bg, c;
    if(d.tipo === "igual"){
      bg = dark ? "rgba(255,255,255,0.16)" : "#efedf7"; c = dark ? "#fff" : "#8a85a2";
    } else if(d.tipo === "gris"){
      bg = dark ? "rgba(255,255,255,0.16)" : "#efedf7"; c = dark ? "#fff" : "#6b6685";
    } else if(d.tipo === "verde"){
      bg = dark ? "rgba(255,255,255,0.16)" : "#e4f6ee"; c = dark ? "#8ff0c0" : "#17835a";
    } else {
      bg = dark ? "rgba(255,255,255,0.16)" : "#fde8ec"; c = dark ? "#ffa3b3" : "#c23a56";
    }
    const flecha = d.tipo === "igual" ? "" : (d.subio ? "▲ " : "▼ ");
    return '<span style="' + CHIP_BASE + "background:" + bg + ";color:" + c + ';">' + flecha + esc(d.texto) + "</span>";
  }
  const chip = (cur, prev, good, dark) => chipHtml(M.chipConteo(cur, prev, good || "up"), dark);

  function fila(label, n, act, prevN){
    const p = M.pct(n, act), w = act ? 100 * n / act : 0;
    return '<div style="display:grid;grid-template-columns:190px 1fr 96px 150px;align-items:center;gap:16px;">' +
      '<div style="font-size:13px;font-weight:600;color:#3a3560;letter-spacing:0.2px;">' + label + "</div>" +
      '<div style="height:14px;background:#e9e7f3;border-radius:7px;overflow:hidden;"><div style="height:100%;width:' + w.toFixed(2) + '%;background:#6b46f0;border-radius:7px;"></div></div>' +
      '<div style="font-size:14px;color:#3a3560;text-align:right;white-space:nowrap;">' + fmt(n) + ' · <span style="font-weight:800;color:#1a1454;">' + p + "%</span></div>" +
      '<div style="text-align:right;">' + chip(n, prevN, "neutral") + "</div></div>";
  }

  function tarjetaNps(nps){
    const box = "flex:1;background:#fff;border-radius:18px;padding:24px 26px;" + SHADOW + "display:flex;flex-direction:column;justify-content:space-between;";
    const N = nps ? M.npsTotal(nps) : 0;
    if(!nps || !N){
      return '<div style="' + box + '"><div style="display:flex;justify-content:space-between;align-items:baseline;"><div style="font-size:14px;color:#585279;font-weight:500;">NPS</div></div>' +
        '<div style="font-weight:800;font-size:42px;letter-spacing:-1px;color:#c9c4e0;">—</div>' +
        '<div><div style="height:10px;background:#ece8f8;border-radius:5px;"></div><div style="font-size:12px;color:#8a85a2;margin-top:10px;font-weight:500;">Sin respuestas cargadas</div></div></div>';
    }
    const score = M.npsScore(nps);
    const pp = 100 * nps.promotores / N, ps = 100 * nps.pasivos / N, pd = 100 * nps.detractores / N;
    const dot = col => '<i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + col + ';margin-right:5px;"></i>';
    return '<div style="' + box + '"><div style="display:flex;justify-content:space-between;align-items:baseline;"><div style="font-size:14px;color:#585279;font-weight:500;">NPS</div><div style="font-size:12px;color:#8a85a2;font-weight:500;">' + fmt(N) + " respuestas</div></div>" +
      '<div style="font-weight:800;font-size:42px;letter-spacing:-1px;color:#1a1454;">' + (score >= 0 ? "+" : "") + score + "</div>" +
      '<div><div style="display:flex;height:10px;border-radius:5px;overflow:hidden;gap:2px;"><div style="width:' + pp + '%;background:#6b46f0;"></div><div style="width:' + ps + '%;background:#cfc9ee;"></div><div style="width:' + pd + '%;background:#e0566f;"></div></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:#585279;margin-top:10px;font-weight:600;"><span>' + dot("#6b46f0") + "Promotores " + Math.round(pp) + "%</span><span>" + dot("#cfc9ee") + "Pasivos " + Math.round(ps) + "%</span><span>" + dot("#e0566f") + "Detractores " + Math.round(pd) + "%</span></div></div></div>";
  }

  function pagina(d){
    const m = d.m, pv = d.prev || null;
    const g = k => (pv && pv[k] !== undefined) ? pv[k] : null;
    const conv = d.convocatoria === "FINALIZADA" ? "FINALIZADA" : "EN PROGRESO";
    const bstyle = (conv === "EN PROGRESO" ? "background:#e9f0ff;color:#3a63d8;" : "background:#ebe9f4;color:#6b6685;") +
      "font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:0.3px;";
    const pa = M.pct(m.act, m.plat), pi = 100 - pa;
    const pinact = (pv && pv.plat !== null && pv.plat !== undefined && pv.act !== null && pv.act !== undefined) ? pv.plat - pv.act : null;
    const legend = pv ? '<div style="font-size:12px;color:#8a85a2;font-weight:500;margin-top:-6px;">▲▼ Cambio contra el mes anterior: personas (pers.) y porcentaje de variación; en las tasas de terminación, personas y puntos porcentuales (pp).</div>' : "";
    const logoHtml = d.logoSrc ? '<img src="' + esc(d.logoSrc) + '" style="height:' + (d.logoAlto || 48) + 'px;width:auto;max-width:200px;object-fit:contain;flex-shrink:0;"><div style="width:1px;height:34px;background:#d8d3ef;flex-shrink:0;"></div>' : "";
    const falta = m.falta > 0 ? '<div style="font-size:12px;color:#8a85a2;margin-top:8px;font-weight:500;">' + m.falta + " por registrar en plataforma</div>" : "";
    const ts = M.tasaSantander(m), to = M.tasaOperativa(m);
    const pts = (pv && pv.fin !== null && pv.fin !== undefined) ? M.pct(pv.fin, pv.beca) : null;
    const pto = (pv && pv.fin !== null && pv.fin !== undefined) ? M.pct(pv.fin, pv.act) : null;
    const chipTermino = (r, pr) => chipHtml(M.chipTasa(m.fin, g("fin"), r, pr), true);
    const card = "background:#f4f2fb;border:1px solid #e4e0f5;border-radius:14px;padding:20px 20px;";
    const kpi = (n, l, p, pn) => '<div style="flex:1;' + card + '"><div style="font-weight:800;font-size:34px;color:#1a1454;letter-spacing:-0.5px;">' + fmt(n) + "</div>" +
      '<div style="font-size:13px;color:#6b6685;margin:5px 0 14px;font-weight:500;">' + l + "</div>" +
      '<div style="height:7px;background:#e2dcf5;border-radius:4px;overflow:hidden;"><div style="height:100%;width:' + p + '%;background:#6b46f0;border-radius:4px;"></div></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;"><div style="font-size:13px;font-weight:700;color:#6b46f0;">' + p + "%</div>" + chip(n, pn) + "</div></div>";
    const dotL = col => '<span style="width:9px;height:9px;border-radius:50%;background:' + col + ';display:inline-block;"></span>';

    return '<div class="pg" style="width:1240px;height:958px;background:#f2f1f8;font-family:\'Inter\',sans-serif;padding:48px 56px;display:flex;flex-direction:column;gap:26px;color:#171433;box-sizing:border-box;">' +
      '<div style="display:flex;align-items:center;gap:22px;padding-bottom:22px;border-bottom:1px solid #e2ddf2;">' + logoHtml +
      '<div style="flex-shrink:0;white-space:nowrap;"><div style="font-weight:800;font-size:26px;color:#1a1454;letter-spacing:-0.2px;">' + esc(d.nombre) + "</div>" +
      '<div style="font-size:13px;color:#8a85a2;margin-top:3px;font-weight:600;letter-spacing:0.5px;">Corte al ' + esc(d.corte) + "</div></div>" +
      '<div style="flex:1;"></div><img src="' + esc(d.uclxSrc) + '" style="height:26px;width:auto;"><div style="width:1px;height:26px;background:#d8d3ef;"></div><img src="' + esc(d.santSrc) + '" style="height:19px;width:auto;"></div>' +

      '<div style="display:flex;gap:22px;">' +
      '<div style="flex:1;background:#fff;border-radius:18px;padding:26px 28px;' + SHADOW + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><div style="font-weight:700;font-size:17px;">Convocatoria</div><div style="' + bstyle + '">' + conv + "</div></div>" +
      '<div style="display:flex;gap:18px;">' + kpi(m.insc, "Total Inscritos", 100, g("insc")) + kpi(m.beca, "Total Beca asignada", M.pct(m.beca, m.insc), g("beca")) + "</div></div>" +

      '<div style="flex:1;background:#fff;border-radius:18px;padding:26px 28px;' + SHADOW + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><div style="font-weight:700;font-size:17px;">Plataforma</div><div style="background:#e9f0ff;color:#3a63d8;font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:0.3px;">EN PROGRESO</div></div>' +
      '<div style="display:flex;align-items:center;gap:26px;">' +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex-shrink:0;"><div style="position:relative;width:118px;height:118px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + ring(pa, 118, 20, "#6b46f0", "#d8d3f2") +
      '<div style="position:relative;width:78px;height:78px;display:flex;flex-direction:column;align-items:center;justify-content:center;"><div style="font-weight:800;font-size:22px;color:#1a1454;letter-spacing:-0.5px;">' + fmt(m.plat) + '</div><div style="font-size:10px;color:#8a85a2;font-weight:600;">TOTAL</div></div></div>' + chip(m.plat, g("plat")) + "</div>" +
      '<div style="display:flex;flex-direction:column;gap:16px;flex-shrink:0;">' +
      '<div style="white-space:nowrap;"><div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#585279;font-weight:500;">' + dotL("#6b46f0") + 'Activos</div><div style="font-weight:800;font-size:20px;color:#1a1454;margin-left:17px;margin-top:2px;">' + pa + '% <span style="color:#8a85a2;font-weight:600;font-size:14px;">— ' + fmt(m.act) + "</span> " + chip(m.act, g("act")) + "</div></div>" +
      '<div style="white-space:nowrap;"><div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#585279;font-weight:500;">' + dotL("#d8d3f2") + 'Inactivos</div><div style="font-weight:800;font-size:20px;color:#8a85a2;margin-left:17px;margin-top:2px;">' + pi + '% <span style="color:#b2add0;font-weight:600;font-size:14px;">— ' + fmt(m.inact) + "</span> " + chip(m.inact, pinact, "down") + "</div></div>" +
      "</div></div>" + falta + "</div></div>" +

      '<div style="background:#fff;border-radius:18px;padding:26px 28px;' + SHADOW + 'flex:1;display:flex;flex-direction:column;">' +
      '<div style="font-weight:700;font-size:17px;margin-bottom:22px;">Close-up de avance</div>' +
      '<div style="display:flex;gap:24px;align-items:stretch;flex:1;">' +
      '<div style="border:1px solid #e9e6f4;background:#f9f8fd;border-radius:14px;padding:18px 26px;text-align:center;min-width:120px;display:flex;flex-direction:column;justify-content:center;"><div style="font-size:13px;color:#8a85a2;font-weight:500;">de</div><div style="font-weight:800;font-size:34px;color:#1a1454;letter-spacing:-0.5px;">' + fmt(m.act) + '</div><div style="font-size:13px;color:#8a85a2;font-weight:500;">activos</div></div>' +
      '<div style="flex:1;display:flex;flex-direction:column;gap:18px;justify-content:center;">' +
      fila("INICIANDO (1–25%)", m.b1, m.act, g("b1")) + fila("A MEDIO CAMINO (26–50%)", m.b2, m.act, g("b2")) + fila("AVANZANDO (51–79%)", m.b3, m.act, g("b3")) + fila("POR TERMINAR (80–99%)", m.b4, m.act, g("b4")) +
      "</div></div></div>" +

      '<div style="display:flex;gap:22px;">' +
      '<div style="flex:1;background:#181150;border-radius:18px;padding:24px 26px;display:flex;justify-content:space-between;align-items:center;color:#fff;box-shadow:0 4px 16px rgba(24,17,80,0.25);">' +
      '<div><div style="font-size:14px;opacity:0.8;font-weight:500;">Terminación Santander</div><div style="font-size:14px;opacity:0.8;margin-bottom:14px;font-weight:500;">vs. Becas asignadas</div><div style="display:flex;align-items:center;gap:10px;"><div style="font-weight:800;font-size:42px;letter-spacing:-1px;">' + ts + "%</div>" + chipTermino(ts, pts) + "</div>" +
      '<div style="font-size:13px;opacity:0.65;margin-top:8px;font-weight:500;">' + fmt(m.fin) + " de " + fmt(m.beca) + " becas</div></div>" +
      '<div style="position:relative;width:62px;height:62px;flex-shrink:0;">' + ring(ts, 62, 9, "#ffffff", "#3c3577") + "</div></div>" +
      '<div style="flex:1;background:linear-gradient(135deg,#8b7bf0,#6a5ce0);border-radius:18px;padding:24px 26px;display:flex;justify-content:space-between;align-items:center;color:#fff;box-shadow:0 4px 16px rgba(107,90,224,0.3);">' +
      '<div><div style="font-size:14px;opacity:0.85;font-weight:500;">Terminación Operativa</div><div style="font-size:14px;opacity:0.85;margin-bottom:14px;font-weight:500;">vs. Activos plataforma</div><div style="display:flex;align-items:center;gap:10px;"><div style="font-weight:800;font-size:42px;letter-spacing:-1px;">' + to + "%</div>" + chipTermino(to, pto) + "</div>" +
      '<div style="font-size:13px;opacity:0.75;margin-top:8px;font-weight:500;">' + fmt(m.fin) + " de " + fmt(m.act) + " activos</div></div>" +
      '<div style="position:relative;width:62px;height:62px;flex-shrink:0;">' + ring(to, 62, 9, "#ffffff", "#9d92ee") + "</div></div>" +
      (d.usaNps ? tarjetaNps(d.nps) : "") +
      "</div>" + legend + "</div>";
  }

  // CSS de la fuente local (ruta absoluta para que sirva dentro del iframe).
  function cssBase(fontUrl){
    return "@font-face{font-family:Inter;font-weight:100 900;src:url(" + fontUrl + ") format('woff2');}" +
      "*{box-sizing:border-box} html,body{margin:0;background:#f2f1f8;}";
  }

  // Documento completo para imprimir (iframe oculto + print()). Una hoja
  // carta horizontal (1056 x 816) por página, con la página escalada 0.8516.
  function documentoImpresion(paginas, titulo, fontUrl){
    const hojas = paginas.map(p => '<div class="hoja">' + p + "</div>").join("");
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>" + esc(titulo) + "</title><style>" + cssBase(fontUrl) +
      "@page{size:letter landscape;margin:0}" +
      "html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}" +
      ".hoja{width:1056px;height:816px;overflow:hidden;position:relative;break-after:page;page-break-after:always;}" +
      ".hoja:last-child{break-after:auto;page-break-after:auto;}" +
      ".hoja>.pg{position:absolute;left:0;top:0;transform:scale(0.8516);transform-origin:0 0;}" +
      "</style></head><body>" + hojas + "</body></html>";
  }

  return {pagina, documentoImpresion, cssBase, ring, chipHtml};
});
