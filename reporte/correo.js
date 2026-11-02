/* Texto del correo mensual para Santander. */
(function(root, factory){
  if(typeof module === "object" && module.exports) module.exports = factory(require("./metricas.js"));
  else root.ReporteCorreo = factory(root.ReporteMetricas);
})(typeof self !== "undefined" ? self : this, function(M){

  // Cursos con número romano o "G#" son generaciones; el resto, convocatorias.
  function etiquetaNueva(nombre){
    return /\b(II|III|IV|V|VI|VII|VIII|IX|X)\b|\bG\d+\b/.test(nombre) ? "(generación nueva)" : "(convocatoria nueva)";
  }

  // cursos: [{nombre, convocatoria, m, prev, nps, usaNps}] (ya ordenados)
  function construirCorreo(o){
    const fmt = n => Number(n).toLocaleString("en-US");
    const asunto = "Reporte mensual de cursos Santander Open Academy, corte al " + o.corteLargo;
    const lineas = o.cursos.map(c => {
      const finalizada = c.convocatoria === "FINALIZADA";
      let t = "- " + c.nombre + ": " + fmt(finalizada ? c.m.beca : c.m.insc) + (finalizada ? " becas" : " inscritos") +
        ", " + fmt(c.m.act) + " activos y " + fmt(c.m.fin) + " personas que terminaron (" + M.tasaSantander(c.m) + "% de las becas).";
      const score = c.usaNps ? M.npsScore(c.nps) : null;
      if(score !== null) t += " NPS " + (score >= 0 ? "+" : "") + score + ".";
      if(!c.prev) t += " " + etiquetaNueva(c.nombre);
      return t;
    });
    const conFalta = o.cursos.filter(c => c.m.falta > 0);
    const totalFalta = conFalta.reduce((a, c) => a + c.m.falta, 0);

    const partes = [
      "Hola " + (o.destinatario || "{destinatario}") + ",",
      "",
      "Adjunto un PDF por curso y la base completa con el estado y el avance de cada persona.",
      "",
      lineas.join("\n")
    ];
    if(totalFalta > 0){
      partes.push("", fmt(totalFalta) + " personas siguen sin registro en plataforma: " +
        conFalta.map(c => c.nombre + " (" + c.m.falta + ")").join(", ") + ".");
    }
    partes.push("",
      "Cada PDF muestra el cambio contra el reporte anterior, en personas y en porcentaje. Los cursos nuevos no llevan ese cambio.",
      "",
      "Quedo al pendiente de cualquier duda.",
      "",
      "Saludos,",
      o.firma || "");
    return {asunto, cuerpo: partes.join("\n")};
  }

  return {construirCorreo, etiquetaNueva};
});
