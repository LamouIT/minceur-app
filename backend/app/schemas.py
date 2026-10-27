from datetime import date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(default="", max_length=100)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    token: str


class ProfileIn(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100)
    start_date: Optional[date] = None
    start_weight: Optional[float] = Field(default=None, ge=30, le=250)
    goal_kg: Optional[float] = Field(default=None, gt=0, le=60)


class ProfileOut(BaseModel):
    email: str
    name: str
    start_date: Optional[date]
    start_weight: Optional[float]
    goal_kg: float


class DoneIn(BaseModel):
    done: bool


class WeightIn(BaseModel):
    kg: float = Field(ge=30, le=250)


class PurchaseIn(BaseModel):
    checked: Optional[bool] = None
    price: Optional[float] = Field(default=None, ge=0, le=10_000_000)
    clear_price: bool = False
