import requests
import json
from datetime import datetime

# Color codes for terminal
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

BASE_URL = 'http://localhost:3000/api/v1'
TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGVzdC1wcm9qZWN0IiwiYXVkIjoidGVzdC1wcm9qZWN0IiwiYXV0aF90aW1lIjoxNzY1NDM4NDIxLCJ1c2VyX2lkIjoidGVzdC11c2VyLTAwMSIsInN1YiI6InRlc3QtdXNlci0wMDEiLCJpYXQiOjE3NjU0Mzg0MjEsImV4cCI6MTc2NTQ0MjAyMSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbInRlc3RAZXhhbXBsZS5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJjdXN0b20ifX0.Ph4wZctN00z_nACoXcNNknwKYUTKs7jEZdicQDg1miQ'
HEADERS = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

test_results = {
    'total': 0,
    'passed': 0,
    'failed': 0,
    'tests': []
}

def test_endpoint(name, method, endpoint, data=None, expected_status=200, auth=True):
    global test_results
    test_results['total'] += 1
    
    url = f'{BASE_URL}{endpoint}'
    headers = HEADERS if auth else {}
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=5)
        elif method == 'POST':
            response = requests.post(url, json=data, headers=headers, timeout=5)
        elif method == 'PATCH':
            response = requests.patch(url, json=data, headers=headers, timeout=5)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=5)
        
        status = response.status_code
        success = status == expected_status or (200 <= status < 300)
        
        if success:
            test_results['passed'] += 1
            print(f'{GREEN} PASS{RESET}: {name} ({method} {endpoint}) - Status: {status}')
            test_results['tests'].append({
                'name': name,
                'method': method,
                'endpoint': endpoint,
                'status': 'PASS',
                'response_code': status
            })
        else:
            test_results['failed'] += 1
            print(f'{RED} FAIL{RESET}: {name} ({method} {endpoint}) - Expected: {expected_status}, Got: {status}')
            test_results['tests'].append({
                'name': name,
                'method': method,
                'endpoint': endpoint,
                'status': 'FAIL',
                'response_code': status,
                'error': response.text
            })
            
    except requests.exceptions.RequestException as e:
        test_results['failed'] += 1
        print(f'{RED} ERROR{RESET}: {name} ({method} {endpoint}) - {str(e)}')
        test_results['tests'].append({
            'name': name,
            'method': method,
            'endpoint': endpoint,
            'status': 'ERROR',
            'error': str(e)
        })

# Test Cases
print(f'\n{YELLOW}===== API TEST SUITE - ShareIn Mobile App ====={RESET}\n')
print(f'Starting tests at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')

# 1. Auth Tests
print(f'{YELLOW}1. AUTH API TESTS{RESET}')
test_endpoint('Create Test Token', 'POST', '/auth/test-token', 
    {'uid': 'test-user-001', 'email': 'test@example.com'}, 200, auth=False)
test_endpoint('Verify Token', 'POST', '/auth/verify', {}, 200, auth=True)

# 2. Posts Tests
print(f'\n{YELLOW}2. POSTS API TESTS{RESET}')
test_endpoint('Get Post Categories', 'GET', '/posts/categories', None, 200, auth=True)
test_endpoint('Get All Posts', 'GET', '/posts', None, 200, auth=True)
test_endpoint('Get My Posts', 'GET', '/posts/me', None, 200, auth=True)

# 3. Users Tests
print(f'\n{YELLOW}3. USERS API TESTS{RESET}')
test_endpoint('Get Current User Info', 'GET', '/users', None, 200, auth=True)

# 4. Chat Tests
print(f'\n{YELLOW}4. CHAT/CONVERSATIONS API TESTS{RESET}')
test_endpoint('Get All Conversations', 'GET', '/conversations', None, 200, auth=True)

# 5. Notifications Tests
print(f'\n{YELLOW}5. NOTIFICATIONS API TESTS{RESET}')
test_endpoint('Get Notifications', 'GET', '/notification', None, 200, auth=True)

# 6. Ratings Tests
print(f'\n{YELLOW}6. RATINGS API TESTS{RESET}')
test_endpoint('Get My Given Ratings', 'GET', '/ratings/me/given', None, 200, auth=True)
test_endpoint('Get My Received Ratings', 'GET', '/ratings/me/received', None, 200, auth=True)

# 7. Search Tests
print(f'\n{YELLOW}7. SEARCH API TESTS{RESET}')
test_endpoint('Get Search History', 'GET', '/search/history', None, 200, auth=True)

# 8. User Interests Tests
print(f'\n{YELLOW}8. USER INTERESTS API TESTS{RESET}')
test_endpoint('Get User Interests', 'GET', '/user-interests', None, 200, auth=True)

# Summary
print(f'\n{YELLOW}===== TEST SUMMARY ====={RESET}')
print(f'Total Tests: {test_results["total"]}')
print(f'{GREEN}Passed: {test_results["passed"]}{RESET}')
print(f'{RED}Failed: {test_results["failed"]}{RESET}')
print(f'Success Rate: {(test_results["passed"]/test_results["total"]*100):.1f}%\n')

if test_results['failed'] > 0:
    print(f'{RED}Failed Tests:{RESET}')
    for test in test_results['tests']:
        if test['status'] != 'PASS':
            print(f"  - {test['name']}: {test.get('error', 'Unknown error')}")
