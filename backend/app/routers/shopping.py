from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from ..auth import current_user
from ..db import get_db
from ..models import Purchase, ShoppingItem, User
from ..schemas import PurchaseIn

router = APIRouter(tags=["courses"])


def check_week(week: int):
    if not 1 <= week <= 4:
        raise HTTPException(404, "Semaine inconnue")


@router.get("/shopping/{week}")
def get_list(week: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    check_week(week)
    items = db.scalars(select(ShoppingItem).where(ShoppingItem.week == week).order_by(ShoppingItem.position))
    bought = {p.item_key: p for p in db.scalars(select(Purchase).where(Purchase.user_id == user.id, Purchase.week == week))}
    cats: dict[str, list] = {}
    for it in items:
        p = bought.get(it.key)
        cats.setdefault(it.category, []).append(dict(
            key=it.key, label=it.label, qty=it.qty, checked=bool(p and p.checked),
            price=float(p.price) if p and p.price is not None else None))
    return dict(week=week, categories=[dict(name=k, items=v) for k, v in cats.items()])


@router.put("/shopping/{week}/{key}")
def set_item(week: int, key: str, body: PurchaseIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    check_week(week)
    if not db.scalar(select(ShoppingItem.id).where(ShoppingItem.week == week, ShoppingItem.key == key)):
        raise HTTPException(404, "Article inconnu")
    values = {}
    if body.checked is not None:
        values["checked"] = body.checked
    if body.clear_price:
        values["price"] = None
    elif body.price is not None:
        values["price"] = body.price
    if not values:
        return {"ok": True}
    stmt = insert(Purchase).values(user_id=user.id, week=week, item_key=key, **values)
    db.execute(stmt.on_conflict_do_update(index_elements=["user_id", "week", "item_key"], set_=values))
    db.commit()
    return {"ok": True}


@router.post("/shopping/{week}/reset")
def reset_checks(week: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    check_week(week)
    db.execute(update(Purchase).where(Purchase.user_id == user.id, Purchase.week == week).values(checked=False))
    db.commit()
    return {"ok": True}


@router.get("/spending")
def spending(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = dict(db.execute(select(Purchase.week, func.coalesce(func.sum(Purchase.price), 0))
                           .where(Purchase.user_id == user.id).group_by(Purchase.week)).all())
    weeks = [float(rows.get(w, 0)) for w in range(1, 5)]
    filled = [x for x in weeks if x > 0]
    return dict(weeks=weeks, month=sum(weeks), average=sum(filled) / len(filled) if filled else 0)
