// Job Profile printable PDF.
// Uses the BROWSER's native print engine (window.print) instead of html2canvas.
// Result: vector PDF, selectable text, tiny file size, perfect text centering,
// and zero of the inline-block / line-height quirks of html2canvas.
//
// UX: opens a print dialog where the user picks "Save as PDF" (or chooses a
// physical printer). The print view is fully styled to match the on-screen
// editor (dark banners, coloured criterion cells, value pills) so what is
// printed equals what is shown.

const escape = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const nl2br = (s) => escape(s).replace(/\n/g, "<br/>");

const styles = `
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    font-size: 11px;
    line-height: 1.45;
    background: #ffffff;
  }

  /* Header band */
  .header { background: #153d63; color: #ffffff; padding: 14px 18px; margin-bottom: 14px; }
  .header .sub { display: block; font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1.6px; margin: 0 0 4px 0; }
  .header h1 { font-size: 22px; margin: 0; letter-spacing: 0.2px; font-weight: 700; }

  /* Three-column grids */
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .field { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; }
  .field .label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 3px 0; }
  .field .value { font-size: 11px; color: #0f172a; margin: 0; }

  /* Section banner */
  .banner { background: #153d63; color: #ffffff; padding: 7px 14px; font-size: 10px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; margin: 16px 0 10px 0; page-break-after: avoid; break-after: avoid; }

  .text-block { background: #ffffff; border: 1px solid #e2e8f0; padding: 10px 12px; font-size: 11px; line-height: 1.5; min-height: 30px; }

  /* Tables */
  table.data { border-collapse: collapse; width: 100%; font-size: 10px; table-layout: fixed; page-break-inside: avoid; break-inside: avoid; }
  table.data th, table.data td { border: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: middle; word-wrap: break-word; }
  table.data thead th { background: #f1f5f9; font-size: 9px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }

  .crit-title { background: #f1f5f9 !important; font-size: 9px; color: #334155 !important; text-transform: uppercase; letter-spacing: 0.6px; text-align: center !important; padding: 5px 4px !important; }
  th.crit-head { color: #ffffff !important; font-size: 9px; font-weight: 700; text-align: center !important; padding: 5px 2px !important; text-transform: uppercase; white-space: nowrap; letter-spacing: 0; }
  th.crit-ideal,        td.crit-ideal,        .crit-ideal        { background: #0e7490 !important; }
  th.crit-esperado,     td.crit-esperado,     .crit-esperado     { background: #047857 !important; }
  th.crit-intermedio,   td.crit-intermedio,   .crit-intermedio   { background: #b45309 !important; }
  th.crit-insuficiente, td.crit-insuficiente, .crit-insuficiente { background: #be123c !important; }

  .cell-ideal        { background: #cffafe !important; color: #164e63; font-weight: 700; text-align: center; }
  .cell-esperado     { background: #d1fae5 !important; color: #064e3b; font-weight: 700; text-align: center; }
  .cell-intermedio   { background: #fef3c7 !important; color: #78350f; font-weight: 700; text-align: center; }
  .cell-insuficiente { background: #ffe4e6 !important; color: #881337; font-weight: 700; text-align: center; }

  /* Pills — using flex wrapper for true vertical/horizontal centering. Native
     browser printing supports flex perfectly (unlike html2canvas). */
  .pills { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; }
  .pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px 12px;
    font-size: 10px;
    line-height: 1;
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #e2e8f0;
    font-weight: 500;
  }
  .pill.active { background: #153d63; color: #ffffff; border-color: #153d63; }

  .footer-meta { margin-top: 18px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: right; }

  /* When printing, hide any browser print headers added to the popup window. */
  @media print {
    body { margin: 0; }
  }
`;

const fieldBox = (label, value) =>
  `<div class="field"><p class="label">${escape(label)}</p><p class="value">${nl2br(value || "—")}</p></div>`;

