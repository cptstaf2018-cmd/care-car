# Phase 2A: Account Suspension + Subscription Trial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3-day trial system, account suspension with reason screen, and subscription cards in center panel so centers see a clear paywall when their trial or subscription expires.

**Architecture:** Backend adds `trial_ends_at` and `suspension_reason` to the Tenant model + a new `require_active_subscription` dependency applied to all center routes. Frontend wraps the entire app in a subscription gate: if status is suspended/expired, show a full-screen blocker instead of the normal layout.

**Tech Stack:** FastAPI, SQLAlchemy 2 (sync), Alembic, React 18, Zustand, React Query, Tailwind CSS v3, Lucide React

---

## File Map

### Backend
```
backend/app/models/tenant.py          — add trial_ends_at, suspension_reason
backend/app/core/deps.py              — add require_active_subscription dependency
backend/app/api/tenants.py            — add DELETE endpoint + set trial on create
backend/app/schemas/tenant.py         — add trial_ends_at, suspension_reason to TenantOut
backend/alembic/versions/e1f2a3b4c5d6_add_trial_suspension_fields.py  — migration
backend/tests/test_subscription.py    — new test file
```

### Frontend
```
frontend/src/api/subscription.js      — GET /tenants/me/status
frontend/src/components/SubscriptionGate.jsx  — full-screen blocker
frontend/src/components/SuspendedScreen.jsx   — suspended reason screen
frontend/src/components/TrialExpiredScreen.jsx — subscription cards
frontend/src/App.jsx                  — wrap routes with SubscriptionGate
frontend/src/pages/superadmin/Tenants.jsx — add suspend button + reason input
frontend/src/pages/superadmin/Subscriptions.jsx — show trial status + days left
```

---

## Task 1: Backend — Tenant Model + Migration

**Files:**
- Modify: `backend/app/models/tenant.py`
- Create: `backend/alembic/versions/e1f2a3b4c5d6_add_trial_suspension_fields.py`

- [ ] **Add fields to Tenant model**

```python
# backend/app/models/tenant.py
import enum
from datetime import date, timedelta
from sqlalchemy import Column, Integer, String, Enum, Boolean, Date
from app.models.base import Base, TimestampMixin

class Plan(str, enum.Enum):
    basic = "basic"
    pro = "pro"
    enterprise = "enterprise"

class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    plan = Column(Enum(Plan), default=Plan.basic, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    contact_phone = Column(String(20))
    logo_url = Column(String(500))
    subscription_starts_at = Column(Date)
    subscription_ends_at = Column(Date)
    subscription_notes = Column(String(500))
    trial_ends_at = Column(Date)
    suspension_reason = Column(String(300))
    ip_camera_url = Column(String(500))
    ip_camera_username = Column(String(100))
    ip_camera_password = Column(String(200))
    wasnder_api_key = Column(String(300))
    whatsapp_number = Column(String(30))
    reminder_days = Column(Integer, default=30, nullable=False)
    reminder_message_template = Column(String(1000))
```

- [ ] **Create migration**

```python
# backend/alembic/versions/e1f2a3b4c5d6_add_trial_suspension_fields.py
"""add trial_ends_at and suspension_reason to tenants

Revision ID: e1f2a3b4c5d6
Revises: d9e0f1a2b3c4
Create Date: 2026-05-24
"""
from alembic import op
import sqlalchemy as sa

revision = 'e1f2a3b4c5d6'
down_revision = 'd9e0f1a2b3c4'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('tenants', sa.Column('trial_ends_at', sa.Date(), nullable=True))
    op.add_column('tenants', sa.Column('suspension_reason', sa.String(300), nullable=True))

def downgrade():
    op.drop_column('tenants', 'trial_ends_at')
    op.drop_column('tenants', 'suspension_reason')
```

- [ ] **Apply migration**

```bash
cd backend
$env:DATABASE_URL="postgresql://oiluser:oilpass@localhost:5432/oildb"
python -m alembic upgrade head
```

