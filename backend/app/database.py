from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# ======================================================
# DATABASE CONFIG (POSTGRES FOR RENDER)
# ======================================================

DATABASE_URL = os.getenv("DATABASE_URL")

# Fallback for local development (SQLite)
if not DATABASE_URL:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'evaluation.db')}"

# Fix postgres URL for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# ======================================================
# ENGINE
# ======================================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

# ======================================================
# SESSION
# ======================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ======================================================
# BASE
# ======================================================

Base = declarative_base()
