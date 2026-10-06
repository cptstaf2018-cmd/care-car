/**
 * What each kind of center offers. A template lists only the services that belong to that trade, and each
 * service carries the details that trade actually asks for (oil grade, gas type, tire size, which panel...).
 *
 * service: { label, image, tone, hint, detail?, keywords? }
 *   detail   → { title, note, kind: 'choice' | 'text', options?, placeholder? } and is appended to the invoice line name
 *   keywords → words used to pre-select the matching stock item (array, or a function of the detail value)
 * Parts stores do not sell "services": they use the 'sale' kind and pick products from stock.
 */
const IMG = '/service-icons-3d/auto-pack'

const ENGINE_OIL_GRADES = ['15W40', '10W40', '10W30', '5W40', '5W30', '5W20', '0W20']
const FRONT_REAR = ['أمامي', 'خلفي', 'الأمامي والخلفي']
const CAR_SIZES = ['صغيرة', 'سيدان', 'SUV / كبيرة']
const PANELS = ['الصدّام الأمامي', 'الصدّام الخلفي', 'الباب الأمامي', 'الباب الخلفي', 'الرفرف', 'الكبوت', 'الصندوق', 'السقف', 'أخرى']

const choice = (title, note, options) => ({ title, note, kind: 'choice', options })
const text = (title, note, placeholder) => ({ title, note, kind: 'text', placeholder })

const OIL_CHANGE = [
  {
    label: 'تبديل زيت المحرك', image: `${IMG}/oil-can.webp`, tone: 'cyan', hint: 'الأكثر طلباً',
    detail: choice('نوع الزيت', 'درجة اللزوجة', ENGINE_OIL_GRADES),
    keywords: (grade) => [grade, grade?.replace('W', 'W-'), 'زيت محرك', 'زيت'],
  },
  { label: 'تبديل فلتر الزيت', image: `${IMG}/oil-filter.webp`, tone: 'amber', hint: 'فلترة المحرك', keywords: ['فلتر زيت'] },
  {
    label: 'زيت الجير الأوتوماتيك', image: `${IMG}/gear-shift.webp`, tone: 'violet', hint: 'ناقل الحركة',
    detail: choice('نوع الزيت', 'مواصفة الجير', ['Dexron III', 'Dexron VI', 'ATF WS', 'CVT', 'ATF T-IV']),
    keywords: (type) => [type, 'جير', 'ATF'],
  },
  {
    label: 'زيت الجير العادي', image: `${IMG}/gear-shift.webp`, tone: 'slate', hint: 'جير يدوي',
    detail: choice('نوع الزيت', 'درجة اللزوجة', ['75W-90', '80W-90', '75W-85', '85W-140']),
    keywords: (grade) => [grade, 'زيت جير', 'جير'],
  },
  {
    label: 'زيت الدفرنس', image: `${IMG}/oil-can.webp`, tone: 'blue', hint: 'الدبل الخلفي أو الأمامي',
    detail: choice('نوع الزيت', 'درجة اللزوجة', ['80W-90', '75W-90', '85W-140']),
    keywords: (grade) => [grade, 'دفرنس', 'دبل'],
  },
  { label: 'زيت الباور (الدركسون)', image: `${IMG}/oil-can.webp`, tone: 'teal', hint: 'نظام التوجيه', keywords: ['باور', 'دركسون'] },
  {
    label: 'زيت الفرامل', image: `${IMG}/brake-fluid.webp`, tone: 'rose', hint: 'سائل الفرامل',
    detail: choice('النوع', 'المواصفة', ['DOT 3', 'DOT 4', 'DOT 5.1']),
    keywords: (type) => [type, 'زيت فرامل', 'فرامل'],
  },
  { label: 'تشحيم (شحم)', image: `${IMG}/oil-can.webp`, tone: 'emerald', hint: 'المفاصل والمحاور', keywords: ['شحم'] },
  { label: 'غسيل المحرك من الداخل (Flush)', image: `${IMG}/oil-can.webp`, tone: 'indigo', hint: 'قبل تبديل الزيت', keywords: ['فلاش', 'flush'] },
]

