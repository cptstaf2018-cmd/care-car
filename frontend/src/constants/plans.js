export const PLAN_ORDER = ['basic', 'pro', 'enterprise']

export const PLAN_DETAILS = {
  basic: {
    name: 'الخطة الأساسية',
    shortName: 'الأساسية',
    price: '100,000',
    adminPrice: 50,
  },
  pro: {
    name: 'الخطة الاحترافية',
    shortName: 'الاحترافية',
    price: '150,000',
    adminPrice: 100,
  },
  enterprise: {
    name: 'الخطة المؤسسية',
    shortName: 'المؤسسية',
    price: '250,000',
    adminPrice: 200,
  },
}

export function planName(plan) {
  return PLAN_DETAILS[plan]?.name || plan
}

export function planShortName(plan) {
  return PLAN_DETAILS[plan]?.shortName || plan
}
