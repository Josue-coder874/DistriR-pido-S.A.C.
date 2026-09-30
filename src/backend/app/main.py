from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router

app = FastAPI(
    title="EcoLogística Lima API",
    version="0.1.0",
    description="API base para gestión y optimización de rutas de distribución.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def read_root() -> dict:
    return {
        "message": "EcoLogística Lima API",
        "status": "ok",
        "version": "0.1.0",
    }
