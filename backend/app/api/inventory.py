from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.inventory import InventoryItem
from app.models.user import User
from app.schemas.inventory import InventoryCreate, InventoryUpdate, InventoryOut, InventoryReceiptCreate

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/", response_model=list[InventoryOut])
def list_inventory(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = db.query(InventoryItem).filter(InventoryItem.tenant_id == user.tenant_id).all()
    result = []
    for item in items:
        out = InventoryOut.model_validate(item)
        out.low_stock = float(item.quantity) <= float(item.min_threshold)
        result.append(out)
    return result

@router.post("/", response_model=InventoryOut, status_code=201)
def create_item(body: InventoryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = InventoryItem(tenant_id=user.tenant_id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.post("/receipt", response_model=list[InventoryOut], status_code=201)
def add_receipt_items(body: InventoryReceiptCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not body.lines:
        raise HTTPException(status_code=400, detail="Receipt has no lines")

    updated_items = []
    for line in body.lines:
        item = db.query(InventoryItem).filter(
            InventoryItem.tenant_id == user.tenant_id,
            InventoryItem.oil_type == line.oil_type,
        ).first()
        if item:
            item.quantity = float(item.quantity) + line.quantity
            item.category = line.category or item.category
            item.supplier_name = body.supplier_name or item.supplier_name
            if line.unit_cost is not None:
                item.unit_cost = line.unit_cost
            if line.sale_price is not None:
                item.sale_price = line.sale_price
            item.min_threshold = item.min_threshold or line.min_threshold
        else:
            item = InventoryItem(
                tenant_id=user.tenant_id,
                oil_type=line.oil_type,
                category=line.category,
                supplier_name=body.supplier_name,
                quantity=line.quantity,
                min_threshold=line.min_threshold,
                unit_cost=line.unit_cost,
                sale_price=line.sale_price,
            )
            db.add(item)
        updated_items.append(item)

    db.commit()
    result = []
    for item in updated_items:
        db.refresh(item)
        out = InventoryOut.model_validate(item)
        out.low_stock = float(item.quantity) <= float(item.min_threshold)
        result.append(out)
    return result

@router.patch("/{item_id}", response_model=InventoryOut)
def update_item(item_id: int, body: InventoryUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(InventoryItem, item_id)
    if not item or item.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item
