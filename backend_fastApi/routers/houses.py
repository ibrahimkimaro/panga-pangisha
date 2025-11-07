from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlmodel import Session, select
from typing import List, Optional
import os
from datetime import datetime
import uuid
from models.houses import Property
from database import get_session
from schema.houses import  PropertyCreate, PropertyUpdate, PropertyRead

house_router = APIRouter(prefix="/api/house", tags=["properties"])

# Image upload configuration
UPLOAD_DIR = "uploads/properties"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_uploaded_file(file: UploadFile) -> str:
    """Save uploaded file and return filename"""
    if not any(file.filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 10MB"
            )
        buffer.write(content)
    
    return unique_filename

@house_router.post("/add-property/", response_model=PropertyRead, status_code=status.HTTP_201_CREATED)
async def create_property(
    property_data: PropertyCreate,
    session: Session = Depends(get_session)
):
    """Create a new property listing"""
    try:
        # Convert to ORM model
        db_property = Property.model_validate(property_data)
        
        # Add to database
        session.add(db_property)
        session.commit()
        session.refresh(db_property)
        
        return db_property 
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating property: {str(e)}"
        )

@house_router.get("/get-properties/", response_model=List[PropertyRead])
async def get_properties(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    property_type: Optional[str] = None,
    region: Optional[str] = None,
    district: Optional[str] = None,
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    bedrooms: Optional[int] = Query(None, ge=0),
    status: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Get all properties with filtering and pagination"""
    try:
        query = select(Property).where(Property.is_active == True)
        
        # Apply filters
        if property_type:
            query = query.where(Property.property_type == property_type)
        if region:
            query = query.where(Property.region == region)
        if district:
            query = query.where(Property.district == district)
        if min_price is not None:
            query = query.where(Property.monthly_rent >= min_price)
        if max_price is not None:
            query = query.where(Property.monthly_rent <= max_price)
        if bedrooms is not None:
            query = query.where(Property.bedrooms == bedrooms)
        if status:
            query = query.where(Property.status == status)
        
        # Apply pagination and order by newest first
        query = query.offset(skip).limit(limit).order_by(Property.created_at.desc())
        
        properties = session.exec(query).all()
        return properties
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching properties: {str(e)}"
        )

@house_router.get("/{property_id}", response_model=PropertyRead)
async def get_property(
    property_id: int,
    session: Session = Depends(get_session)
):
    """Get a specific property by ID"""
    try:
        property = session.get(Property, property_id)
        if not property or not property.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        return property
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching property: {str(e)}"
        )

@house_router.put("/{property_id}", response_model=PropertyRead)
async def update_property(
    property_id: int,
    property_data: PropertyUpdate,
    session: Session = Depends(get_session)
):
    """Update a property"""
    try:
        db_property = session.get(Property, property_id)
        if not db_property or not db_property.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        
        # Update only provided fields
        update_data = property_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_property, field, value)
        
        db_property.updated_at = datetime.utcnow()
        
        session.add(db_property)
        session.commit()
        session.refresh(db_property)
        
        return db_property
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating property: {str(e)}"
        )

@house_router.delete("/delete/{property_id}/")
async def delete_property(
    property_id: int,
    session: Session = Depends(get_session)
):
    """Soft delete a property"""
    try:
        db_property = session.get(Property, property_id)
        if not db_property:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        
        # Soft delete
        db_property.is_active = False
        db_property.updated_at = datetime.utcnow()
        
        session.add(db_property)
        session.commit()
        
        return {"message": "Property deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting property: {str(e)}"
        )

@house_router.post("/{property_id}/images")
async def upload_property_images(
    property_id: int,
    files: List[UploadFile] = File(...),
    session: Session = Depends(get_session)
):
    """Upload images for a property"""
    try:
        db_property = session.get(Property, property_id)
        if not db_property or not db_property.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        
        # Check if we're within the 10 image limit
        current_images = db_property.images or []
        if len(current_images) + len(files) > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 10 images allowed per property"
            )
        
        # Save uploaded files
        saved_filenames = []
        for file in files:
            filename = save_uploaded_file(file)
            saved_filenames.append(filename)
        
        # Update property images
        db_property.images = current_images + saved_filenames
        db_property.updated_at = datetime.utcnow()
        
        session.add(db_property)
        session.commit()
        session.refresh(db_property)
        
        return {
            "message": f"Successfully uploaded {len(saved_filenames)} images",
            "images": db_property.images
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading images: {str(e)}"
        )

@house_router.delete("/{property_id}/images/{image_name}")
async def delete_property_image(
    property_id: int,
    image_name: str,
    session: Session = Depends(get_session)
):
    """Delete a specific image from a property"""
    try:
        db_property = session.get(Property, property_id)
        if not db_property or not db_property.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        
        current_images = db_property.images or []
        if image_name not in current_images:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found for this property"
            )
        
        # Remove image from list
        db_property.images = [img for img in current_images if img != image_name]
        db_property.updated_at = datetime.utcnow()
        
        # Delete physical file
        file_path = os.path.join(UPLOAD_DIR, image_name)
        if os.path.exists(file_path):
            os.remove(file_path)
        
        session.add(db_property)
        session.commit()
        session.refresh(db_property)
        
        return {"message": "Image deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting image: {str(e)}"
        )

@house_router.get("/search/filter")
async def filter_properties(
    region: Optional[str] = None,
    district: Optional[str] = None,
    property_type: Optional[str] = None,
    min_bedrooms: Optional[int] = Query(None, ge=0),
    max_bedrooms: Optional[int] = Query(None, ge=0),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    amenities: Optional[List[str]] = Query(None),
    session: Session = Depends(get_session)
):
    """Advanced property filtering"""
    try:
        query = select(Property).where(Property.is_active == True)
        
        # Apply filters
        if region:
            query = query.where(Property.region == region)
        if district:
            query = query.where(Property.district == district)
        if property_type:
            query = query.where(Property.property_type == property_type)
        if min_bedrooms is not None:
            query = query.where(Property.bedrooms >= min_bedrooms)
        if max_bedrooms is not None:
            query = query.where(Property.bedrooms <= max_bedrooms)
        if min_price is not None:
            query = query.where(Property.monthly_rent >= min_price)
        if max_price is not None:
            query = query.where(Property.monthly_rent <= max_price)
        if amenities:
            # Filter properties that have all specified amenities
            for amenity in amenities:
                query = query.where(Property.amenities.contains([amenity]))
        
        properties = session.exec(query.order_by(Property.created_at.desc())).all()
        return properties
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error filtering properties: {str(e)}"
        )

@house_router.get("/regions/districts")
async def get_regions_districts(session: Session = Depends(get_session)):
    """Get all available regions and their districts"""
    try:
        # Get unique regions
        regions_query = select(Property.region).distinct().where(Property.is_active == True)
        regions = session.exec(regions_query).all()
        
        # Get districts for each region
        result = {}
        for region in regions:
            districts_query = select(Property.district).distinct().where(
                Property.region == region,
                Property.is_active == True
            )
            districts = session.exec(districts_query).all()
            result[region] = districts
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching regions and districts: {str(e)}"
        )