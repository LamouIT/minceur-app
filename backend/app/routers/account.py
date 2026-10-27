from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import check_password, current_user, hash_password, make_token
from ..db import get_db
from ..models import User
from ..schemas import LoginIn, ProfileIn, ProfileOut, RegisterIn, TokenOut

router = APIRouter(tags=["compte"])


def to_out(u: User) -> ProfileOut:
    return ProfileOut(email=u.email, name=u.name, start_date=u.start_date,
                      start_weight=float(u.start_weight) if u.start_weight is not None else None,
                      goal_kg=float(u.goal_kg))


@router.post("/auth/register", response_model=TokenOut)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "Un compte existe déjà avec cet e-mail")
    u = User(email=email, password_hash=hash_password(body.password), name=body.name.strip(), goal_kg=10)
    db.add(u)
    db.commit()
    return TokenOut(token=make_token(u.id))


@router.post("/auth/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    u = db.scalar(select(User).where(User.email == body.email.lower()))
    if not u or not check_password(body.password, u.password_hash):
        raise HTTPException(401, "E-mail ou mot de passe incorrect")
    return TokenOut(token=make_token(u.id))


@router.get("/me", response_model=ProfileOut)
def me(user: User = Depends(current_user)):
    return to_out(user)


@router.put("/me", response_model=ProfileOut)
def update_me(body: ProfileIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    data = body.model_dump(exclude_unset=True)
    if "start_date" in data and data["start_date"] is not None and data["start_date"].weekday() != 5:
        raise HTTPException(422, "Le programme doit commencer un samedi (jour des courses)")
    for k, v in data.items():
        setattr(user, k, v)
    db.commit()
    return to_out(user)
