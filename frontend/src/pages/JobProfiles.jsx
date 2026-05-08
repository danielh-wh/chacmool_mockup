import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Briefcase,
  Building2,
  UserCheck,
  Save,
  X,
  Trash2,
  Settings,
  ChevronRight,
  ClipboardList,
  Target,
  GraduationCap,
  Heart,
  FileText,
  Edit3,
  Check,
  Download,
} from "lucide-react";
import { useCompanyValues } from "../contexts/CompanyValuesContext";
import { downloadJobProfilePdf } from "../utils/jobProfilePdf";

// =====================================================================
// MOCK DATA (frontend-only first stage)
// =====================================================================
const DEPARTMENTS = [
  "Desarrollo",
  "Operaciones",
  "Ventas",
  "Soporte",
  "Administración",
  "Recursos Humanos",
  "Marketing",
  "Finanzas",
];

const TEMPORALIDADES = ["Diaria", "Semanal", "Mensual", "Trimestral", "Semestral", "Anual"];

const SEED_PROFILES = [
  {
    id: "JP-001",
    puesto: "Programador Mid",
    departamento: "Desarrollo",
    jefeDirecto: "Líder de Proyecto",
    proposito: "Apoyar el desarrollo y resolución de problemas",
    responsabilidades:
      "Garantizar el cumplimiento de metas, escribir código limpio, participar en sprints y revisiones de código.",
    kpis: [
      { id: "k1", resultado: "Cumplimiento del sprint", kpi: "Porcentaje", temporalidad: "Semanal", ideal: "100", esperado: "90", intermedio: "60", insuficiente: "10" },
      { id: "k2", resultado: "Tiempo de cumplimiento", kpi: "Fecha", temporalidad: "Semanal", ideal: "Jueves", esperado: "Viernes", intermedio: "Sábado", insuficiente: "Sig. Lunes" },
      { id: "k3", resultado: "Horas de práctica", kpi: "Cantidad de horas", temporalidad: "Semanal", ideal: "6", esperado: "4", intermedio: "2", insuficiente: "0" },
      { id: "k4", resultado: "Tasa de bugs", kpi: "Errores reportados", temporalidad: "Mensual", ideal: "0", esperado: "1", intermedio: "2", insuficiente: "3" },
    ],
    okrs: [
      { id: "o1", descripcion: "¿Cuáles son los resultados que se esperan de esta posición?", temporalidad: "Trimestral", ideal: "100", esperado: "90", intermedio: "60", insuficiente: "10" },
    ],
    experiencia: "2 años",
    conocimientos: "Ing. en Sistemas",
    competenciasSoft: "Enfoque a resultados",
    valores: ["Identidad", "Hacemos que las cosas sucedan", "Hazlo ahora"],
    kpisCount: 4,
  },
  {
    id: "JP-002",
    puesto: "Coordinador de Operaciones",
    departamento: "Operaciones",
    jefeDirecto: "Gerente de Operaciones",
    proposito: "Coordinar y supervisar las operaciones diarias",
    responsabilidades: "",
    kpis: [
      { id: "k1", resultado: "Eficiencia operativa", kpi: "Porcentaje", temporalidad: "Mensual", ideal: "95", esperado: "85", intermedio: "70", insuficiente: "50" },
      { id: "k2", resultado: "Reportes entregados", kpi: "Cantidad", temporalidad: "Semanal", ideal: "5", esperado: "4", intermedio: "3", insuficiente: "1" },
    ],
    okrs: [],
    experiencia: "5 años",
    conocimientos: "Lic. en Administración",
    competenciasSoft: "Liderazgo, comunicación",
    valores: ["Identidad", "Trabajo en equipo"],
    kpisCount: 2,
  },
];

