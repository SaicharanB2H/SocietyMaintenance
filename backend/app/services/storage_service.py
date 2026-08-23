import uuid
import requests
from fastapi import HTTPException, status, UploadFile
from app.core.config import settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

class StorageService:
    @staticmethod
    def validate_file(file: UploadFile) -> None:
        """
        Validates that the file type is an allowed image and that
        the size is under the maximum limit.
        """
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file.content_type}. Allowed: JPEG, PNG, WEBP."
            )
        
        # Read small portion or seek to check size
        # Since FastAPI UploadFile holds files in memory or temp file, we can check size:
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()  # Get size
        file.file.seek(0)  # Reset to beginning

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds the maximum limit of 5MB."
            )

    @staticmethod
    def upload_photo(file: UploadFile) -> str:
        """
        Uploads a file to Supabase Storage.
        Returns the public URL of the uploaded image.
        """
        # Validate first
        StorageService.validate_file(file)

        # Generate a unique filename to avoid overwrites
        extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_name = f"{uuid.uuid4()}.{extension}"
        bucket = settings.SUPABASE_STORAGE_BUCKET

        url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{unique_name}"
        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": settings.SUPABASE_ANON_KEY,
            "Content-Type": file.content_type
        }

        try:
            # Read all file bytes
            file_bytes = file.file.read()
            response = requests.post(url, headers=headers, data=file_bytes, timeout=15)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to upload photo to storage. Supabase response: {response.text}"
                )
            
            # Return the public URL of the uploaded object
            public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{unique_name}"
            return public_url
            
        except requests.RequestException as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Storage service connection failure: {str(e)}"
            )
        finally:
            file.file.seek(0)
