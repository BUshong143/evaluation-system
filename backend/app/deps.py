from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os

# ======================================================
# JWT CONFIG (MUST MATCH auth.py)
# ======================================================
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = "HS256"

security = HTTPBearer()

# ===============================
# CORE AUTH
# ===============================
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # REQUIRED FIELDS
        if "id" not in payload or "role" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )

    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


# ===============================
# ROLE GUARDS
# ===============================

# ADMIN ONLY
def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user


# HR ONLY
def require_hr(user=Depends(get_current_user)):
    if user["role"] != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR access required"
        )
    return user


# HEAD ONLY
def require_head(user=Depends(get_current_user)):
    if user["role"] != "head":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Department Head access required"
        )
    return user


# ===============================
# COMBINED ROLE GUARDS
# ===============================

# ADMIN OR HR
def require_hr_or_admin(user=Depends(get_current_user)):
    if user["role"] not in ["hr", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR or Admin access required"
        )
    return user


# ADMIN OR HEAD
def require_head_or_admin(user=Depends(get_current_user)):
    if user["role"] not in ["head", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Head or Admin access required"
        )
    return user