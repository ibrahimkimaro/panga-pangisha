from passlib.context import CryptContext

# Argon2 is modern, memory-hard, and has no 72-byte limit
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    # No truncation needed; supports long passwords safely
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
