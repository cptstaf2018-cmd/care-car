// Fails when a center specialty has no usable template (the bug where 8 specialties showed only 7 templates).
import { existsSync } from 'node:fs'
import { CENTER_SPECIALTIES } from '../src/constants/centerSpecialties.js'
import { PARTS_CATEGORIES, SERVICE_TEMPLATES, isSaleSpecialty } from '../src/constants/serviceTemplates.js'

const problems = []
const need = (cond, msg) => { if (!cond) problems.push(msg) }
const imageExists = (url) => existsSync(new URL(`../public${url}`, import.meta.url))

for (const spec of CENTER_SPECIALTIES) {
  const sale = isSaleSpecialty(spec.value)
  const entries = sale ? PARTS_CATEGORIES : SERVICE_TEMPLATES[spec.value]
  need(Array.isArray(entries) && entries.length > 0, `${spec.value}: no template entries`)
  need(imageExists(spec.icon), `${spec.value}: specialty icon missing ${spec.icon}`)
  const labels = new Set()
  for (const item of entries || []) {
    need(item.label && !labels.has(item.label), `${spec.value}: duplicate or empty label "${item.label}"`)
    labels.add(item.label)
    need(item.image && imageExists(item.image), `${spec.value}/${item.label}: image missing ${item.image}`)
    need(item.tone, `${spec.value}/${item.label}: no tone`)
    if (!sale) need(item.hint, `${spec.value}/${item.label}: no hint`)
    if (sale) need(Array.isArray(item.keywords) && item.keywords.length > 0, `${spec.value}/${item.label}: no keywords`)
    if (item.detail) {
      need(['choice', 'text'].includes(item.detail.kind), `${spec.value}/${item.label}: bad detail kind`)
      if (item.detail.kind === 'choice') need(item.detail.options?.length > 1, `${spec.value}/${item.label}: choice needs options`)
    }
  }
  console.log(`${spec.value.padEnd(14)} ${String((entries || []).length).padStart(2)} ${sale ? 'product types' : 'services'}  (${spec.label})`)
}
console.log(`\n${CENTER_SPECIALTIES.length} specialties checked`)
if (problems.length) { console.error('\nPROBLEMS:\n- ' + problems.join('\n- ')); process.exit(1) }
console.log('all templates OK')