// =====================================================================
// SHARED UI HELPERS
// =====================================================================
const SectionBanner = ({ icon: Icon, number, title }) => (
  <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center gap-2.5 mb-4">
    {Icon && <Icon className="w-4 h-4 text-slate-300" />}
    <span className="text-xs font-bold tracking-wider uppercase">
      {number ? `${number}. ` : ""}
      {title}
    </span>
  </div>
);

const Field = ({ label, children, hint }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
      {label}
    </label>
    {children}
    {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className={
      (props.className || "") +
      " w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-colors"
    }
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className={
      (props.className || "") +
      " w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 appearance-none bg-no-repeat bg-[right_0.5rem_center] pr-8"
    }
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
      backgroundSize: "1rem",
    }}
  >
    {children}
  </select>
);

const TextArea = (props) => (
  <textarea
    {...props}
    className={
      (props.className || "") +
      " w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-colors resize-y"
    }
  />
);

// Criteria color tokens (close to the PDF)
const CRITERIA = {
  ideal:        { label: "IDEAL",        bg: "bg-cyan-500",    text: "text-white", soft: "bg-cyan-50",    border: "border-cyan-300",    chip: "text-cyan-700",    chipBg: "bg-cyan-50",    ring: "ring-cyan-200" },
  esperado:     { label: "ESPERADO",     bg: "bg-emerald-500", text: "text-white", soft: "bg-emerald-50", border: "border-emerald-300", chip: "text-emerald-700", chipBg: "bg-emerald-50", ring: "ring-emerald-200" },
  intermedio:   { label: "INTERMEDIO",   bg: "bg-amber-500",   text: "text-white", soft: "bg-amber-50",   border: "border-amber-300",   chip: "text-amber-700",   chipBg: "bg-amber-50",   ring: "ring-amber-200" },
  insuficiente: { label: "INSUFICIENTE", bg: "bg-rose-500",    text: "text-white", soft: "bg-rose-50",    border: "border-rose-300",    chip: "text-rose-700",    chipBg: "bg-rose-50",    ring: "ring-rose-200" },
};

