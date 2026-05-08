import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  Briefcase,
  Building2,
  UserCheck,
  Save,
  X,
  ChevronRight,
  ClipboardList,
  Target,
  GraduationCap,
  Heart,
  FileText,
  Edit3,
  Trash2,
  Check,
  Sparkles,
} from "lucide-react";

// =====================================================================
// MOCK DATA  (V2 lleva su propio catálogo independiente del V1)
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

const COMPANY_VALUES = [
  "Identidad",
  "Hacemos que las cosas sucedan",
  "Hazlo ahora",
  "Compromiso con resultados",
  "Mejora continua",
  "Trabajo en equipo",
  "Honestidad",
  "Servicio al cliente",
];

const SEED_PROFILES_V2 = [
  {
    id: "JP2-001",
    puesto: "Programador Mid",
    departamento: "Desarrollo",
    jefeDirecto: "Líder de Proyecto",
    proposito: "Apoyar el desarrollo y resolución de problemas",
    responsabilidades:
      "Garantizar el cumplimiento de metas, escribir código limpio, participar en sprints y revisiones de código.",
    kpis: [
      { id: "k1", resultado: "Cumplimiento del sprint", kpi: "Porcentaje", temporalidad: "Semanal", ideal: "100", esperado: "90", intermedio: "60", insuficiente: "10" },
      { id: "k2", resultado: "Tasa de bugs", kpi: "Errores reportados", temporalidad: "Mensual", ideal: "0", esperado: "1", intermedio: "2", insuficiente: "3" },
    ],
    okrs: [
      { id: "o1", descripcion: "Reducir el tiempo de respuesta del API en un 30%", temporalidad: "Trimestral", ideal: "30%", esperado: "20%", intermedio: "10%", insuficiente: "0%" },
    ],
    experiencia: "2 años",
    conocimientos: "Ing. en Sistemas",
    competenciasSoft: "Enfoque a resultados",
    valores: ["Identidad", "Hazlo ahora"],
  },
];

// =====================================================================
// SHARED UI HELPERS  (duplicados intencionalmente para no tocar V1)
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

const CRITERIA = {
  ideal:        { label: "IDEAL",        bg: "bg-cyan-500",    text: "text-white", soft: "bg-cyan-50/70",    chip: "text-cyan-700",    ring: "focus:ring-cyan-300" },
  esperado:     { label: "ESPERADO",     bg: "bg-emerald-500", text: "text-white", soft: "bg-emerald-50/70", chip: "text-emerald-700", ring: "focus:ring-emerald-300" },
  intermedio:   { label: "INTERMEDIO",   bg: "bg-amber-500",   text: "text-white", soft: "bg-amber-50/70",   chip: "text-amber-700",   ring: "focus:ring-amber-300" },
  insuficiente: { label: "INSUFICIENTE", bg: "bg-rose-500",    text: "text-white", soft: "bg-rose-50/70",    chip: "text-rose-700",    ring: "focus:ring-rose-300" },
};

