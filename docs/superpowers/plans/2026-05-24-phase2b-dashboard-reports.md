# Phase 2B: Dashboard Real Data + Reports Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all fake/calculated chart data in Dashboard.jsx and Reports.jsx with real API data, add a service-reminder engine, and make the yearly report mode fully functional.

**Architecture:** Three new backend endpoints (`/reports/history`, `/reports/yearly`, `/reports/reminders`) return real aggregated data. Frontend replaces every `Math.round(... + i * ...)` formula with API calls. Quick-action buttons in the dashboard are wired to `useNavigate`.

**Tech Stack:** FastAPI, SQLAlchemy 2 (sync), React 18, React Query, Recharts, Tailwind CSS v3

---

## File Map

### Backend
```
backend/app/services/report_service.py   — add get_daily_history, get_yearly_report, get_reminders
backend/app/api/reports.py               — add GET /reports/history, /reports/yearly, /reports/reminders
```

### Frontend
```
frontend/src/api/reports.js              — add getDailyHistory, getYearlyReport, getReminders
frontend/src/pages/Dashboard.jsx         — replace fake data; wire quick actions
frontend/src/pages/Reports.jsx           — replace fake data; wire yearly mode
```

---

## Task 1: Backend — Three New Report Service Functions

**Files:**
- Modify: `backend/app/services/report_service.py`

- [ ] **Add three functions at the bottom of `backend/app/services/report_service.py`**

```python
# backend/app/services/report_service.py
# (append after existing get_monthly_report)

from datetime import timedelta
from app.models.car import Car
from app.models.tenant import Tenant


def get_daily_history(db: Session, tenant_id: int, days: int = 7) -> list[dict]:
    today = date.today()
    return [
        get_daily_report(db, tenant_id, today - timedelta(days=days - 1 - i))
        for i in range(days)
    ]


def get_yearly_report(db: Session, tenant_id: int, year: int) -> list[dict]:
    return [
        get_monthly_report(db, tenant_id, year, m)
        for m in range(1, 13)
    ]


def get_reminders(db: Session, tenant_id: int) -> list[dict]:
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    reminder_days = (tenant.reminder_days or 30) if tenant else 30

    from sqlalchemy import func
    subq = (
        db.query(Service.car_id, func.max(Service.service_date).label("last_svc"))
        .filter(Service.tenant_id == tenant_id)
        .group_by(Service.car_id)
        .subquery()
    )

    rows = (
        db.query(Car, subq.c.last_svc)
        .outerjoin(subq, Car.id == subq.c.car_id)
        .filter(Car.tenant_id == tenant_id)
        .all()
    )

    today = date.today()
    result = []
    for car, last_svc in rows:
        if last_svc is None:
            continue
        next_due = last_svc + timedelta(days=reminder_days)
        days_until = (next_due - today).days
        if -7 <= days_until <= 14:
            result.append({
                "car_id": car.id,
                "plate_number": car.plate_number,
                "owner_name": car.owner_name,
                "phone": car.phone,
                "last_service_date": str(last_svc),
                "next_due_date": str(next_due),
                "days_until_due": days_until,
            })
    result.sort(key=lambda x: x["days_until_due"])
    return result
```

- [ ] **Add missing imports at the top of `backend/app/services/report_service.py`**

The file currently has:
```python
from datetime import date
from calendar import monthrange
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.invoice import Invoice, InvoiceStatus
from app.models.service import Service
from app.models.debt import Debt
```

Change to:
```python
from datetime import date, timedelta
from calendar import monthrange
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.invoice import Invoice, InvoiceStatus
from app.models.service import Service
from app.models.debt import Debt
from app.models.car import Car
from app.models.tenant import Tenant
```

---

## Task 2: Backend — New Report Endpoints

**Files:**
- Modify: `backend/app/api/reports.py`

- [ ] **Replace `backend/app/api/reports.py` with this full file**

