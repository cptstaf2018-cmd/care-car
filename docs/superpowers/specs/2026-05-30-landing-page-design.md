# Landing Page Design — carecar.online/about

**Date:** 2026-05-30  
**Route:** `/about` (public, no auth required)  
**Project:** cear-car — SaaS نظام إدارة مراكز تغيير الزيت

---

## Goal

صفحة تسويقية تجذب مراكز تغيير الزيت للاشتراك في النظام. الهدف الأساسي: تحويل الزوار لمشتركين جدد.

---

## Architecture

- **File:** `frontend/src/pages/LandingPage.jsx` — component واحد مقسم إلى sub-components داخله
- **Route:** `/about` مضاف في `App.jsx` كـ public route (بدون ProtectedRoute)
- **Language:** `useState` للغة (`'ar' | 'en'`)، تغيير `dir` عند التبديل
- **Animations:** Framer Motion `whileInView` + `initial/animate` — خفيفة فقط
- **Assets:** صور حقيقية من جذر المشروع (PNG موجودة)
- **Pricing:** مستوردة من `src/constants/plans.js` مباشرة

---

## Sections

### 1. Navbar
- شعار النظام (carecar) يساراً (RTL)
- زر تبديل اللغة AR/EN
- زر "سجل الآن" يوجه لـ `/register`

### 2. Hero
- عنوان رئيسي كبير (AR: "أدر مركزك بذكاء" / EN: "Manage Your Center Smartly")
- جملة وصفية قصيرة
- زران: "ابدأ مجاناً" → `/register` و "تسجيل دخول" → `/login`
- Screenshot: `admin-panel.png` بظل وزاوية خفيفة

### 3. Features Grid
6 بطاقات بأيقونات Lucide:
1. كاميرا IP + قراءة اللوحة (Camera)
2. تذكيرات واتساب (MessageCircle)
3. إدارة المخزون (Package)
4. فواتير احترافية (FileText)
5. تقارير وإحصائيات (BarChart2)
6. دعم متخصص (Headphones)

### 4. Screenshots Section
3 screenshots مع وصف (alternating layout):
- `car-search.png` → إدارة السيارات والزبائن
- `invoice-print-test.png` → الفواتير والطباعة
- `admin-panel.png` → لوحة التحكم الكاملة

### 5. Pricing
3 cards من `PLAN_DETAILS` (basic/pro/enterprise):
- السعر بالدينار العراقي
- قائمة المميزات (features ✅ / noFeatures ❌)
- Pro card مميزة بـ badge "الأكثر طلباً"
- زر "اشترك الآن" → `/register`

### 6. FAQ
5 أسئلة شائعة بـ accordion (toggle):
1. هل يمكنني تجربة النظام؟
2. كيف يتم الدفع؟
3. هل البيانات محمية؟
4. هل يعمل على الجوال؟
5. كيف أتواصل مع الدعم؟

### 7. CTA Section
بنر ملون (gradient) مع عنوان كبير وزر تسجيل.

### 8. Footer
- شعار + وصف قصير
- روابط: تسجيل دخول / تسجيل / صفحتنا
- Developed by: [Baghdad Future AI](https://baghdad-future-ai.my/)
- بريد: cptstaf2018@gmail.com

---

## Visual Design

| Element | Value |
|---------|-------|
| Background | `#eef2f7` (نفس الموقع) |
| Primary Text | `#101828` |
| Accent | `#2563eb` (blue-600) |
| Font | IBM Plex Sans Arabic |
| Default Dir | RTL (عربي) |
| Animations | fade-up on scroll, hover scale على البطاقات |

---

## Out of Scope

- لا backend جديد
- لا نشر قبل مراجعة المستخدم
- لا تعديل على الصفحات الأخرى