const TIRES = [
  { label: 'تبديل إطار', image: `${IMG}/tire-change-exact.webp`, tone: 'slate', hint: 'تركيب إطار', detail: text('المقاس', 'اختياري', '205/55R16'), keywords: ['إطار', 'تاير'] },
  { label: 'بيع إطار', image: `${IMG}/tire-sale-exact.webp`, tone: 'cyan', hint: 'إطار جديد', detail: text('المقاس', 'اختياري', '205/55R16'), keywords: ['إطار', 'تاير'] },
  { label: 'رقعة إطار', image: `${IMG}/tire-patch.webp`, tone: 'amber', hint: 'تصليح بنجر', keywords: ['رقعة', 'لصق'] },
  { label: 'ترصيص', image: `${IMG}/wheel-balancing-exact.webp`, tone: 'rose', hint: 'توازن الإطار', keywords: ['أوزان', 'ترصيص'] },
  { label: 'ميزان (ضبط الزوايا)', image: `${IMG}/wheel-alignment-exact.webp`, tone: 'sky', hint: 'ضبط مسار' },
  { label: 'تعبئة نيتروجين', image: `${IMG}/nitrogen-fill-exact.webp`, tone: 'teal', hint: 'ضغط ثابت', keywords: ['نيتروجين'] },
  { label: 'تبديل بلف', image: `${IMG}/tire-valve-exact.webp`, tone: 'emerald', hint: 'بلف الإطار', keywords: ['بلف'] },
  { label: 'تدوير إطارات', image: `${IMG}/tire-rotate.webp`, tone: 'violet', hint: 'توزيع التآكل' },
]

const WASH = [
  { label: 'غسيل خارجي', image: `${IMG}/car-wash-exterior-exact.webp`, tone: 'sky', hint: 'تنظيف سريع', detail: choice('حجم السيارة', 'يحدد السعر', CAR_SIZES) },
  { label: 'غسيل كامل', image: `${IMG}/car-wash-full-exact.webp`, tone: 'cyan', hint: 'خارجي وداخلي', detail: choice('حجم السيارة', 'يحدد السعر', CAR_SIZES) },
  { label: 'تنظيف داخلي', image: `${IMG}/interior-clean.webp`, tone: 'indigo', hint: 'المقصورة', detail: choice('حجم السيارة', 'يحدد السعر', CAR_SIZES) },
  { label: 'بولش', image: `${IMG}/polisher.webp`, tone: 'amber', hint: 'لمعان الطلاء', detail: choice('حجم السيارة', 'يحدد السعر', CAR_SIZES) },
  { label: 'واكس', image: `${IMG}/wax-shield.webp`, tone: 'teal', hint: 'حماية الطلاء', detail: choice('حجم السيارة', 'يحدد السعر', CAR_SIZES) },
  { label: 'نانو سيراميك', image: `${IMG}/nano-shield.webp`, tone: 'violet', hint: 'حماية متقدمة', detail: choice('حجم السيارة', 'يحدد السعر', CAR_SIZES) },
  { label: 'تعقيم', image: `${IMG}/disinfect-spray.webp`, tone: 'emerald', hint: 'تنظيف صحي' },
]

const ELECTRICAL = [
  { label: 'فحص كمبيوتر', image: `${IMG}/computer-scan.webp`, tone: 'cyan', hint: 'تشخيص أعطال' },
  { label: 'تبديل بطارية', image: `${IMG}/battery.webp`, tone: 'emerald', hint: 'بطارية جديدة', detail: choice('السعة', 'أمبير', ['45', '60', '70', '80', '100', '120']), keywords: ['بطارية'] },
  { label: 'فحص البطارية والشحن', image: `${IMG}/battery-check.webp`, tone: 'teal', hint: 'فولتية وشحن' },
  { label: 'فحص وتصليح دينمو', image: `${IMG}/alternator.webp`, tone: 'amber', hint: 'شحن السيارة' },
  { label: 'تصليح سلف', image: `${IMG}/starter.webp`, tone: 'slate', hint: 'تشغيل المحرك' },
  { label: 'تبديل حساس', image: `${IMG}/sensor.webp`, tone: 'sky', hint: 'حساسات السيارة', detail: text('نوع الحساس', 'مثلاً أوكسجين أو حرارة', 'حساس أوكسجين'), keywords: ['حساس'] },
  { label: 'تصليح إنارة', image: `${IMG}/headlight.webp`, tone: 'violet', hint: 'مصابيح وأسلاك' },
  { label: 'تبديل فيوز', image: `${IMG}/fuse.webp`, tone: 'rose', hint: 'كهرباء داخلية', keywords: ['فيوز'] },
]

