"""
AWS S3 Storage integration for file uploads
"""
import os
import boto3
from botocore.exceptions import ClientError
import logging
from typing import Tuple, Optional
import uuid

logger = logging.getLogger(__name__)

# S3 client (initialized lazily)
_s3_client = None
_storage_available = False
_bucket_name = None
_region = None

def init_storage() -> bool:
    """Initialize S3 storage. Returns True if available, False otherwise."""
    global _s3_client, _storage_available, _bucket_name, _region
    
    if _s3_client is not None:
        return _storage_available
    
    # Read credentials at init time (after dotenv has loaded them)
    aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
    _bucket_name = os.environ.get("S3_BUCKET_NAME")
    _region = os.environ.get("AWS_REGION", "us-east-1")
    
    # Check if AWS credentials are configured
    if not all([aws_access_key, aws_secret_key, _bucket_name]):
        logger.warning("AWS S3 credentials not fully configured. Storage will be unavailable.")
        _storage_available = False
        return False
    
    try:
        _s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=_region
        )
        
        # Test connection by checking bucket exists
        _s3_client.head_bucket(Bucket=_bucket_name)
        logger.info(f"✓ S3 Storage initialized successfully (bucket: {_bucket_name})")
        _storage_available = True
        return True
        
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        if error_code == '404':
            logger.error(f"S3 bucket '{_bucket_name}' does not exist")
        elif error_code == '403':
            logger.error(f"Access denied to S3 bucket '{_bucket_name}'. Check permissions.")
        else:
            logger.error(f"S3 initialization error: {e}")
        _storage_available = False
        return False
        
    except Exception as e:
        logger.error(f"S3 initialization failed: {e}")
        _storage_available = False
        return False

def is_storage_available() -> bool:
    """Check if storage is available."""
    global _storage_available
    if _s3_client is None:
        init_storage()
    return _storage_available

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """
    Upload file to S3.
    Returns: {"path": "...", "url": "...", "size": 123}
    """
    if not is_storage_available():
        raise RuntimeError("S3 storage not available")
    
    try:
        _s3_client.put_object(
            Bucket=_bucket_name,
            Key=path,
            Body=data,
            ContentType=content_type
        )
        
        # Generate the public URL
        url = f"https://{_bucket_name}.s3.{_region}.amazonaws.com/{path}"
        
        logger.info(f"Uploaded file to S3: {path}")
        return {
            "path": path,
            "url": url,
            "size": len(data)
        }
        
    except ClientError as e:
        logger.error(f"S3 upload failed: {e}")
        raise

def get_object(path: str) -> Tuple[bytes, str]:
    """
    Download file from S3.
    Returns: (content_bytes, content_type)
    """
    if not is_storage_available():
        raise RuntimeError("S3 storage not available")
    
    try:
        response = _s3_client.get_object(
            Bucket=_bucket_name,
            Key=path
        )
        
        content = response['Body'].read()
        content_type = response.get('ContentType', 'application/octet-stream')
        
        return content, content_type
        
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        if error_code == 'NoSuchKey':
            logger.error(f"S3 file not found: {path}")
        else:
            logger.error(f"S3 download failed: {e}")
        raise

def generate_presigned_url(path: str, expiration: int = 3600) -> Optional[str]:
    """
    Generate a presigned URL for temporary access to a private S3 object.
    Returns: presigned URL string or None if failed
    """
    if not is_storage_available():
        return None
    
    try:
        url = _s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': _bucket_name,
                'Key': path
            },
            ExpiresIn=expiration
        )
        return url
    except ClientError as e:
        logger.error(f"Failed to generate presigned URL: {e}")
        return None

def generate_upload_path(user_id: str, verification_type: str, extension: str) -> str:
    """Generate a unique path for verification uploads"""
    filename = f"{uuid.uuid4()}.{extension}"
    return f"lits/verification/{user_id}/{verification_type}/{filename}"

def delete_object(path: str) -> bool:
    """Delete a file from S3. Returns True if successful."""
    if not is_storage_available():
        return False
    
    try:
        _s3_client.delete_object(
            Bucket=_bucket_name,
            Key=path
        )
        logger.info(f"Deleted file from S3: {path}")
        return True
    except ClientError as e:
        logger.error(f"S3 delete failed: {e}")
        return False
