export const PLAN_ORDER = ['basic', 'pro', 'enterprise']
export const PLAN_RANK = { basic: 1, pro: 2, enterprise: 3 }

export const PLAN_DETAILS = {
  basic: {
    name: 'الخطة الأساسية',
    shortName: 'الأساسية',
    price: '100,000',
    adminPrice: 100000,
    features: ['الفواتير والسيارات', 'المخزون مع الخصم التلقائي', 'الديون ومطالبة واتساب', 'مستخدم واحد'],
    noFeatures: ['قراءة وصل الشراء', 'كاميرا قراءة اللوحة', 'مساعد المركز'],
  },
  pro: {
    name: 'الخطة المتوسطة',
    shortName: 'المتوسطة',
    price: '150,000',
    adminPrice: 150000,
    features: ['كل مميزات الأساسية', 'مستخدمان', 'قراءة وصل الشراء', 'تنبيهات مخزون', 'تقارير أفضل ومساعد المركز'],
    noFeatures: ['كاميرا قراءة اللوحة', 'استقبال السيارة بالكاميرا', 'أرشفة Excel شهرية'],
  },
  enterprise: {
    name: 'الخطة المميزة',
    shortName: 'المميزة',
    price: '250,000',
    adminPrice: 250000,
    features: ['كل مميزات المتوسطة', '3 مستخدمين', 'كاميرا قراءة اللوحة CTK', 'استقبال السيارة داخل خدمة جديدة', 'أرشفة Excel شهرية ودعم خاص'],
    noFeatures: [],
  },
}

export const IQD = (amount) => `${(amount / 1000).toFixed(0)}K د.ع`

export function planName(plan) {
  return PLAN_DETAILS[plan]?.name || plan
}

export function planShortName(plan) {
  return PLAN_DETAILS[plan]?.shortName || plan
}

export function isHigherPlan(targetPlan, currentPlan) {
  return (PLAN_RANK[targetPlan] || 0) > (PLAN_RANK[currentPlan] || 0)
}

export function nextPlan(currentPlan) {
  return PLAN_ORDER.find(plan => isHigherPlan(plan, currentPlan))
}

export function hasPlanFeature(plan, feature) {
  const rank = PLAN_RANK[plan] || 1
  const requirements = {
    inventory: 1,
    debt_whatsapp: 1,
    invoices: 1,
    inventory_receipt: 2,
    inventory_auto_deduct: 1,
    low_stock_alerts: 2,
    whatsapp_reminders: 2,
    advanced_reports: 2,
    assistant: 2,
    camera: 3,
    plate_ocr: 3,
    monthly_archive: 3,
  }
  return rank >= (requirements[feature] || 1)
}

export function planUserLimit(plan) {
  return ({ basic: 1, pro: 2, enterprise: 3 })[plan] || 1
}

export function isTrialTenant(tenant) {
  return Boolean(tenant?.trial_ends_at && !tenant?.subscription_ends_at)
}

export function tenantPlanLabel(tenant) {
  return isTrialTenant(tenant) ? 'فترة تجريبية' : planShortName(tenant?.plan)
}

export function tenantPlanPrice(tenant) {
  return isTrialTenant(tenant) ? 0 : PLAN_DETAILS[tenant?.plan]?.adminPrice || 0
}

export function tenantPlanPriceLabel(tenant) {
  return isTrialTenant(tenant) ? 'مجاني مؤقت' : `${IQD(tenantPlanPrice(tenant))}/شهر`
}