const MECHANIC = [
  { label: 'تبديل بريك (تيل)', image: `${IMG}/brake-replace-exact.webp`, tone: 'rose', hint: 'أمان الفرامل', detail: choice('الموضع', 'أي عجلات', FRONT_REAR), keywords: ['بريك', 'فرامل', 'تيل'] },
  { label: 'تبديل جامبين', image: `${IMG}/shock.webp`, tone: 'slate', hint: 'تعليق السيارة', detail: choice('الموضع', 'أي عجلات', FRONT_REAR), keywords: ['جامبين'] },
  { label: 'تبديل مقص', image: `${IMG}/control-arm.webp`, tone: 'amber', hint: 'أذرع التعليق', detail: choice('الموضع', 'أي عجلات', FRONT_REAR), keywords: ['مقص'] },
  { label: 'تبديل سير', image: `${IMG}/engine-belt.webp`, tone: 'cyan', hint: 'سيور المحرك', detail: choice('نوع السير', '', ['سير مكينة', 'سير تايمن']), keywords: ['سير'] },
  { label: 'تبديل مضخة ماء', image: `${IMG}/water-pump.webp`, tone: 'blue', hint: 'تبريد المحرك', keywords: ['مضخة ماء', 'طرمبة ماء'] },
  { label: 'تبديل ماء الرديتر', image: `${IMG}/radiator-coolant-exact.webp`, tone: 'sky', hint: 'سائل التبريد', keywords: ['ماء رديتر', 'رديتر'] },
  { label: 'تصليح رديتر', image: `${IMG}/radiator.webp`, tone: 'teal', hint: 'نظام التبريد' },
  { label: 'تبديل بواجي', image: `${IMG}/spark-plug.webp`, tone: 'fuchsia', hint: 'إشعال المحرك', keywords: ['بواجي', 'شمعات'] },
  { label: 'فحص عام', image: `${IMG}/inspection.webp`, tone: 'emerald', hint: 'كشف ميكانيكي' },
]

const AC = [
  { label: 'تعبئة غاز مكيف', image: `${IMG}/ac-gas-exact.webp`, tone: 'cyan', hint: 'تبريد أفضل', detail: choice('نوع الغاز', '', ['R134a', 'R1234yf', 'R12']), keywords: (gas) => [gas, 'غاز مكيف', 'فريون'] },
  { label: 'فحص تهريب مكيف', image: `${IMG}/ac-leak-exact.webp`, tone: 'sky', hint: 'كشف تسريب' },
  { label: 'تبديل كمبروسر', image: `${IMG}/ac-compressor-exact.webp`, tone: 'violet', hint: 'ضاغط المكيف', keywords: ['كمبروسر'] },
  { label: 'تبديل فلتر مكيف', image: `${IMG}/ac-filter.webp`, tone: 'emerald', hint: 'هواء المقصورة', keywords: ['فلتر مكيف'] },
  { label: 'تنظيف الثلاجة (المبخّر)', image: `${IMG}/ac-evaporator-exact.webp`, tone: 'teal', hint: 'تنظيف داخلي' },
  { label: 'تصليح مروحة التبريد', image: `${IMG}/fan.webp`, tone: 'amber', hint: 'مروحة المكيف والرديتر' },
]

const BODY_PAINT = [
  { label: 'صبغ قطعة', image: `${IMG}/paint-spray.webp`, tone: 'rose', hint: 'دهان موضعي', detail: choice('القطعة', '', PANELS) },
  { label: 'سمكرة ضربة', image: `${IMG}/dent-repair.webp`, tone: 'slate', hint: 'تعديل الهيكل', detail: choice('القطعة', '', PANELS) },
  { label: 'تلميع', image: `${IMG}/polisher.webp`, tone: 'amber', hint: 'لمعان الطلاء' },
  { label: 'بولش خدوش', image: `${IMG}/scratch-polish.webp`, tone: 'cyan', hint: 'إزالة آثار', detail: choice('القطعة', '', PANELS) },
  { label: 'حماية طلاء', image: `${IMG}/paint-protection.webp`, tone: 'teal', hint: 'طبقة حماية' },
]

export const SERVICE_TEMPLATES = {
  quick_service: OIL_CHANGE,
  tires: TIRES,
  wash: WASH,
  electrical: ELECTRICAL,
  mechanic: MECHANIC,
  ac: AC,
  body_paint: BODY_PAINT,
  parts_store: [], // sells products from stock, not services: see ProductSale
}

/** What a template calls itself on screen: a parts store sells, every other center serves. */
export const SALE_SPECIALTIES = ['parts_store']
export const isSaleSpecialty = (specialty) => SALE_SPECIALTIES.includes(specialty)

export const TERMS = {
  service: { newLabel: 'خدمة جديدة', headline: 'خدمة سيارة', stops: ['دخلت المحطة', 'اختيار الخدمات', 'جاهزة للفاتورة', 'خرجت'], timer: 'مدة السيارة بالمحطة', add: 'إضافة الخدمة إلى الفاتورة', ticket: 'تذكرة خدمة' },
  sale: { newLabel: 'بيع جديد', headline: 'بيع قطع غيار', stops: ['بدأ البيع', 'اختيار الأصناف', 'جاهز للفاتورة', 'تم البيع'], timer: 'مدة البيع', add: 'إضافة الصنف إلى الفاتورة', ticket: 'تذكرة بيع' },
}
export const termsFor = (specialty) => (isSaleSpecialty(specialty) ? TERMS.sale : TERMS.service)
