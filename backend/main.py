from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel

app = FastAPI()

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

@app.get("/")
def read_root():
    return {"message": "FastAPI backend running."}

@app.get("/dashboards")
def get_dashboards():
    return dashboard_data

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=55222, reload=True)
