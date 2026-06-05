from datetime import date
import json
from sqlalchemy.orm import Session
from app.models.service import Service
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_line import InvoiceLine
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


def _extract_invoice_lines(data: dict) -> list[dict]:
    lines = data.get("invoice_lines") or []
    if lines:
        return lines
    notes = data.get("notes") or ""
    if isinstance(notes, str) and notes.startswith("INVOICE_LINES:"):
        try:
            parsed = json.loads(notes.removeprefix("INVOICE_LINES:"))
            return parsed if isinstance(parsed, list) else []
        except (TypeError, ValueError, json.JSONDecodeError):
            return []
    return []


def _add_invoice_lines(db: Session, tenant_id: int, invoice_id: int, data: dict) -> None:
    for line in _extract_invoice_lines(data):
        if not isinstance(line, dict):
            continue
        name = str(line.get("name") or line.get("inventory_item_name") or "").strip()
        if not name:
            continue
        qty = float(line.get("quantity") or line.get("inventory_quantity") or 1)
        line_total = float(line.get("amount") or 0)
        unit_price = float(line.get("unit_price") or (line_total / qty if qty else line_total) or 0)
        db.add(InvoiceLine(
            tenant_id=tenant_id,
            invoice_id=invoice_id,
            inventory_item_id=line.get("inventory_item_id") or line.get("inventoryItemId"),
            name=name,
            sku=line.get("sku") or "",
            category=line.get("category") or "",
            quantity=qty,
            unit_price=unit_price,
            line_total=line_total,
            notes=line.get("notes") or "",
        ))


def _apply_deductions(db: Session, tenant_id: int, data: dict) -> None:
    for deduction in data.get("inventory_deductions", []):
        item = db.get(InventoryItem, deduction["item_id"])
        if item and item.tenant_id == tenant_id:
            item.quantity = max(0, float(item.quantity) - float(deduction["quantity"]))
            item.total_sold = float(item.total_sold) + float(deduction["quantity"])


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

    _add_invoice_lines(db, tenant_id, invoice.id, data)

    remaining = max(net_owed - paid_amount, 0)
    if remaining > 0:
        db.add(Debt(
            tenant_id=tenant_id,
            invoice_id=invoice.id,
            car_id=data["car_id"],
            amount=remaining,
            notes="دين تلقائي من فاتورة خدمة" if status == InvoiceStatus.unpaid else f"متبقي بعد دفع {paid_amount:,.0f} IQD",
        ))

    _apply_deductions(db, tenant_id, data)

    db.commit()
    db.refresh(service)
    db.refresh(invoice)
    return service, invoice


def create_sale_invoice(db: Session, tenant_id: int, data: dict) -> Invoice:
    """Retail sale: an invoice tied to a customer directly — no car, no service."""
    inv_date = data.get("invoice_date") or date.today()
    net_owed, paid_amount, status = _payment_amounts(data)
    customer_name = (data.get("customer_name") or "").strip() or None
    customer_phone = (data.get("customer_phone") or "").strip() or None

    invoice = Invoice(
        tenant_id=tenant_id,
        service_id=None,
        invoice_type="sale",
        customer_name=customer_name,
        customer_phone=customer_phone,
        amount=data["amount"],
        discount=data.get("discount", 0),
        status=status,
        invoice_date=inv_date,
    )
    db.add(invoice)
    db.flush()

    _add_invoice_lines(db, tenant_id, invoice.id, data)

    remaining = max(net_owed - paid_amount, 0)
    if remaining > 0:
        db.add(Debt(
            tenant_id=tenant_id,
            invoice_id=invoice.id,
            car_id=None,
            customer_name=customer_name,
            customer_phone=customer_phone,
            amount=remaining,
            notes="دين من فاتورة بيع" if status == InvoiceStatus.unpaid else f"متبقي بعد دفع {paid_amount:,.0f} IQD",
        ))

    _apply_deductions(db, tenant_id, data)

    db.commit()
    db.refresh(invoice)
    return invoice
