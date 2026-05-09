from datetime import datetime, date
from uuid import uuid4
from typing import Dict, Any, List

from fastapi import APIRouter, Depends, HTTPException

from middlewares.auth import db, get_current_user
from models.clima_laboral import ClimaSurveyCreate, ClimaTemplateCreate


router = APIRouter(prefix="/api/clima-laboral", tags=["Clima Laboral"])


HEALTH_RANGES = [
    {"label": "Óptimo", "min": 90, "max": 100, "color": "#00B050"},
    {"label": "Saludable", "min": 60, "max": 89.99, "color": "#FFCC00"},
    {"label": "Mejorable", "min": 31, "max": 59.99, "color": "#FF6600"},
    {"label": "Poco Saludable", "min": 0, "max": 30.99, "color": "#FF0000"},
]


def get_health_status(score: float) -> Dict[str, Any]:
    for item in HEALTH_RANGES:
        if item["min"] <= score <= item["max"]:
            return item
    return HEALTH_RANGES[-1]


def normalize_question_payload(question: Dict[str, Any], order: int) -> Dict[str, Any]:
    q_id = str(uuid4())
    q_type = question.get("tipo", "seleccion")

    options_payload: List[Dict[str, Any]] = []
    if q_type != "abierta":
        for option_order, option in enumerate(question.get("opciones", []), start=1):
            options_payload.append(
                {
                    "id": str(uuid4()),
                    "titulo": option.get("titulo", "").strip(),
                    "valor": int(option.get("valor", 1)),
                    "orden": option_order,
                }
            )

    return {
        "id": q_id,
        "pregunta": question.get("pregunta", "").strip(),
        "tipo": q_type,
        "orden": order,
        "opciones": options_payload,
    }


def compute_results_payload(survey: Dict[str, Any], responses: List[Dict[str, Any]], include_participants: bool) -> Dict[str, Any]:
    stats = []
    total_points = 0
    total_votes = 0
    participant_scores: Dict[str, Dict[str, Any]] = {}

    questions = sorted(survey.get("preguntas", []), key=lambda q: q.get("orden", 0))

    for question in questions:
        question_id = question.get("id")
        q_type = question.get("tipo")

        if q_type == "abierta":
            open_answers = []
            for response in responses:
                answer = next((item for item in response.get("respuestas", []) if item.get("pregunta_id") == question_id), None)
                if answer and answer.get("texto_respuesta"):
                    open_answers.append(answer.get("texto_respuesta"))

            stats.append(
                {
                    "id": question_id,
                    "pregunta": question.get("pregunta"),
                    "tipo": "abierta",
                    "respuestas": open_answers,
                }
            )
            continue

        options = sorted(question.get("opciones", []), key=lambda o: o.get("orden", 0))
        option_lookup = {option.get("id"): option for option in options}
        option_votes = {option.get("id"): 0 for option in options}

        question_points = 0
        question_votes = 0

        for response in responses:
            answer = next((item for item in response.get("respuestas", []) if item.get("pregunta_id") == question_id), None)
            if not answer:
                continue

            for option_id in answer.get("opcion_ids", []):
                option_data = option_lookup.get(option_id)
                if not option_data:
                    continue

                option_votes[option_id] += 1
                question_votes += 1
                question_points += option_data.get("valor", 0)
                total_votes += 1
                total_points += option_data.get("valor", 0)

                if include_participants and response.get("empleado_id"):
                    employee_id = response.get("empleado_id")
                    if employee_id not in participant_scores:
                        participant_scores[employee_id] = {
                            "empleado_id": employee_id,
                            "nombre": response.get("empleado_nombre") or "Colaborador",
                            "puntos": 0,
                            "votos": 0,
                        }

                    participant_scores[employee_id]["puntos"] += option_data.get("valor", 0)
                    participant_scores[employee_id]["votos"] += 1

        promedio = round(question_points / question_votes, 2) if question_votes else 0

        stats.append(
            {
                "id": question_id,
                "pregunta": question.get("pregunta"),
                "tipo": q_type,
                "promedio": promedio,
                "alerta": bool(question_votes and promedio <= 3.0),
                "opciones": [
                    {
                        "id": option.get("id"),
                        "titulo": option.get("titulo"),
                        "votos": option_votes.get(option.get("id"), 0),
                        "valor": option.get("valor"),
                    }
                    for option in options
                ],
            }
        )

    global_index = round((total_points / (total_votes * 5)) * 100, 1) if total_votes else 0
    health = get_health_status(global_index)

    participantes = []
    if include_participants:
        for participant in participant_scores.values():
            votes = participant.get("votos", 0)
            score = round((participant.get("puntos", 0) / (votes * 5)) * 100, 1) if votes else 0
            participantes.append(
                {
                    "empleado_id": participant.get("empleado_id"),
                    "nombre": participant.get("nombre"),
                    "score": score,
                    "alerta_colaborador": score < 50,
                }
            )

        participantes.sort(key=lambda item: item.get("score", 0), reverse=True)

    return {
        "global_index": global_index,
        "status": health.get("label"),
        "health_color": health.get("color"),
        "stats": stats,
        "participantes": participantes,
    }