```python
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, Role
from app.services.report_service import (
    get_daily_report, get_monthly_report,
    get_daily_history, get_yearly_report, get_reminders,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/daily")
def daily_report(target_date: date = Query(default=None), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == Role.superadmin:
        raise HTTPException(400, detail="Superadmin must specify tenant_id query parameter")
    d = target_date or date.today()
    return get_daily_report(db, user.tenant_id, d)


@router.get("/monthly")
def monthly_report(year: int = Query(default=None), month: int = Query(default=None),
                   db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == Role.superadmin:
        raise HTTPException(400, detail="Superadmin must specify tenant_id query parameter")
    today = date.today()
    return get_monthly_report(db, user.tenant_id, year or today.year, month or today.month)


@router.get("/history")
def daily_history(days: int = Query(default=7, ge=1, le=90),
                  db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == Role.superadmin:
        raise HTTPException(400, detail="Superadmin must specify tenant_id query parameter")
    return get_daily_history(db, user.tenant_id, days)


@router.get("/yearly")
def yearly_report(year: int = Query(default=None),
                  db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == Role.superadmin:
        raise HTTPException(400, detail="Superadmin must specify tenant_id query parameter")
    y = year or date.today().year
    return get_yearly_report(db, user.tenant_id, y)


@router.get("/reminders")
def reminder_list(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == Role.superadmin:
        raise HTTPException(400, detail="Superadmin must specify tenant_id query parameter")
    return get_reminders(db, user.tenant_id)
```

- [ ] **Test the 3 new endpoints manually**

```
cd C:\Users\saad\Desktop\cear-car\backend
$env:DATABASE_URL="postgresql://oiluser:oilpass@localhost:5432/oildb"
python -m uvicorn app.main:app --reload
```

In another terminal:
```
# Get history (last 7 days)
curl http://localhost:8000/reports/history -H "Authorization: Bearer <token>"

# Get yearly
curl http://localhost:8000/reports/yearly -H "Authorization: Bearer <token>"

# Get reminders
curl http://localhost:8000/reports/reminders -H "Authorization: Bearer <token>"
```

Expected: All 3 return JSON arrays (possibly empty if no data yet).

- [ ] **Commit**

```bash
git add backend/app/services/report_service.py backend/app/api/reports.py
git commit -m "feat: add history, yearly, reminders report endpoints"
```

---

## Task 3: Frontend — API Client Functions

**Files:**
- Modify: `frontend/src/api/reports.js`

- [ ] **Replace `frontend/src/api/reports.js`**

```js
import client from './client'
export const getDailyReport = (date) => client.get('/reports/daily', { params: { target_date: date } })
export const getMonthlyReport = (year, month) => client.get('/reports/monthly', { params: { year, month } })
export const getDailyHistory = (days = 7) => client.get('/reports/history', { params: { days } })
export const getYearlyReport = (year) => client.get('/reports/yearly', { params: { year } })
export const getReminders = () => client.get('/reports/reminders')
```

---

