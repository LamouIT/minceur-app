import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, SessionLocal, engine
from .routers import account, plan, shopping, weights
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(title="Suivi minceur API", lifespan=lifespan)
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                   allow_methods=["*"], allow_headers=["*"])

for r in (account.router, plan.router, weights.router, shopping.router):
    app.include_router(r, prefix="/api")


@app.get("/api/health")
def health():
    return {"ok": True}
