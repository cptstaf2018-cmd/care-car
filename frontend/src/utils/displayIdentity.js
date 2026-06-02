export function displayUserContact(user, center) {
  if (!user) return ''
  if (user.role === 'superadmin') return user.email || ''

  const email = user.email || ''
  if (email.endsWith('@carecar.internal')) {
    return center?.whatsapp_number || center?.contact_phone || 'حساب واتساب'
  }
  if (email.endsWith('@carecar.app')) {
    return center?.whatsapp_number || center?.contact_phone || email.replace('@carecar.app', '')
  }
  return email
}
