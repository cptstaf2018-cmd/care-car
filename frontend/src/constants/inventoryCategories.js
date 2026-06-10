export const STORE_CATEGORIES = [
  ['oils', 'الزيوت'],
  ['filters', 'الفلاتر'],
  ['spark', 'البلكات'],
  ['engine', 'المحرك'],
  ['transmission', 'الكير'],
  ['brakes', 'الفرامل'],
  ['cooling', 'التبريد'],
  ['electrical', 'الكهرباء'],
  ['tires', 'الإطارات'],
  ['accessories', 'الإكسسوارات'],
]

export const STORE_CATEGORIES_BY_SPECIALTY = {
  ac: [
    ['gas_freon', 'غاز / فريون'],
    ['compressors', 'كومبروسرات'],
    ['ac_filters', 'فلاتر مكيف'],
    ['hoses_pipes', 'خراطيم ومواسير'],
    ['fans', 'مراوح'],
    ['accessories', 'إكسسوارات'],
  ],
  tires: [
    ['tires', 'إطارات'],
    ['valves', 'بلف وصمامات'],
    ['balance_weights', 'أوزان ترصيص'],
    ['nitrogen', 'نيتروجين'],
    ['accessories', 'إكسسوارات'],
  ],
  wash: [
    ['wash_supplies', 'مواد غسيل'],
    ['wax_polish', 'شمع وبولش'],
    ['nano_ceramic', 'نانو سيراميك'],
    ['fresheners', 'معطرات وتعقيم'],
    ['accessories', 'إكسسوارات'],
  ],
  electrical: [
    ['batteries', 'بطاريات'],
    ['sensors', 'حساسات'],
    ['fuses_wires', 'فيوزات وأسلاك'],
    ['lighting', 'إنارة'],
    ['alternators_starters', 'دينمو وسلف'],
    ['accessories', 'إكسسوارات'],
  ],
  mechanic: [
    ['brakes', 'فرامل'],
    ['suspension', 'تعليق (جمبات/مقص)'],
    ['belts_pumps', 'سيور ومضخات'],
    ['cooling_radiators', 'تبريد ورديترات'],
    ['oils_filters', 'زيوت وفلاتر'],
    ['accessories', 'إكسسوارات'],
  ],
  body_paint: [
    ['paint_materials', 'مواد صبغ'],
    ['putty_bodywork', 'معجون وسمكرة'],
    ['polishing', 'تلميع وبولش'],
    ['paint_protection', 'حماية طلاء'],
    ['accessories', 'إكسسوارات'],
  ],
}

export const getStoreCategories = specialty =>
  STORE_CATEGORIES_BY_SPECIALTY[specialty] || STORE_CATEGORIES
