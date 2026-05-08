import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "evalpro:companyValues";

const DEFAULT_VALUES = [
  "Identidad",
  "Hacemos que las cosas sucedan",
  "Hazlo ahora",
  "Compromiso con resultados",
  "Mejora continua",
  "Trabajo en equipo",
  "Honestidad",
  "Servicio al cliente",
];

const CompanyValuesContext = createContext(null);

export const CompanyValuesProvider = ({ children }) => {
  const [values, setValues] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_VALUES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch (e) {}
  }, [values]);

  const addValue = (label) => {
    const v = (label || "").trim();
    if (!v) return false;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) return false;
    setValues((vs) => [...vs, v]);
    return true;
  };

  const updateValue = (oldLabel, newLabel) => {
    const v = (newLabel || "").trim();
    if (!v) return false;
    setValues((vs) => vs.map((x) => (x === oldLabel ? v : x)));
    return true;
  };

  const removeValue = (label) => setValues((vs) => vs.filter((x) => x !== label));

  const moveValue = (label, direction) => {
    setValues((vs) => {
      const idx = vs.indexOf(label);
      if (idx < 0) return vs;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= vs.length) return vs;
      const copy = [...vs];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };

  const resetToDefault = () => setValues(DEFAULT_VALUES);

  return (
    <CompanyValuesContext.Provider
      value={{ values, addValue, updateValue, removeValue, moveValue, resetToDefault }}
    >
      {children}
    </CompanyValuesContext.Provider>
  );
};

export const useCompanyValues = () => {
  const ctx = useContext(CompanyValuesContext);
  if (!ctx) throw new Error("useCompanyValues must be used inside CompanyValuesProvider");
  return ctx;
};
