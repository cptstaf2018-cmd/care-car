export const PLAN_ORDER = ['basic', 'pro', 'enterprise']

export const PLAN_DETAILS = {
  basic: {
    name: 'الخطة الأساسية',
    shortName: 'الأساسية',
    price: '100,000',
    adminPrice: 100000,
    features: ['سيارات الزبائن وتاريخ الخدمة', 'خدمة سريعة وفواتير', 'تقارير أساسية', 'إعدادات المركز والشعار'],
    noFeatures: ['تذكيرات واتساب', 'إدارة المخزون', 'كاميرا IP', 'قراءة اللوحة'],
  },
  pro: {
    name: 'الخطة الاحترافية',
    shortName: 'الاحترافية',
    price: '150,000',
    adminPrice: 150000,
    features: ['كل مميزات الأساسية', 'المخزون مع خصم تلقائي', 'تذكيرات واتساب التلقائية', 'تقارير متقدمة'],
    noFeatures: ['كاميرا IP', 'قراءة اللوحة OCR'],
  },
  enterprise: {
    name: 'الخطة المؤسسية',
    shortName: 'المؤسسية',
    price: '250,000',
    adminPrice: 250000,
    features: ['كل مميزات الاحترافية', 'ربط كاميرا IP', 'قراءة اللوحة بالكاميرا', 'دعم متقدم وإعداد مخصص'],
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
