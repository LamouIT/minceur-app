import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .db import get_db
from .models import User

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-a-changer")
ALGO = "HS256"
TOKEN_DAYS = 30
bearer = HTTPBearer(auto_error=False)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode()[:72], bcrypt.gensalt()).decode()


def check_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode()[:72], hashed.encode())


def make_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": exp}, SECRET_KEY, algorithm=ALGO)


def current_user(cred: HTTPAuthorizationCredentials | None = Depends(bearer),
                 db: Session = Depends(get_db)) -> User:
    if cred is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Connexion requise")
    try:
        payload = jwt.decode(cred.credentials, SECRET_KEY, algorithms=[ALGO])
        user = db.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        user = None
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expirée, reconnecte-toi")
    return user
