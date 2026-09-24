from fastapi import FastAPI

app = FastAPI(
    title="Who's Free Today API",
    version="0.1.0",
)


@app.get("/")
async def root():
    return {
        "app": "Who's Free Today",
        "status": "ok",
        "version": "0.1.0",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
