/* Base completa en Excel (ExcelJS). Una hoja por curso incluido, con las
   columnas Estado, Progreso, Nombre, Email. Sin ajustes: tal cual la base. */
(function(root, factory){
  if(typeof module === "object" && module.exports) module.exports = factory();
  else root.ReporteXlsx = factory();
})(typeof self !== "undefined" ? self : this, function(){

  const AZUL = "FF4069BC", AZUL_OSCURO = "FF2E4F91", MORADO = "FF9987FF", GRIS = "FF5C5C7A", TINTA = "FF14213B";

  function nombreHoja(n, usados){
    let base = (String(n).replace(/[\\\/\*\?\[\]:]/g, " ").trim() || "Curso").slice(0, 31);
    let nombre = base, i = 2;
    while(usados.has(nombre.toLowerCase())){
      const suf = " " + i++;
      nombre = base.slice(0, 31 - suf.length) + suf;
    }
    usados.add(nombre.toLowerCase());
    return nombre;
  }

  function nombreCompleto(r){
    const t = r.nombres || r.apellidos ? (r.nombres || "") + " " + (r.apellidos || "") : (r.nombre || r.Nombre || "");
    return String(t).replace(/\s+/g, " ").trim();
  }
  function progresoTexto(v){
    if(typeof v === "number") return v + "%";
    return v === null || v === undefined || v === "" ? "0%" : String(v);
  }

  // o: {cursos:[{hoja, rows}], corteLargo, hoyLargo, usuario}
  async function construirLibro(ExcelJS, o){
    const wb = new ExcelJS.Workbook();
    wb.creator = "Central operativa UCLX";
    wb.created = new Date();

    const p = wb.addWorksheet("Portada", {views: [{showGridLines: false}]});
    p.getColumn(1).width = 4;
    p.getColumn(2).width = 100;
    const put = (ref, texto, font, wrap) => {
      const c = p.getCell(ref); c.value = texto; c.font = font;
      if(wrap) c.alignment = {wrapText: true};
    };
    put("B6", "Base completa de cursos — Operaciones UCLX", {bold: true, size: 18, color: {argb: AZUL_OSCURO}});
    put("B8", "Corte al " + o.corteLargo + ". Generado el " + o.hoyLargo + (o.usuario ? " por " + o.usuario : "") + ".", {size: 11, color: {argb: GRIS}});
    put("B11", "Cómo usar este archivo", {bold: true, size: 13, color: {argb: MORADO}});
    [
      "Cada curso tiene su propia hoja (pestaña abajo).",
      "Cada fila es una persona. Estado dice si ya está en plataforma o falta registrarla, y Progreso es su avance.",
      "Es una fotografía a la fecha de corte y no se actualiza sola."
    ].forEach((t, i) => put("B" + (12 + i), "•  " + t, {size: 11, color: {argb: TINTA}}, true));
    put("B16", "Cursos incluidos (" + o.cursos.length + ")", {bold: true, size: 13, color: {argb: MORADO}});

    const usados = new Set(["portada"]);
    o.cursos.forEach((c, i) => {
      const nombre = nombreHoja(c.hoja, usados);
      put("B" + (17 + i), {text: c.hoja, hyperlink: "#'" + nombre + "'!A1"}, {size: 11, color: {argb: AZUL_OSCURO}});
      const ws = wb.addWorksheet(nombre, {views: [{state: "frozen", ySplit: 1, topLeftCell: "A2"}]});
      ws.columns = [
        {header: "Estado", key: "estado", width: 16},
        {header: "Progreso", key: "progreso", width: 11},
        {header: "Nombre", key: "nombre", width: 48},
        {header: "Email", key: "email", width: 48}
      ];
      c.rows.forEach(r => ws.addRow({
        estado: r.estado || r.Estado || "",
        progreso: progresoTexto(r.progreso !== undefined ? r.progreso : r.Progreso),
        nombre: nombreCompleto(r),
        email: r.email || r.Email || ""
      }));
      ws.getRow(1).eachCell(cell => {
        cell.font = {bold: true, color: {argb: "FFFFFFFF"}};
        cell.fill = {type: "pattern", pattern: "solid", fgColor: {argb: AZUL}};
        cell.alignment = {vertical: "middle"};
      });
      ws.autoFilter = {from: {row: 1, column: 1}, to: {row: 1, column: 4}};
    });
    return wb;
  }

  return {construirLibro, nombreCompleto, progresoTexto};
});
