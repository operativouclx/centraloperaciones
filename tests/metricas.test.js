const test = require("node:test");
const assert = require("node:assert");
const M = require("../reporte/metricas.js");
const oct = require("./estado-octubre.json");

// Genera filas inventadas que producen justo las métricas de un curso.
function filasDe(c){
  const rows = [];
  const add = (n, estado, prog) => { for(let i = 0; i < n; i++) rows.push({estado, progreso: prog}); };
  add(c.b1, "En plataforma", "10.5%");
  add(c.b2, "En plataforma", "40%");
  add(c.b3, "En plataforma", "60%");
  add(c.b4, "En plataforma", "85%");
  add(c.fin, "En plataforma", "100%");
  add(c.inact, "En plataforma", "0%");
  add(c.falta, "Falta registrar", "0%");
  return rows;
}

test("cada curso de octubre da exactamente la tabla", () => {
  Object.entries(oct).forEach(([nombre, c]) => {
    const m = M.calcularMetricas(filasDe(c), {convocatoria: "EN PROGRESO"});
    ["plat", "falta", "act", "inact", "b1", "b2", "b3", "b4", "fin"].forEach(k =>
      assert.strictEqual(m[k], c[k], nombre + " " + k));
    assert.strictEqual(m.b1 + m.b2 + m.b3 + m.b4 + m.fin, m.act, nombre);
  });
});

test("límites de los tramos", () => {
  const r = p => ({estado: "En plataforma", progreso: p});
  const m = M.calcularMetricas([r("0%"), r("1%"), r("25%"), r("25.1%"), r("50%"), r("50.5%"), r("79.9%"), r("80%"), r("99.9%"), r("100%")], {});
  assert.deepStrictEqual([m.b1, m.b2, m.b3, m.b4, m.fin, m.act, m.inact], [2, 2, 2, 2, 1, 9, 1]);
});

test("convocatoria finalizada usa inscritos y becas fijos; vacíos usan filas", () => {
  const rows = filasDe(oct["Mi Prepa Santander"]);
  const f = M.calcularMetricas(rows, {convocatoria: "FINALIZADA", inscritos_fijos: 2068, becas_fijas: 2062});
  assert.strictEqual(f.insc, 2068); assert.strictEqual(f.beca, 2062);
  const v = M.calcularMetricas(rows, {convocatoria: "FINALIZADA"});
  assert.strictEqual(v.insc, rows.length);
  const p = M.calcularMetricas(rows, {convocatoria: "EN PROGRESO", inscritos_fijos: 5});
  assert.strictEqual(p.insc, rows.length);
});

test("no retroceso: NV IV base 416, cierre previo 421", () => {
  const c = oct["No+Violencia IV"];
  const m = M.calcularMetricas(filasDe(Object.assign({}, c, {fin: 416, act: c.act - 5})), {});
  assert.strictEqual(m.fin, 416);
  const r = M.aplicarNoRetroceso(m, {fin: 421}, true);
  assert.strictEqual(r.m.fin, 421);
  assert.strictEqual(r.m.act, m.act + 5);
  assert.strictEqual(r.m.plat, m.plat + 5);
  assert.strictEqual(r.m.b1 + r.m.b2 + r.m.b3 + r.m.b4 + r.m.fin, r.m.act);
  assert.strictEqual(r.ajustes[0].texto, "Se ajustó Terminaron: la base dice 416, el reporte dice 421");
  assert.strictEqual(M.aplicarNoRetroceso(m, {fin: 421}, false).m.fin, 416);
  assert.strictEqual(M.aplicarNoRetroceso(m, null, true).ajustes.length, 0);
});

test("septiembre vs octubre de Matemáticamente", () => {
  const sep = {insc: 2185, beca: 2185, plat: 2036, act: 930, b1: 725, b2: 73, b3: 22, b4: null, fin: 110};
  const o = oct["Matemáticamente"];
  assert.strictEqual(M.chipConteo(o.insc, sep.insc, "up").texto, "316 pers. · 14.5%");
  assert.strictEqual(M.chipConteo(o.insc, sep.insc, "up").tipo, "verde");
  assert.strictEqual(M.chipConteo(o.b4, sep.b4, "neutral"), null);
  const r = M.tasaSantander(o), pr = M.tasaSantander(sep);
  const t = M.chipTasa(o.fin, sep.fin, r, pr);
  assert.strictEqual(t.texto, "35 pers. · +1 pp");
});

test("chips: sin cambio, <0.1%, anterior 0, colores", () => {
  assert.strictEqual(M.chipConteo(10, 10, "up").texto, "= sin cambio");
  assert.strictEqual(M.chipConteo(100001, 100000, "up").texto, "1 pers. · <0.1%");
  assert.strictEqual(M.chipConteo(5, 0, "up").texto, "5 pers.");
  assert.strictEqual(M.chipConteo(8, 10, "down").tipo, "verde");
  assert.strictEqual(M.chipConteo(12, 10, "down").tipo, "rojo");
  assert.strictEqual(M.chipConteo(12, 10, "neutral").tipo, "gris");
  const t = M.chipTasa(100, 100, 5, 4);
  assert.strictEqual(t.texto, "0 pers. · +1 pp"); assert.strictEqual(t.subio, true);
});

test("NPS", () => {
  assert.strictEqual(M.npsScore({promotores: 123, pasivos: 28, detractores: 6}), 75);
  assert.deepStrictEqual(M.npsDesdeCalificaciones([10, 9, 8, 7, 6, 0]), {promotores: 2, pasivos: 2, detractores: 2});
  assert.strictEqual(M.npsScore(null), null);
});

test("cierre anterior es el más reciente previo de ese curso", () => {
  const cs = [{id: "2026-08", cursos: {a: {fin: 1}}}, {id: "2026-09", cursos: {b: {fin: 5}}}, {id: "2026-10", cursos: {a: {fin: 9}}}];
  assert.strictEqual(M.cierreAnterior(cs, "a", "2026-11").fin, 9);
  assert.strictEqual(M.cierreAnterior(cs, "a", "2026-10").fin, 1);
  assert.strictEqual(M.cierreAnterior(cs, "c", "2026-11"), null);
});

test("frescura y fechas", () => {
  const rows = [{ultimaActualizacionPlataforma: "2026-10-12"}, {ultimaActualizacionPlataforma: "2026-10-10"}];
  const f = M.frescura(rows, "2026-10-30");
  assert.strictEqual(f.dias, 18); assert.strictEqual(f.vieja, true);
  assert.strictEqual(M.frescura([{ultimaActualizacionPlataforma: "2026-10-28"}], "2026-10-30").vieja, false);
  assert.strictEqual(M.fechaCorteCorta("2026-10-30"), "30 oct 2026");
  assert.strictEqual(M.fechaCorteLarga("2026-10-30"), "30 de octubre de 2026");
  assert.strictEqual(M.mesAnio("2026-11-02"), "Nov 2026");
});
