from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime,
    JSON,
    Boolean
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# ======================================================
# DEPARTMENT
# ======================================================
class Department(Base):
    __tablename__ = "departments"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

    users = relationship(
        "User",
        back_populates="department",
        cascade="all, delete-orphan"
    )

    questionnaires = relationship(
        "Questionnaire",
        back_populates="department",
        cascade="all, delete-orphan"
    )


# ======================================================
# USER
# ======================================================
class User(Base):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, hr, head
    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True
    )

    department = relationship(
        "Department",
        back_populates="users"
    )


# ======================================================
# QUESTIONNAIRE
# ======================================================
class Questionnaire(Base):
    __tablename__ = "questionnaires"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)

    content = Column(Text, nullable=False)

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(DateTime, default=datetime.utcnow)

    # ✅ REQUIRED FOR ACTIVATION SYSTEM
    is_active = Column(Boolean, default=False, nullable=False)

    department = relationship(
        "Department",
        back_populates="questionnaires"
    )

    responses = relationship(
        "EvaluationResponse",
        back_populates="questionnaire",
        cascade="all, delete-orphan"
    )


# ======================================================
# EVALUATION RESPONSE
# ======================================================
class EvaluationResponse(Base):
    __tablename__ = "evaluation_responses"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)

    questionnaire_id = Column(
        Integer,
        ForeignKey("questionnaires.id"),
        nullable=False
    )

    name = Column(String, nullable=True)
    date = Column(String)
    time = Column(String)
    client_category = Column(String)

    ratings = Column(JSON, nullable=False)

    feedback_type = Column(String)
    feedback_message = Column(String)

    questionnaire = relationship(
        "Questionnaire",
        back_populates="responses"
    )