Expected: `Running upgrade d9e0f1a2b3c4 -> e1f2a3b4c5d6`

- [ ] **Commit**

```bash
git add backend/app/models/tenant.py backend/alembic/versions/e1f2a3b4c5d6_add_trial_suspension_fields.py
git commit -m "feat: add trial_ends_at and suspension_reason to tenant model"
```

---

## Task 2: Backend — Subscription Status Endpoint + Tenant Create with Trial

**Files:**
- Modify: `backend/app/api/tenants.py`
- Modify: `backend/app/schemas/tenant.py`

- [ ] **Add trial_ends_at and suspension_reason to TenantOut schema**

```python
# backend/app/schemas/tenant.py
from pydantic import BaseModel, ConfigDict
from datetime import date
from app.models.tenant import Plan

class TenantCreate(BaseModel):
    name: str
    plan: Plan = Plan.basic
    contact_phone: str | None = None
    logo_url: str | None = None
    subscription_starts_at: date | None = None
    subscription_ends_at: date | None = None
    subscription_notes: str | None = None
    ip_camera_url: str | None = None
    ip_camera_username: str | None = None
    ip_camera_password: str | None = None
    wasnder_api_key: str | None = None
    whatsapp_number: str | None = None
    reminder_days: int = 30
    reminder_message_template: str | None = None

class TenantUpdate(BaseModel):
    name: str | None = None
    plan: Plan | None = None
    is_active: bool | None = None
    contact_phone: str | None = None
    logo_url: str | None = None
    subscription_starts_at: date | None = None
    subscription_ends_at: date | None = None
    subscription_notes: str | None = None
    suspension_reason: str | None = None
    ip_camera_url: str | None = None
    ip_camera_username: str | None = None
    ip_camera_password: str | None = None
    wasnder_api_key: str | None = None
    whatsapp_number: str | None = None
    reminder_days: int | None = None
    reminder_message_template: str | None = None

class TenantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    plan: str
    is_active: bool
    contact_phone: str | None
    logo_url: str | None
    subscription_starts_at: date | None
    subscription_ends_at: date | None
    subscription_notes: str | None
    trial_ends_at: date | None
    suspension_reason: str | None
    ip_camera_url: str | None
    ip_camera_username: str | None
    whatsapp_number: str | None
    reminder_days: int
    reminder_message_template: str | None
```

- [ ] **Update create_tenant to set trial_ends_at + add /me/status endpoint**

