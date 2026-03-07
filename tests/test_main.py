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


def test_create_message():
    payload = {
        "sender_email": "test@example.com",
        "recipient_email": "friend@example.com",
        "subject": "I told you so!",
        "body": "I told you that Leverkusen is going to win!",
        "send_at": "2030-01-01T00:00:00"
    }
    response = client.post("/messages", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["message"] == "Message scheduled"


def test_list_messages():
    response = client.get("/messages")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_messages_by_sender():
    payload = {
        "sender_email": "sender_unique@example.com",
        "recipient_email": "recipient@example.com",
        "subject": "Future message",
        "body": "I told you so!",
        "send_at": "2030-06-01T10:00:00"
    }
    client.post("/messages", json=payload)

    response = client.get("/messages?sender_email=sender_unique@example.com")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all(m["sender_email"] == "sender_unique@example.com" for m in data)


def test_message_has_scheduled_status():
    payload = {
        "sender_email": "status_test@example.com",
        "recipient_email": "other@example.com",
        "subject": "Status test",
        "body": "Checking status",
        "send_at": "2035-12-31T23:59:00"
    }
    response = client.post("/messages", json=payload)
    msg_id = response.json()["id"]

    all_msgs = client.get("/messages").json()
    created = next((m for m in all_msgs if m["id"] == msg_id), None)
    assert created is not None
    assert created["status"] == "scheduled"
    assert created["sent_at"] is None