const renderCriteriaTable = (rows, opts = {}) => {
  const showResultado = opts.showResultadoColumn !== false;
  const metricLabel = opts.metricLabel || "KPI / Cómo se mide";
  const resultadoLabel = opts.resultadoLabel || "Resultados Principales";
  const empty = !rows || rows.length === 0;

  // Wider data columns; criterion columns share the rest in 4 equal slices.
  const W_RES = 24;
  const W_METRIC = showResultado ? 22 : 44;
  const W_TIME = 10;
  const W_CRIT = (100 - (showResultado ? W_RES : 0) - W_METRIC - W_TIME) / 4;
  const totalCols = (showResultado ? 1 : 0) + 2 + 4;

  return `
    <table class="data">
      <colgroup>
        ${showResultado ? `<col style="width:${W_RES}%"/>` : ""}
        <col style="width:${W_METRIC}%"/>
        <col style="width:${W_TIME}%"/>
        <col style="width:${W_CRIT}%"/>
        <col style="width:${W_CRIT}%"/>
        <col style="width:${W_CRIT}%"/>
        <col style="width:${W_CRIT}%"/>
      </colgroup>
      <thead>
        <tr>
          ${showResultado ? `<th rowspan="2">${escape(resultadoLabel)}</th>` : ""}
          <th rowspan="2">${escape(metricLabel)}</th>
          <th rowspan="2">Temporalidad</th>
          <th colspan="4" class="crit-title">Criterio de éxito</th>
        </tr>
        <tr>
          <th class="crit-head crit-ideal">IDEAL</th>
          <th class="crit-head crit-esperado">ESPERADO</th>
          <th class="crit-head crit-intermedio">INTERMEDIO</th>
          <th class="crit-head crit-insuficiente">INSUFICIENTE</th>
        </tr>
      </thead>
      <tbody>
        ${
          empty
            ? `<tr><td colspan="${totalCols}" style="text-align:center;color:#94a3b8;padding:18px;">Sin filas registradas.</td></tr>`
            : rows
                .map(
                  (r) => `
            <tr>
              ${showResultado ? `<td>${escape(r.resultado || "")}</td>` : ""}
              <td>${escape(r.kpi || r.descripcion || "")}</td>
              <td>${escape(r.temporalidad || "")}</td>
              <td class="cell-ideal">${escape(r.ideal || "—")}</td>
              <td class="cell-esperado">${escape(r.esperado || "—")}</td>
              <td class="cell-intermedio">${escape(r.intermedio || "—")}</td>
              <td class="cell-insuficiente">${escape(r.insuficiente || "—")}</td>
            </tr>`,
                )
                .join("")
        }
      </tbody>
    </table>
  `;
};

const buildHtml = (profile, allValues = []) => {
  const today = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  const valoresUniverse = allValues.length ? allValues : profile.valores || [];
  const valoresList = valoresUniverse
    .map((v) => `<span class="pill ${profile.valores?.includes(v) ? "active" : ""}">${escape(v)}</span>`)
    .join("");

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/>
<title>Perfil del Puesto - ${escape(profile.puesto || "Sin nombre")}</title>
<style>${styles}</style>
</head><body>
  <div class="header">
    <span class="sub">Perfil del Puesto</span>
    <h1>${escape(profile.puesto || "Sin nombre")}</h1>
  </div>

  <div class="grid3">
    ${fieldBox("Departamento", profile.departamento)}
    ${fieldBox("Jefe Directo", profile.jefeDirecto)}
    ${fieldBox("Identificador", profile.id)}
  </div>

  <div class="field">
    <p class="label">Propósito (¿Por qué estoy en la nómina?)</p>
    <p class="value">${nl2br(profile.proposito || "—")}</p>
  </div>

  <div class="banner">1. Principales Responsabilidades y Funciones</div>
  <div class="text-block">${nl2br(profile.responsabilidades || "—")}</div>

  <div class="banner">2. Resultados Esperados (KPIs)</div>
  ${renderCriteriaTable(profile.kpis || [], { resultadoLabel: "Resultados Principales", metricLabel: "KPI / Cómo se mide" })}

  <div class="banner">3. Proyectos Estratégicos / OKRs</div>
  ${renderCriteriaTable(profile.okrs || [], { showResultadoColumn: false, metricLabel: "Descripción del OKR" })}

  <div class="banner">4. Conocimientos / Habilidades / Competencias</div>
  <div class="grid3">
    ${fieldBox("Experiencia", profile.experiencia)}
    ${fieldBox("Conocimientos / Formación", profile.conocimientos)}
    ${fieldBox("Competencias Soft", profile.competenciasSoft)}
  </div>

  <div class="banner">5. Valores de Empresa</div>
  <div class="pills">${valoresList || `<span style="color:#94a3b8;font-size:11px;">Sin valores seleccionados.</span>`}</div>

  <div class="footer-meta">Generado el ${today}</div>

  <script>
    window.addEventListener('load', function() {
      // Wait for fonts/layout to settle, then trigger the print dialog.
      setTimeout(function() {
        window.focus();
        window.print();
      }, 250);
      // After printing (or cancelling) close the popup.
      window.addEventListener('afterprint', function() { window.close(); });
    });
  </script>
</body></html>`;
};

export const downloadJobProfilePdf = async (profile, allValues = []) => {
  const html = buildHtml(profile, allValues);
  // Use a hidden iframe so the popup blocker never trips and the user stays on
  // the page. The iframe loads the document, then triggers print().
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1000);
  };

  iframe.onload = () => {
    try {
      const win = iframe.contentWindow;
      win.focus();
      win.print();
      // Some browsers fire afterprint on the iframe window
      win.addEventListener("afterprint", cleanup);
      // Fallback cleanup after a generous timeout
      setTimeout(cleanup, 60_000);
    } catch (e) {
      console.error("Print error:", e);
      cleanup();
    }
  };

  // Write the document into the iframe.
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
};
