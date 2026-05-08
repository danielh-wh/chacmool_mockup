import React, { useState } from "react";
import { Heart, Plus, X, Edit3, Check, ArrowUp, ArrowDown, RotateCcw, Settings as SettingsIcon } from "lucide-react";
import { useCompanyValues } from "../contexts/CompanyValuesContext";

const CompanySettings = ({ isAdmin }) => {
  const { values, addValue, updateValue, removeValue, moveValue, resetToDefault } = useCompanyValues();
  const [newValue, setNewValue] = useState("");
  const [editing, setEditing] = useState(null); // { original, draft }
  const [error, setError] = useState("");

  const handleAdd = () => {
    setError("");
    const ok = addValue(newValue);
    if (!ok) {
      setError(newValue.trim() ? "Ya existe ese valor." : "El valor no puede estar vacío.");
      return;
    }
    setNewValue("");
  };

  const startEdit = (v) => setEditing({ original: v, draft: v });
  const saveEdit = () => {
    if (!editing) return;
    if (editing.draft.trim() && editing.draft !== editing.original) {
      updateValue(editing.original, editing.draft);
    }
    setEditing(null);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center" data-testid="settings-no-access">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <SettingsIcon className="w-6 h-6 text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Acceso restringido</h2>
        <p className="text-sm text-slate-500 mt-1">Esta sección solo está disponible para administradores.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl" data-testid="company-settings">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: "Outfit" }}>
          Configuración
        </h1>
        <p className="text-slate-500 mt-1">Define los valores institucionales que se reflejan en cada perfil de puesto.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
            <Heart className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-900">Valores de Empresa</h2>
            <p className="text-xs text-slate-500">{values.length} {values.length === 1 ? "valor definido" : "valores definidos"}.</p>
          </div>
          <button
            onClick={() => { if (window.confirm("¿Restaurar la lista de valores por defecto?")) resetToDefault(); }}
            className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            data-testid="reset-values-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar default
          </button>
        </div>

        {/* Add new */}
        <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newValue}
              onChange={(e) => { setNewValue(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Ej. Innovación constante"
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              data-testid="new-value-input"
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium inline-flex items-center gap-1.5 transition-colors"
              data-testid="add-value-btn"
            >
              <Plus className="w-4 h-4" />
              Añadir
            </button>
          </div>
          {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}
        </div>

        {/* List */}
        <ul className="divide-y divide-slate-100">
          {values.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-slate-400">No hay valores. Añade el primero arriba.</li>
          )}
          {values.map((v, idx) => (
            <li key={v} className="px-5 py-3 flex items-center gap-3 group hover:bg-slate-50/60 transition-colors" data-testid={`value-row-${idx}`}>
              <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              {editing?.original === v ? (
                <>
                  <input
                    autoFocus
                    value={editing.draft}
                    onChange={(e) => setEditing({ ...editing, draft: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); }}
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                  <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Guardar">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg" title="Cancelar">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-800">{v}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveValue(v, "up")}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Subir"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === values.length - 1}
                      onClick={() => moveValue(v, "down")}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Bajar"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => startEdit(v)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      title="Editar"
                      data-testid={`edit-value-${idx}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (window.confirm(`¿Eliminar el valor "${v}"?`)) removeValue(v); }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Eliminar"
                      data-testid={`remove-value-${idx}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Los cambios se reflejan automáticamente en los formularios V1 y V2 de Perfiles de Puesto.
      </p>
    </div>
  );
};

export default CompanySettings;