```python
# backend/app/api/tenants.py
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import require_superadmin, get_current_user
from app.core.security import hash_password
from app.models.tenant import Tenant
from app.models.user import User, Role
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantOut

router = APIRouter(prefix="/tenants", tags=["tenants"])

SUPERADMIN_ALLOWED_FIELDS = {
    "name", "plan", "is_active", "contact_phone",
    "subscription_starts_at", "subscription_ends_at",
    "subscription_notes", "suspension_reason",
}

class TenantWithManagerCreate(BaseModel):
    tenant: TenantCreate
    manager_email: str
    manager_password: str
    manager_name: str | None = None

@router.get("/", response_model=list[TenantOut])
def list_tenants(db: Session = Depends(get_db), _=Depends(require_superadmin)):
    return db.query(Tenant).all()

@router.get("/me/status")
def get_my_subscription_status(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Returns subscription status for the current center user."""
    if user.role == Role.superadmin:
        return {"status": "active"}
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(404, detail="Tenant not found")
    today = date.today()
    if not tenant.is_active:
        return {
            "status": "suspended",
            "reason": tenant.suspension_reason or "تم إيقاف الحساب من قِبل الإدارة",
        }
    if tenant.subscription_ends_at and tenant.subscription_ends_at < today:
        return {
            "status": "expired",
            "plan": tenant.plan,
            "expired_at": str(tenant.subscription_ends_at),
        }
    if tenant.trial_ends_at and tenant.trial_ends_at < today and not tenant.subscription_ends_at:
        return {
            "status": "trial_expired",
            "trial_ended_at": str(tenant.trial_ends_at),
        }
    if tenant.trial_ends_at and tenant.trial_ends_at >= today and not tenant.subscription_ends_at:
        days_left = (tenant.trial_ends_at - today).days
        return {"status": "trial", "days_left": days_left, "trial_ends_at": str(tenant.trial_ends_at)}
    return {"status": "active", "plan": tenant.plan, "subscription_ends_at": str(tenant.subscription_ends_at) if tenant.subscription_ends_at else None}

@router.post("/", response_model=TenantOut, status_code=201)
def create_tenant(body: TenantWithManagerCreate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    tenant_data = body.tenant.model_dump()
    # Auto-set 3-day trial
    tenant_data["trial_ends_at"] = date.today() + timedelta(days=3)
    tenant = Tenant(**tenant_data)
    db.add(tenant)
    db.flush()
    manager = User(
        tenant_id=tenant.id,
        email=body.manager_email,
        hashed_password=hash_password(body.manager_password),
        full_name=body.manager_name,
        role=Role.manager,
    )
    db.add(manager)
    db.commit()
    db.refresh(tenant)
    return tenant

@router.patch("/{tenant_id}", response_model=TenantOut)
def update_tenant(tenant_id: int, body: TenantUpdate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    for k, v in body.model_dump(exclude_none=True).items():
        if k in SUPERADMIN_ALLOWED_FIELDS:
            setattr(tenant, k, v)
    db.commit()
    db.refresh(tenant)
    return tenant

@router.delete("/{tenant_id}", status_code=204)
def suspend_tenant(tenant_id: int, reason: str = "عدم دفع الاشتراك", db: Session = Depends(get_db), _=Depends(require_superadmin)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.is_active = False
    tenant.suspension_reason = reason
    db.commit()
```

- [ ] **Commit**

```bash
git add backend/app/api/tenants.py backend/app/schemas/tenant.py
git commit -m "feat: subscription status endpoint, auto trial on create, suspend endpoint"
```

---

## Task 3: Backend — Tests

**Files:**
- Create: `backend/tests/test_subscription.py`

- [ ] **Write tests**

```python
# backend/tests/test_subscription.py
from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient
from tests.conftest import *

def test_new_center_gets_trial(client, superadmin_headers):
    r = client.post("/tenants/", headers=superadmin_headers, json={
        "tenant": {"name": "Trial Center", "plan": "basic"},
        "manager_email": "trial@test.com",
        "manager_password": "Test1234!",
    })
    assert r.status_code == 201
    assert r.json()["trial_ends_at"] is not None

def test_active_center_status(client, auth_headers):
    r = client.get("/tenants/me/status", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] in ("active", "trial", "trial_expired", "suspended", "expired")

def test_superadmin_status_is_active(client, superadmin_headers):
    r = client.get("/tenants/me/status", headers=superadmin_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "active"

def test_suspend_tenant(client, superadmin_headers, db):
    from app.models.tenant import Tenant
    tenant = db.query(Tenant).first()
    r = client.delete(f"/tenants/{tenant.id}?reason=عدم+دفع", headers=superadmin_headers)
    assert r.status_code == 204
    db.refresh(tenant)
    assert not tenant.is_active
    assert tenant.suspension_reason == "عدم دفع"
    # restore
    tenant.is_active = True
    tenant.suspension_reason = None
    db.commit()
```

- [ ] **Run tests**

```bash
cd backend
python -m pytest tests/test_subscription.py -v
```

Expected: 4 passed

- [ ] **Commit**

```bash
git add tests/test_subscription.py
git commit -m "test: subscription status and trial auto-assignment"
```

---

## Task 4: Frontend — Subscription API + Gate Components

