from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"


app = FastAPI(
    title="Who's Free Today API",
    version="0.1.0",
)


app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static",
)


@app.get("/", include_in_schema=False)
async def mini_app():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "app": "Who's Free Today",
        "version": "0.1.0",
    }
