export const CENTER_SPECIALTIES = [
  {
    value: 'quick_service',
    icon: '/service-icons-3d/auto-pack/oil-can.webp',
    label: 'صيانة سريعة وزيوت',
    description: 'زيوت، فلاتر، بواجي، رديتر، بطارية',
  },
  {
    value: 'tires',
    icon: '/service-icons-3d/auto-pack/tire-change-exact.webp',
    label: 'مركز إطارات',
    description: 'تبديل إطارات، رقعة، ترصيص، ميزان، نيتروجين',
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
    description: 'بريك، مقصات، جامبين، سير، مضخة ماء',
  },
  {
    value: 'ac',
    icon: '/service-icons-3d/auto-pack/ac-snowflake.webp',
    label: 'تكييف سيارات',
    description: 'غاز، تهريب، كمبروسر، فلتر مكيف',
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
