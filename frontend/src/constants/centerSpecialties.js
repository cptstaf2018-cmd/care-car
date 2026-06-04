export const CENTER_SPECIALTIES = [
  {
    value: 'quick_service',
    label: 'صيانة سريعة وزيوت',
    description: 'زيوت، فلاتر، بواجي، رديتر، بطارية',
  },
  {
    value: 'tires',
    label: 'مركز إطارات',
    description: 'تبديل إطارات، رقعة، ترصيص، ميزان، نيتروجين',
  },
  {
    value: 'wash',
    label: 'غسيل وعناية',
    description: 'غسيل، بولش، تنظيف داخلي، نانو، تعقيم',
  },
  {
    value: 'electrical',
    label: 'كهرباء سيارات',
    description: 'فحص كمبيوتر، بطارية، دينمو، سلف، حساسات',
  },
  {
    value: 'mechanic',
    label: 'ميكانيك',
    description: 'بريك، مقصات، جامبين، سير، مضخة ماء',
  },
  {
    value: 'ac',
    label: 'تكييف سيارات',
    description: 'غاز، تهريب، كمبروسر، فلتر مكيف',
  },
  {
    value: 'body_paint',
    label: 'سمكرة وصبغ',
    description: 'صبغ قطعة، تعديل ضربة، تلميع، بولش',
  },
]

export const DEFAULT_CENTER_SPECIALTY = 'quick_service'

export const getSpecialtyLabel = (value) => (
  CENTER_SPECIALTIES.find(item => item.value === value)?.label
  || CENTER_SPECIALTIES.find(item => item.value === DEFAULT_CENTER_SPECIALTY)?.label
)
