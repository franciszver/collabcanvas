#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const file = path.resolve(process.cwd(), 'src/version.ts')
const src = fs.readFileSync(file, 'utf8')
const match = src.match(/APP_VERSION\s*=\s*'([0-9]+)\.([0-9]+)\.([0-9]+)'/)
if (!match) {
  console.error('Could not find APP_VERSION in src/version.ts')
  process.exit(1)
}
const major = parseInt(match[1], 10)
const minor = parseInt(match[2], 10)
const patch = parseInt(match[3], 10) + 1
const next = `${major}.${minor}.${patch}`
const updated = src.replace(/APP_VERSION\s*=\s*'[^']+'/, `APP_VERSION = '${next}'`)
fs.writeFileSync(file, updated, 'utf8')
console.log(`Bumped APP_VERSION to ${next}`)
