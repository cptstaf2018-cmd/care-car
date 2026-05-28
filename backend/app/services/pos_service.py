from datetime import date
from sqlalchemy.orm import Session
from app.models.service import Service
from app.models.invoice import Invoice, InvoiceStatus
from app.models.inventory import InventoryItem

def create_service_with_invoice(db: Session, tenant_id: int, data: dict) -> tuple[Service, Invoice]:
    svc_date = data.get("service_date") or date.today()
    service = Service(
        tenant_id=tenant_id,
        car_id=data["car_id"],
        oil_type=data["oil_type"],
        mileage=data.get("mileage"),
        notes=data.get("notes"),
        service_date=svc_date,
    )
    db.add(service)
    db.flush()
    net_owed = data["amount"] - data.get("discount", 0)
    status = InvoiceStatus.paid if net_owed <= 0 else InvoiceStatus.unpaid
    invoice = Invoice(
        tenant_id=tenant_id,
        service_id=service.id,
        amount=data["amount"],
        discount=data.get("discount", 0),
        status=status,
        invoice_date=svc_date,
    )
    db.add(invoice)

    for deduction in data.get("inventory_deductions", []):
        item = db.get(InventoryItem, deduction["item_id"])
        if item and item.tenant_id == tenant_id:
            item.quantity = max(0, float(item.quantity) - float(deduction["quantity"]))
            item.total_sold = float(item.total_sold) + float(deduction["quantity"])

    db.commit()
    db.refresh(service)
    db.refresh(invoice)
    return service, invoice
