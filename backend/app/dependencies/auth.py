import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_supabase_jwt
from app.models.profile import Profile

security_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> Profile:
    """
    Decodes the Bearer token, validates it against Supabase,
    and returns the corresponding Profile record from the database.
    """
    token = credentials.credentials
    payload = verify_supabase_jwt(token)
    user_id_str = payload.get("id")
    
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user ID"
        )
        
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token"
        )

    # Query the profiles table
    user = db.query(Profile).filter(Profile.id == user_uuid).first()
    if not user:
        # Fallback in case trigger failed to propagate new signup profile
        email = payload.get("email")
        full_name = payload.get("user_metadata", {}).get("full_name", "")
        if email:
            user = Profile(
                id=user_uuid,
                email=email,
                full_name=full_name,
                role="resident" # Default role is resident
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found in system"
            )

    return user

def get_current_resident(current_user: Profile = Depends(get_current_user)) -> Profile:
    """
    Ensures that the current user is a resident or admin.
    (Everyone registered is a resident by default)
    """
    return current_user

def get_current_admin(current_user: Profile = Depends(get_current_user)) -> Profile:
    """
    Enforces that the current authenticated user has an 'admin' role.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privileges required"
        )
    return current_user
