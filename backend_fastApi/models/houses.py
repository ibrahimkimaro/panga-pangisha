from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, JSON, DateTime

class Property(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Basic Information
    property_name: str = Field(sa_column=Column(String(255), nullable=False))
    property_type: str = Field(sa_column=Column(String(50), nullable=False))  # apartment, house, villa, etc.
    property_category: str = Field(sa_column=Column(String(50), nullable=False))  # residential, commercial, mixed
    furnishing_status: str = Field(sa_column=Column(String(50), nullable=False))  # furnished, semi-furnished, unfurnished
    description: str = Field(sa_column=Column(String(2000), nullable=False))
    
    # Location
    region: str = Field(sa_column=Column(String(100), nullable=False))
    district: str = Field(sa_column=Column(String(100), nullable=False))
    ward: str = Field(sa_column=Column(String(100), nullable=False))  # Mtaa
    street: str = Field(sa_column=Column(String(255), nullable=False))
    house_number: Optional[str] = Field(sa_column=Column(String(100), nullable=True))
    landmark: Optional[str] = Field(sa_column=Column(String(255), nullable=True))
    
    # Property Details
    total_units: int = Field(default=1, nullable=False)
    available_units: int = Field(default=1, nullable=False)
    bedrooms: int = Field(default=1, nullable=False)
    bathrooms: int = Field(default=1, nullable=False)
    square_feet: Optional[int] = Field(default=0, nullable=True)
    floor: Optional[int] = Field(default=1, nullable=True)
    total_floors: Optional[int] = Field(default=1, nullable=True)
    parking_spaces: Optional[int] = Field(default=0, nullable=True)
    year_built: Optional[str] = Field(sa_column=Column(String(4), nullable=True))
    
    # Pricing
    monthly_rent: float = Field(default=0.0, nullable=False)
    security_deposit: Optional[float] = Field(default=0.0, nullable=True)
    maintenance_fee: Optional[float] = Field(default=0.0, nullable=True)
    
    # Amenities (stored as JSON array)
    amenities: List[str] = Field(sa_column=Column(JSON), default_factory=list)
    
    # Media (file paths or URLs would be stored here)
    images: List[str] = Field(sa_column=Column(JSON), default_factory=list)
    
    # Contact
    contact_name: str = Field(sa_column=Column(String(255), nullable=False))
    contact_phone: str = Field(sa_column=Column(String(20), nullable=False))
    contact_email: str = Field(sa_column=Column(String(255), nullable=False))
    contact_hours: Optional[str] = Field(sa_column=Column(String(100), nullable=True))
    
    # Rules & Policies
    lease_duration: Optional[str] = Field(sa_column=Column(String(20), nullable=True))  # in months
    status: str = Field(sa_column=Column(String(20), default="available") ) # available, rented, draft
    
    # Timestamps
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow,sa_column=Column(DateTime, default=datetime.utcnow))
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow,sa_column=Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow))
    
    # Optional: For soft deletion
    is_active: bool = Field(default=True)