from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime

class PropertyBase(BaseModel):
    # Basic Information
    property_name: str
    property_type: str
    property_category: str
    furnishing_status: str
    description: str
    
    # Location
    region: str
    district: str
    ward: str
    street: str
    house_number: Optional[str] = None
    landmark: Optional[str] = None
    
    # Property Details
    total_units: int
    available_units: int
    bedrooms: int
    bathrooms: int
    square_feet: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    parking_spaces: Optional[int] = None
    year_built: Optional[str] = None
    
    # Pricing
    monthly_rent: float
    security_deposit: Optional[float] = None
    maintenance_fee: Optional[float] = None
    
    # Amenities
    amenities: List[str] = []
    
    # Contact
    contact_name: str
    contact_phone: str
    contact_email: EmailStr
    contact_hours: Optional[str] = None
    
    # Rules & Policies
    lease_duration: Optional[str] = None
    status: str = "available"

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    # Include all optional fields for updates
    property_name: Optional[str] = None
    available_units: Optional[int] = None
    monthly_rent: Optional[float] = None
    status: Optional[str] = None
    # ... include other fields as needed

class PropertyRead(PropertyBase):
    id: int
    # images: List[str] = []
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True