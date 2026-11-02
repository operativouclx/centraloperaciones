/* Motor de métricas del reporte mensual. Sin dependencias: corre en el
   navegador (window.ReporteMetricas) y en Node (module.exports). */
(function(root, factory){
  if(typeof module === "object" && module.exports) module.exports = factory();
  else root.ReporteMetricas = factory();
})(typeof self !== "undefined" ? self : this, function(){

  const MESES_CORTO = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const MESES_LARGO = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  function pct(a, b){ return b ? Math.round(100 * a / b) : 0; }

  // "10.5%" -> 10.5 ; 10.5 -> 10.5 ; vacío o inválido -> 0
  function parseProgreso(v){
    if(typeof v === "number") return isFinite(v) ? v : 0;
    if(v === null || v === undefined) return 0;
    const n = parseFloat(String(v).replace("%", "").replace(",", ".").trim());
    return isFinite(n) ? n : 0;
  }

  function esFilaPlataforma(r){ return String(r.estado || r.Estado || "").trim() === "En plataforma"; }
  function esFilaFalta(r){ return String(r.estado || r.Estado || "").trim() === "Falta registrar"; }
  function progresoDe(r){ return parseProgreso(r.progreso !== undefined ? r.progreso : r.Progreso); }

  // rows: filas de la tabla madre del curso. cfg: configuración del reporte.
  function calcularMetricas(rows, cfg){
    cfg = cfg || {};
    const n = rows.length;
    let plat = 0, falta = 0, act = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, fin = 0;
    rows.forEach(r => {
      if(esFilaFalta(r)) falta++;
      if(!esFilaPlataforma(r)) return;
      plat++;
      const p = progresoDe(r);
      if(p > 0) act++;
      if(p >= 100) fin++;
      else if(p >= 80) b4++;
      else if(p > 50) b3++;
      else if(p > 25) b2++;
      else if(p > 0) b1++;
    });
    const fijos = cfg.convocatoria === "FINALIZADA";
    const num = v => (typeof v === "number" && v > 0) ? v : null;
    const insc = (fijos && num(cfg.inscritos_fijos)) || n;
    const beca = (fijos && num(cfg.becas_fijas)) || n;
    const m = {insc, beca, plat, falta, act, inact: plat - act, b1, b2, b3, b4, fin};
    if(b1 + b2 + b3 + b4 + fin !== act) throw new Error("Los tramos no suman los activos");
    return m;
  }

  // No retroceso: "terminaron" nunca baja respecto al cierre anterior.
  // Devuelve {m, ajustes}; m es una copia.
  function aplicarNoRetroceso(m, prev, activo){
    const out = Object.assign({}, m);
    const ajustes = [];
    if(activo !== false && prev && typeof prev.fin === "number" && m.fin < prev.fin){
      const dif = prev.fin - m.fin;
      out.fin = prev.fin;
      out.act += dif;
      out.plat += dif;
      ajustes.push({
        campo: "fin", base: m.fin, reporte: prev.fin,
        texto: "Se ajustó Terminaron: la base dice " + m.fin + ", el reporte dice " + prev.fin
      });
    }
    return {m: out, ajustes};
  }

  function tasaSantander(m){ return pct(m.fin, m.beca); }
  function tasaOperativa(m){ return pct(m.fin, m.act); }

  // ---- NPS ----
  function tipoNps(cal){ return cal >= 9 ? "Promotor" : (cal >= 7 ? "Pasivo" : "Detractor"); }
  function npsDesdeCalificaciones(cals){
    const o = {promotores: 0, pasivos: 0, detractores: 0};
    cals.forEach(c => {
      if(c >= 9) o.promotores++; else if(c >= 7) o.pasivos++; else o.detractores++;
    });
    return o;
  }
  function npsScore(n){
    if(!n) return null;
    const N = n.promotores + n.pasivos + n.detractores;
    return N ? Math.round(100 * (n.promotores - n.detractores) / N) : null;
  }
  function npsTotal(n){ return n ? n.promotores + n.pasivos + n.detractores : 0; }

  // ---- Cierres ----
  // cierres: [{id:"2026-10", fecha_corte, cursos:{[cursoId]:{...}}}]. Devuelve el
  // cierre más reciente ANTERIOR a `periodo` (AAAA-MM) que tenga ese curso.
  function cierreAnterior(cierres, cursoId, periodo){
    const c = (cierres || [])
      .filter(x => x.id < periodo && x.cursos && x.cursos[cursoId])
      .sort((a, b) => a.id < b.id ? 1 : -1)[0];
    return c ? c.cursos[cursoId] : null;
  }

  // ---- Frescura ----
  function fechaDeTexto(s){
    if(!s) return null;
    const d = new Date(String(s).length <= 10 ? s + "T12:00:00" : s);
    return isNaN(d) ? null : d;
  }
  function ultimaActualizacion(rows){
    let max = null;
    rows.forEach(r => {
      const d = fechaDeTexto(r.ultimaActualizacionPlataforma || r["Última actualización plataforma"]);
      if(d && (!max || d > max)) max = d;
    });
    return max;
  }
  function frescura(rows, fechaCorte){
    const ult = ultimaActualizacion(rows);
    const corte = fechaDeTexto(fechaCorte);
    if(!ult || !corte) return {ultima: ult, dias: null, vieja: !ult};
    const dias = Math.round((corte - ult) / 86400000);
    return {ultima: ult, dias, vieja: dias > 7};
  }

  // ---- Chips de cambio (datos, sin HTML) ----
  // good: "up" | "down" | "neutral"
  function chipConteo(cur, prev, good){
    if(prev === null || prev === undefined) return null;
    const d = cur - prev;
    if(d === 0) return {tipo: "igual", texto: "= sin cambio"};
    const pc = prev ? Math.abs(100 * d / prev) : null;
    let texto = Math.abs(d).toLocaleString("en-US") + " pers.";
    if(pc !== null) texto += pc < 0.05 ? " · <0.1%" : " · " + pc.toFixed(1) + "%";
    return {tipo: tono(d > 0, good), subio: d > 0, texto};
  }
  function chipTasa(fin, pfin, r, pr){
    if(pfin === null || pfin === undefined) return null;
    const d = fin - pfin;
    const dp = r - pr;
    if(d === 0 && dp === 0) return {tipo: "igual", texto: "= sin cambio"};
    const sube = d !== 0 ? d > 0 : dp > 0;
    const pp = dp === 0 ? "0 pp" : (dp > 0 ? "+" : "") + dp + " pp";
    return {tipo: tono(sube, "up"), subio: sube, texto: Math.abs(d).toLocaleString("en-US") + " pers. · " + pp};
  }
  function tono(sube, good){
    if(good === "neutral") return "gris";
    return ((sube && good === "up") || (!sube && good === "down")) ? "verde" : "rojo";
  }

  // ---- Fechas ----
  function fechaCorteCorta(iso){
    const d = fechaDeTexto(iso);
    return d ? d.getDate() + " " + MESES_CORTO[d.getMonth()] + " " + d.getFullYear() : "";
  }
  function fechaCorteLarga(iso){
    const d = fechaDeTexto(iso);
    return d ? d.getDate() + " de " + MESES_LARGO[d.getMonth()] + " de " + d.getFullYear() : "";
  }
  function mesAnio(iso){
    const d = fechaDeTexto(iso);
    if(!d) return "";
    const m = MESES_LARGO[d.getMonth()];
    return m.charAt(0).toUpperCase() + m.slice(1, 3) + " " + d.getFullYear();
  }
  function periodoDe(iso){ return String(iso).slice(0, 7); }

  return {
    pct, parseProgreso, calcularMetricas, aplicarNoRetroceso, tasaSantander, tasaOperativa,
    tipoNps, npsDesdeCalificaciones, npsScore, npsTotal, cierreAnterior, frescura,
    ultimaActualizacion, chipConteo, chipTasa, fechaCorteCorta, fechaCorteLarga, mesAnio, periodoDe
  };
});
