#!/usr/bin/env node
/**
 * Fetches gruppen.js from GitHub and writes contacts.json using the same schema.
 * Run before build: node scripts/fetch-contacts.js
 */
import { writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../public/data/contacts.json')
const VERSION_FILE = join(__dirname, '../public/version.json')

const SOURCE_URL =
  'https://raw.githubusercontent.com/Snap252/gru-su/refs/heads/master/docs/gruppen.js'

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

/** @type {import('../src/types').Gruppe[]} */
const gruppen = JSON.parse(arrayText.slice(0, end))

writeFileSync(OUT, JSON.stringify(gruppen))
console.log(`Wrote ${gruppen.length} Funkgruppen to ${OUT}`)

// Sync dataVersion in version.json from gruppen_version in the source file
const versionMatch = text.match(/const gruppen_version\s*=\s*"([^"]+)"/)
if (versionMatch) {
  const grVersion = versionMatch[1]
  const dataVersion = `gruppen-${grVersion}`
  const versionJson = JSON.parse(readFileSync(VERSION_FILE, 'utf8'))
  if (versionJson.dataVersion !== dataVersion) {
    versionJson.dataVersion = dataVersion
    writeFileSync(VERSION_FILE, JSON.stringify(versionJson, null, 2) + '\n')
    console.log(`dataVersion → ${dataVersion}`)
  } else {
    console.log(`dataVersion unchanged (${dataVersion})`)
  }
}
