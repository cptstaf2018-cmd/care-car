const PROVINCES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'اربيل', 'السليمانية', 'دهوك', 'النجف', 'كربلاء', 'بابل', 'الأنبار', 'الانبار',
  'ديالى', 'صلاح الدين', 'كركوك', 'واسط', 'ذي قار', 'ميسان', 'المثنى', 'القادسية', 'حلبجة',
]

/** Split "بغداد 45218 ب" into the province and the rest; plates without a known province stay whole. */
export function splitPlate(plate) {
  const text = String(plate || '').trim().replace(/\s+/g, ' ')
  const province = PROVINCES.find((p) => text.startsWith(`${p} `) || text === p)
  if (!province) return { province: '', main: text }
  return { province, main: text.slice(province.length).trim() }
}
