from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    fullname: str
    email: str = Field(unique=True, index=True)
    phone: str = Field(unique=True, index=True)
    role: str = Field(default="tenant")  # tenant, landlord, agent, investor
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})