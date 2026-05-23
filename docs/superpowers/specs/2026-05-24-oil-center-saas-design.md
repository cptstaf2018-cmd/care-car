# نظام إدارة مراكز تبديل الزيت — SaaS

**التاريخ:** 2026-05-24  
**الحالة:** معتمد  
**التقنيات:** Python (FastAPI) + React 18 + PostgreSQL + OpenCV + EasyOCR

---

## نظرة عامة

منصة SaaS متعددة المستأجرين (multi-tenant) لإدارة مراكز تبديل الزيت والدهون. المالك (Super Admin) يبيع اشتراكات لمراكز مختلفة. كل مركز يحصل على Dashboard مستقل ومعزول. الكاميرا USB تقرأ لوحات الأرقام تلقائياً.

---

## المستخدمون

| الدور | الصلاحيات |
|---|---|
| Super Admin (المالك) | كل شيء — إدارة المراكز، الاشتراكات، تقارير موحدة |
| Manager (مدير المركز) | مركزه فقط — تقارير، أسعار، موظفين |
| Employee (موظف) | إدخال خدمات فقط |

---

## المعمارية

```
USB Camera
    ↓
Python Camera Service (OpenCV + EasyOCR)
    ↓ HTTP/WebSocket
FastAPI Backend
    ↓
PostgreSQL (multi-tenant بـ tenant_id)
    ↑
React Frontend (Dashboard per tenant + Super Admin Panel)
```

### المكونات:

**Backend (FastAPI / Python):**
- Auth: JWT tokens + tenant isolation middleware
- Camera Service: OpenCV VideoCapture + EasyOCR لقراءة اللوحات
- WhatsApp Service: whatsapp-web.js عبر subprocess أو Twilio API
- Scheduler: APScheduler لإرسال التذكيرات اليومية

**Frontend (React 18 + Tailwind CSS):**
- Super Admin Panel: إدارة المراكز والاشتراكات
- Center Dashboard: إحصائيات + إدارة السيارات + كاشير
- RTL كامل (عربي)

**Database (PostgreSQL):**
- كل جدول يحمل `tenant_id` للعزل
- Alembic للـ migrations

---

## قاعدة البيانات

### الجداول الرئيسية:

```sql
tenants (id, name, plan, status, created_at)
users (id, tenant_id, role, email, hashed_password)
cars (id, tenant_id, plate_number, car_type, owner_name, phone, photo_url)
services (id, tenant_id, car_id, service_date, oil_type, mileage, notes)
invoices (id, tenant_id, service_id, amount, status, created_at)
debts (id, tenant_id, invoice_id, car_id, amount, due_date)
inventory (id, tenant_id, oil_type, quantity, min_threshold)
whatsapp_logs (id, tenant_id, car_id, sent_at, status)
```

---

## المراحل

### المرحلة 1 — MVP (أسبوعان)
- [ ] إعداد المشروع (FastAPI + React + PostgreSQL + Docker)
- [ ] نظام Auth (JWT، أدوار، multi-tenant middleware)
- [ ] CRUD السيارات والخدمات
- [ ] نظام الكاشير والفواتير والديون
- [ ] إدارة المخزون
- [ ] التقارير (يومي / أسبوعي / شهري / سنوي)
- [ ] Super Admin Panel (إدارة المراكز، الاشتراكات)
- [ ] Center Dashboard (إحصائيات، قوائم، تنبيهات)

### المرحلة 2 — الكاميرا (أسبوع)
- [ ] Camera Service بـ OpenCV (USB VideoCapture)
- [ ] EasyOCR لقراءة لوحات الأرقام العربية
- [ ] WebSocket لبث الفيديو للـ Dashboard
- [ ] إدخال تلقائي للسيارة عند اكتشاف لوحة جديدة
- [ ] حفظ صورة السيارة

### المرحلة 3 — الأتمتة (أسبوع)
- [ ] WhatsApp تذكيرات تلقائية (30 يوم بعد آخر خدمة)
- [ ] إشعارات انتهاء المخزون
- [ ] جدولة التقارير الأسبوعية بالبريد
- [ ] OCR للفواتير الورقية (اختياري)

---

## نموذج الاشتراكات

| الخطة | السعر | المراكز | الكاميرا | WhatsApp |
|---|---|---|---|---|
| بيسك | 50$/شهر | 1 | ❌ | ❌ |
| برو | 100$/شهر | 3 | ✅ | ✅ |
| إنتربرايز | 200$/شهر | غير محدود | ✅ | ✅ + دعم 24/7 |

---

## هيكل المجلدات

```
cear-car/
├── backend/
│   ├── app/
│   │   ├── api/          # routes
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # business logic
│   │   ├── camera/       # OpenCV + EasyOCR
│   │   └── core/         # config, auth, db
│   ├── alembic/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/        # Dashboard, SuperAdmin, Auth
│   │   ├── components/   # shared components
│   │   └── api/          # axios clients
│   └── package.json
└── docker-compose.yml
```

---

## الأمان

- JWT مع انتهاء صلاحية + refresh tokens
- كل API endpoint يتحقق من `tenant_id` في الـ token
- لا يمكن لمركز رؤية بيانات مركز آخر أبداً
- كلمات مرور مشفرة بـ bcrypt
- HTTPS في الإنتاج

---

## متطلبات التشغيل

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- كاميرا USB (cv2.VideoCapture(0))
- Docker (اختياري للنشر)
