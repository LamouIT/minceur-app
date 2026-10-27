from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from ..auth import current_user
from ..db import get_db
from ..models import Dish, HabitLog, MealLog, PlanSlot, User, Weight
from ..schemas import DoneIn

router = APIRouter(tags=["programme"])
TIMES = ["07:30", "10:30", "13:00", "16:30", "19:30"]
HABITS = ["Menu respecté", "2 L d’eau", "Marche 30 min", "7 h de sommeil"]
NDAYS = 28


def day_index(user: User, d: date) -> int:
    if user.start_date is None:
        raise HTTPException(409, "Choisis d’abord la date de début de ton programme")
    i = (d - user.start_date).days
    if not 0 <= i < NDAYS:
        raise HTTPException(404, "Cette date est en dehors de ton programme de 4 semaines")
    return i


@router.get("/plan/day/{d}")
def get_day(d: date, user: User = Depends(current_user), db: Session = Depends(get_db)):
    i = day_index(user, d)
    week, wday = i // 7 + 1, i % 7
    rows = db.execute(select(PlanSlot.slot, Dish).join(Dish, Dish.code == PlanSlot.dish_code)
                      .where(PlanSlot.week == week, PlanSlot.day == wday).order_by(PlanSlot.slot)).all()
    done = {m.slot: m.done for m in db.scalars(select(MealLog).where(MealLog.user_id == user.id, MealLog.day == d))}
    habits = {h.habit: h.done for h in db.scalars(select(HabitLog).where(HabitLog.user_id == user.id, HabitLog.day == d))}
    w = db.get(Weight, (user.id, d))
    meals = [dict(slot=slot, time=TIMES[slot], type=dish.type, name=dish.name, kcal=dish.kcal, protein=dish.protein,
                  ingredients=dish.ingredients, recipe=dish.recipe, done=done.get(slot, False)) for slot, dish in rows]
    return dict(date=d, index=i, week=week, day=wday, meals=meals,
                habits=[dict(id=k, label=l, done=habits.get(k, False)) for k, l in enumerate(HABITS)],
                weight=float(w.kg) if w else None)


@router.put("/plan/day/{d}/meal/{slot}")
def set_meal(d: date, slot: int, body: DoneIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    day_index(user, d)
    if not 0 <= slot < len(TIMES):
        raise HTTPException(404, "Repas inconnu")
    stmt = insert(MealLog).values(user_id=user.id, day=d, slot=slot, done=body.done)
    db.execute(stmt.on_conflict_do_update(index_elements=["user_id", "day", "slot"], set_={"done": body.done}))
    db.commit()
    return {"ok": True}


@router.put("/plan/day/{d}/habit/{habit}")
def set_habit(d: date, habit: int, body: DoneIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    day_index(user, d)
    if not 0 <= habit < len(HABITS):
        raise HTTPException(404, "Habitude inconnue")
    stmt = insert(HabitLog).values(user_id=user.id, day=d, habit=habit, done=body.done)
    db.execute(stmt.on_conflict_do_update(index_elements=["user_id", "day", "habit"], set_={"done": body.done}))
    db.commit()
    return {"ok": True}


@router.get("/plan/overview")
def overview(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Grille des 28 jours : score = repas cochés + habitudes cochées (sur 9)."""
    if user.start_date is None:
        raise HTTPException(409, "Choisis d’abord la date de début de ton programme")
    start, end = user.start_date, user.start_date + timedelta(days=NDAYS - 1)
    meals = db.scalars(select(MealLog).where(MealLog.user_id == user.id, MealLog.day.between(start, end), MealLog.done))
    habits = db.scalars(select(HabitLog).where(HabitLog.user_id == user.id, HabitLog.day.between(start, end), HabitLog.done))
    score = [0] * NDAYS
    meal_count = water = walk = 0
    for m in meals:
        score[(m.day - start).days] += 1
        meal_count += 1
    for h in habits:
        score[(h.day - start).days] += 1
        water += h.habit == 1
        walk += h.habit == 2
    days = [dict(date=start + timedelta(days=i), score=s) for i, s in enumerate(score)]
    return dict(days=days, full_days=sum(s >= 9 for s in score), meals_done=meal_count,
                water_days=water, walk_days=walk)
