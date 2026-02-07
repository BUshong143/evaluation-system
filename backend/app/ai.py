from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq
import os

router = APIRouter(prefix="/ai", tags=["AI"])

# ======================================================
# SCHEMA
# ======================================================
class ChatSchema(BaseModel):
    message: str

# ======================================================
# GROQ CLIENT (LAZY INIT — FIXES WINDOWS RELOAD)
# ======================================================
def get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set")
    return Groq(api_key=api_key)

# ======================================================
# CORE AI FUNCTION
# ======================================================
def ask_ai(prompt: str) -> str:
    client = get_groq_client()

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Buddy, an intelligent university evaluation assistant. "
                    "You generate professional, accurate, and context-aware responses. "
                    "When asked to generate survey questions, return ONLY a JSON array "
                    "of clear, measurable questions suitable for 1–5 star ratings."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.4
    )

    return completion.choices[0].message.content.strip()

# ======================================================
# ROUTER ENDPOINT
# ======================================================
@router.post("/chat")
def ai_chat(data: ChatSchema):
    return {"reply": ask_ai(data.message)}
