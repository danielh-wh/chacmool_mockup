#!/usr/bin/env python3
"""
Extended Backend API Testing - Focus on Auth and Edge Cases
"""

import requests
import json

BASE_URL = "https://levanta-build.preview.emergentagent.com/api"

def test_multiple_logins():
    """Test login with multiple users to verify body consumed bug is fixed"""
    print("\n" + "="*60)
    print("Testing Multiple Sequential Logins (Body Consumed Bug)")
    print("="*60)
    
    test_users = [
        ("admin@empresa.com", "admin123", "Admin Usuario"),
        ("maria@empresa.com", "maria123", "María García López"),
        ("juan@empresa.com", "juan123", "Juan Rodríguez"),
        ("laura@empresa.com", "laura123", "Laura Sánchez"),
        ("carlos@empresa.com", "carlos123", "Carlos Mendoza"),
    ]
    
    success_count = 0
    
    for email, password, expected_name in test_users:
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": email, "password": password},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    user = data["user"]
                    if user.get("name") == expected_name:
                        print(f"✅ {email}: Login successful as {expected_name}")
                        success_count += 1
                    else:
                        print(f"❌ {email}: Name mismatch - expected {expected_name}, got {user.get('name')}")
                else:
                    print(f"❌ {email}: Missing access_token or user in response")
            else:
                print(f"❌ {email}: Status {response.status_code}")
        except Exception as e:
            print(f"❌ {email}: Exception - {str(e)}")
    
    print(f"\n✅ Successfully logged in {success_count}/{len(test_users)} users")
    return success_count == len(test_users)


def test_concurrent_auth_operations():
    """Test auth operations in sequence to verify no state issues"""
    print("\n" + "="*60)
    print("Testing Concurrent Auth Operations")
    print("="*60)
    
    # Login as admin
    response1 = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@empresa.com", "password": "admin123"},
        timeout=10
    )
    
    if response1.status_code != 200:
        print("❌ Admin login failed")
        return False
    
    admin_token = response1.json()["access_token"]
    print("✅ Admin login successful")
    
    # Login as employee
    response2 = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "juan@empresa.com", "password": "juan123"},
        timeout=10
    )
    
    if response2.status_code != 200:
        print("❌ Employee login failed")
        return False
    
    employee_token = response2.json()["access_token"]
    print("✅ Employee login successful")
    
    # Verify admin token still works
    response3 = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10
    )
    
    if response3.status_code == 200 and response3.json().get("email") == "admin@empresa.com":
        print("✅ Admin token still valid after employee login")
    else:
        print("❌ Admin token invalid after employee login")
        return False
    
    # Verify employee token works
    response4 = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {employee_token}"},
        timeout=10
    )
    
    if response4.status_code == 200 and response4.json().get("email") == "juan@empresa.com":
        print("✅ Employee token valid")
    else:
        print("❌ Employee token invalid")
        return False
    
    return True


def test_survey_edge_cases():
    """Test survey creation and response edge cases"""
    print("\n" + "="*60)
    print("Testing Survey Edge Cases")
    print("="*60)
    
    # Login as admin
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@empresa.com", "password": "admin123"},
        timeout=10
    )
    
    if response.status_code != 200:
        print("❌ Admin login failed")
        return False
    
    admin_token = response.json()["access_token"]
    
    # Test: Create survey with meta_participacion = 0
    survey_data = {
        "nombre": "Test Survey - Zero Meta",
        "descripcion": "Testing zero meta_participacion",
        "fecha_fin": "2024-12-31",
        "es_anonima": True,
        "meta_participacion": 0,
        "meta_satisfaccion": 50,
        "preguntas": [
            {
                "pregunta": "Test question",
                "tipo": "seleccion",
                "opciones": [
                    {"titulo": "Option 1", "valor": 1},
                    {"titulo": "Option 2", "valor": 5}
                ]
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/clima-laboral/surveys",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=survey_data,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        survey = data.get("survey", {})
        if survey.get("meta_participacion") == 0:
            print("✅ Survey with meta_participacion=0 created successfully")
        else:
            print(f"❌ meta_participacion mismatch: expected 0, got {survey.get('meta_participacion')}")
            return False
    else:
        print(f"❌ Survey creation failed: {response.status_code}")
        return False
    
    # Test: Create survey with high meta values
    survey_data2 = {
        "nombre": "Test Survey - High Meta",
        "descripcion": "Testing high meta values",
        "fecha_fin": "2024-12-31",
        "es_anonima": False,
        "meta_participacion": 100,
        "meta_satisfaccion": 100,
        "preguntas": [
            {
                "pregunta": "Test question 2",
                "tipo": "seleccion",
                "opciones": [
                    {"titulo": "Option A", "valor": 3},
                    {"titulo": "Option B", "valor": 5}
                ]
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/clima-laboral/surveys",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=survey_data2,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        survey = data.get("survey", {})
        if survey.get("meta_participacion") == 100 and survey.get("meta_satisfaccion") == 100:
            print("✅ Survey with meta values=100 created successfully")
        else:
            print(f"❌ meta values mismatch")
            return False
    else:
        print(f"❌ Survey creation failed: {response.status_code}")
        return False
    
    return True


def test_employee_permissions():
    """Test that employees cannot create surveys/templates"""
    print("\n" + "="*60)
    print("Testing Employee Permissions")
    print("="*60)
    
    # Login as employee
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "juan@empresa.com", "password": "juan123"},
        timeout=10
    )
    
    if response.status_code != 200:
        print("❌ Employee login failed")
        return False
    
    employee_token = response.json()["access_token"]
    
    # Try to create template as employee (should fail)
    template_data = {
        "nombre": "Unauthorized Template",
        "descripcion": "Should not be created",
        "preguntas": [
            {
                "pregunta": "Test",
                "tipo": "seleccion",
                "opciones": [{"titulo": "Yes", "valor": 5}]
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/clima-laboral/templates",
        headers={"Authorization": f"Bearer {employee_token}"},
        json=template_data,
        timeout=10
    )
    
    if response.status_code == 403:
        print("✅ Employee correctly denied template creation (403)")
    else:
        print(f"❌ Expected 403, got {response.status_code}")
        return False
    
    # Try to create survey as employee (should fail)
    survey_data = {
        "nombre": "Unauthorized Survey",
        "descripcion": "Should not be created",
        "fecha_fin": "2024-12-31",
        "es_anonima": True,
        "meta_participacion": 50,
        "meta_satisfaccion": 50,
        "preguntas": [
            {
                "pregunta": "Test",
                "tipo": "seleccion",
                "opciones": [{"titulo": "Yes", "valor": 5}]
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/clima-laboral/surveys",
        headers={"Authorization": f"Bearer {employee_token}"},
        json=survey_data,
        timeout=10
    )
    
    if response.status_code == 403:
        print("✅ Employee correctly denied survey creation (403)")
    else:
        print(f"❌ Expected 403, got {response.status_code}")
        return False
    
    return True


def main():
    """Run extended tests"""
    print("\n" + "="*60)
    print("EXTENDED BACKEND API TESTING")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    
    results = []
    
    results.append(("Multiple Logins", test_multiple_logins()))
    results.append(("Concurrent Auth", test_concurrent_auth_operations()))
    results.append(("Survey Edge Cases", test_survey_edge_cases()))
    results.append(("Employee Permissions", test_employee_permissions()))
    
    print("\n" + "="*60)
    print("EXTENDED TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n✅ Passed: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 ALL EXTENDED TESTS PASSED!")
    else:
        print(f"\n⚠️  {total - passed} TEST(S) FAILED")
    
    print("="*60)
    
    exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
