import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


def _normalize(url: str) -> str:
    # Neon et Render donnent souvent "postgres://" ou "postgresql://" : on force le pilote psycopg 3.
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


DATABASE_URL = _normalize(os.getenv("DATABASE_URL", "postgresql://minceur:minceur@localhost:5432/minceur"))
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=5)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
