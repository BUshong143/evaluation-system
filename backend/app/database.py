from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# ======================================================
# DATABASE URL (ENV FIRST, FALLBACK TO SQLITE)
# ======================================================

# Use DATABASE_URL from environment (Render/PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL")

# If not provided, use local SQLite database
if not DATABASE_URL:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'evaluation.db')}"

# ======================================================
# SQLITE SPECIAL ARGUMENT
# ======================================================

connect_args = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# ======================================================
# SQLALCHEMY ENGINE
# ======================================================

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,   # important for cloud DB stability
)

# ======================================================
# SESSION FACTORY
# ======================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ======================================================
# BASE MODEL
# ======================================================

Base = declarative_base()
