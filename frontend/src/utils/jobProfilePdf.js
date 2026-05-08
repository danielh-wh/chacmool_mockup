// Generates a printable PDF that mimics the original "Perfil del Puesto" template:
// header banner with title, dark section banners, and color-coded criteria tables
// (Ideal/Esperado/Intermedio/Insuficiente). Buttons / sidebar / form chrome are NOT included.

import html2pdf from "html2pdf.js";

const escape = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const nl2br = (s) => escape(s).replace(/\n/g, "<br/>");

const styles = `
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; color: #0f172a; margin: 0; }
  .pdf-root { padding: 28px 32px; width: 794px; }
  .header { background: #0f172a; color: white; padding: 18px 22px; border-radius: 12px; margin-bottom: 18px; }
  .header h1 { margin: 0; font-size: 22px; letter-spacing: 0.5px; }
  .header .sub { margin-top: 4px; font-size: 11px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1.5px; }
  .grid { display: grid; gap: 12px; margin-bottom: 14px; }
  .grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
  .field { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; }
  .field .label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
  .field .value { font-size: 12px; color: #0f172a; line-height: 1.4; }
  .banner { background: #0f172a; color: white; padding: 8px 14px; border-radius: 6px; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin: 18px 0 10px 0; }
  .text-block { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 11px; line-height: 1.5; color: #1e293b; min-height: 36px; }
  table { border-collapse: collapse; width: 100%; font-size: 10px; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: middle; }
  th { background: #f1f5f9; font-size: 9px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
  .crit-head { color: white; font-size: 9px; font-weight: 700; padding: 5px 0; text-align: center; letter-spacing: 0.8px; }
  .crit-ideal { background: #06b6d4; }
  .crit-esperado { background: #10b981; }
  .crit-intermedio { background: #f59e0b; }
  .crit-insuficiente { background: #f43f5e; }
  .cell-ideal { background: #ecfeff; color: #0e7490; font-weight: 700; text-align: center; }
  .cell-esperado { background: #ecfdf5; color: #047857; font-weight: 700; text-align: center; }
  .cell-intermedio { background: #fffbeb; color: #b45309; font-weight: 700; text-align: center; }
  .cell-insuficiente { background: #fff1f2; color: #be123c; font-weight: 700; text-align: center; }
  .pill { display: inline-block; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 999px; font-size: 10px; color: #334155; margin: 0 4px 4px 0; }
  .pill.active { background: #0f172a; color: white; border-color: #0f172a; }
  .footer-meta { margin-top: 22px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: right; }
`;

const renderCriteriaTable = (rows, opts = {}) => {
  const showResultado = opts.showResultadoColumn !== false;
  const metricLabel = opts.metricLabel || "KPI / Cómo se mide";
  const resultadoLabel = opts.resultadoLabel || "Resultados Principales";
  const empty = !rows || rows.length === 0;
  return `
    <table>
      <thead>
        <tr>
          ${showResultado ? `<th style="width:22%">${resultadoLabel}</th>` : ""}
          <th style="width:${showResultado ? "22%" : "32%"}">${metricLabel}</th>
          <th style="width:13%">Temporalidad</th>
          <th colspan="4" style="padding:0;border:none;">
            <div style="background:#f1f5f9;padding:5px 0 4px 0;text-align:center;font-size:9px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:0.8px;">Criterio de éxito</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:2px;padding:2px;">
              <div class="crit-head crit-ideal">IDEAL</div>
              <div class="crit-head crit-esperado">ESPERADO</div>
              <div class="crit-head crit-intermedio">INTERMEDIO</div>
              <div class="crit-head crit-insuficiente">INSUFICIENTE</div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        ${
          empty
            ? `<tr><td colspan="${showResultado ? 7 : 6}" style="text-align:center;color:#94a3b8;padding:18px;">Sin filas registradas.</td></tr>`
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
  const valoresList = (allValues.length ? allValues : profile.valores || [])
    .map((v) => `<span class="pill ${profile.valores?.includes(v) ? "active" : ""}">${escape(v)}</span>`)
    .join("");

  return `
    <div class="pdf-root">
      <div class="header">
        <div class="sub">Perfil del Puesto</div>
        <h1>${escape(profile.puesto || "Sin nombre")}</h1>
      </div>

      <div class="grid cols-3">
        <div class="field"><div class="label">Departamento</div><div class="value">${escape(profile.departamento || "—")}</div></div>
        <div class="field"><div class="label">Jefe Directo</div><div class="value">${escape(profile.jefeDirecto || "—")}</div></div>
        <div class="field"><div class="label">Identificador</div><div class="value">${escape(profile.id || "—")}</div></div>
      </div>

      <div class="field" style="margin-bottom:8px;">
        <div class="label">Propósito (¿Por qué estoy en la nómina?)</div>
        <div class="value">${nl2br(profile.proposito || "—")}</div>
      </div>

      <div class="banner">1. Principales Responsabilidades y Funciones</div>
      <div class="text-block">${nl2br(profile.responsabilidades || "—")}</div>

      <div class="banner">2. Resultados Esperados (KPIs)</div>
      ${renderCriteriaTable(profile.kpis || [], { resultadoLabel: "Resultados Principales", metricLabel: "KPI / Cómo se mide" })}

      <div class="banner">3. Proyectos Estratégicos / OKRs</div>
      ${renderCriteriaTable(profile.okrs || [], { showResultadoColumn: false, metricLabel: "Descripción del OKR" })}

      <div class="banner">4. Conocimientos / Habilidades / Competencias</div>
      <div class="grid cols-3">
        <div class="field"><div class="label">Experiencia</div><div class="value">${nl2br(profile.experiencia || "—")}</div></div>
        <div class="field"><div class="label">Conocimientos / Formación</div><div class="value">${nl2br(profile.conocimientos || "—")}</div></div>
        <div class="field"><div class="label">Competencias Soft</div><div class="value">${nl2br(profile.competenciasSoft || "—")}</div></div>
      </div>

      <div class="banner">5. Valores de Empresa</div>
      <div>${valoresList || `<span style="color:#94a3b8;font-size:11px;">Sin valores seleccionados.</span>`}</div>

      <div class="footer-meta">Generado el ${today}</div>
    </div>
  `;
};

export const downloadJobProfilePdf = async (profile, allValues = []) => {
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.innerHTML = `<style>${styles}</style>${buildHtml(profile, allValues)}`;
  document.body.appendChild(wrapper);

  const filename = `Perfil_${(profile.puesto || "Puesto").replace(/[^a-z0-9]+/gi, "_")}.pdf`;

  try {
    await html2pdf()
      .from(wrapper.querySelector(".pdf-root"))
      .set({
        margin: [10, 10, 14, 10],
        filename,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
};
