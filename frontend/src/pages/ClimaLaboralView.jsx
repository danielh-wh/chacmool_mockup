import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { climateAPI } from '../services/api';
import {
  Plus,
  FileText,
  Shield,
  Calendar,
  BarChart3,
  Users,
  ChevronRight,
  Target,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ClipboardList,
  Gauge,
  ArrowLeft,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

const HEALTH_LEVELS = [
  { label: 'Poco Saludable', min: 0, max: 30, color: '#EF4444' },
  { label: 'Mejorable', min: 31, max: 59, color: '#F59E0B' },
  { label: 'Saludable', min: 60, max: 89, color: '#22C55E' },
  { label: 'Óptimo', min: 90, max: 100, color: '#3B82F6' },
];

const getHealthLevel = (value) => {
  return HEALTH_LEVELS.find((level) => value >= level.min && value <= level.max) || HEALTH_LEVELS[3];
};

const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const getAverageVisualState = (value) => {
  const average = Number(value || 0);

  if (average >= 4.95) {
    return {
      tone: 'alto',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      textClass: 'text-emerald-600',
      barClass: 'bg-emerald-500',
      label: 'Excelente',
    };
  }

  if (average <= 3) {
    return {
      tone: 'bajo',
      badgeClass: 'bg-red-100 text-red-700',
      textClass: 'text-red-600',
      barClass: 'bg-red-500',
      label: 'Bajo',
    };
  }

  return {
    tone: 'promedio',
    badgeClass: 'bg-amber-100 text-amber-700',
    textClass: 'text-amber-700',
    barClass: 'bg-amber-500',
    label: 'Promedio',
  };
};


const createEmptyQuestion = () => ({
  id: `q-${Date.now()}-${Math.random()}`,
  pregunta: '',
  tipo: 'seleccion',
  opciones: [{ id: `o-${Date.now()}-${Math.random()}`, titulo: '', valor: 3 }],
});

const getDefaultEndDate = () => {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 14);
  return nextDate.toISOString().split('T')[0];
};

const createBaseSurveyDraft = () => ({
  nombre: '',
  descripcion: '',
  fecha_fin: getDefaultEndDate(),
  es_anonima: true,
  meta_participacion: 0,
  meta_satisfaccion: 80,
  preguntas: [createEmptyQuestion()],
});

