#!/usr/bin/env python3
"""
Backend API Testing Script for EvalPro
Tests authentication and Clima Laboral endpoints
"""

import requests
import json
from datetime import date, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://repo-lift-1.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@empresa.com"
ADMIN_PASSWORD = "admin123"
EMPLOYEE_EMAIL = "juan@empresa.com"
EMPLOYEE_PASSWORD = "juan123"

# Global variables to store tokens and IDs
admin_token: Optional[str] = None
employee_token: Optional[str] = None
created_template_id: Optional[str] = None
created_survey_id: Optional[str] = None

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}


def log_test(test_name: str, passed: bool, message: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {test_name}")
    if message:
        print(f"   {message}")
    
    if passed:
        test_results["passed"] += 1
    else:
        test_results["failed"] += 1
        test_results["errors"].append(f"{test_name}: {message}")


def test_auth_login():
    """Test POST /api/auth/login with valid credentials"""
    global admin_token, employee_token
    
    print("\n" + "="*60)
    print("Testing Authentication")
    print("="*60)
    
    # Test admin login
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                admin_token = data["access_token"]
                user = data["user"]
                if user.get("email") == ADMIN_EMAIL and user.get("role") == "admin":
                    log_test("Admin Login", True, f"Logged in as {user.get('name')}")
                else:
                    log_test("Admin Login", False, f"User data mismatch: {user}")
            else:
                log_test("Admin Login", False, f"Missing access_token or user in response: {data}")
        else:
            log_test("Admin Login", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Admin Login", False, f"Exception: {str(e)}")
    
    # Test employee login
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": EMPLOYEE_EMAIL, "password": EMPLOYEE_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                employee_token = data["access_token"]
                user = data["user"]
                if user.get("email") == EMPLOYEE_EMAIL:
                    log_test("Employee Login", True, f"Logged in as {user.get('name')}")
                else:
                    log_test("Employee Login", False, f"User data mismatch: {user}")
            else:
                log_test("Employee Login", False, f"Missing access_token or user in response")
        else:
            log_test("Employee Login", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Employee Login", False, f"Exception: {str(e)}")
    
    # Test invalid credentials
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpass"},
            timeout=10
        )
        
        if response.status_code == 401:
            log_test("Invalid Login Rejection", True, "Correctly rejected invalid credentials")
        else:
            log_test("Invalid Login Rejection", False, f"Expected 401, got {response.status_code}")
    except Exception as e:
        log_test("Invalid Login Rejection", False, f"Exception: {str(e)}")


def test_auth_me():
    """Test GET /api/auth/me"""
    if not admin_token:
        log_test("Auth /me", False, "No admin token available")
        return
    
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("email") == ADMIN_EMAIL:
                log_test("Auth /me", True, f"Retrieved user: {data.get('name')}")
            else:
                log_test("Auth /me", False, f"User data mismatch: {data}")
        else:
            log_test("Auth /me", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Auth /me", False, f"Exception: {str(e)}")


def test_get_templates():
    """Test GET /api/clima-laboral/templates"""
    if not admin_token:
        log_test("GET Templates", False, "No admin token available")
        return
    
    print("\n" + "="*60)
    print("Testing Clima Laboral - Templates")
    print("="*60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/clima-laboral/templates",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "ok" in data and "plantillas" in data:
                templates = data["plantillas"]
                log_test("GET Templates", True, f"Retrieved {len(templates)} templates")
            else:
                log_test("GET Templates", False, f"Unexpected response format: {data}")
        else:
            log_test("GET Templates", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        log_test("GET Templates", False, f"Exception: {str(e)}")


def test_create_template():
    """Test POST /api/clima-laboral/templates"""
    global created_template_id
    
    if not admin_token:
        log_test("POST Template", False, "No admin token available")
        return
    
    template_data = {
        "nombre": "Plantilla de Prueba Automatizada",
        "descripcion": "Plantilla creada por test automatizado",
        "preguntas": [
            {
                "pregunta": "¿Qué tan satisfecho estás con tu trabajo?",
                "tipo": "seleccion",
                "opciones": [
                    {"titulo": "Muy insatisfecho", "valor": 1},
                    {"titulo": "Insatisfecho", "valor": 2},
                    {"titulo": "Neutral", "valor": 3},
                    {"titulo": "Satisfecho", "valor": 4},
                    {"titulo": "Muy satisfecho", "valor": 5}
                ]
            },
            {
                "pregunta": "¿Qué aspectos mejorarías?",
                "tipo": "multiple",
                "opciones": [
                    {"titulo": "Comunicación", "valor": 3},
                    {"titulo": "Herramientas", "valor": 3},
                    {"titulo": "Ambiente", "valor": 3}
                ]
            },
            {
                "pregunta": "Comentarios adicionales",
                "tipo": "abierta",
                "opciones": []
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/clima-laboral/templates",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=template_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "ok" in data and "plantilla" in data:
                created_template_id = data["plantilla"].get("id")
                log_test("POST Template", True, f"Created template ID: {created_template_id}")
            else:
                log_test("POST Template", False, f"Unexpected response format: {data}")
        else:
            log_test("POST Template", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        log_test("POST Template", False, f"Exception: {str(e)}")


def test_create_survey():
    """Test POST /api/clima-laboral/surveys with meta fields"""
    global created_survey_id
    
    if not admin_token:
        log_test("POST Survey", False, "No admin token available")
        return
    
    print("\n" + "="*60)
    print("Testing Clima Laboral - Surveys")
    print("="*60)
    
    # Calculate fecha_fin (30 days from now)
    fecha_fin = (date.today() + timedelta(days=30)).isoformat()
    
    survey_data = {
        "nombre": "Encuesta de Clima Laboral Q1 2024 - Test",
        "descripcion": "Encuesta de prueba automatizada con metas",
        "fecha_fin": fecha_fin,
        "es_anonima": False,
        "meta_participacion": 80,
        "meta_satisfaccion": 75,
        "preguntas": [
            {
                "pregunta": "¿Cómo calificarías el ambiente laboral?",
                "tipo": "seleccion",
                "opciones": [
                    {"titulo": "Muy malo", "valor": 1},
                    {"titulo": "Malo", "valor": 2},
                    {"titulo": "Regular", "valor": 3},
                    {"titulo": "Bueno", "valor": 4},
                    {"titulo": "Excelente", "valor": 5}
                ]
            },
            {
                "pregunta": "¿Qué tan satisfecho estás con tu equipo?",
                "tipo": "seleccion",
                "opciones": [
                    {"titulo": "Muy insatisfecho", "valor": 1},
                    {"titulo": "Insatisfecho", "valor": 2},
                    {"titulo": "Neutral", "valor": 3},
                    {"titulo": "Satisfecho", "valor": 4},
                    {"titulo": "Muy satisfecho", "valor": 5}
                ]
            },
            {
                "pregunta": "¿Qué aspectos valoras más?",
                "tipo": "multiple",
                "opciones": [
                    {"titulo": "Flexibilidad", "valor": 4},
                    {"titulo": "Comunicación", "valor": 4},
                    {"titulo": "Reconocimiento", "valor": 4}
                ]
            },
            {
                "pregunta": "Sugerencias de mejora",
                "tipo": "abierta",
                "opciones": []
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/clima-laboral/surveys",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=survey_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "ok" in data and "survey" in data:
                survey = data["survey"]
                created_survey_id = survey.get("id")
                
                # Verify meta fields
                meta_participacion = survey.get("meta_participacion")
                meta_satisfaccion = survey.get("meta_satisfaccion")
                
                if meta_participacion == 80 and meta_satisfaccion == 75:
                    log_test("POST Survey with Metas", True, 
                            f"Created survey ID: {created_survey_id}, meta_participacion: {meta_participacion}, meta_satisfaccion: {meta_satisfaccion}")
                else:
                    log_test("POST Survey with Metas", False, 
                            f"Meta fields mismatch: participacion={meta_participacion}, satisfaccion={meta_satisfaccion}")
            else:
                log_test("POST Survey with Metas", False, f"Unexpected response format: {data}")
        else:
            log_test("POST Survey with Metas", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        log_test("POST Survey with Metas", False, f"Exception: {str(e)}")


def test_get_surveys():
    """Test GET /api/clima-laboral/surveys"""
    if not employee_token:
        log_test("GET Surveys", False, "No employee token available")
        return
    
    try:
        response = requests.get(
            f"{BASE_URL}/clima-laboral/surveys",
            headers={"Authorization": f"Bearer {employee_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "ok" in data and "surveys" in data:
                surveys = data["surveys"]
                log_test("GET Surveys", True, f"Retrieved {len(surveys)} surveys")
                
                # Verify our created survey is in the list
                if created_survey_id:
                    found = any(s.get("id") == created_survey_id for s in surveys)
                    if found:
                        log_test("Survey in List", True, "Created survey found in list")
                    else:
                        log_test("Survey in List", False, "Created survey not found in list")
            else:
                log_test("GET Surveys", False, f"Unexpected response format: {data}")
        else:
            log_test("GET Surveys", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        log_test("GET Surveys", False, f"Exception: {str(e)}")


def test_respond_survey():
    """Test POST /api/clima-laboral/surveys/{id}/respond"""
    if not employee_token or not created_survey_id:
        log_test("POST Survey Response", False, "No employee token or survey ID available")
        return
    
    print("\n" + "="*60)
    print("Testing Clima Laboral - Survey Responses")
    print("="*60)
    
    # First, get the survey to get question IDs
    try:
        response = requests.get(
            f"{BASE_URL}/clima-laboral/surveys",
            headers={"Authorization": f"Bearer {employee_token}"},
            timeout=10
        )
        
        if response.status_code != 200:
            log_test("POST Survey Response", False, "Failed to fetch survey for question IDs")
            return
        
        surveys = response.json().get("surveys", [])
        survey = next((s for s in surveys if s.get("id") == created_survey_id), None)
        
        if not survey:
            log_test("POST Survey Response", False, "Survey not found")
            return
        
        questions = survey.get("preguntas", [])
        if len(questions) < 4:
            log_test("POST Survey Response", False, f"Expected 4 questions, got {len(questions)}")
            return
        
        # Build response payload
        respuestas = {}
        
        # Question 1: seleccion (ambiente laboral)
        q1 = questions[0]
        q1_options = q1.get("opciones", [])
        if q1_options:
            respuestas[q1["id"]] = q1_options[3]["id"]  # "Bueno" (valor 4)
        
        # Question 2: seleccion (satisfacción con equipo)
        q2 = questions[1]
        q2_options = q2.get("opciones", [])
        if q2_options:
            respuestas[q2["id"]] = q2_options[4]["id"]  # "Muy satisfecho" (valor 5)
        
        # Question 3: multiple (aspectos que valora)
        q3 = questions[2]
        q3_options = q3.get("opciones", [])
        if len(q3_options) >= 2:
            respuestas[q3["id"]] = [q3_options[0]["id"], q3_options[1]["id"]]  # Flexibilidad y Comunicación
        
        # Question 4: abierta (sugerencias)
        q4 = questions[3]
        respuestas[q4["id"]] = "Excelente ambiente de trabajo. Seguir mejorando la comunicación entre equipos."
        
        response_payload = {"respuestas": respuestas}
        
        # Submit response
        response = requests.post(
            f"{BASE_URL}/clima-laboral/surveys/{created_survey_id}/respond",
            headers={"Authorization": f"Bearer {employee_token}"},
            json=response_payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                log_test("POST Survey Response", True, "Response submitted successfully")
            else:
                log_test("POST Survey Response", False, f"Unexpected response: {data}")
        else:
            log_test("POST Survey Response", False, f"Status {response.status_code}: {response.text}")
    
    except Exception as e:
        log_test("POST Survey Response", False, f"Exception: {str(e)}")


def test_get_survey_results():
    """Test GET /api/clima-laboral/surveys/{id}/results with NEW FIELDS"""
    if not admin_token or not created_survey_id:
        log_test("GET Survey Results", False, "No admin token or survey ID available")
        return
    
    print("\n" + "="*60)
    print("Testing Clima Laboral - Survey Results (NEW FIELDS)")
    print("="*60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/clima-laboral/surveys/{created_survey_id}/results",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields including NEW FIELDS
            required_fields = ["ok", "nombre", "total", "global_index", "status", "stats", 
                             "meta_participacion", "meta_satisfaccion", "por_departamento",
                             "question_promedios", "areas_atencion", "response_matrix"]
            
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                log_test("GET Survey Results - Required Fields", False, f"Missing required fields: {missing_fields}")
                return
            
            global_index = data.get("global_index")
            status = data.get("status")
            meta_participacion = data.get("meta_participacion")
            meta_satisfaccion = data.get("meta_satisfaccion")
            total = data.get("total")
            por_departamento = data.get("por_departamento", {})
            stats = data.get("stats", [])
            question_promedios = data.get("question_promedios", [])
            areas_atencion = data.get("areas_atencion", [])
            response_matrix = data.get("response_matrix", {})
            
            log_test("GET Survey Results - Basic Structure", True, 
                    f"All required fields present")
            
            log_test("GET Survey Results - Global Index", True, 
                    f"global_index: {global_index}, status: {status}")
            
            log_test("GET Survey Results - Meta Fields", True, 
                    f"meta_participacion: {meta_participacion}, meta_satisfaccion: {meta_satisfaccion}")
            
            log_test("GET Survey Results - Responses", True, 
                    f"Total responses: {total}")
            
            # NEW FIELD: question_promedios
            if isinstance(question_promedios, list) and len(question_promedios) > 0:
                sample_promedio = question_promedios[0]
                required_promedio_fields = ["id", "codigo", "pregunta", "promedio", "alerta"]
                promedio_missing = [f for f in required_promedio_fields if f not in sample_promedio]
                
                if not promedio_missing:
                    log_test("GET Survey Results - question_promedios", True, 
                            f"Found {len(question_promedios)} question promedios with correct structure (codigo, promedio, alerta)")
                else:
                    log_test("GET Survey Results - question_promedios", False, 
                            f"question_promedios missing fields: {promedio_missing}")
            else:
                log_test("GET Survey Results - question_promedios", False, 
                        f"question_promedios is empty or not a list: {question_promedios}")
            
            # NEW FIELD: areas_atencion
            if isinstance(areas_atencion, list):
                if len(areas_atencion) > 0:
                    sample_area = areas_atencion[0]
                    required_area_fields = ["id", "codigo", "pregunta", "promedio"]
                    area_missing = [f for f in required_area_fields if f not in sample_area]
                    
                    if not area_missing:
                        log_test("GET Survey Results - areas_atencion", True, 
                                f"Found {len(areas_atencion)} areas de atención (promedio <= 3)")
                    else:
                        log_test("GET Survey Results - areas_atencion", False, 
                                f"areas_atencion missing fields: {area_missing}")
                else:
                    log_test("GET Survey Results - areas_atencion", True, 
                            "areas_atencion is empty (no questions with promedio <= 3)")
            else:
                log_test("GET Survey Results - areas_atencion", False, 
                        f"areas_atencion is not a list: {areas_atencion}")
            
            # NEW FIELD: response_matrix (global)
            if isinstance(response_matrix, dict):
                matrix_required = ["columns", "rows", "legend"]
                matrix_missing = [f for f in matrix_required if f not in response_matrix]
                
                if not matrix_missing:
                    columns = response_matrix.get("columns", [])
                    rows = response_matrix.get("rows", [])
                    legend = response_matrix.get("legend", {})
                    
                    # Verify columns structure
                    if len(columns) > 0:
                        sample_col = columns[0]
                        col_required = ["id", "codigo", "pregunta", "tipo"]
                        col_missing = [f for f in col_required if f not in sample_col]
                        
                        if not col_missing:
                            log_test("GET Survey Results - response_matrix.columns", True, 
                                    f"Found {len(columns)} columns with correct structure (P1, P2, etc.)")
                        else:
                            log_test("GET Survey Results - response_matrix.columns", False, 
                                    f"columns missing fields: {col_missing}")
                    else:
                        log_test("GET Survey Results - response_matrix.columns", False, 
                                "response_matrix.columns is empty")
                    
                    # Verify rows structure
                    if len(rows) > 0:
                        sample_row = rows[0]
                        row_required = ["num_encuesta", "response_id", "values", "low_count", "high_count"]
                        row_missing = [f for f in row_required if f not in sample_row]
                        
                        if not row_missing:
                            log_test("GET Survey Results - response_matrix.rows", True, 
                                    f"Found {len(rows)} rows with correct structure (num_encuesta, values, counts)")
                        else:
                            log_test("GET Survey Results - response_matrix.rows", False, 
                                    f"rows missing fields: {row_missing}")
                    else:
                        log_test("GET Survey Results - response_matrix.rows", False, 
                                "response_matrix.rows is empty")
                    
                    # Verify legend
                    if "low" in legend and "high" in legend:
                        log_test("GET Survey Results - response_matrix.legend", True, 
                                f"Legend present with low/high definitions")
                    else:
                        log_test("GET Survey Results - response_matrix.legend", False, 
                                f"Legend missing low/high: {legend}")
                else:
                    log_test("GET Survey Results - response_matrix", False, 
                            f"response_matrix missing fields: {matrix_missing}")
            else:
                log_test("GET Survey Results - response_matrix", False, 
                        f"response_matrix is not a dict: {response_matrix}")
            
            # Verify department structure with NEW FIELDS
            if por_departamento:
                dept_name = list(por_departamento.keys())[0]
                dept_data = por_departamento[dept_name]
                dept_required = ["total", "global_index", "status", "stats", 
                               "question_promedios", "areas_atencion", "response_matrix"]
                dept_missing = [field for field in dept_required if field not in dept_data]
                
                if not dept_missing:
                    log_test("GET Survey Results - por_departamento Structure", True, 
                            f"Department '{dept_name}' has all required fields including NEW FIELDS")
                    
                    # Verify department response_matrix
                    dept_matrix = dept_data.get("response_matrix", {})
                    if isinstance(dept_matrix, dict) and "columns" in dept_matrix and "rows" in dept_matrix:
                        dept_cols = dept_matrix.get("columns", [])
                        dept_rows = dept_matrix.get("rows", [])
                        log_test("GET Survey Results - por_departamento.response_matrix", True, 
                                f"Department '{dept_name}' has response_matrix with {len(dept_cols)} columns and {len(dept_rows)} rows")
                    else:
                        log_test("GET Survey Results - por_departamento.response_matrix", False, 
                                f"Department response_matrix structure invalid: {dept_matrix}")
                else:
                    log_test("GET Survey Results - por_departamento Structure", False, 
                            f"Department missing fields: {dept_missing}")
            else:
                log_test("GET Survey Results - por_departamento", False, 
                        "No departments found in results")
                
        else:
            log_test("GET Survey Results", False, f"Status {response.status_code}: {response.text}")
    
    except Exception as e:
        log_test("GET Survey Results", False, f"Exception: {str(e)}")


def test_employee_dashboard_summary():
    """Test GET /api/dashboard/employee-summary"""
    if not employee_token:
        log_test("GET Employee Dashboard Summary", False, "No employee token available")
        return
    
    print("\n" + "="*60)
    print("Testing Dashboard - Employee Summary")
    print("="*60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/dashboard/employee-summary",
            headers={"Authorization": f"Bearer {employee_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Check ok and summary fields
            if not data.get("ok"):
                log_test("GET Employee Dashboard Summary - Response", False, "ok field is not true")
                return
            
            summary = data.get("summary")
            if not summary:
                log_test("GET Employee Dashboard Summary - Response", False, "summary field missing")
                return
            
            log_test("GET Employee Dashboard Summary - Response", True, "ok=true and summary present")
            
            # Check required summary fields
            required_fields = ["comisiones_bonos", "asistencia", "actividades", 
                             "vacaciones", "objetivos", "alertas"]
            missing_fields = [field for field in required_fields if field not in summary]
            
            if missing_fields:
                log_test("GET Employee Dashboard Summary - Structure", False, 
                        f"Missing required fields: {missing_fields}")
                return
            
            log_test("GET Employee Dashboard Summary - Structure", True, 
                    "All required fields present (comisiones_bonos, asistencia, actividades, vacaciones, objetivos, alertas)")
            
            # Verify comisiones_bonos structure
            comisiones_bonos = summary.get("comisiones_bonos", {})
            cb_required = ["comisiones", "bono_desempeno", "total", "moneda"]
            cb_missing = [f for f in cb_required if f not in comisiones_bonos]
            
            if not cb_missing:
                log_test("GET Employee Dashboard Summary - comisiones_bonos", True, 
                        f"comisiones: {comisiones_bonos.get('comisiones')}, bono: {comisiones_bonos.get('bono_desempeno')}, total: {comisiones_bonos.get('total')} {comisiones_bonos.get('moneda')}")
            else:
                log_test("GET Employee Dashboard Summary - comisiones_bonos", False, 
                        f"Missing fields: {cb_missing}")
            
            # Verify asistencia structure
            asistencia = summary.get("asistencia", {})
            asist_required = ["dias_habiles", "dias_trabajados", "retardos", "descuentos"]
            asist_missing = [f for f in asist_required if f not in asistencia]
            
            if not asist_missing:
                log_test("GET Employee Dashboard Summary - asistencia", True, 
                        f"dias_trabajados: {asistencia.get('dias_trabajados')}/{asistencia.get('dias_habiles')}, retardos: {asistencia.get('retardos')}, descuentos: {asistencia.get('descuentos')}")
            else:
                log_test("GET Employee Dashboard Summary - asistencia", False, 
                        f"Missing fields: {asist_missing}")
            
            # Verify actividades
            actividades = summary.get("actividades", [])
            if isinstance(actividades, list) and len(actividades) > 0:
                sample_act = actividades[0]
                act_required = ["id", "titulo", "fecha", "tipo", "prioridad"]
                act_missing = [f for f in act_required if f not in sample_act]
                
                if not act_missing:
                    log_test("GET Employee Dashboard Summary - actividades", True, 
                            f"Found {len(actividades)} activities with correct structure")
                else:
                    log_test("GET Employee Dashboard Summary - actividades", False, 
                            f"Activity missing fields: {act_missing}")
            else:
                log_test("GET Employee Dashboard Summary - actividades", False, 
                        f"actividades is empty or not a list")
            
            # Verify vacaciones structure
            vacaciones = summary.get("vacaciones", {})
            vac_required = ["saldo_dias", "usados_periodo", "proximas"]
            vac_missing = [f for f in vac_required if f not in vacaciones]
            
            if not vac_missing:
                proximas = vacaciones.get("proximas", [])
                log_test("GET Employee Dashboard Summary - vacaciones", True, 
                        f"saldo: {vacaciones.get('saldo_dias')} días, usados: {vacaciones.get('usados_periodo')}, próximas: {len(proximas)}")
            else:
                log_test("GET Employee Dashboard Summary - vacaciones", False, 
                        f"Missing fields: {vac_missing}")
            
            # Verify objetivos
            objetivos = summary.get("objetivos", [])
            if isinstance(objetivos, list) and len(objetivos) > 0:
                sample_obj = objetivos[0]
                obj_required = ["id", "titulo", "avance"]
                obj_missing = [f for f in obj_required if f not in sample_obj]
                
                if not obj_missing:
                    log_test("GET Employee Dashboard Summary - objetivos", True, 
                            f"Found {len(objetivos)} objectives with correct structure")
                else:
                    log_test("GET Employee Dashboard Summary - objetivos", False, 
                            f"Objective missing fields: {obj_missing}")
            else:
                log_test("GET Employee Dashboard Summary - objetivos", False, 
                        f"objetivos is empty or not a list")
            
            # Verify alertas
            alertas = summary.get("alertas", [])
            if isinstance(alertas, list):
                log_test("GET Employee Dashboard Summary - alertas", True, 
                        f"Found {len(alertas)} alerts")
            else:
                log_test("GET Employee Dashboard Summary - alertas", False, 
                        f"alertas is not a list")
                
        else:
            log_test("GET Employee Dashboard Summary", False, f"Status {response.status_code}: {response.text}")
    
    except Exception as e:
        log_test("GET Employee Dashboard Summary", False, f"Exception: {str(e)}")


def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"✅ Passed: {test_results['passed']}")
    print(f"❌ Failed: {test_results['failed']}")
    print(f"Total: {test_results['passed'] + test_results['failed']}")
    
    if test_results['errors']:
        print("\n" + "="*60)
        print("FAILED TESTS DETAILS")
        print("="*60)
        for error in test_results['errors']:
            print(f"❌ {error}")
    
    print("\n" + "="*60)
    
    if test_results['failed'] == 0:
        print("🎉 ALL TESTS PASSED!")
    else:
        print(f"⚠️  {test_results['failed']} TEST(S) FAILED")
    
    print("="*60)


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("BACKEND API TESTING - EVALPRO")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin: {ADMIN_EMAIL}")
    print(f"Employee: {EMPLOYEE_EMAIL}")
    
    # Run tests in order
    test_auth_login()
    test_auth_me()
    test_get_templates()
    test_create_template()
    test_create_survey()
    test_get_surveys()
    test_respond_survey()
    test_get_survey_results()
    test_employee_dashboard_summary()
    
    # Print summary
    print_summary()
    
    # Exit with appropriate code
    exit(0 if test_results['failed'] == 0 else 1)


if __name__ == "__main__":
    main()
