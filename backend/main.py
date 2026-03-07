from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import asyncio
import uuid

app = FastAPI(title="I Told You So")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FrameOptionsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "ALLOWALL"
        return response

app.add_middleware(FrameOptionsMiddleware)

providers = {}

dashboard_data = [
    {"id": i, "title": f"Dashboard {i+1}", "data": f"Data for dashboard {i+1}"}
    for i in range(5)
]

class Provider(BaseModel):
    id: int
    name: str
    config: dict

class TimedMessage(BaseModel):
    sender_email: str
    recipient_email: str
    subject: str
    body: str
    send_at: datetime

# NOTE: messages is an in-memory store. Data is lost on restart. Use a database for production.
messages = []

@app.get("/")
def read_root():
    return {"message": "FastAPI backend running."}

@app.get("/dashboards")
def get_dashboards(page: int = 1, page_size: int = 5):
    start = (page - 1) * page_size
    end = start + page_size
    return dashboard_data[start:end]

@app.get("/providers")
def list_providers():
    return list(providers.values())

@app.post("/providers")
def add_provider(provider: Provider):
    if provider.id in providers:
         raise HTTPException(status_code=400, detail="Provider already exists")
    providers[provider.id] = provider.dict()
    return {"message": "Provider added", "provider": provider.dict()}

@app.delete("/providers/{provider_id}")
def delete_provider(provider_id: int):
    if provider_id not in providers:
         raise HTTPException(status_code=404, detail="Provider not found")
    del providers[provider_id]
    return {"message": "Provider removed"}

@app.post("/messages")
def create_message(message: TimedMessage):
    msg_id = str(uuid.uuid4())
    msg = {
        "id": msg_id,
        "sender_email": message.sender_email,
        "recipient_email": message.recipient_email,
        "subject": message.subject,
        "body": message.body,
        "send_at": message.send_at.isoformat(),
        "status": "scheduled",
        "created_at": datetime.utcnow().isoformat(),
        "sent_at": None,
    }
    messages.append(msg)
    return {"message": "Message scheduled", "id": msg_id}

@app.get("/messages")
def list_messages(sender_email: Optional[str] = None):
    if sender_email:
        return [m for m in messages if m["sender_email"] == sender_email]
    return messages

async def check_and_send_messages():
    while True:
        try:
            now = datetime.utcnow()
            for msg in messages:
                if msg["status"] == "scheduled":
                    send_at = datetime.fromisoformat(msg["send_at"])
                    if now >= send_at:
                        msg["status"] = "sent"
                        msg["sent_at"] = now.isoformat()
                        # In production, send the email via SMTP or an email service here
        except Exception as exc:
            print(f"Error in message scheduler: {exc}")
        await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(check_and_send_messages())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=55222, reload=True)
