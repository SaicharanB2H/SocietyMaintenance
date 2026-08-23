from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user
from app.schemas.auth import ProfileResponse
from app.models.profile import Profile

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/me", response_model=ProfileResponse)
def get_me(current_user: Profile = Depends(get_current_user)):
    """
    Get current user profile.
    """
    return current_user
