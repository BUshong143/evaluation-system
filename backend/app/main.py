from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import os

from .database import SessionLocal, engine
from .models import Base, User, Department, Questionnaire, EvaluationResponse
from .schemas import (
    LoginSchema,
    DepartmentCreate,
    QuestionnaireCreate,
    EvaluationSubmitSchema,
    ChatSchema,
    UpdateUserSchema,
    AssignHeadSchema
)
from .auth import create_token, hash_password, verify_password
from .deps import get_current_user
from .ai import router as ai_router, ask_ai

# ======================================================
# APP INIT
# ======================================================
app = FastAPI(title="University Evaluation System API")

Base.metadata.create_all(bind=engine)
app.include_router(ai_router)

# ======================================================
# ✅ PRODUCTION-SAFE CORS (FIXES MOBILE ERROR)
# ======================================================
ALLOWED_ORIGINS = [
    "https://evaluation-system-2.onrender.com",
    "https://evaluation-system-1.onrender.com",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================================================
# DB DEPENDENCY
# ======================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ======================================================
# SEED DEFAULT USERS
# ======================================================
@app.on_event("startup")
def seed_users():
    db = SessionLocal()

    if not db.query(User).filter_by(username="admin").first():
        db.add(User(username="admin", password=hash_password("admin123"), role="admin"))

    if not db.query(User).filter_by(username="hr").first():
        db.add(User(username="hr", password=hash_password("hr123"), role="hr"))

    db.commit()
    db.close()

# ======================================================
# ROOT HEALTH CHECK (IMPORTANT FOR RENDER + MOBILE)
# ======================================================
@app.get("/")
def root():
    return {"status": "API running"}

# ======================================================
# AUTH — LOGIN
# ======================================================
@app.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({"id": user.id, "role": user.role, "department_id": user.department_id})

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "department_id": user.department_id
    }

# ======================================================
# REGISTER (PUBLIC)
# ======================================================
@app.post("/register")
def register(data: LoginSchema, db: Session = Depends(get_db)):
    if db.query(User).filter_by(username=data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    user = User(username=data.username, password=hash_password(data.password), role="user")
    db.add(user)
    db.commit()
    return {"message": "Account created"}

# ======================================================
# USERS (ADMIN + HR)
# ======================================================
@app.get("/users")
def get_users(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403)
    return db.query(User).all()


@app.put("/users/{user_id}")
def update_user(user_id: int, data: UpdateUserSchema, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403)

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404)

    target.username = data.username
    target.role = data.role
    target.department_id = data.department_id
    db.commit()
    return {"message": "User updated"}


@app.delete("/users/{user_id}")
def delete_user(user_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403)

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404)

    if target.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin")

    db.delete(target)
    db.commit()
    return {"message": "User deleted"}

# ======================================================
# DEPARTMENTS
# ======================================================
@app.get("/departments")
def list_departments(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403)

    result = []
    for d in db.query(Department).all():
        head = db.query(User).filter_by(role="head", department_id=d.id).first()
        result.append({"id": d.id, "name": d.name, "head_name": head.username if head else None})

    return result


@app.post("/departments")
def create_department(data: DepartmentCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] != "hr":
        raise HTTPException(status_code=403)

    existing = db.query(Department).filter(
        func.lower(func.trim(Department.name)) == func.lower(func.trim(data.name))
    ).first()

    if existing:
        return {"id": existing.id, "name": existing.name}

    dept = Department(name=data.name.strip())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {"id": dept.id, "name": dept.name}


@app.put("/departments/{dept_id}/assign-head")
def assign_head(dept_id: int, data: AssignHeadSchema, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403)

    head = db.query(User).filter_by(username=data.username).first()
    if not head:
        raise HTTPException(status_code=404, detail="User not found")

    head.role = "head"
    head.department_id = dept_id
    db.commit()
    return {"message": "Head assigned"}


@app.put("/departments/{dept_id}/remove-head")
def remove_head(dept_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403)

    head = db.query(User).filter_by(role="head", department_id=dept_id).first()
    if not head:
        raise HTTPException(status_code=404, detail="No head assigned")

    head.role = "user"
    head.department_id = None
    db.commit()
    return {"message": "Head removed"}


@app.delete("/departments/{dept_id}")
def delete_department(dept_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403)

    dept = db.query(Department).filter_by(id=dept_id).first()
    if not dept:
        raise HTTPException(status_code=404)

    db.delete(dept)
    db.commit()
    return {"message": "Department deleted"}

# ======================================================
# QUESTIONNAIRES
# ======================================================
@app.post("/questionnaires")
def create_questionnaire(data: QuestionnaireCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] != "head":
        raise HTTPException(status_code=403)

    q = Questionnaire(
        content=data.content,
        department_id=user["department_id"],
        created_by=user["id"],
        is_active=False
    )

    db.add(q)
    db.commit()
    db.refresh(q)
    return {"id": q.id}


@app.get("/questionnaires")
def list_questionnaires(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] == "admin":
        return db.query(Questionnaire).all()

    if user["role"] == "head":
        return db.query(Questionnaire).filter(Questionnaire.department_id == user["department_id"]).all()

    raise HTTPException(status_code=403)


@app.post("/questionnaires/{qid}/activate")
def activate_questionnaire(qid: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] != "head":
        raise HTTPException(status_code=403)

    db.query(Questionnaire).filter(
        Questionnaire.department_id == user["department_id"]
    ).update({Questionnaire.is_active: False})

    q = db.query(Questionnaire).filter(
        Questionnaire.id == qid,
        Questionnaire.department_id == user["department_id"]
    ).first()

    if not q:
        raise HTTPException(status_code=404)

    q.is_active = True
    db.commit()
    return {"message": "Activated"}

# ======================================================
# PUBLIC EVALUATION
# ======================================================
@app.get("/public/active-questionnaire")
def get_active_questionnaire(db: Session = Depends(get_db)):
    q = db.query(Questionnaire).filter(
        Questionnaire.is_active == True
    ).order_by(Questionnaire.created_at.desc()).first()

    if not q:
        raise HTTPException(status_code=404)

    return {"id": q.id, "content": q.content}


@app.post("/evaluations/{qid}/submit")
def submit_evaluation(qid: int, data: EvaluationSubmitSchema, db: Session = Depends(get_db)):
    q = db.query(Questionnaire).filter_by(id=qid, is_active=True).first()
    if not q:
        raise HTTPException(status_code=404)

    ev = EvaluationResponse(questionnaire_id=qid, **data.dict())
    db.add(ev)
    db.commit()
    return {"message": "Submitted"}


@app.get("/head/evaluations")
def head_evaluations(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] != "head":
        raise HTTPException(status_code=403)

    return (
        db.query(EvaluationResponse)
        .join(Questionnaire)
        .filter(Questionnaire.department_id == user["department_id"])
        .all()
    )

# ======================================================
# AI CHAT
# ======================================================
@app.post("/chat")
def chat(data: ChatSchema, user=Depends(get_current_user)):
    if user["role"] != "head":
        raise HTTPException(status_code=403)
    return {"reply": ask_ai(data.message)}


@app.post("/public/chat")
def public_chat(data: ChatSchema):
    return {"reply": ask_ai(data.message)}
