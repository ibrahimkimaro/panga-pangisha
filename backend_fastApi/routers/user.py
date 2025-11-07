# routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlmodel import Session, select
from database import get_session
from models.users import User
from schema.user import UserCreate, UserRead, UserLogin
from core.auth import (
    create_access_token, 
    create_refresh_token,
    verify_refresh_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS
)

from core.security import hash_password, verify_password


router = APIRouter(prefix="/api/user", tags=["Auth"])

# --- Signup ---
@router.post("/signup/", response_model=UserRead)
def signup(user_data: UserCreate, session: Session = Depends(get_session)):
    # Check if email already exists
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if phone already exists
    existing_phone = session.exec(select(User).where(User.phone == user_data.phone)).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # Create new user
    new_user = User(
        fullname=user_data.fullname,
        email=user_data.email,
        phone=user_data.phone,
        role=user_data.role,
        hashed_password=hash_password(user_data.password)
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

# --- Login ---
@router.post("/login/")
def login(
    user_data: UserLogin, 
    response: Response, 
    session: Session = Depends(get_session)
):
    # Find user by email or phone
    user = session.exec(
        select(User).where(
            (User.email == user_data.login) | (User.phone == user_data.login)
        )
    ).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )

    # Create tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    print("access_token:", access_token)
    
    # Set refresh token in HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "fullname": user.fullname,
            "role": user.role
        }
    }

# --- Refresh Token ---
@router.post("/refresh/")
async def refresh_token(request: Request):
    try:
        # Get refresh token from cookies or request body
        refresh_token = request.cookies.get("refresh_token")
        
        if not refresh_token:
            # Try to get from request body
            body = await request.json()
            refresh_token = body.get("refresh_token")
            
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token required"
            )
        
        # Verify refresh token
        payload = verify_refresh_token(refresh_token)
        user_id = int(payload.get("sub"))
        
        # Create new access token
        new_access_token = create_access_token({"sub": user_id})
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

# --- Logout ---
@router.post("/logout/")
def logout(response: Response):
    # Clear the refresh token cookie
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

# --- Get Current User ---
@router.get("/me/", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# --- Protected Test Endpoint ---
@router.get("/protected")
def protected_route(current_user: User = Depends(get_current_user)):
    return {
        "message": f"Hello {current_user.fullname}!",
        "user_id": current_user.id,
        "role": current_user.role
    }



@router.get("/getUser/{user_id}/", response_model=UserRead)
def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
