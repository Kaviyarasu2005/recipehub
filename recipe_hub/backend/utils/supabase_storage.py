import uuid
import logging
from django.conf import settings
from rest_framework.exceptions import ValidationError
from .supabase import get_supabase_client

logger = logging.getLogger(__name__)

def _upload_to_supabase(file, bucket_name: str) -> str:
    """
    Internal helper to upload a file to a specific Supabase bucket.
    Generates a unique filename using UUID.
    Returns the public URL of the uploaded file.
    """
    import mimetypes
    
    supabase = get_supabase_client()
    
    # Generate unique filename: uuid_original-name.ext
    ext = file.name.split('.')[-1] if '.' in file.name else ''
    unique_filename = f"{uuid.uuid4()}.{ext}" if ext else f"{uuid.uuid4()}"
    
    # Determine content type
    content_type = getattr(file, 'content_type', None)
    if not content_type:
        content_type, _ = mimetypes.guess_type(file.name)
    if not content_type:
        content_type = 'application/octet-stream'

    try:
        # Seek to beginning in case it was read
        if hasattr(file, 'seek'):
            file.seek(0)
            
        # Read file bytes
        file_bytes = file.read()
        
        # Upload file
        response = supabase.storage.from_(bucket_name).upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": content_type}
        )
        
        # Get public URL
        # Note: Supabase Python SDK get_public_url returns the URL string directly or an object with publicUrl attribute
        # depending on the version. Assuming standard recent version.
        public_url = supabase.storage.from_(bucket_name).get_public_url(unique_filename)
        
        # If it returns an object (some versions do), extract the URL
        if isinstance(public_url, dict):
            public_url = public_url.get('publicURL') or public_url.get('public_url')
        elif hasattr(public_url, 'public_url'):
            public_url = public_url.public_url
            
        logger.info(f"Successfully uploaded {file.name} to {bucket_name} as {unique_filename}")
        return public_url
        
    except Exception as e:
        logger.error(f"Supabase upload error for bucket {bucket_name}: {str(e)}")
        raise ValidationError(f"Failed to upload file to {bucket_name}. Please try again.")

def upload_video(file) -> str:
    """Upload video to 'videos' bucket."""
    return _upload_to_supabase(file, "videos")

def upload_thumbnail(file) -> str:
    """Upload thumbnail to 'thumbnails' bucket."""
    return _upload_to_supabase(file, "thumbnails")

def upload_avatar(file) -> str:
    """Upload avatar to 'avatars' bucket."""
    return _upload_to_supabase(file, "avatars")
