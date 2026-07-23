#!/usr/bin/env node
/**
 * Fetches gruppen.js from GitHub and converts to contacts.json
 * Run before build: node scripts/fetch-contacts.js
 */
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../public/data/contacts.json')

const SOURCE_URL =
  'https://raw.githubusercontent.com/Snap252/gru-su/refs/heads/master/docs/gruppen.js'

function deriveCategory(e) {
  if (e.RTH) return 'RTH'
  if (e.THW && e.Pol) return 'Gemischt'
  if (e.THW) return 'THW'
  if (e.Pol && !e.nPol) return 'Polizei'
  if (e.nPol && !e.Pol) return 'Nicht-Polizei'
  if (e.Pol && e.nPol) return 'Gemischt'
  if (e.OA) return 'Öffentliche Ordnung'
  return 'Allgemein'
}

function deriveScope(e) {
  if (e.Bundesweit) return 'Bundesweit'
  if (e.Landesweit) return 'Landesweit'
  if (e.Kreisweit) return 'Kreisweit'
  return null
}

function deriveFlags(e) {
  return [
    e.RTH && 'RTH',
    e.THW && 'THW',
    e.Pol && 'Pol',
    e.nPol && 'nPol',
    e.OA && 'ÖA',
  ].filter(Boolean)
}

const response = await fetch(SOURCE_URL)
if (!response.ok) throw new Error(`HTTP ${response.status}`)
const text = await response.text()

// Find the JSON array that follows `const gruppen =`
// The declaration may have // line comments before the opening [
const declStart = text.indexOf('const gruppen =')
const arrayStart = text.indexOf('[', declStart)
const arrayText = text.slice(arrayStart)
let depth = 0, end = 0
for (let i = 0; i < arrayText.length; i++) {
  if (arrayText[i] === '[') depth++
  else if (arrayText[i] === ']') { if (--depth === 0) { end = i + 1; break } }
}
const gruppen = JSON.parse(arrayText.slice(0, end))

const contacts = gruppen.map((e, i) => {
  const entry = {
    id: i + 1,
    name: e.label,
    value: e.value,
    valueStr: String(e.value),
    category: deriveCategory(e),
    flags: deriveFlags(e),
  }
  const scope = deriveScope(e)
  if (scope) entry.scope = scope
  if (e.PolKW) entry.polKW = e.PolKW
  if (e.Zusatztext) entry.zusatztext = e.Zusatztext
  return entry
})

writeFileSync(OUT, JSON.stringify(contacts))
console.log(`Wrote ${contacts.length} Funkgruppen to ${OUT}`)
