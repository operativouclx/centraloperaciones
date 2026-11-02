/* Exportar dashboards a PDF.
   Camino principal: iframe oculto + print() (vectorial, texto seleccionable).
   Respaldo: "Descarga rápida" con jsPDF + html2canvas (queda como imagen). */
(function(root){
  const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  const H2C_URL = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

  function cargarScript(url){
    return new Promise((ok, mal) => {
      const s = document.createElement("script");
      s.src = url; s.onload = ok; s.onerror = () => mal(new Error("No se pudo cargar " + url));
      document.head.appendChild(s);
    });
  }

  // paginas: strings HTML de ReporteDashboard.pagina(); titulo: nombre de archivo sugerido.
  async function imprimir(paginas, titulo, fontUrl){
    const D = root.ReporteDashboard;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(D.documentoImpresion(paginas, titulo, fontUrl));
    doc.close();
    doc.title = titulo;
    try{
      await Promise.all(Array.from(doc.images).map(i => i.decode ? i.decode().catch(() => {}) : Promise.resolve()));
      await doc.fonts.ready;
      await doc.fonts.load("800 26px Inter");
    }catch(e){ /* se imprime igual */ }
    await new Promise(r => setTimeout(r, 150));
    const limpiar = () => setTimeout(() => iframe.remove(), 1000);
    iframe.contentWindow.addEventListener("afterprint", limpiar);
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }

  async function descargaRapida(paginas, titulo, fontUrl){
    if(!root.jspdf) await cargarScript(JSPDF_URL);
    if(!root.html2canvas) await cargarScript(H2C_URL);
    const estilo = document.createElement("style");
    estilo.textContent = root.ReporteDashboard.cssBase(fontUrl);
    document.head.appendChild(estilo);
    const caja = document.createElement("div");
    caja.style.cssText = "position:fixed;left:-20000px;top:0;width:1240px;";
    document.body.appendChild(caja);
    try{
      await document.fonts.load("800 26px Inter");
      const pdf = new root.jspdf.jsPDF({orientation: "landscape", unit: "px", format: [1056, 816], hotfixes: ["px_scaling"]});
      for(let i = 0; i < paginas.length; i++){
        caja.innerHTML = paginas[i];
        const nodo = caja.firstElementChild;
        await Promise.all(Array.from(nodo.querySelectorAll("img")).map(im => im.decode ? im.decode().catch(() => {}) : Promise.resolve()));
        const canvas = await root.html2canvas(nodo, {scale: 3, backgroundColor: "#f2f1f8", useCORS: true});
        if(i > 0) pdf.addPage([1056, 816], "landscape");
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 1056, 816);
      }
      pdf.save(titulo);
    } finally {
      caja.remove(); estilo.remove();
    }
  }

  root.ReportePdf = {imprimir, descargaRapida};
})(typeof self !== "undefined" ? self : this);
