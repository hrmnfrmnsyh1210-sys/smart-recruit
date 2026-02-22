import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from app.config import get_settings


def _get_fernet() -> Fernet:
    settings = get_settings()
    key_material = settings.ENCRYPTION_KEY.encode()
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"smart-recruit-salt",  # In production, use a random salt stored securely
        iterations=480000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(key_material))
    return Fernet(key)


def encrypt_data(data: str) -> bytes:
    if not data:
        return b""
    fernet = _get_fernet()
    return fernet.encrypt(data.encode())


def decrypt_data(encrypted_data: bytes) -> str:
    if not encrypted_data:
        return ""
    fernet = _get_fernet()
    return fernet.decrypt(encrypted_data).decode()
