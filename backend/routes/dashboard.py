from datetime import date, datetime, timedelta
from typing import Dict, Any, List

from fastapi import APIRouter, Depends

from middlewares.auth import db, get_current_user


router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def build_employee_dashboard_summary(current_user: Dict[str, Any]) -> Dict[str, Any]:
    today = date.today()
    period_key = today.strftime("%Y-%m")
    period_label = today.strftime("%B %Y").capitalize()

    user_id = current_user.get("id") or "empleado"
    seed = sum(ord(char) for char in user_id)

    dias_habiles = 22
    dias_trabajados = 16 + (seed % 6)
    retardos = seed % 4
    descuentos = float((retardos * 175) + (seed % 3) * 120)
    comisiones = float(1800 + (seed % 8) * 420)
    bono_desempeno = float(800 + (seed % 5) * 250)

    actividades: List[Dict[str, Any]] = [
        {
            "id": f"act-{user_id}-1",
            "titulo": "Revisión quincenal con líder",
            "fecha": (today + timedelta(days=2)).isoformat(),
            "tipo": "Reunión",
            "prioridad": "media",
        },
        {
            "id": f"act-{user_id}-2",
            "titulo": "Entrega de avances KPI",
            "fecha": (today + timedelta(days=5)).isoformat(),
            "tipo": "Entrega",
            "prioridad": "alta",
        },
        {
            "id": f"act-{user_id}-3",
            "titulo": "Sesión de clima laboral",
            "fecha": (today + timedelta(days=9)).isoformat(),
            "tipo": "Clima",
            "prioridad": "media",
        },
    ]

    vacaciones = {
        "saldo_dias": 12 + (seed % 5),
        "usados_periodo": 2 + (seed % 3),
        "proximas": [
            {
                "inicio": (today + timedelta(days=18)).isoformat(),
                "fin": (today + timedelta(days=20)).isoformat(),
                "estado": "Aprobadas",
            }
        ],
    }

    objetivos = [
        {
            "id": "obj-1",
            "titulo": "Cumplimiento de entregables",
            "avance": 70 + (seed % 20),
        },
        {
            "id": "obj-2",
            "titulo": "Satisfacción de clientes internos",
            "avance": 65 + (seed % 25),
        },
    ]

    alertas = [
        "Tienes 1 actividad de prioridad alta esta semana.",
        f"Tus retardos del periodo: {retardos}.",
    ]

    return {
        "id": f"dash-{user_id}-{period_key}",
        "user_id": user_id,
        "period_key": period_key,
        "periodo": period_label,
        "comisiones_bonos": {
            "comisiones": comisiones,
            "bono_desempeno": bono_desempeno,
            "total": round(comisiones + bono_desempeno, 2),
            "moneda": "MXN",
        },
        "asistencia": {
            "dias_habiles": dias_habiles,
            "dias_trabajados": dias_trabajados,
            "retardos": retardos,
            "descuentos": descuentos,
        },
        "actividades": actividades,
        "vacaciones": vacaciones,
        "objetivos": objetivos,
        "alertas": alertas,
        "updated_at": datetime.utcnow(),
    }


@router.get("/employee-summary")
async def get_employee_dashboard_summary(current_user: dict = Depends(get_current_user)):
    today = date.today()
    period_key = today.strftime("%Y-%m")
    user_id = current_user.get("id") or "empleado"

    summary = await db.dashboard_employee_summary.find_one(
        {"user_id": user_id, "period_key": period_key},
        {"_id": 0},
    )

    if summary:
        return {"ok": True, "summary": summary}

    default_summary = build_employee_dashboard_summary(current_user)
    await db.dashboard_employee_summary.insert_one(default_summary)
    default_summary.pop("_id", None)

    return {"ok": True, "summary": default_summary}