## Task 4: Frontend — Dashboard.jsx Real Data

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`

- [ ] **Replace `frontend/src/pages/Dashboard.jsx` with this full file**

```jsx
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Bell, Car, CreditCard, DollarSign, MessageCircle, Package, PlusCircle, Receipt, Wrench } from 'lucide-react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { getDailyReport, getMonthlyReport, getDailyHistory } from '../api/reports'
import { getInventory } from '../api/inventory'
import { getInvoices } from '../api/invoices'
import { getReminders } from '../api/reports'
import { useAuthStore } from '../store/auth'
import centerTemplateRed from '../assets/center-template-red.png'
import centerTemplateSuv from '../assets/center-template-suv.png'
import centerTemplateWhite from '../assets/center-template-white.png'

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()

  const dailyQuery = useQuery({ queryKey: ['daily', today], queryFn: () => getDailyReport(today).then(r => r.data) })
  const monthlyQuery = useQuery({ queryKey: ['monthly', now.getFullYear(), now.getMonth() + 1], queryFn: () => getMonthlyReport(now.getFullYear(), now.getMonth() + 1).then(r => r.data) })
  const historyQuery = useQuery({ queryKey: ['history', 7], queryFn: () => getDailyHistory(7).then(r => r.data) })
  const remindersQuery = useQuery({ queryKey: ['reminders'], queryFn: () => getReminders().then(r => r.data) })
  const inventoryQuery = useQuery({ queryKey: ['inventory'], queryFn: () => getInventory().then(r => r.data) })
  const invoicesQuery = useQuery({ queryKey: ['invoices'], queryFn: () => getInvoices().then(r => r.data) })

  const daily = dailyQuery.data
  const monthly = monthlyQuery.data
  const history = historyQuery.data || []
  const reminders = remindersQuery.data || []
  const inventory = inventoryQuery.data || []
  const invoices = invoicesQuery.data || []
  const lowStock = inventory.filter(item => item.low_stock)
  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid')
  const dueCount = reminders.filter(r => r.days_until_due <= 3).length

  const weekData = history.map(d => ({
    day: new Date(d.date).toLocaleDateString('ar-IQ', { weekday: 'short' }),
    sales: d.total_sales,
    services: d.service_count,
  }))

  const oilData = [...inventory]
    .sort((a, b) => Number(b.quantity) - Number(a.quantity))
    .slice(0, 5)
    .map(item => ({ name: item.oil_type, value: Number(item.quantity) }))

  const centerTemplates = [centerTemplateRed, centerTemplateSuv, centerTemplateWhite]
  const selectedTemplate = centerTemplates[(Number(user?.tenant_id || 1) - 1) % centerTemplates.length]

  const QUICK_ACTIONS = [
    { label: 'خدمة جديدة', path: '/new-service' },
    { label: 'إضافة سيارة', path: '/cars' },
    { label: 'إضافة وصل مخزون', path: '/inventory' },
    { label: 'تقارير', path: '/reports' },
  ]

  return (
    <Layout>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-5 min-h-[300px] overflow-hidden rounded-lg border border-slate-900 bg-slate-950 bg-cover bg-left shadow-2xl"
        style={{ backgroundImage: `url(${selectedTemplate})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/86 to-slate-950/6" />
        <div className="relative mr-auto flex min-h-[300px] w-full max-w-3xl flex-col justify-between p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-cyan-300">AI Oil Center ERP</p>
              <h2 className="mt-2 text-3xl font-black">مركز العمليات اليومي</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200">تدفق الخدمات، المخزون، الفواتير، التذكيرات في شاشة واحدة.</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-left backdrop-blur">
              <p className="text-xs text-slate-300">اليوم</p>
              <p className="font-black">{today}</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ['خدمات اليوم', daily?.service_count ?? '—'],
              ['رسائل قريبة', dueCount],
              ['نقص مخزون', lowStock.length],
              ['غير مدفوع', unpaidInvoices.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-slate-300">{label}</p>
                <p className="mt-1 text-2xl font-black">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard icon={Wrench} label="خدمات اليوم" value={daily?.service_count} color="blue" loading={dailyQuery.isLoading} />
        <StatCard icon={DollarSign} label="مبيعات اليوم" value={daily?.total_sales != null ? `${daily.total_sales.toLocaleString()} IQD` : null} color="green" loading={dailyQuery.isLoading} />
        <StatCard icon={CreditCard} label="محصّل اليوم" value={daily?.paid != null ? `${daily.paid.toLocaleString()} IQD` : null} color="purple" loading={dailyQuery.isLoading} />
        <StatCard icon={Receipt} label="ديون معلقة" value={monthly?.pending_debts != null ? `${monthly.pending_debts.toLocaleString()} IQD` : null} color="red" loading={monthlyQuery.isLoading} />
        <StatCard icon={Package} label="تنبيهات مخزون" value={lowStock.length} color="orange" loading={inventoryQuery.isLoading} />
      </div>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="premium-card rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-950">مبيعات آخر 7 أيام</h3>
              <p className="mt-1 text-xs text-slate-500">بيانات حقيقية من قاعدة البيانات</p>
            </div>
            <button onClick={() => navigate('/reports')} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">تقرير كامل</button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="sales" stroke="#0891b2" fill="url(#sales)" strokeWidth={3} name="المبيعات" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="premium-card rounded-lg p-5">
          <h3 className="font-black text-slate-950">المخزون الحالي</h3>
          <p className="mt-1 text-xs text-slate-500">أعلى 5 مواد بالكمية</p>
          {oilData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={oilData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={52} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} name="الكمية" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-sm font-semibold text-slate-400">لا يوجد مخزون بعد</div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="مركز التنبيهات" icon={Bell}>
          <AlertRow tone="amber" text={lowStock[0] ? `نقص في ${lowStock[0].oil_type}` : 'لا توجد تنبيهات مخزون'} />
          <AlertRow tone="rose" text={unpaidInvoices[0] ? `فاتورة #${unpaidInvoices[0].id} غير مدفوعة` : 'لا توجد فواتير متأخرة'} />
          <AlertRow tone="cyan" text={dueCount ? `${dueCount} زبائن اقترب موعد تذكيرهم` : 'لا توجد تذكيرات عاجلة'} />
        </Panel>

        <Panel title="تذكيرات تبديل الزيت" icon={MessageCircle}>
          {reminders.length ? reminders.slice(0, 5).map(r => (
            <div key={r.car_id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <div>
                <p className="font-mono font-black text-slate-950">{r.plate_number}</p>
                <p className="text-xs text-slate-500">{r.owner_name || 'عميل'} · {r.phone || 'لا يوجد'}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${r.days_until_due <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-cyan-100 text-cyan-700'}`}>
                {r.days_until_due <= 0 ? 'متأخر' : `${r.days_until_due} يوم`}
              </span>
            </div>
          )) : <EmptyState text="لا توجد تذكيرات قريبة" />}
        </Panel>

        <Panel title="آخر الفواتير" icon={Receipt}>
          {invoices.slice(0, 5).map(inv => (
            <div key={inv.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
              <span className="font-mono font-bold">#{inv.id}</span>
              <span className="text-sm text-slate-500">{inv.invoice_date}</span>
              <span className="font-bold text-slate-950">{Number(inv.amount).toLocaleString()} IQD</span>
            </div>
          ))}
          {!invoices.length && <EmptyState text="لا توجد فواتير بعد" />}
        </Panel>
      </section>

      <section className="mt-5">
        <Panel title="إجراءات سريعة" icon={PlusCircle}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {QUICK_ACTIONS.map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-800 transition hover:border-cyan-300 hover:bg-cyan-50">
                {label}
              </button>
            ))}
          </div>
        </Panel>
      </section>
    </Layout>
  )
}

function Panel({ title, icon: Icon, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="premium-card rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white"><Icon size={17} /></div>
        <h3 className="font-black text-slate-950">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </motion.div>
  )
}

function AlertRow({ text, tone }) {
  const classes = {
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  }
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${classes[tone]}`}>
      <AlertTriangle size={15} />
      {text}
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm font-semibold text-slate-400">{text}</div>
}
```

---

## Task 5: Frontend — Reports.jsx Real Data

**Files:**
- Modify: `frontend/src/pages/Reports.jsx`

- [ ] **Replace `frontend/src/pages/Reports.jsx` with this full file**

```jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarDays, CreditCard, TrendingDown, TrendingUp, Wrench } from 'lucide-react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { getMonthlyReport, getDailyHistory, getYearlyReport } from '../api/reports'

export default function Reports() {
  const now = new Date()
  const [period, setPeriod] = useState('monthly')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const monthlyQuery = useQuery({
    queryKey: ['monthly', year, month],
    queryFn: () => getMonthlyReport(year, month).then(r => r.data),
  })

  const weeklyQuery = useQuery({
    queryKey: ['history', 7],
    queryFn: () => getDailyHistory(7).then(r => r.data),
    enabled: period === 'weekly',
  })

  const yearlyQuery = useQuery({
    queryKey: ['yearly', year],
    queryFn: () => getYearlyReport(year).then(r => r.data),
    enabled: period === 'yearly',
  })

  const monthly = monthlyQuery.data
  const isLoading = monthlyQuery.isLoading

  const trendData = (() => {
    if (period === 'weekly') {
      return (weeklyQuery.data || []).map(d => ({
        label: new Date(d.date).toLocaleDateString('ar-IQ', { weekday: 'short' }),
        sales: d.total_sales,
        debt: 0,
        paid: d.paid,
      }))
    }
    if (period === 'yearly') {
      return (yearlyQuery.data || []).map(d => ({
        label: `ش${d.month}`,
        sales: d.total_sales,
        debt: d.pending_debts,
        paid: d.paid,
      }))
    }
    // monthly: use 30 daily history points fetched per-day is too expensive
    // show monthly totals as a single bar summary instead via monthly data
    return monthly ? [
      { label: 'المبيعات', value: monthly.total_sales },
      { label: 'المحصّل', value: monthly.paid },
      { label: 'غير محصّل', value: monthly.unpaid },
      { label: 'الديون', value: monthly.pending_debts },
    ] : []
  })()

  const isSummaryMode = period === 'monthly'

  return (
    <Layout>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black text-cyan-700">Analytics Center</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">تقارير تشغيل وربحية المركز</h2>
          <p className="mt-2 text-sm text-slate-500">تحليل أسبوعي، شهري، وسنوي للمبيعات والديون.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['weekly', 'monthly', 'yearly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-sm font-black ${period === p ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
              {p === 'weekly' ? 'أسبوعي' : p === 'monthly' ? 'شهري' : 'سنوي'}
            </button>
          ))}
          {period === 'monthly' && (
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none">
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>شهر {i + 1}</option>)}
            </select>
          )}
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
            className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none" />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Wrench} label="الخدمات" value={monthly?.service_count} color="blue" loading={isLoading} />
        <StatCard icon={TrendingUp} label="المبيعات" value={monthly?.total_sales != null ? `${monthly.total_sales.toLocaleString()} IQD` : null} color="green" loading={isLoading} />
        <StatCard icon={CreditCard} label="المحصّل" value={monthly?.paid != null ? `${monthly.paid.toLocaleString()} IQD` : null} color="purple" loading={isLoading} />
        <StatCard icon={TrendingDown} label="الديون" value={monthly?.pending_debts != null ? `${monthly.pending_debts.toLocaleString()} IQD` : null} color="red" loading={isLoading} />
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <ChartCard title={period === 'weekly' ? 'مبيعات آخر 7 أيام' : period === 'yearly' ? `مبيعات سنة ${year}` : `ملخص شهر ${month}/${year}`}
          subtitle="بيانات حقيقية من قاعدة البيانات">
          <ResponsiveContainer width="100%" height={300}>
            {isSummaryMode ? (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v) => `${Number(v).toLocaleString()} IQD`} />
                <Bar dataKey="value" fill="#0891b2" radius={[6, 6, 0, 0]} name="المبلغ" />
              </BarChart>
            ) : (
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v) => `${Number(v).toLocaleString()} IQD`} />
                <Area type="monotone" dataKey="sales" stroke="#0891b2" fill="url(#sales)" strokeWidth={3} name="المبيعات" />
                <Line type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={3} dot={false} name="المحصّل" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="الديون غير المحصلة" subtitle="مراقبة الديون">
          <ResponsiveContainer width="100%" height={300}>
            {!isSummaryMode ? (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v) => `${Number(v).toLocaleString()} IQD`} />
                <Line type="monotone" dataKey="debt" stroke="#e11d48" strokeWidth={3} dot={false} name="الديون" />
              </LineChart>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
                <p className="text-3xl font-black text-rose-600">{monthly?.pending_debts != null ? `${monthly.pending_debts.toLocaleString()}` : '—'}</p>
                <p className="text-sm text-slate-500">IQD ديون معلقة إجمالي</p>
                <p className="mt-4 text-sm font-bold text-slate-700">غير محصّل هذا الشهر</p>
                <p className="text-2xl font-black text-amber-600">{monthly?.unpaid != null ? `${monthly.unpaid.toLocaleString()}` : '—'} IQD</p>
              </div>
            )}
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </Layout>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="premium-card rounded-lg p-5">
      <h3 className="font-black text-slate-950">{title}</h3>
      <p className="mb-4 mt-1 text-xs text-slate-500">{subtitle}</p>
      {children}
    </motion.div>
  )
}
```

- [ ] **Commit**

```bash
git add frontend/src/api/reports.js frontend/src/pages/Dashboard.jsx frontend/src/pages/Reports.jsx
git commit -m "feat: wire dashboard and reports to real API data"
```

---

## Self-Check

- History endpoint loops N days using existing `get_daily_report` — no new SQL logic needed.
- Yearly endpoint loops 12 months using existing `get_monthly_report`.
- Reminders uses a real JOIN of Service + Car filtered by tenant_id.
- Dashboard chart data comes from `historyQuery` (real API), not Math.round formulas.
- Oil chart uses actual inventory items sorted by quantity.
- Reminders list uses real `remindersQuery` — `daysUntilReminder` fake seed function is gone.
- Quick actions navigate to real routes: `/new-service`, `/cars`, `/inventory`, `/reports`.
- Reports yearly mode uses `yearlyQuery` (real data), not fake array.
- Reports weekly mode uses `getDailyHistory(7)` (real data).
- Monthly mode shows a summary bar chart + plain debt numbers (avoids per-day API hammering).
