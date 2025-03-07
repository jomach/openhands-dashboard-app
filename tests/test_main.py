from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_get_dashboards():
    response = client.get("/dashboards")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 5


def test_provider_crud():
    # Get initial count
    response = client.get("/providers")
    initial_count = len(response.json())

    payload = {"id": 1, "name": "Test Provider", "config": {}}
    response = client.post("/providers", json=payload)
    assert response.status_code == 200

    response = client.get("/providers")
    new_count = len(response.json())
    assert new_count == initial_count + 1

    response = client.delete("/providers/1")
    assert response.status_code == 200

    response = client.get("/providers")
    final_count = len(response.json())
    assert final_count == initial_count
