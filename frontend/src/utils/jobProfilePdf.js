// PDF for "Perfil del Puesto" — print-safe layout for html2pdf / html2canvas.
// Width = A4 portrait minus margins (≈ 720px @ 96dpi) so nothing is cut off.
// No nested tables, no CSS grid, no flex with align-items.
// Pills use symmetric padding (line-height 1 unreliable in html2canvas).

import html2pdf from "html2pdf.js";

// A4 = 210mm wide. Page margin 8mm L/R → 194mm content. 1mm = 96/25.4 px.
const PAGE_MARGIN_MM = 8;
const PAGE_INNER_MM = 210 - PAGE_MARGIN_MM * 2; // 194 mm
const PAGE_INNER_PX = Math.round((PAGE_INNER_MM * 96) / 25.4); // ~733 px

const escape = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const nl2br = (s) => escape(s).replace(/\n/g, "<br/>");

const styles = `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; color: #0f172a; background: #ffffff; }

  .pdf-root { width: ${PAGE_INNER_PX}px; padding: 0; background: #ffffff; }

  /* Header band */
  .header { background: #0f172a; color: #ffffff; padding: 16px 20px; border-radius: 10px; margin-bottom: 14px; }
  .header .sub { display: block; font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1.6px; margin: 0 0 6px 0; }
  .header h1 { font-size: 22px; margin: 0; letter-spacing: 0.3px; font-weight: 700; }

  /* Three-up layout via real <table> (more reliable than grid in html2canvas) */
  table.layout { width: 100%; border-collapse: separate; border-spacing: 8px 0; }
  table.layout > tbody > tr > td { vertical-align: top; padding: 0; }

  .field { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .field .label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0; }
  .field .value { font-size: 11px; color: #0f172a; margin: 0; line-height: 1.45; }

  /* Section banner */
  .banner { background: #0f172a; color: #ffffff; padding: 8px 14px; border-radius: 6px; font-size: 10px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; margin: 16px 0 10px 0; page-break-inside: avoid; break-inside: avoid; }

  .text-block { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 11px; line-height: 1.5; color: #1e293b; min-height: 32px; }

  /* Data tables */
  table.data { border-collapse: collapse; width: 100%; font-size: 10px; table-layout: fixed; page-break-inside: avoid; break-inside: avoid; }
  table.data th, table.data td { border: 1px solid #e2e8f0; padding: 7px 8px; vertical-align: middle; word-wrap: break-word; }
  table.data thead th { background: #f1f5f9; font-size: 9px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }

  /* Criterion title row + 4 colour cells. NO NESTED TABLES. */
  .crit-title  { background: #f1f5f9; font-size: 9px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.8px; text-align: center !important; padding: 5px 0 !important; border: 1px solid #e2e8f0; vertical-align: middle; text-indent: 0.8px; }
  .crit-head { color: #ffffff !important; font-size: 9px; font-weight: 700; text-align: center !important; letter-spacing: 0; padding: 5px 0 !important; border: 1px solid #e2e8f0; vertical-align: middle; }
  .crit-ideal        { background: #06b6d4; }
  .crit-esperado     { background: #10b981; }
  .crit-intermedio   { background: #f59e0b; }
  .crit-insuficiente { background: #f43f5e; }

  /* Coloured cell bodies */
  .cell-ideal        { background: #ecfeff; color: #0e7490; font-weight: 700; text-align: center; }
  .cell-esperado     { background: #ecfdf5; color: #047857; font-weight: 700; text-align: center; }
  .cell-intermedio   { background: #fffbeb; color: #b45309; font-weight: 700; text-align: center; }
  .cell-insuficiente { background: #fff1f2; color: #be123c; font-weight: 700; text-align: center; }

  /* Pills: html2canvas-safe — only symmetric padding, natural line-height,
     no fixed height, no line-height:0 wrappers. */
  .pills { margin: 0; padding: 0; }
  .pill {
    display: inline-block;
    padding: 5px 14px 5px 14px;
    border-radius: 999px;
    font-size: 10px;
    line-height: 1.3;
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #e2e8f0;
    margin: 0 6px 6px 0;
    font-weight: 500;
    vertical-align: middle;
  }
  .pill.active { background: #0f172a; color: #ffffff; border-color: #0f172a; }

  .footer-meta { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: right; }
`;

// Three-up via a real table (one row, three equal columns).
const threeUp = (a, b, c) => `
  <table class="layout"><tbody><tr>
    <td style="width:33.33%">${a}</td>
    <td style="width:33.33%">${b}</td>
    <td style="width:33.33%">${c}</td>
  </tr></tbody></table>
`;

const fieldBox = (label, value) =>
  `<div class="field"><p class="label">${escape(label)}</p><p class="value">${nl2br(value || "—")}</p></div>`;

// Two-row header using rowspan for the left columns and colspan for the criterion title.
// Avoids nested tables entirely (which html2canvas frequently mis-renders).
const renderCriteriaTable = (rows, opts = {}) => {
  const showResultado = opts.showResultadoColumn !== false;
  const metricLabel = opts.metricLabel || "KPI / Cómo se mide";
  const resultadoLabel = opts.resultadoLabel || "Resultados Principales";
  const empty = !rows || rows.length === 0;

  // Column widths sum to 100%.
  // KPI (with resultado): 22% + 22% + 14% + 4 × 10.5% = 86% (the borders eat the rest).
  const W_RES = 22;
  const W_METRIC = showResultado ? 22 : 36;
  const W_TIME = 14;
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
          ${showResultado ? `<th rowspan="2" style="text-align:left">${escape(resultadoLabel)}</th>` : ""}
          <th rowspan="2" style="text-align:left">${escape(metricLabel)}</th>
          <th rowspan="2" style="text-align:left">Temporalidad</th>
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

  return `
    <div class="pdf-root">
      <div class="header">
        <span class="sub">Perfil del Puesto</span>
        <h1>${escape(profile.puesto || "Sin nombre")}</h1>
      </div>

      ${threeUp(
        fieldBox("Departamento", profile.departamento),
        fieldBox("Jefe Directo", profile.jefeDirecto),
        fieldBox("Identificador", profile.id),
      )}

      <div style="height:8px"></div>
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
      ${threeUp(
        fieldBox("Experiencia", profile.experiencia),
        fieldBox("Conocimientos / Formación", profile.conocimientos),
        fieldBox("Competencias Soft", profile.competenciasSoft),
      )}

      <div class="banner">5. Valores de Empresa</div>
      <div class="pills">${valoresList || `<span style="color:#94a3b8;font-size:11px;">Sin valores seleccionados.</span>`}</div>

      <div class="footer-meta">Generado el ${today}</div>
    </div>
  `;
};

export const downloadJobProfilePdf = async (profile, allValues = []) => {
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.background = "#ffffff";
  wrapper.style.width = `${PAGE_INNER_PX}px`;
  wrapper.innerHTML = `<style>${styles}</style>${buildHtml(profile, allValues)}`;
  document.body.appendChild(wrapper);

  const filename = `Perfil_${(profile.puesto || "Puesto").replace(/[^a-z0-9]+/gi, "_")}.pdf`;

  try {
    await html2pdf()
      .from(wrapper.querySelector(".pdf-root"))
      .set({
        margin: [PAGE_MARGIN_MM, PAGE_MARGIN_MM, PAGE_MARGIN_MM + 2, PAGE_MARGIN_MM],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          letterRendering: true,
          logging: false,
          width: PAGE_INNER_PX,
          windowWidth: PAGE_INNER_PX,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
        pagebreak: { mode: ["css", "legacy"], avoid: [".banner", "table.data", ".field"] },
      })
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
};
