/* Pantalla "Reporte mensual". Todo corre en el navegador. Los datos pasan
   por un `store` (Firestore en producción, memoria en las pruebas). */
(function(root){
  const M = root.ReporteMetricas, D = root.ReporteDashboard, C = root.ReporteCorreo, X = root.ReporteXlsx, P = root.ReportePdf;
  const esc = s => String(s === null || s === undefined ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const abs = p => new URL(p, document.baseURI).href;
  const FONT_URL = () => abs("assets/inter-latin.woff2");
  const norm = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

  // ---- Cursos que hoy entran al reporte (valores por defecto) ----
  const hasTok = (n, t) => new RegExp("(^| )" + t + "( |$)").test(n);
  const nv = t => n => n.includes("violencia") && !n.includes("add on") && hasTok(n, t);
  const DEFAULTS = [
    {clave: "Crianza Responsable III", nombre: "Crianza Responsable III", hoja: "Crianza responsable III", logo: "reporte-crianza-responsable.png", logo_alto: 48, grupo_pdf: "", orden: 1, convocatoria: "FINALIZADA", usa_nps: true,
      match: n => n.includes("crianza responsable") && hasTok(n, "iii") && !n.includes("add on")},
    {clave: "Matemáticamente", nombre: "Matemáticamente", hoja: "Matemáticamente", logo: "reporte-matematicamente.png", logo_alto: 44, grupo_pdf: "", orden: 2, convocatoria: "EN PROGRESO", usa_nps: true,
      match: n => n.includes("matematicamente")},
    {clave: "Mi Prepa Santander", nombre: "Mi Prepa Santander", hoja: "Mi Prepa", logo: "reporte-mi-prepa.png", logo_alto: 50, grupo_pdf: "", orden: 3, convocatoria: "FINALIZADA", usa_nps: true,
      match: n => n.includes("mi prepa") && !hasTok(n, "2") && !hasTok(n, "ii")},
    {clave: "No+Violencia III", nombre: "No+Violencia III", hoja: "No+Violencia III", logo: "reporte-no-violencia.png", logo_alto: 44, grupo_pdf: "No+Violencia", orden: 4, convocatoria: "FINALIZADA", usa_nps: true, match: nv("iii")},
    {clave: "No+Violencia IV", nombre: "No+Violencia IV", hoja: "No+Violencia IV", logo: "reporte-no-violencia.png", logo_alto: 44, grupo_pdf: "No+Violencia", orden: 5, convocatoria: "FINALIZADA", usa_nps: true, match: nv("iv")},
    {clave: "No+Violencia V", nombre: "No+Violencia V", hoja: "No+Violencia V", logo: "reporte-no-violencia.png", logo_alto: 44, grupo_pdf: "No+Violencia", orden: 6, convocatoria: "EN PROGRESO", usa_nps: true, match: nv("v")},
    {clave: "VocaAcción 2026", nombre: "VocaAcción 2026", hoja: "VocaAcción 2026", logo: "reporte-vocaaccion.png", logo_alto: 58, grupo_pdf: "VocaAcción", orden: 7, convocatoria: "FINALIZADA", usa_nps: false,
      match: n => n.includes("vocaaccion") && n.includes("2026") && !n.includes("cecyte")},
    {clave: "VocaAcción CECYTE", nombre: "VocaAcción CECYTE", hoja: "VocaAcción CECYTE", logo: "reporte-vocaaccion.png", logo_alto: 58, grupo_pdf: "VocaAcción", orden: 8, convocatoria: "EN PROGRESO", usa_nps: false,
      match: n => n.includes("vocaaccion") && n.includes("cecyte")}
  ];
  // Cierre sembrado: corte al 30 de octubre de 2026.
  const SEMILLA_2026_10 = {
    "Matemáticamente": {insc: 2501, beca: 2501, plat: 2501, falta: 0, act: 1153, inact: 1348, b1: 790, b2: 138, b3: 40, b4: 40, fin: 145, nps: {promotores: 123, pasivos: 28, detractores: 6}, convocatoria: "EN PROGRESO"},
    "Mi Prepa Santander": {insc: 2068, beca: 2062, plat: 2043, falta: 19, act: 1011, inact: 1032, b1: 756, b2: 155, b3: 37, b4: 17, fin: 46, nps: {promotores: 46, pasivos: 5, detractores: 0}, convocatoria: "FINALIZADA"},
    "No+Violencia III": {insc: 3269, beca: 1271, plat: 3265, falta: 0, act: 689, inact: 2576, b1: 107, b2: 59, b3: 26, b4: 19, fin: 478, nps: {promotores: 412, pasivos: 55, detractores: 19}, convocatoria: "FINALIZADA"},
    "No+Violencia IV": {insc: 1808, beca: 1801, plat: 1797, falta: 0, act: 729, inact: 1068, b1: 178, b2: 63, b3: 37, b4: 30, fin: 421, nps: {promotores: 370, pasivos: 45, detractores: 14}, convocatoria: "FINALIZADA"},
    "No+Violencia V": {insc: 159, beca: 159, plat: 159, falta: 0, act: 6, inact: 153, b1: 2, b2: 1, b3: 1, b4: 0, fin: 2, nps: null, convocatoria: "EN PROGRESO"},
    "Crianza Responsable III": {insc: 878, beca: 872, plat: 631, falta: 0, act: 397, inact: 234, b1: 91, b2: 84, b3: 36, b4: 11, fin: 175, nps: {promotores: 126, pasivos: 18, detractores: 5}, convocatoria: "FINALIZADA"},
    "VocaAcción 2026": {insc: 562, beca: 562, plat: 562, falta: 0, act: 150, inact: 412, b1: 0, b2: 8, b3: 15, b4: 0, fin: 127, nps: null, convocatoria: "FINALIZADA"},
    "VocaAcción CECYTE": {insc: 188, beca: 188, plat: 187, falta: 1, act: 10, inact: 177, b1: 0, b2: 0, b3: 2, b4: 0, fin: 8, nps: null, convocatoria: "EN PROGRESO"}
  };

  // ---- store en Firestore ----
  function storeFirestore(){
    const db = firebase.firestore();
    const cursos = () => db.collection("courses");
    return {
      usuario: () => firebase.auth().currentUser || {},
      async listCursos(){
        const s = await cursos().get();
        return s.docs.map(d => { const x = d.data() || {}; return {slug: d.id, displayName: x.displayName || d.id, archived: !!x.archived, nps: x.nps || null}; });
      },
      async getConfigs(){
        const s = await db.collection("config_reporte").get();
        const o = {}; s.docs.forEach(d => o[d.id] = d.data()); return o;
      },
      async saveConfig(slug, data){ await db.collection("config_reporte").doc(slug).set(data, {merge: true}); },
      async getMaster(slug){
        const s = await cursos().doc(slug).collection("master").get();
        return s.docs.map(d => d.data());
      },
      async listCierres(){
        const s = await db.collection("cierres").get();
        const out = [];
        for(const d of s.docs){
          const cs = await d.ref.collection("cursos").get();
          const cursosMap = {}; cs.docs.forEach(c => cursosMap[c.id] = c.data());
          out.push(Object.assign({id: d.id}, d.data(), {cursos: cursosMap}));
        }
        return out;
      },
      async saveCierre(periodo, meta, porCurso){
        const ref = db.collection("cierres").doc(periodo);
        const b = db.batch();
        b.set(ref, meta);
        Object.keys(porCurso).forEach(slug => b.set(ref.collection("cursos").doc(slug), porCurso[slug]));
        await b.commit();
      }
    };
  }

  // ---- estado ----
  const S = {store: null, cursos: [], cfgs: {}, cierres: [], masters: {}, nps: {}, nppend: {}, avisos: {}, logos: {}, corte: "", abierto: false, cfgAbierta: null, correo: null, pdfs: false};
  let host = null;

  function cfgDe(c){
    const def = DEFAULTS.find(d => d.match(norm(c.slug + " " + c.displayName)) && !c.archived);
    const base = def ? Object.assign({}, def, {incluir: true}) : {nombre: c.displayName, hoja: c.displayName, logo: "", logo_alto: 48, grupo_pdf: "", orden: 99, convocatoria: "EN PROGRESO", usa_nps: true, incluir: false};
    delete base.match; delete base.clave;
    const cfg = Object.assign({no_retroceso: true, inscritos_fijos: null, becas_fijas: null}, base, S.cfgs[c.slug] || {});
    cfg.clave = def ? def.clave : null;
    return cfg;
  }
  const incluidos = () => S.cursos.map(c => ({c, cfg: cfgDe(c)})).filter(x => x.cfg.incluir).sort((a, b) => (a.cfg.orden - b.cfg.orden) || a.cfg.nombre.localeCompare(b.cfg.nombre));
  const periodo = () => M.periodoDe(S.corte);

  function npsActual(c){
    const a = S.nps[c.slug];
    if(a) return a;
    const cfgNps = (S.cfgs[c.slug] || {}).nps_actual;
    if(cfgNps && M.npsTotal(cfgNps)) return cfgNps;
    const n = c.nps;   // el NPS que ya cargaba la central en el curso
    return n && (n.promotores || n.pasivos || n.detractores) ? {promotores: n.promotores || 0, pasivos: n.pasivos || 0, detractores: n.detractores || 0, archivo: n.archivo, fecha: n.fecha} : null;
  }

  function calcular(x){
    const rows = S.masters[x.c.slug];
    if(!rows) return null;
    const prev = M.cierreAnterior(S.cierres, x.c.slug, periodo());
    const base = M.calcularMetricas(rows, x.cfg);
    const adj = M.aplicarNoRetroceso(base, prev, x.cfg.no_retroceso);
    return {rows, prev, base, m: adj.m, ajustes: adj.ajustes, fresc: M.frescura(rows, S.corte), nps: x.cfg.usa_nps ? npsActual(x.c) : null};
  }

  // Avisos: cada uno se acepta por separado.
  function avisosDe(x, k){
    const l = [];
    if(x.cfg.usa_nps && !k.nps) l.push({id: "nps", texto: "NPS pendiente: la tarjeta saldrá vacía («Sin respuestas cargadas»)."});
    if(k.fresc.vieja) l.push({id: "fresco", texto: k.fresc.ultima ? "Datos de plataforma del " + M.fechaCorteCorta(k.fresc.ultima.toISOString().slice(0, 10)) + ", " + k.fresc.dias + " días antes del corte." : "No hay fecha de última actualización de plataforma."});
    if(S.nppend[x.c.slug] && S.nppend[x.c.slug].avisos.length) S.nppend[x.c.slug].avisos.forEach((t, i) => l.push({id: "npsval" + i, texto: "NPS: " + t}));
    return l;
  }
  const aceptado = (slug, id) => !!(S.avisos[slug] && S.avisos[slug][id]);
  function bloqueado(){
    if(!S.corte) return "Falta la fecha de corte.";
    const xs = incluidos();
    if(!xs.length) return "No hay cursos incluidos.";
    for(const x of xs){
      const k = calcular(x);
      if(!k) return "Calculando…";
      if(S.nppend[x.c.slug]) return "Hay un NPS por confirmar en " + x.cfg.nombre + ".";
      for(const a of avisosDe(x, k)) if(!aceptado(x.c.slug, a.id)) return "Hay advertencias sin aceptar.";
    }
    return "";
  }

  // ---- logos (recorta el espacio en blanco) ----
  function recortarLogo(url){
    return new Promise(ok => {
      const img = new Image();
      img.onload = () => {
        try{
          const w = img.naturalWidth, h = img.naturalHeight, cv = document.createElement("canvas");
          cv.width = w; cv.height = h;
          const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0);
          const d = cx.getImageData(0, 0, w, h).data;
          let x0 = w, y0 = h, x1 = -1, y1 = -1;
          for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
            const i = (y * w + x) * 4;
            if(d[i + 3] > 12 && !(d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245)){
              if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y;
            }
          }
          if(x1 < 0) return ok(url);
          const o = document.createElement("canvas"); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
          o.getContext("2d").drawImage(cv, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
          ok(o.toDataURL("image/png"));
        }catch(e){ ok(url); }
      };
      img.onerror = () => ok("");
      img.src = url;
    });
  }
  async function logoDe(cfg){
    if(!cfg.logo) return "";
    if(S.logos[cfg.logo] === undefined) S.logos[cfg.logo] = await recortarLogo(abs("assets/course-logos/" + cfg.logo));
    return S.logos[cfg.logo];
  }

  async function datosPagina(x, k){
    return {nombre: x.cfg.nombre, corte: M.fechaCorteCorta(S.corte), convocatoria: x.cfg.convocatoria, m: k.m, prev: k.prev, nps: k.nps, usaNps: x.cfg.usa_nps,
      logoSrc: await logoDe(x.cfg), logoAlto: x.cfg.logo_alto, uclxSrc: abs("assets/reporte/uclx.svg"), santSrc: abs("assets/reporte/santander-open-academy.svg")};
  }
  const paginaDe = async x => D.pagina(await datosPagina(x, calcular(x)));

  // ---- archivos de salida ----
  const hoy = () => new Date().toISOString().slice(0, 10);
  const mesArchivo = () => M.mesAnio(hoy());
  function grupos(){
    const out = [], idx = {};
    incluidos().forEach(x => {
      const g = x.cfg.grupo_pdf;
      if(g){ if(idx[g] === undefined){ idx[g] = out.length; out.push({nombre: g, xs: []}); } out[idx[g]].xs.push(x); }
      else out.push({nombre: x.cfg.nombre, xs: [x]});
    });
    return out;
  }
  const tituloPdf = g => "Dashboard " + g.nombre.replace(/[\\\/:*?"<>|·]/g, "-") + " - " + mesArchivo() + ".pdf";
  async function paginasDeGrupo(g){ const a = []; for(const x of g.xs) a.push(await paginaDe(x)); return a; }

  function bajar(buf, nombre, tipo){
    const url = URL.createObjectURL(new Blob([buf], {type: tipo}));
    const a = document.createElement("a"); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  async function descargarXlsx(xs, nombre){
    await asegurarMasters(xs);
    const u = S.store.usuario();
    const wb = await X.construirLibro(root.ExcelJS, {
      cursos: xs.map(x => ({hoja: x.cfg.hoja || x.cfg.nombre, rows: S.masters[x.c.slug]})),
      corteLargo: M.fechaCorteLarga(S.corte),
      hoyLargo: M.fechaCorteLarga(hoy()), usuario: u.email || ""
    });
    bajar(await wb.xlsx.writeBuffer(), nombre, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  async function asegurarMasters(xs){
    for(const x of xs) if(!S.masters[x.c.slug]) S.masters[x.c.slug] = await S.store.getMaster(x.c.slug);
  }

  // ---- NPS desde archivo ----
  function leerArchivo(file){
    return new Promise((ok, mal) => {
      const fr = new FileReader();
      const csv = /\.csv$/i.test(file.name);
      fr.onload = () => { try{
        const wb = csv ? root.XLSX.read(fr.result, {type: "string", raw: true}) : root.XLSX.read(new Uint8Array(fr.result), {type: "array"});
        ok(root.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {defval: ""}));
      }catch(e){ mal(e); } };
      fr.onerror = () => mal(fr.error);
      csv ? fr.readAsText(file) : fr.readAsArrayBuffer(file);
    });
  }
  function colDe(row, nombres){
    const k = Object.keys(row).find(h => nombres.includes(norm(h)));
    return k === undefined ? null : k;
  }
  async function procesarNps(x, file){
    const rows = await leerArchivo(file);
    if(!rows.length) throw new Error("El archivo está vacío.");
    const cCal = colDe(rows[0], ["calificacion", "calificacion nps", "score"]);
    if(!cCal) throw new Error("No encontré la columna «Calificación».");
    const cTipo = colDe(rows[0], ["tipo"]), cEmail = colDe(rows[0], ["email", "correo", "correo electronico"]), cNom = colDe(rows[0], ["nombre", "nombre completo"]);
    const cals = [], tipos = [], emails = [], noms = [];
    rows.forEach(r => {
      const v = String(r[cCal]).trim().replace(",", "."); if(v === "") return;
      const n = Number(v); if(!isFinite(n) || n < 0 || n > 10) return;
      cals.push(n); tipos.push(cTipo ? norm(r[cTipo]) : null); emails.push(cEmail ? norm(r[cEmail]) : ""); noms.push(cNom ? norm(r[cNom]) : "");
    });
    if(!cals.length) throw new Error("No hay calificaciones de 0 a 10.");
    const av = [];
    // VocaAcción califica del 1 al 5: se recalcula a 1–10 (1→1, 2→3, 3→6, 4→8, 5→10).
    if(/voca+c+ion/.test(norm(x.c.slug + " " + x.cfg.nombre)) && Math.max(...cals) <= 5){
      cals.forEach((c, i) => { cals[i] = Math.round(1 + (Math.max(1, c) - 1) * 9 / 4); });
      av.push("Las calificaciones venían del 1 al 5 y se recalcularon al 1–10.");
    }
    const cuenta = M.npsDesdeCalificaciones(cals);
    if(cTipo){
      const dif = cals.filter((c, i) => tipos[i] && tipos[i] !== norm(M.tipoNps(c))).length;
      if(dif) av.push(dif + " filas tienen un Tipo distinto al que sale de la calificación. Se usó la calificación.");
    }
    await asegurarMasters([x]);
    const rowsM = S.masters[x.c.slug];
    const eM = new Set(rowsM.map(r => norm(r.emailManual || r.email || "")).filter(Boolean));
    const nM = new Set(rowsM.map(r => norm(((r.nombres || "") + " " + (r.apellidos || "")).trim() || r.nombre)).filter(Boolean));
    const compara = (lista, set) => { const l = lista.filter(Boolean); return l.length ? Math.round(100 * l.filter(v => set.has(v)).length / l.length) : null; };
    const pe = cEmail ? compara(emails, eM) : null, pn = cNom ? compara(noms, nM) : null;
    if(pe !== null && pe < 90) av.push("Solo " + pe + "% de los correos del archivo están en este curso (puede ser de otra generación).");
    if(pn !== null && pn < 90 && !(pe !== null && pe < 90)) av.push("Solo " + pn + "% de los nombres del archivo están en este curso.");
    const insc = calcular(x).m.insc;
    if(cals.length > insc) av.push("Hay más respuestas (" + cals.length + ") que inscritos (" + insc + ").");
    return {conteos: cuenta, archivo: file.name, avisos: av, total: cals.length};
  }

  // ---- UI ----
  const CSS = `
  #rm-root{position:fixed;inset:0;z-index:50;background:var(--paper);overflow:auto;padding:28px 20px 80px;}
  #rm-root .rm-wrap{max-width:1180px;margin:0 auto;}
  #rm-root .rm-top{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:18px;}
  #rm-root .rm-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:18px;}
  #rm-root .rm-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px;}
  #rm-root .rm-card h3{font-size:18px;margin-bottom:8px;}
  #rm-root .rm-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0;font-size:14px;}
  #rm-root .rm-warn{background:var(--amber-bg);border:1px solid var(--amber-line);color:var(--amber);border-radius:8px;padding:6px 10px;font-size:13px;display:flex;gap:8px;align-items:center;}
  #rm-root .rm-info{background:var(--teal-bg);border-radius:8px;padding:6px 10px;font-size:13px;color:var(--teal-dark);}
  #rm-root .rm-ok{color:#17835a;font-weight:600;}
  #rm-root .rm-prev{position:relative;overflow:hidden;border:1px solid var(--line);border-radius:10px;margin-top:10px;background:#f2f1f8;}
  #rm-root .rm-prev>div{transform-origin:0 0;}
  #rm-root .rm-cfg{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;margin-top:10px;}
  #rm-root .rm-cfg label{font-size:12px;color:var(--ink-soft);display:flex;flex-direction:column;gap:3px;}
  #rm-root textarea.input-text{width:100%;min-height:260px;font-family:inherit;}
  #rm-root table.rm-tab{border-collapse:collapse;width:100%;font-size:13px;}
  #rm-root table.rm-tab th{background:var(--teal);color:#fff;text-align:left;padding:6px 8px;position:sticky;top:0;}
  #rm-root table.rm-tab td{padding:5px 8px;border-bottom:1px solid var(--line-soft);}
  #rm-root .rm-modal{position:fixed;inset:0;background:rgba(20,33,59,.45);z-index:60;display:flex;align-items:center;justify-content:center;padding:20px;}
  #rm-root .rm-modal>div{background:#fff;border-radius:12px;padding:18px;max-width:900px;width:100%;max-height:88vh;display:flex;flex-direction:column;}
  `;

  function montar(){
    if(host) return;
    const st = document.createElement("style"); st.textContent = CSS + D.cssBase(FONT_URL()).replace("html,body{margin:0;background:#f2f1f8;}", ""); document.head.appendChild(st);
    host = document.createElement("div"); host.id = "rm-root"; host.className = "hidden"; document.body.appendChild(host);
    host.addEventListener("click", onClick);
    host.addEventListener("change", onChange);
  }

  const btn = (act, txt, extra, cls) => '<button type="button" class="btn ' + (cls || "btn-ghost") + ' btn-small" data-act="' + act + '" ' + (extra || "") + ">" + txt + "</button>";

  async function render(){
    if(!host) return;
    const xs = incluidos(), bloq = bloqueado();
    const fuera = S.cursos.map(c => ({c, cfg: cfgDe(c)})).filter(x => !x.cfg.incluir && !x.c.archived);
    let h = '<div class="rm-wrap"><div class="rm-top"><h1>Reporte mensual</h1>' + btn("cerrar-pantalla", "&larr; Volver a la central") + "</div>";
    h += '<div class="rm-bar"><label>Fecha de corte <input type="date" id="rm-corte" class="input-text" value="' + esc(S.corte) + '"></label>' +
      '<span class="rm-info">Se compara contra el cierre anterior de cada curso. Mes actual: ' + esc(periodo()) + ". Cierres guardados: " + (S.cierres.map(c => c.id).sort().join(", ") || "ninguno") + ".</span></div>";
    h += '<div class="rm-bar">' + btn("pdfs", "Descargar PDFs", bloq ? "disabled" : "", "btn-primary") + btn("xlsx", "Descargar base completa", bloq ? "disabled" : "", "btn-primary") +
      btn("correo", "Copiar correo", bloq ? "disabled" : "", "btn-primary") + btn("cerrar-mes", "Cerrar mes", bloq ? "disabled" : "") +
      (S.cierres.length ? "" : btn("sembrar", "Sembrar cierre 2026-10")) + (bloq ? '<span class="rm-warn">' + esc(bloq) + "</span>" : '<span class="rm-ok">Todo listo para descargar.</span>') + "</div>";
    if(S.pdfs) h += await htmlPdfs();
    if(S.correo) h += htmlCorreo();
    for(const x of xs) h += await htmlCurso(x);
    h += '<div class="rm-card"><h3>Cursos fuera del reporte</h3>' + (fuera.length ? fuera.map(x => '<div class="rm-row">' + esc(x.c.displayName) + btn("cfg", "Configurar / incluir", 'data-slug="' + esc(x.c.slug) + '"') + "</div>" + (S.cfgAbierta === x.c.slug ? htmlCfg(x) : "")).join("") : "<em>Ninguno.</em>") + "</div></div>";
    host.innerHTML = h;
    host.querySelectorAll(".rm-prev").forEach(escalar);
  }
  function escalar(box){
    const inner = box.firstElementChild; if(!inner) return;
    const ajustar = () => {
      const w = box.clientWidth; if(!w) return;
      const s = w / 1240; inner.style.transform = "scale(" + s + ")"; box.style.height = (958 * s) + "px";
    };
    ajustar();
    if(root.ResizeObserver) new ResizeObserver(ajustar).observe(box);
  }

  async function htmlCurso(x){
    const slug = x.c.slug, k = calcular(x);
    let h = '<div class="rm-card"><h3>' + esc(x.cfg.nombre) + ' <span style="font-size:12px;color:var(--ink-soft)">(' + esc(x.c.displayName) + ")</span></h3>";
    if(!k) return h + '<div class="rm-row">' + btn("cargar", "Calcular este curso", 'data-slug="' + esc(slug) + '"', "btn-primary") + "</div></div>";
    h += '<div class="rm-row"><b>Datos de plataforma:</b> ' + (k.fresc.ultima ? "actualizados el " + esc(M.fechaCorteCorta(k.fresc.ultima.toISOString().slice(0, 10))) : "sin fecha") + "</div>";
    h += '<div class="rm-row"><b>Convocatoria:</b> <select data-conv="' + esc(slug) + '" class="input-text" style="width:auto"><option' + (x.cfg.convocatoria === "EN PROGRESO" ? " selected" : "") + '>EN PROGRESO</option><option' + (x.cfg.convocatoria === "FINALIZADA" ? " selected" : "") + ">FINALIZADA</option></select>" +
      (x.cfg.usa_nps ? " &nbsp; <b>NPS:</b> " + (k.nps ? "cargado (" + M.npsTotal(k.nps) + " respuestas" + (k.nps.archivo ? ", " + esc(k.nps.archivo) : "") + ")" : '<span style="color:var(--rust)">pendiente</span>') +
        ' <input type="file" accept=".xlsx,.csv" data-nps="' + esc(slug) + '">' : " &nbsp; Sin NPS") + "</div>";
    const pend = S.nppend[slug];
    if(pend) h += '<div class="rm-info">NPS del archivo ' + esc(pend.archivo) + ": " + pend.conteos.promotores + " promotores, " + pend.conteos.pasivos + " pasivos, " + pend.conteos.detractores + " detractores (NPS " + M.npsScore(pend.conteos) + ") " +
      btn("nps-guardar", "Guardar NPS", 'data-slug="' + esc(slug) + '"', "btn-primary") + btn("nps-descartar", "Descartar", 'data-slug="' + esc(slug) + '"') + "</div>";
    k.ajustes.forEach(a => h += '<div class="rm-warn">' + esc(a.texto) + "</div>");
    avisosDe(x, k).forEach(a => h += '<div class="rm-warn"><label><input type="checkbox" data-aviso="' + esc(slug) + '|' + esc(a.id) + '"' + (aceptado(slug, a.id) ? " checked" : "") + "> Aceptar</label> " + esc(a.texto) + "</div>");
    if(!k.prev) h += '<div class="rm-info">Sin cierre anterior: el dashboard no lleva indicadores de cambio.</div>';
    h += '<div class="rm-row">' + btn("ver-base", "Ver base", 'data-slug="' + esc(slug) + '"') + btn("bajar-base", "Descargar base (Excel)", 'data-slug="' + esc(slug) + '"') +
      btn("cfg", "Configuración", 'data-slug="' + esc(slug) + '"') + btn("recargar", "Releer datos", 'data-slug="' + esc(slug) + '"') + "</div>";
    if(S.cfgAbierta === slug) h += htmlCfg(x);
    h += '<div class="rm-prev">' + await paginaDe(x) + "</div></div>";
    return h;
  }

  function htmlCfg(x){
    const c = x.cfg, f = (k, lbl, tipo) => '<label>' + lbl + '<input class="input-text" data-cfg="' + k + '" type="' + (tipo || "text") + '" value="' + esc(c[k] === null || c[k] === undefined ? "" : c[k]) + '"></label>';
    const sn = (k, lbl) => '<label>' + lbl + '<select class="input-text" data-cfg="' + k + '"><option value="1"' + (c[k] ? " selected" : "") + '>Sí</option><option value="0"' + (c[k] ? "" : " selected") + ">No</option></select></label>";
    return '<div class="rm-cfg">' + f("nombre", "Nombre en el dashboard") + f("hoja", "Hoja en el Excel") + f("logo", "Logo (archivo en assets/course-logos)") + f("logo_alto", "Alto del logo (px)", "number") +
      f("grupo_pdf", "Grupo de PDF (vacío = uno por curso)") + f("orden", "Orden", "number") + f("inscritos_fijos", "Inscritos fijos (si FINALIZADA)", "number") + f("becas_fijas", "Becas fijas (si FINALIZADA)", "number") +
      sn("usa_nps", "Usa NPS") + sn("incluir", "Incluir en el reporte") + sn("no_retroceso", "Regla de no retroceso") + "</div>" +
      '<div class="rm-row">' + btn("cfg-guardar", "Guardar configuración", 'data-slug="' + esc(x.c.slug) + '"', "btn-primary") + "</div>";
  }

  async function htmlPdfs(){
    let h = '<div class="rm-card"><h3>Descargar PDFs</h3><div class="rm-info">Se abre el cuadro de impresión: elige «Guardar como PDF», hoja carta horizontal. El nombre de archivo ya viene sugerido.</div>';
    grupos().forEach((g, i) => h += '<div class="rm-row"><b>' + esc(tituloPdf(g)) + "</b> (" + g.xs.length + " pág.) " + btn("pdf", "Imprimir / guardar PDF", 'data-i="' + i + '"', "btn-primary") + btn("pdf-rapido", "Descarga rápida (imagen)", 'data-i="' + i + '"') + "</div>");
    return h + "</div>";
  }
  function htmlCorreo(){
    return '<div class="rm-card"><h3>Correo para Santander</h3><div class="rm-row"><label>Destinatario <input id="rm-dest" class="input-text" value="' + esc(S.correo.destinatario) + '"></label>' + btn("correo-regen", "Regenerar texto") + "</div>" +
      '<div class="rm-row" style="flex-direction:column;align-items:stretch"><input id="rm-asunto" class="input-text" value="' + esc(S.correo.asunto) + '"><textarea id="rm-cuerpo" class="input-text">' + esc(S.correo.cuerpo) + "</textarea></div>" +
      '<div class="rm-row">' + btn("correo-copiar", "Copiar correo", "", "btn-primary") + '<span id="rm-copiado" class="rm-ok"></span></div></div>';
  }

  function generarCorreo(dest){
    const u = S.store.usuario();
    const cursos = incluidos().map(x => { const k = calcular(x); return {nombre: x.cfg.nombre, convocatoria: x.cfg.convocatoria, m: k.m, prev: k.prev, nps: k.nps, usaNps: x.cfg.usa_nps}; });
    const r = C.construirCorreo({destinatario: dest, firma: u.displayName || u.email || "", corteLargo: M.fechaCorteLarga(S.corte), cursos});
    return Object.assign({destinatario: dest}, r);
  }

  async function verBase(slug){
    const x = incluidos().concat(S.cursos.map(c => ({c, cfg: cfgDe(c)}))).find(y => y.c.slug === slug);
    await asegurarMasters([x]);
    const rows = S.masters[slug];
    const m = document.createElement("div"); m.className = "rm-modal";
    m.innerHTML = '<div><div class="rm-row"><h3 style="margin:0">' + esc(x.cfg.nombre) + " — " + rows.length + ' filas</h3><input class="input-text" id="rm-q" placeholder="Buscar nombre o correo" style="max-width:260px">' +
      btn("bajar-base", "Descargar (Excel)", 'data-slug="' + esc(slug) + '"', "btn-primary") + btn("modal-cerrar", "Cerrar") + '</div><div style="overflow:auto"><table class="rm-tab"><thead><tr><th>Estado</th><th>Progreso</th><th>Nombre</th><th>Email</th></tr></thead><tbody></tbody></table></div><div id="rm-n" style="font-size:12px;color:var(--ink-soft);margin-top:6px"></div></div>';
    host.appendChild(m);
    const lista = rows.map(r => [r.estado || "", X.progresoTexto(r.progreso), X.nombreCompleto(r), r.emailManual || r.email || ""]);
    const pintar = () => {
      const q = norm(m.querySelector("#rm-q").value);
      const f = q ? lista.filter(r => norm(r[2] + " " + r[3]).includes(q)) : lista;
      m.querySelector("tbody").innerHTML = f.slice(0, 500).map(r => "<tr>" + r.map(v => "<td>" + esc(v) + "</td>").join("") + "</tr>").join("");
      m.querySelector("#rm-n").textContent = f.length > 500 ? "Mostrando 500 de " + f.length + ". Usa el buscador o descarga el Excel." : f.length + " filas.";
    };
    m.querySelector("#rm-q").addEventListener("input", pintar); pintar();
  }

  async function cerrarMes(){
    const xs = incluidos(), per = periodo();
    if(S.cierres.some(c => c.id === per) && !confirm("Ya existe un cierre " + per + ". ¿Reemplazarlo?")) return;
    if(!confirm("Cerrar el mes " + per + " con corte al " + M.fechaCorteLarga(S.corte) + " para " + xs.length + " cursos?")) return;
    const por = {};
    xs.forEach(x => {
      const k = calcular(x);
      por[x.c.slug] = Object.assign({fecha_corte: S.corte}, k.m, {nps: x.cfg.usa_nps && k.nps ? {promotores: k.nps.promotores, pasivos: k.nps.pasivos, detractores: k.nps.detractores} : null,
        convocatoria: x.cfg.convocatoria, ajustes: k.ajustes.map(a => a.texto), nombre: x.cfg.nombre});
    });
    await S.store.saveCierre(per, {fecha_corte: S.corte, cerrado_por: S.store.usuario().email || "", cerrado: new Date().toISOString()}, por);
    S.cierres = await S.store.listCierres();
    alert("Mes " + per + " cerrado.");
    render();
  }
  async function sembrar(){
    const por = {}, faltan = [];
    Object.keys(SEMILLA_2026_10).forEach(clave => {
      const x = S.cursos.map(c => ({c, cfg: cfgDe(c)})).find(y => y.cfg.clave === clave);
      if(!x) return faltan.push(clave);
      por[x.c.slug] = Object.assign({fecha_corte: "2026-10-30"}, SEMILLA_2026_10[clave], {ajustes: [], nombre: x.cfg.nombre});
    });
    if(faltan.length && !confirm("No encontré estos cursos y no se sembrarán: " + faltan.join(", ") + ". ¿Continuar?")) return;
    if(!confirm("Guardar el cierre 2026-10 (corte 30 de octubre de 2026) para " + Object.keys(por).length + " cursos?")) return;
    await S.store.saveCierre("2026-10", {fecha_corte: "2026-10-30", cerrado_por: S.store.usuario().email || "", cerrado: new Date().toISOString(), sembrado: true}, por);
    S.cierres = await S.store.listCierres();
    render();
  }

  async function onClick(e){
    const b = e.target.closest("[data-act]"); if(!b) return;
    const act = b.dataset.act, slug = b.dataset.slug;
    try{
      if(act === "cerrar-pantalla"){ host.classList.add("hidden"); document.body.style.overflow = ""; }
      else if(act === "modal-cerrar") b.closest(".rm-modal").remove();
      else if(act === "cargar" || act === "recargar"){ delete S.masters[slug]; b.disabled = true; await asegurarMasters([incluidos().concat(S.cursos.map(c => ({c, cfg: cfgDe(c)}))).find(y => y.c.slug === slug)]); render(); }
      else if(act === "cfg"){ S.cfgAbierta = S.cfgAbierta === slug ? null : slug; render(); }
      else if(act === "cfg-guardar"){
        const d = {};
        host.querySelectorAll("[data-cfg]").forEach(i => {
          const k = i.dataset.cfg, v = i.value;
          d[k] = ["usa_nps", "incluir", "no_retroceso"].includes(k) ? v === "1" : (["logo_alto", "orden", "inscritos_fijos", "becas_fijas"].includes(k) ? (v === "" ? null : Number(v)) : v.trim());
        });
        await S.store.saveConfig(slug, d); S.cfgs[slug] = Object.assign(S.cfgs[slug] || {}, d); S.cfgAbierta = null; render();
      }
      else if(act === "ver-base") await verBase(slug);
      else if(act === "bajar-base"){
        const x = incluidos().concat(S.cursos.map(c => ({c, cfg: cfgDe(c)}))).find(y => y.c.slug === slug);
        await descargarXlsx([x], "Base " + x.cfg.nombre.replace(/[\\\/:*?"<>|]/g, "-") + " - " + mesArchivo() + ".xlsx");
      }
      else if(act === "nps-guardar"){
        const p = S.nppend[slug], u = S.store.usuario();
        const data = {nps_actual: Object.assign({}, p.conteos, {archivo: p.archivo, fecha: new Date().toISOString(), por: u.email || ""})};
        await S.store.saveConfig(slug, data); S.cfgs[slug] = Object.assign(S.cfgs[slug] || {}, data); delete S.nps[slug]; delete S.nppend[slug]; render();
      }
      else if(act === "nps-descartar"){ delete S.nppend[slug]; render(); }
      else if(act === "pdfs"){ S.pdfs = !S.pdfs; render(); }
      else if(act === "pdf" || act === "pdf-rapido"){
        const g = grupos()[Number(b.dataset.i)], pags = await paginasDeGrupo(g);
        act === "pdf" ? await P.imprimir(pags, tituloPdf(g), FONT_URL()) : await P.descargaRapida(pags, tituloPdf(g), FONT_URL());
      }
      else if(act === "xlsx") await descargarXlsx(incluidos(), "Base completa UCLX - " + mesArchivo() + ".xlsx");
      else if(act === "correo"){ S.correo = generarCorreo(S.correo ? S.correo.destinatario : ""); render(); }
      else if(act === "correo-regen"){ S.correo = generarCorreo(host.querySelector("#rm-dest").value); render(); }
      else if(act === "correo-copiar"){
        const txt = "Asunto: " + host.querySelector("#rm-asunto").value + "\n\n" + host.querySelector("#rm-cuerpo").value.replace("{destinatario}", host.querySelector("#rm-dest").value);
        await navigator.clipboard.writeText(txt); host.querySelector("#rm-copiado").textContent = "Copiado.";
      }
      else if(act === "cerrar-mes") await cerrarMes();
      else if(act === "sembrar") await sembrar();
    }catch(err){ console.error(err); alert("No se pudo completar: " + (err && err.message ? err.message : err)); }
  }

  async function onChange(e){
    const t = e.target;
    try{
      if(t.id === "rm-corte"){ S.corte = t.value; try{ localStorage.setItem("rm-corte", S.corte); }catch(_){ } S.avisos = {}; render(); }
      else if(t.dataset.aviso){ const [s, id] = t.dataset.aviso.split("|"); (S.avisos[s] = S.avisos[s] || {})[id] = t.checked; render(); }
      else if(t.dataset.conv){ const s = t.dataset.conv; await S.store.saveConfig(s, {convocatoria: t.value}); S.cfgs[s] = Object.assign(S.cfgs[s] || {}, {convocatoria: t.value}); render(); }
      else if(t.dataset.nps && t.files[0]){
        const x = incluidos().find(y => y.c.slug === t.dataset.nps);
        try{ S.nppend[x.c.slug] = await procesarNps(x, t.files[0]); }catch(err){ alert(err.message); }
        render();
      }
    }catch(err){ console.error(err); alert("No se pudo completar: " + err.message); }
  }

  async function abrir(){
    montar();
    host.classList.remove("hidden"); document.body.style.overflow = "hidden";
    host.innerHTML = '<div class="rm-wrap"><p>Cargando cursos, configuración y cierres…</p></div>';
    try{
      if(!S.store) S.store = storeFirestore();
      if(!S.corte){ try{ S.corte = localStorage.getItem("rm-corte") || ""; }catch(_){ } if(!S.corte) S.corte = hoy(); }
      [S.cursos, S.cfgs, S.cierres] = await Promise.all([S.store.listCursos(), S.store.getConfigs(), S.store.listCierres()]);
      await render();
      for(const x of incluidos()){ if(!S.masters[x.c.slug]){ S.masters[x.c.slug] = await S.store.getMaster(x.c.slug); await render(); } }
    }catch(err){
      console.error(err);
      host.innerHTML = '<div class="rm-wrap"><p class="rm-warn">No se pudo cargar el reporte: ' + esc(err.message) + ". Revisa que las reglas de Firestore permitan config_reporte y cierres.</p>" + btn("cerrar-pantalla", "Volver") + "</div>";
    }
  }

  root.ReporteUI = {abrir, _S: S, _setStore: s => { S.store = s; }, DEFAULTS, SEMILLA_2026_10};
})(typeof self !== "undefined" ? self : this);
