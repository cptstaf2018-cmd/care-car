from datetime import date
from sqlalchemy.orm import Session
from app.models.service import Service
from app.models.invoice import Invoice, InvoiceStatus
from app.models.inventory import InventoryItem
from app.models.debt import Debt


def _payment_amounts(data: dict) -> tuple[float, float, InvoiceStatus]:
    net = max(float(data["amount"] or 0) - float(data.get("discount") or 0), 0)
    payment_status = data.get("payment_status")

    if not payment_status:
        status = InvoiceStatus.paid if net <= 0 else InvoiceStatus.unpaid
        paid = net if status == InvoiceStatus.paid else 0
        return net, paid, status

    if payment_status == "paid":
        return net, net, InvoiceStatus.paid
    if payment_status == "partial":
        paid = min(max(float(data.get("paid_amount") or 0), 0), net)
        return net, paid, InvoiceStatus.paid if paid >= net else InvoiceStatus.partial
    if payment_status == "unpaid":
        return net, 0, InvoiceStatus.unpaid
    return net, 0, InvoiceStatus.unpaid

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
    net_owed, paid_amount, status = _payment_amounts(data)
    invoice = Invoice(
        tenant_id=tenant_id,
        service_id=service.id,
        amount=data["amount"],
        discount=data.get("discount", 0),
        status=status,
        invoice_date=svc_date,
    )
    db.add(invoice)
    db.flush()

    remaining = max(net_owed - paid_amount, 0)
    if remaining > 0:
        db.add(Debt(
            tenant_id=tenant_id,
            invoice_id=invoice.id,
            car_id=data["car_id"],
            amount=remaining,
            notes="دين تلقائي من فاتورة خدمة" if status == InvoiceStatus.unpaid else f"متبقي بعد دفع {paid_amount:,.0f} IQD",
        ))

    for deduction in data.get("inventory_deductions", []):
        item = db.get(InventoryItem, deduction["item_id"])
        if item and item.tenant_id == tenant_id:
            item.quantity = max(0, float(item.quantity) - float(deduction["quantity"]))
            item.total_sold = float(item.total_sold) + float(deduction["quantity"])

    db.commit()
    db.refresh(service)
    db.refresh(invoice)
    return service, invoice