**Files:**
- Create: `frontend/src/api/subscription.js`
- Create: `frontend/src/components/SuspendedScreen.jsx`
- Create: `frontend/src/components/TrialExpiredScreen.jsx`
- Create: `frontend/src/components/SubscriptionGate.jsx`

- [ ] **Create `frontend/src/api/subscription.js`**

```js
import client from './client'
export const getSubscriptionStatus = () => client.get('/tenants/me/status')
```

- [ ] **Create `frontend/src/components/SuspendedScreen.jsx`**

```jsx
import { ShieldAlert } from 'lucide-react'

export default function SuspendedScreen({ reason }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-rose-950/30 p-10 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20">
          <ShieldAlert size={40} className="text-rose-400" />
        </div>
        <h1 className="text-2xl font-black text-white">تم إيقاف الحساب</h1>
        <p className="mt-3 leading-7 text-rose-300">{reason || 'تم إيقاف حسابك من قِبل الإدارة.'}</p>
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-right">
          <p className="text-sm font-bold text-slate-300">للتواصل مع الإدارة:</p>
          <p className="mt-1 text-sm text-slate-400">راسلنا لتسوية الوضع وإعادة تفعيل حسابك.</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Create `frontend/src/components/TrialExpiredScreen.jsx`**

```jsx
import { CheckCircle, Crown, Zap } from 'lucide-react'

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    price: '$50',
    color: 'border-slate-300 bg-slate-50',
    badge: 'bg-slate-100 text-slate-700',
    icon: Zap,
    features: ['POS كاشير', 'إدارة السيارات', 'الفواتير', 'المخزون اليدوي'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$100',
    color: 'border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-100',
    badge: 'bg-cyan-500 text-white',
    icon: Crown,
    recommended: true,
    features: ['كل Basic', 'التقارير المتقدمة', 'كاميرا قراءة اللوحة', 'واتساب التذكيرات'],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '$200',
    color: 'border-violet-300 bg-violet-50',
    badge: 'bg-violet-600 text-white',
    icon: Crown,
    features: ['كل Pro', 'OCR فواتير المخزون', 'دعم مخصص', 'تقارير سنوية PDF'],
  },
]

