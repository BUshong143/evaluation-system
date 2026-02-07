from sqlalchemy.orm import Session
from .models import User, Questionnaire

def authenticate(db: Session, username: str, password: str):
    return db.query(User).filter(
        User.username == username,
        User.password == password
    ).first()

def create_user(db: Session, username, password, department):
    user = User(
        username=username,
        password=password,
        role="user",
        department=department
    )
    db.add(user)
    db.commit()
    return user

def create_questionnaire(db, content, department, user_id):
    q = Questionnaire(
        content=content,
        department=department,
        created_by=user_id
    )
    db.add(q)
    db.commit()
    return q

def approve_questionnaire(db, q_id):
    q = db.query(Questionnaire).get(q_id)
    q.status = "approved"
    db.commit()
    return q

def get_approved_by_department(db, department):
    return db.query(Questionnaire).filter(
        Questionnaire.department == department,
        Questionnaire.status == "approved"
    ).all()