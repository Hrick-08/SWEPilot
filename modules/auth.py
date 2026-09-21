"""Authentication utilities: password hashing, JWT tokens, GitHub token encryption."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib

import bcrypt
import jwt
from cryptography.fernet import Fernet


def _bcrypt_input(password: str) -> bytes:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) <= 72:
        return password_bytes
    return hashlib.sha256(password_bytes).digest()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_bcrypt_input(password), bcrypt.gensalt()).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    password_bytes = plain.encode("utf-8")
    hashed_bytes = hashed.encode("ascii")
    if len(password_bytes) <= 72 and bcrypt.checkpw(password_bytes, hashed_bytes):
        return True
    return len(password_bytes) > 72 and bcrypt.checkpw(_bcrypt_input(plain), hashed_bytes)


# ---------------------------------------------------------------------------
# JWT access tokens
# ---------------------------------------------------------------------------
_JWT_ALGORITHM = "HS256"
_JWT_EXPIRE_HOURS = 24


def create_access_token(username: str, secret_key: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=_JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret_key, algorithm=_JWT_ALGORITHM)


def decode_access_token(token: str, secret_key: str) -> str | None:
    """Return the username embedded in *token*, or ``None`` on failure."""
    try:
        payload = jwt.decode(token, secret_key, algorithms=[_JWT_ALGORITHM])
        return payload.get("sub")
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


# ---------------------------------------------------------------------------
# GitHub token encryption (Fernet symmetric encryption)
# ---------------------------------------------------------------------------

def _derive_fernet_key(secret_key: str) -> bytes:
    """Derive a valid 32-byte URL-safe base64 Fernet key from an arbitrary secret."""
    import base64
    import hashlib

    digest = hashlib.sha256(secret_key.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_github_token(token: str, secret_key: str) -> str:
    fernet = Fernet(_derive_fernet_key(secret_key))
    return fernet.encrypt(token.encode()).decode()


def decrypt_github_token(encrypted: str, secret_key: str) -> str:
    fernet = Fernet(_derive_fernet_key(secret_key))
    return fernet.decrypt(encrypted.encode()).decode()
