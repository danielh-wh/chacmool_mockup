import { useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Award,
  Star,
  AlertTriangle,
  Link,
  Wallet,
  Clock3,
  CalendarDays,
  Plane,
  BellRing,
  CheckCircle2,
  TrendingUp,
  CalendarCheck2,
} from 'lucide-react';
import { employeesAPI, empleadoAAPI, dashboardAPI, climateAPI } from '../services/api';
import { classificationMatrix, classificationColors } from '../utils/classifications';

const Dashboard = ({ isAdmin }) => {
  const [employees, setEmployees] = useState([]);
  const [empleadoAResults, setEmpleadoAResults] = useState([]);
  const [employeeSummary, setEmployeeSummary] = useState(null);
  const [pendingSurveys, setPendingSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (isAdmin) {
          const [employeesData, resultsData] = await Promise.all([
            employeesAPI.getAll(),
            empleadoAAPI.getAllResults().catch(() => []),
          ]);
          setEmployees(employeesData);
          setEmpleadoAResults(resultsData);
        } else {
          const [summaryData, pendingData] = await Promise.all([
            dashboardAPI.getEmployeeSummary(),
            climateAPI.getPendingSurveys().catch(() => ({ surveys: [] })),
          ]);
          setEmployeeSummary(summaryData.summary || null);
          setPendingSurveys(pendingData.surveys || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const adminMetrics = useMemo(() => {
    const avgValores = empleadoAResults.length > 0
      ? Math.round(empleadoAResults.reduce((acc, item) => acc + (item.promedio_valores || 0), 0) / empleadoAResults.length)
      : 0;

    const topPerformers = empleadoAResults.filter((item) => item.cuadrante_mayoria === 'A').length;

    const needsAttention = empleadoAResults.filter((item) => ['C1', 'C2', 'C3'].includes(item.cuadrante_mayoria)).length;

    return { avgValores, topPerformers, needsAttention };
  }, [empleadoAResults]);

  const currency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'Sin fecha';
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Cargando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    const summary = employeeSummary || {
      periodo: 'Periodo actual',
      comisiones_bonos: { total: 0, comisiones: 0, bono_desempeno: 0 },
      asistencia: { dias_trabajados: 0, dias_habiles: 0, retardos: 0, descuentos: 0 },
      actividades: [],
      vacaciones: { saldo_dias: 0, usados_periodo: 0, proximas: [] },
      objetivos: [],
      alertas: [],
      anuncios: [],
    };

    const nextActivity = summary.actividades?.[0];
    const nextPendingSurvey = pendingSurveys?.[0];

    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit' }}>
            Dashboard del Empleado
          </h1>
          <p className="text-slate-500 mt-1">Resumen de tu periodo: {summary.periodo}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <Wallet className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-sm text-slate-500">Comisiones y bonos</p>
            <p className="text-2xl font-bold text-slate-900">{currency(summary.comisiones_bonos?.total)}</p>
            <p className="text-xs text-slate-500 mt-1">
              Comisiones: {currency(summary.comisiones_bonos?.comisiones)}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <Clock3 className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-sm text-slate-500">Días trabajados</p>
            <p className="text-2xl font-bold text-slate-900">
              {summary.asistencia?.dias_trabajados} / {summary.asistencia?.dias_habiles}
            </p>
            <p className="text-xs text-slate-500 mt-1">Periodo en curso</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <AlertTriangle className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-sm text-slate-500">Descuentos y retardos</p>
            <p className="text-2xl font-bold text-slate-900">{summary.asistencia?.retardos} retardos</p>
            <p className="text-xs text-slate-500 mt-1">Descuentos: {currency(summary.asistencia?.descuentos)}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <CalendarDays className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-sm text-slate-500">Próximas actividades</p>
            <p className="text-2xl font-bold text-slate-900">{summary.actividades?.length || 0}</p>
            <p className="text-xs text-slate-500 mt-1">
              {nextActivity ? `${nextActivity.titulo} · ${formatDate(nextActivity.fecha)}` : 'Sin actividades próximas'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <Plane className="w-5 h-5 text-cyan-500 mb-2" />
            <p className="text-sm text-slate-500">Vacaciones</p>
            <p className="text-2xl font-bold text-slate-900">{summary.vacaciones?.saldo_dias || 0} días</p>
            <p className="text-xs text-slate-500 mt-1">Usados: {summary.vacaciones?.usados_periodo || 0}</p>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <CheckCircle2 className="w-5 h-5 text-indigo-500 mb-2" />
            <p className="text-sm text-slate-500">Encuestas pendientes</p>
            <p className="text-2xl font-bold text-slate-900">{pendingSurveys.length}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {nextPendingSurvey ? nextPendingSurvey.nombre : 'No tienes encuestas pendientes'}
            </p>
          </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Objetivos del periodo</h2>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>

            {(summary.objetivos || []).length === 0 ? (
              <p className="text-sm text-slate-500">No hay objetivos registrados para este periodo.</p>
            ) : (
              <div className="space-y-4">
                {summary.objetivos.map((goal) => (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{goal.titulo}</span>
                      <span className="text-slate-500">{goal.avance}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-800"
                        style={{ width: `${Math.max(0, Math.min(100, goal.avance || 0))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase mb-4">Recordatorios</h2>
            {(summary.alertas || []).length === 0 ? (
              <p className="text-sm text-slate-500">Sin alertas para hoy.</p>
            ) : (
              <ul className="space-y-3">
                {summary.alertas.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <BellRing className="w-4 h-4 text-amber-500 mt-0.5" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase mb-4">Anuncios de la empresa</h2>

          {(summary.anuncios || []).length === 0 ? (
            <p className="text-sm text-slate-500">No hay anuncios publicados para este periodo.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(summary.anuncios || []).map((announcement) => (
                <div key={announcement.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-900 text-sm">{announcement.titulo}</p>
                    <span className="text-[11px] text-slate-500">{formatDate(announcement.fecha)}</span>
                  </div>
                  <p className="text-sm text-slate-600">{announcement.descripcion}</p>
                  <span className="inline-flex mt-3 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {announcement.tipo || 'Evento'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Agenda próxima</h2>
              <CalendarCheck2 className="w-5 h-5 text-slate-400" />
            </div>

            {(summary.actividades || []).length === 0 ? (
              <p className="text-sm text-slate-500">No tienes actividades programadas.</p>
            ) : (
              <div className="space-y-3">
                {summary.actividades.map((activity) => (
                  <div key={activity.id} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{activity.titulo}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{activity.tipo} · {formatDate(activity.fecha)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.prioridad === 'alta'
                        ? 'bg-red-100 text-red-700'
                        : activity.prioridad === 'media'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                    }`}>
                      {activity.prioridad || 'normal'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase mb-4">Accesos rápidos</h2>
            <div className="space-y-2">
              <NavLink to="/my-profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Mi Perfil</p>
                  <p className="text-xs text-slate-500">Información y resultados</p>
                </div>
              </NavLink>

              <NavLink to="/clima-laboral" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Clima Laboral</p>
                  <p className="text-xs text-slate-500">Responde tus encuestas</p>
                </div>
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit' }}>Dashboard</h1>
        <p className="text-slate-500 mt-1">Resumen de evaluaciones 360°</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <Users className="w-5 h-5 text-slate-400 mb-2" />
          <p className="text-sm text-slate-500">Empleados</p>
          <p className="text-3xl font-bold text-slate-900">{employees.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <Award className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-sm text-slate-500">Prom. Valores</p>
          <p className="text-3xl font-bold text-purple-600">{adminMetrics.avgValores}%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <Star className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-sm text-slate-500">Empleados A</p>
          <p className="text-3xl font-bold text-green-600">{adminMetrics.topPerformers}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-sm text-slate-500">Atención</p>
          <p className="text-3xl font-bold text-red-600">{adminMetrics.needsAttention}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Empleado A</h2>
            <NavLink to="/9box" className="text-sm text-blue-600">Ver completo →</NavLink>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['B3', 'B2', 'A', 'C4', 'B1', 'B4', 'C1', 'C2', 'C3'].map((code) => {
              const config = classificationMatrix[code];
              const colors = classificationColors[config.color];
              const count = empleadoAResults.filter((item) => item.cuadrante_mayoria === code).length;

              return (
                <div key={code} className="rounded-xl border-2 p-3 text-center" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                  <span className="text-lg font-bold" style={{ color: colors.text }}>{code}</span>
                  <p className="text-xs" style={{ color: colors.text }}>{config.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: colors.text }}>{count}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase mb-4">Acciones Rápidas</h2>
          <div className="space-y-2">
            <NavLink to="/evaluations" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Link className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Generar Enlace 360</p>
                <p className="text-xs text-slate-500">Crear evaluación</p>
              </div>
            </NavLink>
            <NavLink to="/kpis" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Evaluar KPIs</p>
                <p className="text-xs text-slate-500">Indicadores</p>
              </div>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

