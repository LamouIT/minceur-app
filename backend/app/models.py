from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (JSON, Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text,
                        UniqueConstraint, func)
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(100), default="")
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    start_weight: Mapped[Decimal | None] = mapped_column(Numeric(5, 1), nullable=True)
    goal_kg: Mapped[Decimal] = mapped_column(Numeric(4, 1), default=10)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Dish(Base):
    __tablename__ = "dishes"
    code: Mapped[str] = mapped_column(String(10), primary_key=True)
    type: Mapped[str] = mapped_column(String(30))
    name: Mapped[str] = mapped_column(String(200))
    kcal: Mapped[int] = mapped_column(Integer)
    protein: Mapped[int] = mapped_column(Integer)
    ingredients: Mapped[list] = mapped_column(JSON)
    recipe: Mapped[str] = mapped_column(Text)


class PlanSlot(Base):
    """Le programme : semaine (1-4), jour (0 = samedi … 6 = vendredi), créneau (0-4) -> plat."""
    __tablename__ = "plan_slots"
    __table_args__ = (UniqueConstraint("week", "day", "slot"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    week: Mapped[int] = mapped_column(Integer)
    day: Mapped[int] = mapped_column(Integer)
    slot: Mapped[int] = mapped_column(Integer)
    dish_code: Mapped[str] = mapped_column(ForeignKey("dishes.code"))


class ShoppingItem(Base):
    __tablename__ = "shopping_items"
    __table_args__ = (UniqueConstraint("week", "key"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    week: Mapped[int] = mapped_column(Integer, index=True)
    key: Mapped[str] = mapped_column(String(30))
    category: Mapped[str] = mapped_column(String(60))
    label: Mapped[str] = mapped_column(String(120))
    qty: Mapped[str] = mapped_column(String(40))
    position: Mapped[int] = mapped_column(Integer)


class MealLog(Base):
    __tablename__ = "meal_logs"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    day: Mapped[date] = mapped_column(Date, primary_key=True)
    slot: Mapped[int] = mapped_column(Integer, primary_key=True)
    done: Mapped[bool] = mapped_column(Boolean, default=False)


class HabitLog(Base):
    __tablename__ = "habit_logs"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    day: Mapped[date] = mapped_column(Date, primary_key=True)
    habit: Mapped[int] = mapped_column(Integer, primary_key=True)
    done: Mapped[bool] = mapped_column(Boolean, default=False)


class Weight(Base):
    __tablename__ = "weights"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    day: Mapped[date] = mapped_column(Date, primary_key=True)
    kg: Mapped[Decimal] = mapped_column(Numeric(5, 1))


class Purchase(Base):
    __tablename__ = "purchases"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    week: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_key: Mapped[str] = mapped_column(String(30), primary_key=True)
    checked: Mapped[bool] = mapped_column(Boolean, default=False)
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