@router.get("/surveys")
async def get_surveys(current_user: dict = Depends(get_current_user)):
    surveys = await db.clima_surveys.find({}, {"_id": 0}).sort("created_at", -1).to_list(300)

    participations = await db.clima_participations.find(
        {"empleado_id": current_user.get("id")},
        {"_id": 0, "survey_id": 1},
    ).to_list(1000)

    participated_ids = {item.get("survey_id") for item in participations}
    today = date.today().isoformat()

    for survey in surveys:
        survey["respondida"] = survey.get("id") in participated_ids
        survey["preguntas_count"] = len(survey.get("preguntas", []))
        survey["esta_vigente"] = bool(
            survey.get("activo", True) and (not survey.get("fecha_fin") or survey.get("fecha_fin") >= today)
        )

    return {"ok": True, "surveys": surveys}


@router.get("/pending")
async def get_pending_surveys(current_user: dict = Depends(get_current_user)):
    participations = await db.clima_participations.find(
        {"empleado_id": current_user.get("id")},
        {"_id": 0, "survey_id": 1},
    ).to_list(1000)

    participated_ids = {item.get("survey_id") for item in participations}
    today = date.today().isoformat()

    surveys = await db.clima_surveys.find(
        {
            "activo": True,
            "fecha_fin": {"$gte": today},
            "id": {"$nin": list(participated_ids)},
        },
        {"_id": 0},
    ).sort("created_at", -1).to_list(200)

    for survey in surveys:
        survey["preguntas_count"] = len(survey.get("preguntas", []))
        survey["respondida"] = False
        survey["esta_vigente"] = True

    return {"ok": True, "surveys": surveys}


@router.post("/surveys")
async def create_survey(payload: ClimaSurveyCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="No autorizado para crear encuestas")

    if not payload.preguntas:
        raise HTTPException(status_code=400, detail="Debes agregar al menos una pregunta")

    questions_payload = []
    for idx, question in enumerate(payload.preguntas, start=1):
        normalized = normalize_question_payload(question.dict(), idx)
        if normalized.get("tipo") != "abierta" and len(normalized.get("opciones", [])) == 0:
            raise HTTPException(status_code=400, detail="Las preguntas de selección requieren opciones")
        questions_payload.append(normalized)

    now = datetime.utcnow()
    survey_doc = {
        "id": str(uuid4()),
        "nombre": payload.nombre.strip(),
        "descripcion": (payload.descripcion or "").strip(),
        "fecha_inicio": date.today().isoformat(),
        "fecha_fin": payload.fecha_fin,
        "activo": True,
        "es_anonima": payload.es_anonima,
        "meta_participacion": payload.meta_participacion,
        "meta_satisfaccion": payload.meta_satisfaccion,
        "preguntas": questions_payload,
        "created_by": current_user.get("id"),
        "created_at": now,
        "updated_at": now,
    }

    await db.clima_surveys.insert_one(survey_doc)
    
    # Remove MongoDB _id before returning
    survey_doc.pop("_id", None)

    return {"ok": True, "survey": survey_doc}


