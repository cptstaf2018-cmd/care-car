export const CENTER_SPECIALTIES = [
  {
    value: 'quick_service',
    icon: '/service-icons-3d/auto-pack/oil-can.webp',
    label: 'مركز تبديل زيت',
    description: 'زيت المحرك، فلتر الزيت، زيت الجير والدفرنس والباور والفرامل',
  },
  {
    value: 'tires',
    icon: '/service-icons-3d/auto-pack/tire-change-exact.webp',
    label: 'مركز إطارات',
    description: 'تبديل وبيع إطارات، رقعة، ترصيص، ميزان، نيتروجين',
  },
  {
    value: 'wash',
    icon: '/service-icons-3d/auto-pack/car-wash.webp',
    label: 'غسيل وعناية',
    description: 'غسيل، بولش، تنظيف داخلي، نانو، تعقيم',
  },
  {
    value: 'electrical',
    icon: '/service-icons-3d/auto-pack/battery.webp',
    label: 'كهرباء سيارات',
    description: 'فحص كمبيوتر، بطارية، دينمو، سلف، حساسات',
  },
  {
    value: 'mechanic',
    icon: '/service-icons-3d/auto-pack/service-wrench-car.webp',
    label: 'ميكانيك',
    description: 'بريك، مقصات، جامبين، سير، مضخة ماء، رديتر، بواجي',
  },
  {
    value: 'ac',
    icon: '/service-icons-3d/auto-pack/ac-snowflake.webp',
    label: 'تكييف وتبريد السيارات',
    description: 'غاز المكيف، تهريب، كمبروسر، فلتر، ثلاجة، مروحة',
  },
  {
    value: 'parts_store',
    icon: '/service-icons-3d/auto-pack/brake-pads.webp',
    label: 'محل قطع غيار',
    description: 'بيع قطع السيارات من مخزونك: فلاتر، بطاريات، بواجي، فرامل، جامبين',
  },
  {
    value: 'body_paint',
    icon: '/service-icons-3d/auto-pack/paint-spray.webp',
    label: 'سمكرة وصبغ',
    description: 'صبغ قطعة، تعديل ضربة، تلميع، بولش',
  },
]

export const DEFAULT_CENTER_SPECIALTY = 'quick_service'

export const getSpecialtyLabel = (value) => (
  CENTER_SPECIALTIES.find(item => item.value === value)?.label
  || CENTER_SPECIALTIES.find(item => item.value === DEFAULT_CENTER_SPECIALTY)?.label
)