// =====================================================================
// CRITERIA TABLE (used for KPIs and OKRs)
// =====================================================================
const CriteriaTable = ({
  rows,
  onRemoveRow,
  showResultadoColumn = true,
  resultadoLabel = "RESULTADOS PRINCIPALES",
  resultadoSubtitle = "¿Cuáles son los resultados que se esperan?",
  metricLabel = "KPIs Y TEMPORALIDAD",
  metricSubtitle = "¿Cómo se miden?",
}) => {
  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-slate-200 rounded-xl py-10 text-center">
        <p className="text-sm text-slate-400">Aún no hay indicadores. Agrega el primero abajo ↓</p>
      </div>
    );
  }
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {showResultadoColumn && (
                <th className="bg-slate-50 px-4 py-3 text-left align-bottom border-b border-slate-200 min-w-[220px]">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{resultadoLabel}</div>
                  <div className="text-[10px] text-slate-400 font-normal normal-case mt-0.5">{resultadoSubtitle}</div>
                </th>
              )}
              <th className="bg-slate-50 px-4 py-3 text-left align-bottom border-b border-slate-200 min-w-[180px]">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{metricLabel}</div>
                <div className="text-[10px] text-slate-400 font-normal normal-case mt-0.5">{metricSubtitle}</div>
              </th>
              <th colSpan={4} className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-center">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Criterio de éxito</div>
                <div className="grid grid-cols-4 gap-1 mt-1.5">
                  {Object.values(CRITERIA).map((c) => (
                    <div key={c.label} className={`${c.bg} ${c.text} text-[10px] font-bold py-1 rounded`}>
                      {c.label}
                    </div>
                  ))}
                </div>
              </th>
              <th className="bg-slate-50 px-2 py-3 border-b border-slate-200 w-10">
                <Settings className="w-3.5 h-3.5 text-slate-400 mx-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/50">
                {showResultadoColumn && (
                  <td className="px-4 py-3 align-middle">
                    <span className="font-medium text-slate-800">{row.resultado || row.descripcion}</span>
                  </td>
                )}
                <td className="px-4 py-3 align-middle">
                  <div className="text-slate-700">{row.kpi || row.descripcion}</div>
                  {row.temporalidad && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
                      {row.temporalidad}
                    </span>
                  )}
                </td>
                <td className={`px-3 py-3 text-center align-middle ${CRITERIA.ideal.soft} ${CRITERIA.ideal.chip} font-bold`}>
                  {row.ideal || "—"}
                </td>
                <td className={`px-3 py-3 text-center align-middle ${CRITERIA.esperado.soft} ${CRITERIA.esperado.chip} font-bold`}>
                  {row.esperado || "—"}
                </td>
                <td className={`px-3 py-3 text-center align-middle ${CRITERIA.intermedio.soft} ${CRITERIA.intermedio.chip} font-bold`}>
                  {row.intermedio || "—"}
                </td>
                <td className={`px-3 py-3 text-center align-middle ${CRITERIA.insuficiente.soft} ${CRITERIA.insuficiente.chip} font-bold`}>
                  {row.insuficiente || "—"}
                </td>
                <td className="px-2 py-3 text-center align-middle">
                  <button
                    type="button"
                    onClick={() => onRemoveRow(row.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Eliminar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =====================================================================
// ADD-ROW FORM (KPIs)
// =====================================================================
const AddKpiRow = ({ onAdd }) => {
  const [draft, setDraft] = useState({
    resultado: "",
    kpi: "",
    temporalidad: "Mensual",
    ideal: "",
    esperado: "",
    intermedio: "",
    insuficiente: "",
  });

  const reset = () => setDraft({ resultado: "", kpi: "", temporalidad: "Mensual", ideal: "", esperado: "", intermedio: "", insuficiente: "" });

  const handleAdd = () => {
    if (!draft.resultado.trim() || !draft.kpi.trim()) return;
    onAdd({ ...draft, id: `k-${Date.now()}` });
    reset();
  };

  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
        <Plus className="w-4 h-4" />
        Añadir Nuevo Indicador
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5">
          <Field label="Resultado Principal Esperado">
            <Input placeholder="Ej. Ingresos generados por ventas" value={draft.resultado} onChange={(e) => setDraft({ ...draft, resultado: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-4">
          <Field label="Nombre del KPI / Cómo se mide">
            <Input placeholder="Ej. Cantidad de ventas en MXN" value={draft.kpi} onChange={(e) => setDraft({ ...draft, kpi: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-3">
          <Field label="Temporalidad">
            <Select value={draft.temporalidad} onChange={(e) => setDraft({ ...draft, temporalidad: e.target.value })}>
              {TEMPORALIDADES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
        </div>
      </div>
      <Field label="Define metas y criterios de éxito">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { key: "ideal", c: CRITERIA.ideal, ph: "Ej. $100,000" },
            { key: "esperado", c: CRITERIA.esperado, ph: "Ej. $80,000" },
            { key: "intermedio", c: CRITERIA.intermedio, ph: "Entre V y R" },
            { key: "insuficiente", c: CRITERIA.insuficiente, ph: "Ej. $50,000" },
          ].map(({ key, c, ph }) => (
            <div key={key} className={`flex items-stretch rounded-lg border ${c.border} overflow-hidden bg-white`}>
              <span className={`${c.bg} ${c.text} text-[10px] font-bold px-2 flex items-center tracking-wider`}>{c.label}</span>
              <input
                placeholder={ph}
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                className={`flex-1 px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none ${c.chipBg} ${c.chip}`}
              />
            </div>
          ))}
        </div>
      </Field>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!draft.resultado.trim() || !draft.kpi.trim()}
        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" /> Añadir
      </button>
    </div>
  );
};

// =====================================================================
// ADD-ROW FORM (OKRs)
// =====================================================================
const AddOkrRow = ({ onAdd }) => {
  const [draft, setDraft] = useState({
    descripcion: "",
    temporalidad: "Trimestral",
    ideal: "",
    esperado: "",
    intermedio: "",
    insuficiente: "",
  });

  const reset = () => setDraft({ descripcion: "", temporalidad: "Trimestral", ideal: "", esperado: "", intermedio: "", insuficiente: "" });

  const handleAdd = () => {
    if (!draft.descripcion.trim()) return;
    onAdd({ ...draft, id: `o-${Date.now()}` });
    reset();
  };

  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
        <Plus className="w-4 h-4" />
        Añadir Proyecto / OKR
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-9">
          <Field label="Descripción del OKR / Proyecto">
            <Input placeholder="Ej. Implementar nuevo sistema de gestión CRM" value={draft.descripcion} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-3">
          <Field label="Temporalidad">
            <Select value={draft.temporalidad} onChange={(e) => setDraft({ ...draft, temporalidad: e.target.value })}>
              {TEMPORALIDADES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { key: "ideal", c: CRITERIA.ideal, ph: "Piloto lograr" },
          { key: "esperado", c: CRITERIA.esperado, ph: "Mensionar" },
          { key: "intermedio", c: CRITERIA.intermedio, ph: "Alerta" },
          { key: "insuficiente", c: CRITERIA.insuficiente, ph: "Crítico" },
        ].map(({ key, c, ph }) => (
          <div key={key} className={`flex items-stretch rounded-lg border ${c.border} overflow-hidden bg-white`}>
            <span className={`${c.bg} ${c.text} text-[10px] font-bold px-2 flex items-center tracking-wider`}>{c.label}</span>
            <input
              placeholder={ph}
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              className={`flex-1 px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none ${c.chipBg} ${c.chip}`}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!draft.descripcion.trim()}
        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" /> Añadir OKR
      </button>
    </div>
  );
};

// =====================================================================
// JOB PROFILE FORM
// =====================================================================
const emptyProfile = {
  id: null,
  puesto: "",
  departamento: "Desarrollo",
  jefeDirecto: "",
  proposito: "",
  responsabilidades: "",
  kpis: [],
  okrs: [],
  experiencia: "",
  conocimientos: "",
  competenciasSoft: "",
  valores: [],
};

const JobProfileForm = ({ initial, onCancel, onSave, companyValues }) => {
  const initialData = initial || { ...emptyProfile, valores: [...companyValues] };
  const [data, setData] = useState(initialData);
  const [downloading, setDownloading] = useState(false);

  const update = (patch) => setData((d) => ({ ...d, ...patch }));
  const addKpi = (row) => update({ kpis: [...data.kpis, row] });
  const removeKpi = (id) => update({ kpis: data.kpis.filter((r) => r.id !== id) });
  const addOkr = (row) => update({ okrs: [...data.okrs, row] });
  const removeOkr = (id) => update({ okrs: data.okrs.filter((r) => r.id !== id) });

  const toggleValor = (v) =>
    update({
      valores: data.valores.includes(v)
        ? data.valores.filter((x) => x !== v)
        : [...data.valores, v],
    });

  const canSave = data.puesto.trim() && data.departamento && data.jefeDirecto.trim();

  return (
    <div className="animate-fade-in pb-32">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <button
            onClick={onCancel}
            className="text-sm text-slate-500 hover:text-slate-900 mb-2 inline-flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Volver al catálogo
          </button>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: "Outfit" }}>
            {initial?.id ? "Editar Perfil de Puesto" : "Nuevo Perfil de Puesto"}
          </h1>
          <p className="text-slate-500 mt-1">Define las metas, KPIs y competencias para este rol.</p>
        </div>
        <button
          type="button"
          disabled={downloading || !data.puesto.trim()}
          onClick={async () => {
            setDownloading(true);
            try {
              await downloadJobProfilePdf(data, companyValues);
            } catch (e) {
              console.error(e);
              alert("No se pudo generar el PDF. Intenta de nuevo.");
            } finally {
              setDownloading(false);
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-sm font-medium shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="download-pdf-btn-v1"
          title={!data.puesto.trim() ? "Define el nombre del puesto primero" : "Descargar como PDF"}
        >
          <Download className="w-4 h-4" />
          {downloading ? "Generando..." : "Descargar PDF"}
        </button>
      </div>

      <div className="space-y-6">
        {/* HEADER FORM */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Puesto">
              <Input placeholder="Ej. Programador Mid" value={data.puesto} onChange={(e) => update({ puesto: e.target.value })} />
            </Field>
            <Field label="Departamento">
              <Select value={data.departamento} onChange={(e) => update({ departamento: e.target.value })}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Jefe Directo (Reporta a)">
              <Input placeholder="Ej. Líder de Proyecto" value={data.jefeDirecto} onChange={(e) => update({ jefeDirecto: e.target.value })} />
            </Field>
          </div>
          <Field label="Propósito (¿Por qué estoy en la nómina?)" hint="¿Cuál es la razón fundamental del puesto?">
            <TextArea rows={2} placeholder="Apoyar el desarrollo y resolución de problemas" value={data.proposito} onChange={(e) => update({ proposito: e.target.value })} />
          </Field>
        </div>

        {/* SECTION 1: Responsabilidades */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <SectionBanner number="1" title="Principales Responsabilidades y Funciones" icon={ClipboardList} />
          <TextArea
            rows={5}
            placeholder="Describe las principales responsabilidades y funciones del puesto..."
            value={data.responsabilidades}
            onChange={(e) => update({ responsabilidades: e.target.value })}
          />
        </div>

        {/* SECTION 2: KPIs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <SectionBanner number="2" title="Resultados Esperados (KPIs)" icon={Target} />
          <CriteriaTable rows={data.kpis} onRemoveRow={removeKpi} />
          <AddKpiRow onAdd={addKpi} />
        </div>

        {/* SECTION 3: OKRs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <SectionBanner number="3" title="Proyectos Estratégicos / OKRs" icon={FileText} />
          <CriteriaTable
            rows={data.okrs}
            onRemoveRow={removeOkr}
            resultadoLabel="DESCRIPCIÓN"
            resultadoSubtitle="¿Cuáles son los resultados que se esperan?"
            metricLabel="TEMPORALIDAD"
            metricSubtitle="—"
            showResultadoColumn={false}
          />
          <AddOkrRow onAdd={addOkr} />
        </div>

        {/* SECTION 4: Conocimientos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <SectionBanner number="4" title="Conocimientos / Habilidades / Competencias" icon={GraduationCap} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Experiencia">
              <TextArea rows={4} placeholder="Ej. 2 años" value={data.experiencia} onChange={(e) => update({ experiencia: e.target.value })} />
            </Field>
            <Field label="Conocimientos / Formación">
              <TextArea rows={4} placeholder="Ej. Ing. en Software" value={data.conocimientos} onChange={(e) => update({ conocimientos: e.target.value })} />
            </Field>
            <Field label="Competencias Soft">
              <TextArea rows={4} placeholder="Ej. Enfoque a resultados" value={data.competenciasSoft} onChange={(e) => update({ competenciasSoft: e.target.value })} />
            </Field>
          </div>
        </div>

        {/* SECTION 5: Valores */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <SectionBanner number="5" title="Valores de Empresa" icon={Heart} />
          <p className="text-sm text-slate-500">Selecciona los valores que más identifican a este puesto.</p>
          <div className="flex flex-wrap gap-2">
            {companyValues.map((v) => {
              const active = data.valores.includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleValor(v)}
                  className={`px-3.5 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between gap-4 shadow-[0_-4px_12px_-4px_rgba(15,23,42,0.05)] z-10">
        <p className="text-xs text-slate-400">
          {data.kpis.length} KPI{data.kpis.length !== 1 ? "s" : ""} · {data.okrs.length} OKR{data.okrs.length !== 1 ? "s" : ""} · {data.valores.length} valores
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave({ ...data, kpisCount: data.kpis.length })}
            disabled={!canSave}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar Perfil Oficial
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// CATALOG VIEW
// =====================================================================
const ProfileCatalog = ({ profiles, onCreate, onEdit, onDelete, isAdmin }) => {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.puesto.toLowerCase().includes(q) ||
        p.departamento.toLowerCase().includes(q) ||
        p.jefeDirecto.toLowerCase().includes(q),
    );
  }, [profiles, search]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: "Outfit" }}>
            Perfiles de Puesto
          </h1>
          <p className="text-slate-500 mt-1">
            {profiles.length} {profiles.length === 1 ? "perfil definido" : "perfiles definidos"} · descripciones formales del rol con KPIs y OKRs.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={onCreate}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2.5 font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Crear Perfil de Puesto
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por puesto, área o jefe directo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No hay perfiles aún</h3>
          <p className="text-sm text-slate-500 mb-4">Comienza creando tu primer perfil de puesto.</p>
          {isAdmin && (
            <button
              onClick={onCreate}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Crear Perfil
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="hidden lg:grid grid-cols-[2fr_1fr_1.2fr_auto_auto] gap-6 px-6 py-3 bg-slate-50 border-b border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Puesto</span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Área</span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Jefe Directo</span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[100px]">KPIs Medibles</span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right min-w-[100px]">Acciones</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => onEdit(p)}
                className="group grid grid-cols-1 lg:grid-cols-[2fr_1fr_1.2fr_auto_auto] gap-4 lg:gap-6 px-6 py-4 hover:bg-slate-50/70 cursor-pointer transition-colors items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{p.puesto}</p>
                    <p className="text-xs text-slate-500 truncate">{p.proposito || "Sin propósito definido"}</p>
                  </div>
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                    <Building2 className="w-3 h-3" />
                    {p.departamento}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                  <UserCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{p.jefeDirecto}</span>
                </div>
                <div className="text-center min-w-[100px]">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-200">
                    {p.kpis?.length ?? p.kpisCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center gap-1 justify-self-end min-w-[100px] justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(p); }}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Ver detalle"
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================================
// MAIN PAGE
// =====================================================================
const JobProfiles = ({ isAdmin }) => {
  const { values: companyValues } = useCompanyValues();
  const [profiles, setProfiles] = useState(SEED_PROFILES);
  const [view, setView] = useState({ mode: "list", editing: null });

  const handleCreate = () => setView({ mode: "form", editing: null });
  const handleEdit = (profile) => setView({ mode: "form", editing: profile });
  const handleCancel = () => setView({ mode: "list", editing: null });
  const handleDelete = (profile) => {
    if (window.confirm(`¿Eliminar el perfil de "${profile.puesto}"?`)) {
      setProfiles((ps) => ps.filter((p) => p.id !== profile.id));
    }
  };
  const handleSave = (data) => {
    if (data.id) {
      setProfiles((ps) => ps.map((p) => (p.id === data.id ? { ...data } : p)));
    } else {
      const newProfile = { ...data, id: `JP-${String(profiles.length + 1).padStart(3, "0")}` };
      setProfiles((ps) => [...ps, newProfile]);
    }
    setView({ mode: "list", editing: null });
  };

  if (view.mode === "form") {
    return (
      <JobProfileForm
        initial={view.editing}
        onCancel={handleCancel}
        onSave={handleSave}
        companyValues={companyValues}
      />
    );
  }
  return (
    <ProfileCatalog
      profiles={profiles}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      isAdmin={isAdmin}
    />
  );
};

export default JobProfiles;
