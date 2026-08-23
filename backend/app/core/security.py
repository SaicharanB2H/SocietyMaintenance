import jwt
import requests
from fastapi import HTTPException, status
from app.core.config import settings

def verify_supabase_jwt(token: str) -> dict:
    """
    Verifies a Supabase Auth JWT token.
    If SUPABASE_JWT_SECRET is set, decodes and verifies locally.
    Otherwise, queries Supabase API to verify and fetch user details.
    """
    if settings.SUPABASE_JWT_SECRET:
        try:
            # Decode using standard HMAC SHA256 signature verification
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
            return {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "user_metadata": payload.get("user_metadata", {})
            }
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )
    else:
        # Request user details from Supabase auth. If token is invalid/expired, this fails.
        url = f"{settings.SUPABASE_URL}/auth/v1/user"
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": settings.SUPABASE_ANON_KEY
        }
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication failed or session expired"
                )
            data = response.json()
            return {
                "id": data.get("id"),
                "email": data.get("email"),
                "user_metadata": data.get("user_metadata", {})
            }
        except requests.RequestException as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Supabase auth connection error: {str(e)}"
            )
