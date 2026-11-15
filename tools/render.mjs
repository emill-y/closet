// Pre-renders every seed garment to public/wardrobe/gen. Usage: npx vite (in another shell), then node tools/render.mjs [ids]
import { chromium } from 'playwright-core'
import fs from 'node:fs'
const ids = process.argv[2] ? process.argv[2].split(',') : null
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const p = await b.newPage()
p.on('pageerror', (e) => console.log('ERR', String(e)))
await p.goto('http://localhost:5173/tools/render.html')
await p.waitForFunction('window.ready')
const out = await p.evaluate((ids) => window.renderAll(ids), ids)
for (const [id, url] of Object.entries(out)) fs.writeFileSync(`public/wardrobe/gen/${id}.png`, Buffer.from(url.split(',')[1], 'base64'))
console.log('rendered', Object.keys(out).length)
await b.close()
