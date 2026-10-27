from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from ..auth import current_user
from ..db import get_db
from ..models import User, Weight
from ..schemas import WeightIn

router = APIRouter(tags=["poids"])


@router.get("/weights")
def list_weights(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Weight).where(Weight.user_id == user.id).order_by(Weight.day))
    return [dict(date=w.day, kg=float(w.kg)) for w in rows]


@router.put("/weights/{d}")
def put_weight(d: date, body: WeightIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    stmt = insert(Weight).values(user_id=user.id, day=d, kg=body.kg)
    db.execute(stmt.on_conflict_do_update(index_elements=["user_id", "day"], set_={"kg": body.kg}))
    if user.start_weight is None:
        user.start_weight = body.kg
    db.commit()
    return {"ok": True}


@router.delete("/weights/{d}")
def delete_weight(d: date, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.execute(delete(Weight).where(Weight.user_id == user.id, Weight.day == d))
    db.commit()
    return {"ok": True}