const GaugeCard = ({ globalIndex, metaSatisfaccion }) => {
  const safeValue = clampPercent(globalIndex);
  const level = getHealthLevel(safeValue);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Satisfacción Global</p>

      <div className="flex items-center justify-center">
        <div
          className="relative w-40 h-40 rounded-full"
          style={{
            background: `conic-gradient(${level.color} ${safeValue * 3.6}deg, #E2E8F0 ${safeValue * 3.6}deg 360deg)`,
          }}
        >
          <div className="absolute inset-[14px] bg-white rounded-full flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: level.color }}>
              {safeValue}%
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Satisfacción</span>
            <span className="text-xs font-medium text-slate-700 mt-1">META: {clampPercent(metaSatisfaccion)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProgressVsMetaCard = ({ globalIndex, metaSatisfaccion }) => {
  const current = clampPercent(globalIndex);
  const meta = clampPercent(metaSatisfaccion);
  const level = getHealthLevel(current);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Progreso vs Meta</p>

      <div className="relative mb-5">
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${current}%`, backgroundColor: level.color }} />
        </div>

        <div className="absolute -top-7 text-[11px] font-semibold" style={{ left: `calc(${current}% - 20px)`, color: level.color }}>
          Actual
        </div>
        <div className="absolute -top-7 text-[11px] font-semibold text-slate-700" style={{ left: `calc(${meta}% - 16px)` }}>
          Meta
        </div>

        <div className="absolute top-[-2px] w-[2px] h-8 bg-slate-800" style={{ left: `${meta}%` }} />
      </div>

      <p className="text-sm text-slate-600 mb-4">
        <span className="font-semibold" style={{ color: level.color }}>Actual {current}%</span>
        <span className="mx-2 text-slate-300">|</span>
        <span className="font-semibold text-slate-700">Meta {meta}%</span>
      </p>

      <div className="grid grid-cols-4 gap-2 text-[11px] font-medium">
        {HEALTH_LEVELS.map((item) => (
          <div key={item.label} className="rounded-lg py-2 text-center text-slate-900" style={{ backgroundColor: `${item.color}33` }}>
            <p>{item.label}</p>
            <p className="text-slate-600">{item.min}–{Math.floor(item.max)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ParticipationCard = ({ total, metaParticipacion }) => {
  const goal = Number(metaParticipacion) || 0;

  if (goal <= 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Participación Total</p>
        <p className="text-4xl font-bold text-slate-900">{total}</p>
        <p className="text-sm text-slate-500 mt-2">Sin meta interna definida</p>
      </div>
    );
  }

  const pct = Math.round((total / goal) * 100);
  const safePct = clampPercent(pct);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Participación Total</p>

      <div className="flex items-end gap-3 mb-3">
        <span className="text-4xl font-bold text-slate-900">{total}</span>
        <span className="text-sm text-slate-500 pb-1">de {goal} esperados</span>
      </div>

      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-slate-800 rounded-full" style={{ width: `${safePct}%` }} />
      </div>

      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{safePct}% de la meta interna alcanzada</p>
    </div>
  );
};

const StandardsChevron = ({ globalIndex }) => {
  const level = getHealthLevel(globalIndex);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Estándares de Salud</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {HEALTH_LEVELS.map((item, idx) => {
          const isActive = level.label === item.label;
          const baseClip =
            idx === 0
              ? 'polygon(0% 0%, 82% 0%, 100% 50%, 82% 100%, 0% 100%)'
              : 'polygon(0% 0%, 82% 0%, 100% 50%, 82% 100%, 0% 100%, 18% 50%)';

          return (
            <div key={item.label} className="relative">
              <div
                className="text-center py-4 px-2 text-xs font-semibold text-slate-900"
                style={{
                  clipPath: baseClip,
                  backgroundColor: `${item.color}44`,
                }}
              >
                <p>{item.label}</p>
                <p className="text-slate-700">{item.min}–{Math.floor(item.max)}%</p>
              </div>

              {isActive && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max px-2 py-1 rounded-md border border-red-500 text-[10px] font-semibold text-red-600 bg-white">
                  En esta encuesta estamos en este rango
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ClimaLaboralView = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [surveys, setSurveys] = useState([]);
  const [pendingSurveys, setPendingSurveys] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [surveyDraft, setSurveyDraft] = useState(createBaseSurveyDraft());
  const [manualTemplateId, setManualTemplateId] = useState('');

  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [answers, setAnswers] = useState({});

  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('Global');
  const [resultsTab, setResultsTab] = useState('resumen-general');
  const [resultsBySurvey, setResultsBySurvey] = useState({});

  const activeResult = selectedSurveyId ? resultsBySurvey[selectedSurveyId] : null;

  const visibleResult = useMemo(() => {
    if (!activeResult) return null;
    if (selectedDepartment === 'Global') return activeResult;

    const dept = activeResult.por_departamento?.[selectedDepartment];
    if (!dept) return activeResult;

    return {
      ...activeResult,
      total: dept.total,
      global_index: dept.global_index,
      status: dept.status,
      stats: dept.stats,
      question_promedios: dept.question_promedios || [],
      areas_atencion: dept.areas_atencion || [],
      response_matrix: dept.response_matrix || { columns: [], rows: [] },
      participantes: [],
    };
  }, [activeResult, selectedDepartment]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [surveyData, templateData, pendingData] = await Promise.all([
        climateAPI.getSurveys(),
        climateAPI.getTemplates(),
        climateAPI.getPendingSurveys(),
      ]);

      setSurveys(surveyData.surveys || []);
      setTemplates(templateData.plantillas || []);
      setPendingSurveys(pendingData.surveys || []);
    } catch (error) {
      toast.error(error.message || 'No se pudo cargar Clima Laboral');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const mapTemplateToDraftQuestions = (templateQuestions = []) => {
    return templateQuestions.map((question) => ({
      id: `q-${Date.now()}-${Math.random()}`,
      pregunta: question.pregunta || '',
      tipo: question.tipo || 'seleccion',
      opciones: (question.opciones || []).map((option) => ({
        id: `o-${Date.now()}-${Math.random()}`,
        titulo: option.titulo || '',
        valor: option.valor ?? 3,
      })),
    }));
  };

  const applyTemplateToDraft = async (templateId) => {
    if (!templateId) return;

    try {
      const detail = await climateAPI.getTemplate(templateId);
      const template = detail.plantilla;
      const mappedQuestions = mapTemplateToDraftQuestions(template.preguntas || []);

      setSurveyDraft((prev) => ({
        ...prev,
        nombre: template.nombre || '',
        descripcion: template.descripcion || '',
        preguntas: mappedQuestions.length ? mappedQuestions : [createEmptyQuestion()],
      }));

      toast.success('Plantilla aplicada al formulario');
    } catch (error) {
      toast.error(error.message || 'No se pudo aplicar la plantilla');
    }
  };

  const startCreatingSurvey = async () => {
    setCurrentView('create');
    setManualTemplateId('');
    setSurveyDraft(createBaseSurveyDraft());

    try {
      const templateData = await climateAPI.getTemplates();
      const availableTemplates = templateData.plantillas || [];
      setTemplates(availableTemplates);

      if (availableTemplates.length > 0) {
        await applyTemplateToDraft(availableTemplates[0].id);
      } else {
        setSurveyDraft({
          ...createBaseSurveyDraft(),
          preguntas: [createEmptyQuestion()],
        });
      }
    } catch (error) {
      toast.error(error.message || 'No se pudieron cargar plantillas');
    }
  };

  const addQuestion = () => {
    setSurveyDraft((prev) => ({
      ...prev,
      preguntas: [...prev.preguntas, createEmptyQuestion()],
    }));
  };

  const removeQuestion = (questionId) => {
    setSurveyDraft((prev) => {
      const nextQuestions = prev.preguntas.filter((question) => question.id !== questionId);
      return {
        ...prev,
        preguntas: nextQuestions.length ? nextQuestions : [createEmptyQuestion()],
      };
    });
  };

  const updateQuestion = (questionId, patch) => {
    setSurveyDraft((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((question) => {
        if (question.id !== questionId) return question;

        const nextQuestion = { ...question, ...patch };
        if (nextQuestion.tipo === 'abierta') {
          nextQuestion.opciones = [];
        }

        if (nextQuestion.tipo !== 'abierta' && nextQuestion.opciones.length === 0) {
          nextQuestion.opciones = [{ id: `o-${Date.now()}-${Math.random()}`, titulo: '', valor: 3 }];
        }

        return nextQuestion;
      }),
    }));
  };

  const addOption = (questionId) => {
    setSurveyDraft((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((question) =>
        question.id === questionId
          ? {
              ...question,
              opciones: [...question.opciones, { id: `o-${Date.now()}-${Math.random()}`, titulo: '', valor: 3 }],
            }
          : question,
      ),
    }));
  };

  const removeOption = (questionId, optionId) => {
    setSurveyDraft((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((question) => {
        if (question.id !== questionId) return question;

        const nextOptions = question.opciones.filter((option) => option.id !== optionId);
        return {
          ...question,
          opciones: nextOptions.length ? nextOptions : [{ id: `o-${Date.now()}-${Math.random()}`, titulo: '', valor: 3 }],
        };
      }),
    }));
  };

  const updateOption = (questionId, optionId, patch) => {
    setSurveyDraft((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((question) => {
        if (question.id !== questionId) return question;

        return {
          ...question,
          opciones: question.opciones.map((option) =>
            option.id === optionId
              ? {
                  ...option,
                  ...patch,
                }
              : option,
          ),
        };
      }),
    }));
  };

  const validateCommonDraft = () => {
    if (!surveyDraft.nombre.trim()) {
      toast.error('El título de la encuesta/plantilla es obligatorio');
      return false;
    }

    for (const question of surveyDraft.preguntas) {
      if (!question.pregunta.trim()) {
        toast.error('Todas las preguntas deben tener texto');
        return false;
      }

      if (question.tipo !== 'abierta') {
        if (!question.opciones.length) {
          toast.error('Las preguntas de selección requieren opciones');
          return false;
        }

        const hasInvalidOption = question.opciones.some((option) => !option.titulo.trim());
        if (hasInvalidOption) {
          toast.error('Cada opción debe tener título');
          return false;
        }
      }
    }

    return true;
  };

  const validateSurveyDraft = () => {
    if (!validateCommonDraft()) {
      return false;
    }

    if (!surveyDraft.fecha_fin) {
      toast.error('La fecha de fin es obligatoria para lanzar una encuesta');
      return false;
    }

    return true;
  };

  const validateTemplateDraft = () => {
    return validateCommonDraft();
  };

  const draftPayload = useMemo(() => {
    return {
      nombre: surveyDraft.nombre,
      descripcion: surveyDraft.descripcion,
      fecha_fin: surveyDraft.fecha_fin,
      es_anonima: surveyDraft.es_anonima,
      meta_participacion: Number(surveyDraft.meta_participacion) || 0,
      meta_satisfaccion: clampPercent(surveyDraft.meta_satisfaccion),
      preguntas: surveyDraft.preguntas.map((question) => ({
        pregunta: question.pregunta,
        tipo: question.tipo,
        opciones:
          question.tipo === 'abierta'
            ? []
            : question.opciones.map((option) => ({
                titulo: option.titulo,
                valor: Number(option.valor) || 1,
              })),
      })),
    };
  }, [surveyDraft]);

  const handleCreateSurvey = async () => {
    if (!validateSurveyDraft()) return;

    try {
      setSaving(true);
      await climateAPI.createSurvey(draftPayload);
      toast.success('Encuesta lanzada correctamente');
      setCurrentView('dashboard');
      setSurveyDraft(createBaseSurveyDraft());
      await loadDashboardData();
    } catch (error) {
      toast.error(error.message || 'No se pudo crear la encuesta');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!validateTemplateDraft()) return;

    try {
      setSaving(true);
      await climateAPI.createTemplate({
        nombre: surveyDraft.nombre,
        descripcion: surveyDraft.descripcion,
        preguntas: draftPayload.preguntas,
      });
      toast.success('Plantilla guardada correctamente');
      const templateData = await climateAPI.getTemplates();
      setTemplates(templateData.plantillas || []);
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar la plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await climateAPI.deleteTemplate(templateId);
      toast.success('Plantilla eliminada');
      const templateData = await climateAPI.getTemplates();
      setTemplates(templateData.plantillas || []);
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar la plantilla');
    }
  };

  const startTakingSurvey = (survey) => {
    const initialAnswers = {};

    (survey.preguntas || []).forEach((question) => {
      if (question.tipo === 'multiple') {
        initialAnswers[question.id] = [];
      } else {
        initialAnswers[question.id] = '';
      }
    });

    setSelectedSurvey(survey);
    setAnswers(initialAnswers);
    setCurrentView('take');
  };

  const setSelectionAnswer = (question, optionId) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  };

  const setMultipleAnswer = (question, optionId, checked) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[question.id]) ? prev[question.id] : [];
      const next = checked ? [...current, optionId] : current.filter((id) => id !== optionId);
      return { ...prev, [question.id]: next };
    });
  };

  const handleSubmitResponses = async () => {
    if (!selectedSurvey) return;

    try {
      setSaving(true);
      await climateAPI.submitSurveyResponse(selectedSurvey.id, { respuestas: answers });
      toast.success('Tus respuestas fueron enviadas correctamente');
      setCurrentView('dashboard');
      setSelectedSurvey(null);
      await loadDashboardData();
    } catch (error) {
      toast.error(error.message || 'No se pudo enviar la encuesta');
    } finally {
      setSaving(false);
    }
  };

  const openResults = async (surveyId) => {
    setCurrentView('results');
    setSelectedSurveyId(surveyId);
    setSelectedDepartment('Global');
    setResultsTab('resumen-general');

    if (resultsBySurvey[surveyId]) return;

    try {
      setLoading(true);
      const result = await climateAPI.getSurveyResults(surveyId);
      setResultsBySurvey((prev) => ({ ...prev, [surveyId]: result }));
    } catch (error) {
      toast.error(error.message || 'No se pudieron cargar los resultados');
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => {
    const listToRender = isAdmin ? surveys : pendingSurveys;

    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit' }}>
              Clima Laboral
            </h1>
            <p className="text-slate-500 mt-1">
              {isAdmin ? 'Gestiona encuestas, plantillas y resultados' : 'Responde tus encuestas activas'}
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('templates')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Plantillas
              </button>
              <button
                onClick={startCreatingSurvey}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Nueva Encuesta
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500">Encuestas</p>
            <p className="text-3xl font-bold text-slate-900">{surveys.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="text-3xl font-bold text-amber-600">{pendingSurveys.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500">Plantillas</p>
            <p className="text-3xl font-bold text-blue-600">{templates.length}</p>
          </div>
        </div>

        {listToRender.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">Sin pendientes</h3>
            <p className="text-slate-500 mt-1">
              {isAdmin ? 'Aún no hay encuestas creadas.' : '¡Excelente! Ya respondiste todas tus encuestas activas.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {listToRender.map((survey) => (
              <div key={survey.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{survey.nombre}</h3>
                    <p className="text-sm text-slate-500 mt-1">{survey.descripcion || 'Sin descripción'}</p>
                  </div>
                  {survey.es_anonima && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      <Shield className="w-3 h-3" />
                      Anónima
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Vence: <span className="font-medium text-slate-700">{survey.fecha_fin}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    {survey.preguntas_count || 0} preguntas
                  </p>
                  <p className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    Estado: {survey.esta_vigente ? 'Activa' : 'Cerrada'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <button
                      onClick={() => openResults(survey.id)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                    >
                      <BarChart3 className="w-4 h-4 inline mr-2" />
                      Resultados
                    </button>
                  ) : (
                    <button
                      disabled={!survey.esta_vigente}
                      onClick={() => startTakingSurvey(survey)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                    >
                      Responder Encuesta
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCreate = () => {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit' }}>
              Nueva Encuesta de Clima
            </h1>
            <p className="text-slate-500 mt-1">Diseña preguntas, metas y lanza la encuesta</p>
          </div>

          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Volver
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Título *</label>
              <input
                value={surveyDraft.nombre}
                onChange={(e) => setSurveyDraft((prev) => ({ ...prev, nombre: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5"
                placeholder="Ej. Encuesta Q1 2026"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
              <textarea
                rows={3}
                value={surveyDraft.descripcion}
                onChange={(e) => setSurveyDraft((prev) => ({ ...prev, descripcion: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5"
                placeholder="Describe el objetivo de la encuesta"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha fin *</label>
              <input
                type="date"
                value={surveyDraft.fecha_fin}
                onChange={(e) => setSurveyDraft((prev) => ({ ...prev, fecha_fin: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Participantes esperados</label>
              <input
                type="number"
                min="0"
                value={surveyDraft.meta_participacion}
                onChange={(e) => setSurveyDraft((prev) => ({ ...prev, meta_participacion: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Meta de satisfacción (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={surveyDraft.meta_satisfaccion}
                onChange={(e) => setSurveyDraft((prev) => ({ ...prev, meta_satisfaccion: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Plantilla manual</label>
              <div className="flex gap-2">
                <select
                  value={manualTemplateId}
                  onChange={(e) => setManualTemplateId(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5"
                >
                  <option value="">Selecciona plantilla</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.nombre}{template.is_default ? ' · Predeterminada' : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => applyTemplateToDraft(manualTemplateId)}
                  className="px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium"
                >
                  Usar
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={surveyDraft.es_anonima}
                  onChange={(e) => setSurveyDraft((prev) => ({ ...prev, es_anonima: e.target.checked }))}
                />
                Hacer encuesta anónima (no se mostrará identidad del colaborador)
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Preguntas</h2>
              <button
                onClick={addQuestion}
                className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium"
              >
                <Plus className="w-3 h-3 inline mr-1" />
                Agregar pregunta
              </button>
            </div>

            {surveyDraft.preguntas.map((question, qIndex) => (
              <div key={question.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-sm text-slate-700 font-medium mb-2">Pregunta {qIndex + 1}</label>
                    <input
                      value={question.pregunta}
                      onChange={(e) => updateQuestion(question.id, { pregunta: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white"
                      placeholder="Escribe la pregunta"
                    />
                  </div>

                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="mt-7 p-2 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-w-xs">
                  <label className="block text-sm text-slate-700 font-medium mb-2">Tipo</label>
                  <select
                    value={question.tipo}
                    onChange={(e) => updateQuestion(question.id, { tipo: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white"
                  >
                    <option value="seleccion">Selección única</option>
                    <option value="multiple">Selección múltiple</option>
                    <option value="abierta">Pregunta abierta</option>
                  </select>
                </div>

                {question.tipo !== 'abierta' && (
                  <div className="space-y-3">
                    {question.opciones.map((option) => (
                      <div key={option.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px_40px] gap-3 items-center">
                        <input
                          value={option.titulo}
                          onChange={(e) => updateOption(question.id, option.id, { titulo: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white"
                          placeholder="Texto de opción"
                        />
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={option.valor}
                          onChange={(e) => updateOption(question.id, option.id, { valor: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
                        />
                        <button
                          onClick={() => removeOption(question.id, option.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => addOption(question.id)}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Agregar opción
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium disabled:opacity-50"
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Guardar como Plantilla
            </button>
            <button
              onClick={handleCreateSurvey}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
            >
              <Target className="w-4 h-4 inline mr-2" />
              Lanzar Encuesta
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTake = () => {
    if (!selectedSurvey) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-slate-600">No hay encuesta seleccionada.</p>
        </div>
      );
    }

    return (
      <div className="animate-fade-in space-y-6">
        <div className="rounded-2xl bg-slate-900 text-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Outfit' }}>{selectedSurvey.nombre}</h1>
              <p className="text-slate-300 mt-1">{selectedSurvey.descripcion || 'Encuesta de clima laboral'}</p>
            </div>
            {selectedSurvey.es_anonima && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-100">
                <Shield className="w-3 h-3" />
                Encuesta anónima
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          {(selectedSurvey.preguntas || []).map((question, qIndex) => (
            <div key={question.id} className="border border-slate-200 rounded-2xl p-4">
              <p className="font-medium text-slate-900 mb-3">
                {qIndex + 1}. {question.pregunta}
              </p>

              {question.tipo === 'abierta' && (
                <textarea
                  rows={4}
                  value={answers[question.id] || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  placeholder="Escribe tu respuesta"
                />
              )}

              {question.tipo === 'seleccion' && (
                <div className="space-y-2">
                  {(question.opciones || []).map((option) => {
                    const selected = answers[question.id] === option.id;

                    return (
                      <label
                        key={option.id}
                        className={`block border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                          selected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          className="mr-3"
                          checked={selected}
                          onChange={() => setSelectionAnswer(question, option.id)}
                        />
                        {option.titulo}
                      </label>
                    );
                  })}
                </div>
              )}

              {question.tipo === 'multiple' && (
                <div className="space-y-2">
                  {(question.opciones || []).map((option) => {
                    const selected = (answers[question.id] || []).includes(option.id);

                    return (
                      <label
                        key={option.id}
                        className={`block border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                          selected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mr-3"
                          checked={selected}
                          onChange={(e) => setMultipleAnswer(question, option.id, e.target.checked)}
                        />
                        {option.titulo}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitResponses}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Enviando...' : 'Enviar Respuestas'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderComparativeTable = () => {
    if (!activeResult?.por_departamento) return null;

    const rows = Object.entries(activeResult.por_departamento);

    if (!rows.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
          No hay departamentos con respuestas.
        </div>
      );
    }

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="py-3">Departamento</th>
              <th className="py-3">Participación</th>
              <th className="py-3">Índice</th>
              <th className="py-3">Estado</th>
              <th className="py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([departmentName, item]) => {
              const level = getHealthLevel(item.global_index || 0);

              return (
                <tr key={departmentName} className="border-b border-slate-100">
                  <td className="py-3 font-medium text-slate-900">{departmentName}</td>
                  <td className="py-3 text-slate-600">{item.total} respuestas</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${clampPercent(item.global_index)}%`, backgroundColor: level.color }} />
                      </div>
                      <span className="text-sm font-semibold">{clampPercent(item.global_index)}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${level.color}22`, color: level.color }}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => setSelectedDepartment(departmentName)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderQuestionStats = () => {
    if (!visibleResult?.stats) return null;

    return (
      <div className="space-y-4">
        {visibleResult.stats.map((stat, index) => {
          const isOpen = stat.tipo === 'abierta';

          return (
            <div key={stat.id || index} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <h3 className="font-semibold text-slate-900">{index + 1}. {stat.pregunta}</h3>

                {isOpen ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Abierta</span>
                ) : (
                  <div className="flex items-center gap-2">
                    {(() => {
                      const averageState = getAverageVisualState(stat.promedio);
                      return (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${averageState.badgeClass}`}>
                          Promedio: {Number(stat.promedio || 0).toFixed(1)} / 5
                        </span>
                      );
                    })()}
                    {stat.alerta && (
                      <span className="text-xs font-medium text-red-600 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Requiere atención
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isOpen ? (
                <div className="space-y-2">
                  {(stat.respuestas || []).length === 0 ? (
                    <p className="text-sm text-slate-500">Sin respuestas de texto.</p>
                  ) : (
                    (stat.respuestas || []).map((response, responseIndex) => (
                      <p key={responseIndex} className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3">
                        “{response}”
                      </p>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {(stat.opciones || []).map((option) => {
                    const totalVotes = (stat.opciones || []).reduce((acc, item) => acc + item.votos, 0) || 1;
                    const percentage = Math.round((option.votos / totalVotes) * 100);

                    return (
                      <div key={option.id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-700">{option.titulo}</span>
                          <span className="text-slate-500">{option.votos} votos · {percentage}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-700 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };


  const renderAttentionAreas = () => {
    const attentionItems = visibleResult?.areas_atencion || [];

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Áreas de atención</h3>
          <span className="text-xs text-slate-500">Promedio por pregunta</span>
        </div>

        {attentionItems.length === 0 ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
            No se detectaron preguntas críticas para el departamento seleccionado.
          </div>
        ) : (
          <div className="space-y-3">
            {attentionItems.map((item) => (
              <div key={item.id} className="border border-red-100 bg-red-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-700">{item.codigo} · Promedio {item.promedio}/5</p>
                <p className="text-sm text-red-900 mt-1">{item.pregunta}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderResponseMatrixTable = () => {
    const matrix = visibleResult?.response_matrix || { columns: [], rows: [] };
    const columns = matrix.columns || [];
    const rows = matrix.rows || [];
    const questionAverageMap = Object.fromEntries((visibleResult?.question_promedios || []).map((item) => [item.id, item.promedio]));

    if (columns.length === 0) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
          No hay columnas disponibles para construir la tabla de resultados.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">VISTA RESULTADO (EQUIVALENTE EXCEL)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Departamento: <span className="font-medium text-slate-700">{selectedDepartment}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="inline-flex items-center gap-2 text-red-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              ≤ 3
            </span>
            <span className="inline-flex items-center gap-2 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {'> 3'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[880px] w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs uppercase tracking-wider text-slate-500 px-4 py-3 sticky left-0 bg-slate-50">NUM. ENCUESTA</th>
                  {columns.map((column) => (
                    <th key={column.id} className="text-left px-4 py-3 min-w-[160px]">
                      <p className="text-xs font-semibold text-slate-900">{column.codigo}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{column.pregunta}</p>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <td className="px-4 py-2 text-xs font-semibold text-slate-600 sticky left-0 bg-slate-50/80">Promedio</td>
                  {columns.map((column) => {
                    const avg = Number(questionAverageMap[column.id] || 0);
                    const colorClass = avg <= 3 ? 'text-red-600' : 'text-emerald-600';
                    return (
                      <td key={`avg-${column.id}`} className={`px-4 py-2 text-sm font-semibold ${colorClass}`}>
                        {avg.toFixed(1)}
                      </td>
                    );
                  })}
                </tr>

                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-sm text-slate-500">
                      Aún no hay respuestas para mostrar en la tabla.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.response_id || row.num_encuesta} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 sticky left-0 bg-white">{row.num_encuesta}</td>
                      {columns.map((column) => {
                        const cell = row.values?.[column.id];
                        const numericCell = typeof cell === 'number' ? cell : Number(cell);
                        const hasValue = Number.isFinite(numericCell);
                        const colorClass = !hasValue ? 'text-slate-400' : numericCell <= 3 ? 'text-red-600' : 'text-emerald-600';

                        return (
                          <td key={`${row.num_encuesta}-${column.id}`} className={`px-4 py-3 text-sm font-semibold ${colorClass}`}>
                            {hasValue ? (Number.isInteger(numericCell) ? numericCell : numericCell.toFixed(1)) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const survey = surveys.find((item) => item.id === selectedSurveyId);
    const departments = Object.keys(activeResult?.por_departamento || {});
    const departmentOptions = ['Global', ...departments];
    const resultsTabs = [
      { id: 'resumen-general', label: 'Resumen General' },
      { id: 'por-pregunta', label: 'Por Pregunta' },
      { id: 'participacion', label: 'Participación' },
      { id: 'vista-resultado', label: 'Vista Resultado' },
    ];

    if (!activeResult || !visibleResult) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
          Cargando resultados...
        </div>
      );
    }

    const currentHealth = getHealthLevel(visibleResult.global_index || 0);

    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit' }}>
              Resultados de Clima
            </h1>
            <p className="text-slate-500 mt-1">{survey?.nombre || activeResult.nombre}</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            >
              {departmentOptions.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>

            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium"
            >
              Volver
            </button>
          </div>
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-2 flex flex-wrap gap-2">
          {resultsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setResultsTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                resultsTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {resultsTab === 'resumen-general' && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <GaugeCard globalIndex={visibleResult.global_index} metaSatisfaccion={activeResult.meta_satisfaccion} />
              <ProgressVsMetaCard globalIndex={visibleResult.global_index} metaSatisfaccion={activeResult.meta_satisfaccion} />
              <ParticipationCard total={visibleResult.total} metaParticipacion={activeResult.meta_participacion} />
            </div>

            <StandardsChevron globalIndex={visibleResult.global_index} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {renderAttentionAreas()}

              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Promedio por pregunta</h3>

                {(visibleResult.question_promedios || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No hay preguntas cerradas para calcular promedio.</p>
                ) : (
                  <div className="space-y-3">
                    {(visibleResult.question_promedios || []).map((question) => {
                      const averageState = getAverageVisualState(question.promedio);

                      return (
                        <div key={question.id}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-700 line-clamp-1">{question.codigo} · {question.pregunta}</span>
                            <span className={`font-semibold ${averageState.textClass}`}>
                              {Number(question.promedio || 0).toFixed(1)} / 5
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${averageState.barClass}`}
                              style={{ width: `${Math.max(0, Math.min(100, Number(question.promedio || 0) * 20))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {resultsTab === 'por-pregunta' && renderQuestionStats()}

        {resultsTab === 'participacion' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ParticipationCard total={visibleResult.total} metaParticipacion={activeResult.meta_participacion} />

              <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-2">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Estado actual</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl font-bold" style={{ color: currentHealth.color }}>
                    {clampPercent(visibleResult.global_index)}%
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${currentHealth.color}22`, color: currentHealth.color }}>
                    {visibleResult.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  Departamento seleccionado: <span className="font-medium text-slate-900">{selectedDepartment}</span>
                </p>
              </div>
            </div>

            {!activeResult.es_anonima && selectedDepartment === 'Global' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 overflow-x-auto">
                <h3 className="font-semibold text-slate-900 mb-4">Rendimiento por colaborador</h3>

                {(activeResult.participantes || []).length === 0 ? (
                  <p className="text-sm text-slate-500">Sin datos de colaboradores para esta encuesta.</p>
                ) : (
                  <table className="w-full min-w-[620px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="py-3">Nombre</th>
                        <th className="py-3">% Satisfacción</th>
                        <th className="py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeResult.participantes.map((participant) => (
                        <tr key={participant.empleado_id} className="border-b border-slate-100">
                          <td className="py-3 font-medium text-slate-900">{participant.nombre}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${participant.alerta_colaborador ? 'bg-red-500' : 'bg-green-500'}`}
                                  style={{ width: `${clampPercent(participant.score)}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold">{clampPercent(participant.score)}%</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                participant.alerta_colaborador ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {participant.alerta_colaborador ? 'Crítico' : 'Estable'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeResult.es_anonima && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
                Esta encuesta es anónima; no se muestran colaboradores individuales.
              </div>
            )}
          </div>
        )}

        {resultsTab === 'vista-resultado' && renderResponseMatrixTable()}
      </div>
    );
  };

  const renderTemplates = () => {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit' }}>
              Biblioteca de Plantillas
            </h1>
            <p className="text-slate-500 mt-1">Reutiliza estructuras de encuesta y opciones</p>
          </div>

          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium"
          >
            Volver al Dashboard
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">Sin plantillas guardadas</h3>
            <p className="text-slate-500 mt-1">Crea una encuesta y guárdala como plantilla.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Acción</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-b border-slate-100">
                    <td className="px-6 py-4 font-medium text-slate-900">{template.nombre}</td>
                    <td className="px-6 py-4 text-slate-600">{template.descripcion || 'Sin descripción'}</td>
                    <td className="px-6 py-4">
                      {template.is_default ? (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          Predeterminada
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          Personalizada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        disabled={template.is_default}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {template.is_default ? 'Protegida' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Toaster position="top-right" richColors closeButton />

      {loading && currentView === 'dashboard' ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Cargando Clima Laboral...</p>
        </div>
      ) : null}

      {!loading || currentView !== 'dashboard' ? (
        <>
          {currentView === 'dashboard' && renderDashboard()}
          {currentView === 'create' && isAdmin && renderCreate()}
          {currentView === 'take' && renderTake()}
          {currentView === 'results' && isAdmin && renderResults()}
          {currentView === 'templates' && isAdmin && renderTemplates()}
        </>
      ) : null}
    </div>
  );
};

export default ClimaLaboralView;
