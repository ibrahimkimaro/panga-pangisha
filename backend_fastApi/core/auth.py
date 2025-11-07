# core/security.py
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
from database import get_session
from models.users import User

# JWT Configuration
SECRET_KEY = "supersecretpanga_pangisha_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15 * 3
REFRESH_TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/login/")

# In-memory storage for refresh tokens (use Redis or database in production)
refresh_tokens = {}

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {**data, "exp": expire, "type": "refresh"}
    refresh_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Store refresh token
    user_id = data.get("sub")
    if user_id:
        refresh_tokens[user_id] = refresh_token
    
    return refresh_token

def verify_refresh_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = int(payload.get("sub"))
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        # Verify the refresh token exists in storage
        if user_id not in refresh_tokens or refresh_tokens[user_id] != token:
            raise HTTPException(status_code=401, detail="Refresh token not found")
            
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid")


def get_current_user(
    request: Request,
    session: Session = Depends(get_session)
):
    # 1️Try to read from Authorization header
    auth_header = request.headers.get("Authorization")
    print("Authorization header received:", auth_header)

    if not auth_header:
        raise HTTPException(status_code=401, detail="No Authorization header found")

    # 2️ Extract token
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    token = auth_header.split(" ")[1]
    print("Token extracted:", token)

    # 3️⃣ Decode JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("Decoded payload:", payload)
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            raise HTTPException(status_code=401, detail="sub missing in token")
    except JWTError as e:
        print("JWTError:", e)
        raise HTTPException(status_code=401, detail="Invalid token")

    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    print("User fetched from DB:", user)
    return user