@router.post("/surveys/{survey_id}/respond")
async def submit_survey_response(survey_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    survey = await db.clima_surveys.find_one({"id": survey_id}, {"_id": 0})
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    today = date.today().isoformat()
    if not survey.get("activo", True) or survey.get("fecha_fin") < today:
        raise HTTPException(status_code=400, detail="Esta encuesta ya no está activa")

    already_participated = await db.clima_participations.find_one(
        {
            "survey_id": survey_id,
            "empleado_id": current_user.get("id"),
        },
        {"_id": 0},
    )

    if already_participated:
        raise HTTPException(status_code=409, detail="Ya has respondido esta encuesta")

    raw_answers = payload.get("respuestas", {})
    if not isinstance(raw_answers, dict):
        raise HTTPException(status_code=400, detail="El formato de respuestas es inválido")

    normalized_answers = []
    for question in survey.get("preguntas", []):
        question_id = question.get("id")
        question_type = question.get("tipo")
        question_value = raw_answers.get(question_id)

        if question_type == "abierta":
            text_value = str(question_value).strip() if question_value is not None else ""
            if text_value:
                normalized_answers.append(
                    {
                        "pregunta_id": question_id,
                        "tipo": question_type,
                        "opcion_ids": [],
                        "texto_respuesta": text_value,
                    }
                )
            continue

        if question_type == "multiple":
            selected_ids = question_value if isinstance(question_value, list) else []
        else:
            selected_ids = [question_value] if question_value else []

        valid_option_ids = {option.get("id") for option in question.get("opciones", [])}
        clean_ids = [option_id for option_id in selected_ids if option_id in valid_option_ids]

        if clean_ids:
            normalized_answers.append(
                {
                    "pregunta_id": question_id,
                    "tipo": question_type,
                    "opcion_ids": clean_ids,
                    "texto_respuesta": None,
                }
            )

    if len(normalized_answers) == 0:
        raise HTTPException(status_code=400, detail="Debes responder al menos una pregunta")

    now = datetime.utcnow()
    participation_doc = {
        "id": str(uuid4()),
        "survey_id": survey_id,
        "empleado_id": current_user.get("id"),
        "fecha_participacion": now,
    }

    response_doc = {
        "id": str(uuid4()),
        "survey_id": survey_id,
        "empleado_id": None if survey.get("es_anonima") else current_user.get("id"),
        "empleado_nombre": None if survey.get("es_anonima") else current_user.get("name"),
        "departamento": current_user.get("department") or "Sin Departamento",
        "created_at": now,
        "respuestas": normalized_answers,
    }

    await db.clima_participations.insert_one(participation_doc)
    await db.clima_responses.insert_one(response_doc)

    return {"ok": True, "message": "Respuestas registradas correctamente"}


@router.get("/surveys/{survey_id}/results")
async def get_survey_results(survey_id: str, current_user: dict = Depends(get_current_user)):
    survey = await db.clima_surveys.find_one({"id": survey_id}, {"_id": 0})
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    responses = await db.clima_responses.find({"survey_id": survey_id}, {"_id": 0}).to_list(5000)
    global_results = compute_results_payload(survey, responses, include_participants=not survey.get("es_anonima", True))

    by_department: Dict[str, List[Dict[str, Any]]] = {}
    for response in responses:
        department_name = response.get("departamento") or "Sin Departamento"
        if department_name not in by_department:
            by_department[department_name] = []
        by_department[department_name].append(response)

    department_results: Dict[str, Dict[str, Any]] = {}
    for department_name, department_responses in by_department.items():
        calc = compute_results_payload(survey, department_responses, include_participants=False)
        department_results[department_name] = {
            "total": len(department_responses),
            "global_index": calc.get("global_index", 0),
            "status": calc.get("status"),
            "stats": calc.get("stats", []),
        }

    return {
        "ok": True,
        "nombre": survey.get("nombre"),
        "es_anonima": survey.get("es_anonima", True),
        "meta_participacion": survey.get("meta_participacion", 0),
        "meta_satisfaccion": survey.get("meta_satisfaccion", 80),
        "total": len(responses),
        "global_index": global_results.get("global_index", 0),
        "status": global_results.get("status"),
        "stats": global_results.get("stats", []),
        "participantes": global_results.get("participantes", []),
        "por_departamento": department_results,
    }


@router.get("/templates")
async def get_templates(current_user: dict = Depends(get_current_user)):
    templates = await db.clima_templates.find({}, {"_id": 0}).sort("created_at", 1).to_list(500)

    compact_templates = [
        {
            "id": template.get("id"),
            "nombre": template.get("nombre"),
            "descripcion": template.get("descripcion"),
            "created_at": template.get("created_at"),
        }
        for template in templates
    ]

    return {"ok": True, "plantillas": compact_templates}


@router.get("/templates/{template_id}")
async def get_template(template_id: str, current_user: dict = Depends(get_current_user)):
    template = await db.clima_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    return {"ok": True, "plantilla": template}


@router.post("/templates")
async def create_template(payload: ClimaTemplateCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="No autorizado para crear plantillas")

    if not payload.preguntas:
        raise HTTPException(status_code=400, detail="Debes agregar al menos una pregunta")

    normalized_questions = [
        normalize_question_payload(question.dict(), idx)
        for idx, question in enumerate(payload.preguntas, start=1)
    ]

    template_doc = {
        "id": str(uuid4()),
        "nombre": payload.nombre.strip(),
        "descripcion": (payload.descripcion or "").strip(),
        "preguntas": normalized_questions,
        "created_at": datetime.utcnow(),
    }

    await db.clima_templates.insert_one(template_doc)
    
    # Remove MongoDB _id before returning
    template_doc.pop("_id", None)

    return {"ok": True, "plantilla": template_doc}


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")

    result = await db.clima_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    return {"ok": True, "message": "Plantilla eliminada"}