// =====================================================================
// EDITABLE CRITERIA TABLE — Excel-style inline editing
// =====================================================================
const EditableCriteriaTable = ({
  rows,
  onUpdateRow,
  onRemoveRow,
  onAddRow,
  showResultadoColumn = true,
  resultadoLabel = "RESULTADOS PRINCIPALES",
  resultadoSubtitle = "¿Qué resultado se espera?",
  metricLabel = "KPI / CÓMO SE MIDE",
  metricSubtitle = "Indicador medible",
  resultadoPlaceholder = "Ej. Ingresos generados por ventas",
  metricPlaceholder = "Ej. Cantidad de ventas en MXN",
}) => {
  const [focusRowId, setFocusRowId] = useState(null);
  const firstCellRefs = useRef({});

  // Auto-focus el primer input cuando se añade una nueva fila
  useEffect(() => {
    if (focusRowId && firstCellRefs.current[focusRowId]) {
      firstCellRefs.current[focusRowId].focus();
      setFocusRowId(null);
    }
  }, [focusRowId, rows]);

  const handleAddRow = () => {
    const newId = `r-${Date.now()}`;
    onAddRow(newId);
    setFocusRowId(newId);
  };

  const totalCols = (showResultadoColumn ? 1 : 0) + 2 + 4 + 1; // res + kpi + temp + 4 criterios + delete

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {showResultadoColumn && (
                <th className="bg-slate-50 px-3 py-3 text-left align-bottom border-b border-slate-200 min-w-[200px]">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{resultadoLabel}</div>
                  <div className="text-[10px] text-slate-400 font-normal normal-case mt-0.5">{resultadoSubtitle}</div>
                </th>
              )}
              <th className="bg-slate-50 px-3 py-3 text-left align-bottom border-b border-slate-200 min-w-[180px]">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{metricLabel}</div>
                <div className="text-[10px] text-slate-400 font-normal normal-case mt-0.5">{metricSubtitle}</div>
              </th>
              <th className="bg-slate-50 px-3 py-3 text-left align-bottom border-b border-slate-200 min-w-[130px]">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Temporalidad</div>
                <div className="text-[10px] text-slate-400 font-normal normal-case mt-0.5">¿Cuándo se mide?</div>
              </th>
              <th colSpan={4} className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-center">
                  Criterio de éxito
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {Object.values(CRITERIA).map((c) => (
                    <div key={c.label} className={`${c.bg} ${c.text} text-[10px] font-bold py-1 rounded text-center`}>
                      {c.label}
                    </div>
                  ))}
                </div>
              </th>
              <th className="bg-slate-50 px-2 py-3 border-b border-slate-200 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="text-center py-12 text-sm text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="w-5 h-5 text-slate-300" />
                    <span>Aún no hay filas. Haz clic en <strong className="text-slate-600">"Añadir fila"</strong> abajo.</span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className="group border-t border-slate-100 hover:bg-slate-50/40 transition-colors"
                >
                  {showResultadoColumn && (
                    <td className="border-r border-slate-100 p-0 align-middle">
                      <input
                        ref={(el) => { if (el) firstCellRefs.current[row.id] = el; }}
                        value={row.resultado || ""}
                        onChange={(e) => onUpdateRow(row.id, { resultado: e.target.value })}
                        placeholder={resultadoPlaceholder}
                        className="w-full bg-transparent px-3 py-3 text-slate-800 text-sm placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-300 transition-colors"
                      />
                    </td>
                  )}
                  <td className="border-r border-slate-100 p-0 align-middle">
                    <input
                      ref={!showResultadoColumn ? (el) => { if (el) firstCellRefs.current[row.id] = el; } : undefined}
                      value={row.kpi || row.descripcion || ""}
                      onChange={(e) => onUpdateRow(row.id, showResultadoColumn ? { kpi: e.target.value } : { descripcion: e.target.value })}
                      placeholder={metricPlaceholder}
                      className="w-full bg-transparent px-3 py-3 text-slate-700 text-sm placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-300 transition-colors"
                    />
                  </td>
                  <td className="border-r border-slate-100 p-0 align-middle">
                    <select
                      value={row.temporalidad || ""}
                      onChange={(e) => onUpdateRow(row.id, { temporalidad: e.target.value })}
                      className="w-full bg-transparent px-3 py-3 text-slate-700 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-300 cursor-pointer appearance-none"
                    >
                      <option value="">— Seleccionar —</option>
                      {TEMPORALIDADES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  {["ideal", "esperado", "intermedio", "insuficiente"].map((key) => {
                    const c = CRITERIA[key];
                    return (
                      <td key={key} className={`${c.soft} p-0 align-middle border-r border-white/40 last:border-r-0`}>
                        <input
                          value={row[key] || ""}
                          onChange={(e) => onUpdateRow(row.id, { [key]: e.target.value })}
                          placeholder="—"
                          className={`w-full bg-transparent px-2 py-3 text-center font-bold text-sm ${c.chip} placeholder:text-slate-300 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-inset ${c.ring}`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 align-middle text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(row.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all opacity-50 group-hover:opacity-100"
                      title="Eliminar fila"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={handleAddRow}
        className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-sm font-medium border-t border-slate-200 transition-colors flex items-center justify-center gap-2 group"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        Añadir fila
      </button>
    </div>
  );
};

// =====================================================================
// JOB PROFILE FORM V2
// =====================================================================
const emptyKpiRow = () => ({ id: `k-${Date.now()}-${Math.random()}`, resultado: "", kpi: "", temporalidad: "", ideal: "", esperado: "", intermedio: "", insuficiente: "" });
const emptyOkrRow = () => ({ id: `o-${Date.now()}-${Math.random()}`, descripcion: "", temporalidad: "", ideal: "", esperado: "", intermedio: "", insuficiente: "" });

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

const JobProfileFormV2 = ({ initial, onCancel, onSave }) => {
  const [data, setData] = useState(initial || emptyProfile);

  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  // KPI handlers
  const addKpi = (id) => update({ kpis: [...data.kpis, { ...emptyKpiRow(), id }] });
  const updateKpi = (id, patch) => update({ kpis: data.kpis.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const removeKpi = (id) => update({ kpis: data.kpis.filter((r) => r.id !== id) });

  // OKR handlers
  const addOkr = (id) => update({ okrs: [...data.okrs, { ...emptyOkrRow(), id }] });
  const updateOkr = (id, patch) => update({ okrs: data.okrs.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
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
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: "Outfit" }}>
              {initial?.id ? "Editar Perfil de Puesto" : "Nuevo Perfil de Puesto"}
            </h1>
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-md tracking-wider">V2</span>
          </div>
          <p className="text-slate-500 mt-1">
            Modo edición tipo hoja de cálculo · escribe directamente en cada celda.
          </p>
        </div>
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

        {/* SECTION 2: KPIs (Excel-style) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <SectionBanner number="2" title="Resultados Esperados (KPIs)" icon={Target} />
          <p className="text-xs text-slate-500 -mt-2 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            Edita directamente cada celda. Usa <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Tab</kbd> para navegar entre celdas.
          </p>
          <EditableCriteriaTable
            rows={data.kpis}
            onAddRow={addKpi}
            onUpdateRow={updateKpi}
            onRemoveRow={removeKpi}
          />
        </div>

        {/* SECTION 3: OKRs (Excel-style) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <SectionBanner number="3" title="Proyectos Estratégicos / OKRs" icon={FileText} />
          <EditableCriteriaTable
            rows={data.okrs}
            onAddRow={addOkr}
            onUpdateRow={updateOkr}
            onRemoveRow={removeOkr}
            showResultadoColumn={false}
            metricLabel="DESCRIPCIÓN DEL OKR"
            metricSubtitle="¿Qué proyecto se debe lograr?"
            metricPlaceholder="Ej. Implementar nuevo sistema de gestión CRM"
          />
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
            {COMPANY_VALUES.map((v) => {
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
            onClick={() => onSave(data)}
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
// CATALOG VIEW V2
// =====================================================================
const ProfileCatalogV2 = ({ profiles, onCreate, onEdit, onDelete, isAdmin }) => {
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
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: "Outfit" }}>
              Perfiles de Puesto
            </h1>
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-md tracking-wider">V2</span>
          </div>
          <p className="text-slate-500 mt-1">
            {profiles.length} {profiles.length === 1 ? "perfil definido" : "perfiles definidos"} · edición tipo hoja de cálculo.
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
                    {p.kpis?.length ?? 0}
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
// MAIN PAGE V2
// =====================================================================
const JobProfilesV2 = ({ isAdmin }) => {
  const [profiles, setProfiles] = useState(SEED_PROFILES_V2);
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
      const newProfile = { ...data, id: `JP2-${String(profiles.length + 1).padStart(3, "0")}` };
      setProfiles((ps) => [...ps, newProfile]);
    }
    setView({ mode: "list", editing: null });
  };

  if (view.mode === "form") {
    return <JobProfileFormV2 initial={view.editing} onCancel={handleCancel} onSave={handleSave} />;
  }
  return (
    <ProfileCatalogV2
      profiles={profiles}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      isAdmin={isAdmin}
    />
  );
};

export default JobProfilesV2;
