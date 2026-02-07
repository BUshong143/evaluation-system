from pydantic import BaseModel
from typing import List, Optional

# =========================
# AUTH
# =========================
class LoginSchema(BaseModel):
    username: str
    password: str


# =========================
# DEPARTMENT
# =========================
class DepartmentCreate(BaseModel):
    name: str


class DepartmentWithUserCreate(BaseModel):
    department_name: str
    username: str
    password: str
    role: str


class AssignHeadSchema(BaseModel):
    department_id: int


# =========================
# QUESTIONNAIRE
# =========================
class QuestionnaireCreate(BaseModel):
    content: str


# =========================
# PUBLIC EVALUATION SUBMIT
# =========================
class EvaluationSubmitSchema(BaseModel):
    name: Optional[str] = None
    date: str
    time: str
    client_category: str
    ratings: List[int]
    feedback_type: str
    feedback_message: str


# =========================
# EMAIL (FIXES 422 ERROR)
# =========================
class SendEvaluationEmailSchema(BaseModel):
    to_email: str
    link: str


# =========================
# USER MANAGEMENT
# =========================
class UpdateUserSchema(BaseModel):
    username: str
    role: str
    department_id: Optional[int] = None


class ResetPasswordSchema(BaseModel):
    password: str


# =========================
# AI / CHAT (OPTIONAL)
# =========================
class ChatSchema(BaseModel):
    message: str