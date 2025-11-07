from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    fullname: str
    email: EmailStr
    phone: str
    role: str = Field(..., pattern="^(tenant|landlord|agent|investor)$")  
    password: str = Field(..., min_length=8, max_length=255)

class UserRead(BaseModel):
    id: int
    fullname: str
    email: EmailStr
    phone: str
    role: str

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    login: str  # this can be email or phone
    password: str