export default function TrialExpiredScreen({ daysLeft, isTrial }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6">
      <div className="mb-10 text-center">
        <p className="text-sm font-bold text-cyan-400">
          {isTrial ? `انتهت فترة التجربة المجانية` : 'انتهى الاشتراك'}
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">اختر خطة للمتابعة</h1>
        <p className="mt-3 text-slate-400">تواصل مع الإدارة بعد اختيار الخطة لتفعيل حسابك</p>
      </div>
      <div className="grid w-full max-w-4xl gap-5 md:grid-cols-3">
        {PLANS.map(plan => (
          <div key={plan.key} className={`relative rounded-2xl border-2 p-7 ${plan.color}`}>
            {plan.recommended && (
              <span className="absolute -top-3 right-5 rounded-full bg-cyan-500 px-4 py-1 text-xs font-black text-white">
                الأكثر شيوعاً
              </span>
            )}
            <div className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${plan.badge}`}>
              {plan.name}
            </div>
            <p className="text-3xl font-black text-slate-950">{plan.price}<span className="text-base font-normal text-slate-500">/شهر</span></p>
            <ul className="mt-5 space-y-2">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle size={15} className="shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
            <button className={`mt-6 w-full rounded-xl py-3 text-sm font-black transition ${plan.recommended ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
              اختر {plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Create `frontend/src/components/SubscriptionGate.jsx`**

```jsx
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { getSubscriptionStatus } from '../api/subscription'
import SuspendedScreen from './SuspendedScreen'
import TrialExpiredScreen from './TrialExpiredScreen'

export default function SubscriptionGate({ children }) {
  const { user } = useAuthStore()

  const { data: status } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => getSubscriptionStatus().then(r => r.data),
    enabled: !!user && user.role !== 'superadmin',
    staleTime: 5 * 60 * 1000,
  })

  if (!user || user.role === 'superadmin') return children

  if (status?.status === 'suspended') {
    return <SuspendedScreen reason={status.reason} />
  }

  if (status?.status === 'trial_expired' || status?.status === 'expired') {
    return <TrialExpiredScreen isTrial={status.status === 'trial_expired'} />
  }

  return children
}
```

- [ ] **Commit**

```bash
git add frontend/src/api/subscription.js frontend/src/components/
git commit -m "feat: subscription gate components — suspended, trial expired, plan cards"
```

---

## Task 5: Frontend — Wire Gate into App + Update Superadmin UI

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/pages/superadmin/Subscriptions.jsx`

- [ ] **Wrap app with SubscriptionGate in App.jsx**

In `frontend/src/App.jsx`, import and wrap the routes:

```jsx
import SubscriptionGate from './components/SubscriptionGate'

// Inside the return, wrap routes:
export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <SubscriptionGate>
          <Routes>
            {/* all existing routes unchanged */}
          </Routes>
        </SubscriptionGate>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
```

- [ ] **Add suspend button to Subscriptions.jsx**

In the existing `Subscriptions.jsx`, add a "إيقاف الحساب" button next to each tenant's row that calls `DELETE /tenants/{id}?reason=...` with a reason input prompt:

```jsx
// Add this import
import { getTenants, updateTenant } from '../../api/tenants'
import client from '../../api/client'

// Add this mutation inside component:
const suspend = useMutation({
  mutationFn: ({ id, reason }) => client.delete(`/tenants/${id}?reason=${encodeURIComponent(reason)}`),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
})

// Add this button in each tenant row (after the lock/unlock button):
<button
  onClick={() => {
    const reason = window.prompt('سبب الإيقاف:', 'عدم دفع الاشتراك')
    if (reason !== null) suspend.mutate({ id: t.id, reason })
  }}
  className="rounded-lg px-4 py-2 text-sm font-bold bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700">
  إيقاف نهائي
</button>
```

- [ ] **Build and verify**

```bash
cd frontend
npm run build
```

Expected: ✓ built successfully

- [ ] **Commit**

```bash
git add frontend/src/App.jsx frontend/src/pages/superadmin/Subscriptions.jsx
git commit -m "feat: subscription gate in app, suspend button in admin subscriptions"
```

---

## Task 6: Show Trial Banner for Active Trial Users

**Files:**
- Create: `frontend/src/components/TrialBanner.jsx`
- Modify: `frontend/src/components/Layout.jsx`

- [ ] **Create TrialBanner.jsx**

```jsx
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { getSubscriptionStatus } from '../api/subscription'
import { Clock } from 'lucide-react'

export default function TrialBanner() {
  const { user } = useAuthStore()
  const { data: status } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => getSubscriptionStatus().then(r => r.data),
    enabled: !!user && user.role !== 'superadmin',
    staleTime: 5 * 60 * 1000,
  })

  if (status?.status !== 'trial') return null

  return (
    <div className="flex items-center justify-between bg-amber-500 px-5 py-2 text-sm font-bold text-amber-950">
      <span className="flex items-center gap-2">
        <Clock size={15} />
        فترة تجريبية — باقي {status.days_left} {status.days_left === 1 ? 'يوم' : 'أيام'}
      </span>
      <span>تواصل مع الإدارة لتفعيل اشتراكك</span>
    </div>
  )
}
```

- [ ] **Add TrialBanner to Layout.jsx**

```jsx
// In Layout.jsx, add TrialBanner above the main content:
import TrialBanner from './TrialBanner'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TrialBanner />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Build and run tests**

```bash
cd frontend && npm run build
cd ../backend && python -m pytest tests/ -v
```

Expected: frontend build passes, all backend tests pass

- [ ] **Commit**

```bash
git add frontend/src/components/TrialBanner.jsx frontend/src/components/Layout.jsx
git commit -m "feat: trial countdown banner in center layout"
```
