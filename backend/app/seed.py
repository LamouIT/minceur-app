import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Dish, PlanSlot, ShoppingItem


def seed(db: Session) -> None:
    """Remplit le menu, les plats et les listes de courses la première fois."""
    if db.scalar(select(Dish.code).limit(1)):
        return
    data = json.loads((Path(__file__).parent / "seed_data.json").read_text(encoding="utf-8"))
    db.add_all(Dish(**d) for d in data["dishes"])
    db.flush()
    db.add_all(PlanSlot(week=p["week"], day=p["day"], slot=p["slot"], dish_code=p["dish"]) for p in data["plan"])
    db.add_all(ShoppingItem(**s) for s in data["shopping"])
    db.commit()
