from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.api import router as api_router
from backend.api.discovery import router as discovery_router
from backend.api.meeting_requests import router as meeting_requests_router


BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"


app = FastAPI(
    title="Who's Free Today API",
    version="0.1.0",
)


app.include_router(api_router)
app.include_router(discovery_router)
app.include_router(meeting_requests_router)


app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static",
)


@app.get("/", include_in_schema=False)
async def mini_app():
    return FileResponse(
        FRONTEND_DIR / "index.html"
    )


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "app": "Who's Free Today",
        "version": "0.1.0",
    }
