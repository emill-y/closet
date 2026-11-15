// Draws a clean garment cut-out on a 600×800 canvas from a spec:
//   { t: template, c: '#hex', ...options, tex: {x,y,w,h}, gfx: {x,y,w,h,dw,dx,dy} }
// tex / gfx are fractions of the source photo: tex tiles real fabric (prints),
// gfx lifts the real graphic off the photo and places it on the chest.
export const GW = 600, GH = 800
const CX = 300, TOPY = 70, WAISTY = 40

const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 }
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})` }

// ---------- silhouettes ----------
function rounded(pts) { // pts: [x, y, r]
  const p = new Path2D(), n = pts.length
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  p.moveTo(...mid(pts[n - 1], pts[0]))
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; p.arcTo(a[0], a[1], ...mid(a, b), a[2] ?? 14) }
  p.closePath()
  return p
}
const mirror = (L) => [...L, ...L.slice().reverse().map(([x, y, r]) => [2 * CX - x, y, r])]

function topShape(o) {
  const { sh = 150, bw = 138, bh = bw, len = 470, sl = 105, sw = 92, a = 30, nw = 50, slope = 22, ah = 108 } = o
  const rad = (a * Math.PI) / 180, SL = [CX - sh, TOPY + slope], ap = TOPY + slope + ah
  const L = [[CX - nw, TOPY, 4], [SL[0], SL[1], 24], [CX - bw, SL[1] + 70, 40], [CX - bh, len, 16]]
  const sleeves = []
  if (sl > 0) for (const s of [1, -1]) {
    const x = (dx) => CX + s * dx
    const co = [x(-sh - Math.sin(rad) * sl), SL[1] + Math.cos(rad) * sl]
    const ci = [co[0] + s * Math.cos(rad) * sw, co[1] + Math.sin(rad) * sw]
    const pts = [[x(-sh + 34), SL[1] - 7, 6], [x(-sh), SL[1], 24], [co[0], co[1], 9], [ci[0], ci[1], 9], [x(-bw + (sl > 200 ? 40 : 30)), ap, 10]]
    sleeves.push({ s, path: rounded(pts), co, ci, mid: [(co[0] + ci[0]) / 2, (co[1] + ci[1]) / 2], top: [x(-sh + 20), SL[1] + 30] })
  }
  return { path: rounded(mirror(L)), sleeves, ap, o: { sh, bw, bh, len, sl, sw, a, nw, slope, ah } }
}

function tankShape(o) {
  const { so = 96, si = 58, ahy = 205, bw = 124, bh = bw, len = 460, nd = 92, straight = false } = o
  const p = new Path2D()
  p.moveTo(CX - so, TOPY)
  p.quadraticCurveTo(CX - so + 4, ahy - 30, CX - bw, ahy)
  p.lineTo(CX - bh, len - 10); p.quadraticCurveTo(CX - bh, len, CX - bh + 12, len)
  p.quadraticCurveTo(CX, len + 8, CX + bh - 12, len); p.quadraticCurveTo(CX + bh, len, CX + bh, len - 10)
  p.lineTo(CX + bw, ahy)
  p.quadraticCurveTo(CX + so - 4, ahy - 30, CX + so, TOPY)
  p.lineTo(CX + si, TOPY)
  if (straight) { p.lineTo(CX + si - 2, TOPY + nd - 8); p.quadraticCurveTo(CX, TOPY + nd + 14, CX - si + 2, TOPY + nd - 8) }
  else p.bezierCurveTo(CX + si, TOPY + nd * 1.25, CX - si, TOPY + nd * 1.25, CX - si, TOPY)
  p.closePath()
  return { path: p, o: { so, si, ahy, bw, bh, len, nd } }
}

function pantsShape(o) {
  const { ww = 108, hw = 128, len = 630, ko = 118, ki = 16, ho = 126, hi = 18, rise = 185 } = o
  const L = [[CX - ww, WAISTY, 6], [CX - hw, WAISTY + 120, 70]]
  if (len > 400) L.push([CX - ko, WAISTY + 350, 120])
  L.push([CX - ho, len, 8], [CX - hi, len, 8])
  if (len > 400) L.push([CX - ki, WAISTY + 350, 120])
  L.push([CX - 2, WAISTY + rise, 6])
  return { path: rounded(mirror(L)), o: { ww, hw, len, ko, ki, ho, hi, rise } }
}

const TOPS = {
  tee: {}, 'tee-over': { sh: 166, bw: 158, len: 505, sl: 125, sw: 104, a: 26 },
  baby: { sh: 126, bw: 116, len: 335, sl: 68, sw: 70, a: 34, nw: 52 }, crop: { sh: 148, bw: 142, len: 322, sl: 92, sw: 88, a: 30 },
  puff: { sh: 132, bw: 112, len: 318, sl: 84, sw: 96, a: 40, nw: 62 },
  ls: { sh: 145, bw: 134, len: 462, sl: 350, sw: 60, a: 9 }, 'ls-fit': { sh: 132, bw: 118, len: 452, sl: 345, sw: 50, a: 9, nw: 60 },
  blouse: { sh: 138, bw: 124, len: 318, sl: 325, sw: 84, a: 12, nw: 66 },
  sweater: { sh: 156, bw: 150, len: 452, sl: 345, sw: 70, a: 9, nw: 54 }, crew: { sh: 166, bw: 160, len: 468, sl: 348, sw: 74, a: 8, nw: 54 },
  hoodie: { sh: 168, bw: 162, len: 482, sl: 350, sw: 76, a: 8, nw: 56 }, fleece: { sh: 166, bw: 160, len: 470, sl: 348, sw: 76, a: 8, nw: 50 },
  jacket: { sh: 160, bw: 150, len: 472, sl: 350, sw: 68, a: 9, nw: 50 }, puffer: { sh: 172, bw: 168, len: 500, sl: 350, sw: 88, a: 8, nw: 54 },
  blazer: { sh: 162, bw: 148, bh: 152, len: 560, sl: 352, sw: 66, a: 8, nw: 46, slope: 18 }, shirt: { sh: 158, bw: 150, len: 545, sl: 350, sw: 66, a: 9, nw: 46 },
  teedress: { sh: 136, bw: 118, bh: 124, len: 640, sl: 78, sw: 76, a: 32 }, wrapdress: { sh: 138, bw: 116, bh: 150, len: 620, sl: 82, sw: 78, a: 32, nw: 56 },
  rash: { sh: 132, bw: 116, len: 440, sl: 345, sw: 48, a: 9, nw: 48 },
}
const TANKS = {
  tank: {}, cami: { so: 74, si: 66, ahy: 168, bw: 112, bh: 118, len: 400, nd: 96, straight: true }, 'cami-crop': { so: 78, si: 70, ahy: 172, bw: 112, len: 300, nd: 100, straight: true },
  babydoll: { so: 72, si: 64, ahy: 168, bw: 106, bh: 150, len: 420, nd: 96, straight: true },
  slip: { so: 70, si: 62, ahy: 172, bw: 110, bh: 132, len: 640, nd: 100, straight: true }, cowl: { so: 72, si: 64, ahy: 172, bw: 112, bh: 126, len: 600, nd: 110 },
  sundress: { so: 72, si: 64, ahy: 170, bw: 106, bh: 190, len: 665, nd: 104 }, maxi: { so: 70, si: 62, ahy: 170, bw: 104, bh: 200, len: 782, nd: 108 },
  onepiece: { so: 78, si: 56, ahy: 190, bw: 108, bh: 60, len: 470, nd: 110 },
}
const PANTS = {
  straight: {}, fitted: { hw: 122, ko: 96, ki: 20, ho: 88, hi: 26 }, flare: { hw: 124, ko: 100, ki: 18, ho: 158, hi: 8 },
  wide: { hw: 134, ko: 152, ki: 10, ho: 176, hi: 8 }, relaxed: { hw: 134, ko: 134, ki: 12, ho: 112, hi: 30 },
  shorts: { hw: 132, len: 262, ho: 140, hi: 14, rise: 178 }, skort: { hw: 130, len: 250, ho: 160, hi: 2, rise: 205 },
}

// ---------- drawing helpers ----------
function stroke(ctx, pts, style, w = 2, dash) {
  ctx.save(); ctx.strokeStyle = style; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  if (dash) ctx.setLineDash(dash)
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) { const p = pts[i]; p.length === 4 ? ctx.quadraticCurveTo(p[0], p[1], p[2], p[3]) : ctx.lineTo(p[0], p[1]) }
  ctx.stroke(); ctx.restore()
}
const both = (fn) => { fn(1); fn(-1) }
const X = (s, dx) => CX + s * dx

function texturePattern(ctx, img, r) {
  const sw = r.w * img.width, sh = r.h * img.height, k = (r.scale || 150) / sw
  const tw = Math.round(sw * k), th = Math.round(sh * k)
  const c = document.createElement('canvas'); c.width = tw * 2; c.height = th * 2
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'
  for (const [fx, fy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    x.save(); x.translate(fx < 0 ? tw * 2 : 0, fy < 0 ? th * 2 : 0); x.scale(fx, fy)
    x.drawImage(img, r.x * img.width, r.y * img.height, sw, sh, 0, 0, tw, th); x.restore()
  }
  return ctx.createPattern(c, 'repeat')
}

function borderColor(img, r) { // colour of the plain fabric just under the graphic
  const [sx, sy] = r.s || [r.x + r.w / 2, Math.min(r.y + r.h + 0.05, 0.95)]
  const c = document.createElement('canvas'); c.width = c.height = 16
  const x = c.getContext('2d'); x.drawImage(img, (sx - 0.04) * img.width, (sy - 0.03) * img.height, 0.08 * img.width, 0.06 * img.height, 0, 0, 16, 16)
  const d = x.getImageData(0, 0, 16, 16).data, R = [], G = [], B = []
  for (let k = 0; k < d.length; k += 4) { R.push(d[k]); G.push(d[k + 1]); B.push(d[k + 2]) }
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1]
  return '#' + [med(R), med(G), med(B)].map((v) => v.toString(16).padStart(2, '0')).join('')
}

// Lift the graphic off the photo. With g.key the plain fabric around the print is
// keyed out (so only the ink transfers) and its colour becomes the garment colour.
function prepGraphic(img, g) {
  const dw = g.dw || 200, dh = dw * (g.h * img.height) / (g.w * img.width)
  const c = document.createElement('canvas'); c.width = Math.round(dw); c.height = Math.round(dh)
  const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high'
  x.drawImage(img, g.x * img.width, g.y * img.height, g.w * img.width, g.h * img.height, 0, 0, c.width, c.height)
  let color = borderColor(img, g)
  if (g.key) {
    const im = x.getImageData(0, 0, c.width, c.height), d = im.data, R = [], G = [], B = []
    for (let k = 0; k < d.length; k += 16) { R.push(d[k]); G.push(d[k + 1]); B.push(d[k + 2]) }
    const med = (a) => a.sort((p, q) => p - q)[a.length >> 1], m = [med(R), med(G), med(B)]
    const t0 = g.key === 1 ? 30 : g.key, t1 = t0 + 45
    if (g.key !== 'c') for (let k = 0; k < d.length; k += 4) {
      const dist = Math.hypot(d[k] - m[0], d[k + 1] - m[1], d[k + 2] - m[2])
      d[k + 3] = Math.max(0, Math.min(1, (dist - t0) / (t1 - t0))) * 255
    }
    if (g.key !== 'c') x.putImageData(im, 0, 0)
    color = '#' + m.map((v) => v.toString(16).padStart(2, '0')).join('')
  }
  const f = Math.min(dw, dh) * (g.feather ?? 0.16)
  x.globalCompositeOperation = 'destination-in'; x.filter = `blur(${f / 2}px)`
  x.fillStyle = '#000'; x.beginPath(); x.roundRect(f, f, c.width - 2 * f, c.height - 2 * f, f); x.fill()
  return { canvas: c, color, x: CX + (g.dx || 0) - dw / 2, y: (g.dy || 250) - dh / 2 }
}

// ---------- main ----------
export function drawGarment(canvas, spec, photo) {
  canvas.width = GW; canvas.height = GH
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, GW, GH)
  let c = spec.c || '#888888'
  const gfx = spec.gfx && photo ? prepGraphic(photo, spec.gfx) : null
  if (gfx && !spec.keepColor) c = gfx.color
  if (c.startsWith('rgb')) c = '#888888'
  const dark = lum(c) < 0.32
  const ink = (a) => (dark ? `rgba(255,255,255,${a * 0.75})` : `rgba(0,0,0,${a})`)
  const t = spec.t
  let S, kind
  if (TOPS[t]) { S = topShape({ ...TOPS[t], ...spec }); kind = 'top' }
  else if (TANKS[t]) { S = tankShape({ ...TANKS[t], ...spec }); kind = 'tank' }
  else if (PANTS[t]) { S = pantsShape({ ...PANTS[t], ...spec }); kind = 'pants' }
  else { S = extraShape(t, spec); kind = 'extra' }
  const path = S.path, o = S.o || {}

  // hood sits behind the body
  if (spec.hood) {
    const h = new Path2D(); h.moveTo(CX - 92, TOPY + 44)
    h.bezierCurveTo(CX - 120, TOPY - 40, CX - 50, TOPY - 62, CX, TOPY - 60); h.bezierCurveTo(CX + 50, TOPY - 62, CX + 120, TOPY - 40, CX + 92, TOPY + 44); h.closePath()
    ctx.fillStyle = shade(c, -0.12); ctx.fill(h); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5; ctx.stroke(h)
    const hi = new Path2D(); hi.ellipse(CX, TOPY + 8, 58, 46, 0, 0, Math.PI * 2); ctx.fillStyle = shade(c, -0.45); ctx.fill(hi)
  }
  if (spec.collar === 'stand') { // jacket / puffer / fleece collar behind
    const h = new Path2D(); h.roundRect(CX - o.nw - 14, TOPY - 44, (o.nw + 14) * 2, 70, 18)
    ctx.fillStyle = shade(c, -0.1); ctx.fill(h); ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.stroke(h)
    const inn = new Path2D(); inn.ellipse(CX, TOPY - 8, o.nw - 4, 26, 0, 0, Math.PI * 2); ctx.fillStyle = shade(c, -0.5); ctx.fill(inn)
  }

  ctx.save(); ctx.clip(path)
  // base fabric
  ctx.fillStyle = c; ctx.fillRect(0, 0, GW, GH)
  if (spec.tex && photo) {
    ctx.fillStyle = texturePattern(ctx, photo, spec.tex)
    if (spec.texOnly === 'sleeves') { ctx.fillRect(0, 0, CX - o.bw + 4, GH); ctx.fillRect(CX + o.bw - 4, 0, GW, GH) } else ctx.fillRect(0, 0, GW, GH)
  }
  if (spec.c2 && spec.split) { ctx.fillStyle = spec.c2; ctx.fillRect(0, spec.split, GW, GH) }
  if (spec.yoke) { ctx.fillStyle = spec.yoke; ctx.fillRect(0, 0, GW, TOPY + 62) }
  if (gfx) ctx.drawImage(gfx.canvas, gfx.x, gfx.y)

  // fabric character
  if (spec.knit) for (let x = 60; x < 540; x += 7) stroke(ctx, [[x, 0], [x, GH]], ink(0.05), 1.2)
  if (spec.cable) for (const dx of [-70, 0, 70]) for (let y = TOPY + 40; y < o.len - 30; y += 26) { stroke(ctx, [[CX + dx - 12, y], [CX + dx, y + 13, CX + dx + 12, y]], ink(0.13), 2); stroke(ctx, [[CX + dx - 12, y + 13], [CX + dx, y + 26, CX + dx + 12, y + 13]], ink(0.07), 2) }
  if (spec.quilt) for (let y = TOPY + 60; y < o.len; y += 54) {
    const g = ctx.createLinearGradient(0, y - 54, 0, y); g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.2)')
    ctx.fillStyle = g; ctx.fillRect(0, y - 54, GW, 54); stroke(ctx, [[0, y], [GW, y]], 'rgba(0,0,0,.28)', 1.6)
  }
  if (spec.fuzzy || spec.denim || spec.velvet) {
    const n = spec.fuzzy ? 5200 : 2600
    for (let i = 0; i < n; i++) { const x = Math.random() * GW, y = Math.random() * GH; ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'; ctx.fillRect(x, y, spec.fuzzy ? 3 : 1.4, spec.fuzzy ? 3 : 2.4) }
  }
  if (spec.satin) { const g = ctx.createLinearGradient(120, 0, 480, 500); g.addColorStop(0.2, 'rgba(255,255,255,0)'); g.addColorStop(0.42, 'rgba(255,255,255,.3)'); g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(0.8, 'rgba(255,255,255,.16)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, GW, GH) }

  const trim = spec.trim || null
  if (kind === 'top') detailTop(ctx, S, spec, c, ink, trim)
  if (kind === 'tank') detailTank(ctx, S, spec, c, ink, trim)
  if (kind === 'pants') detailPants(ctx, S, spec, c, ink)
  if (kind === 'extra' && S.detail) S.detail(ctx, ink)

  // volume: darker edges, soft folds, a touch of light down the middle
  const body = kind === 'pants' ? o.hw + 30 : (o.bw || 140) + 10
  const g = ctx.createLinearGradient(CX - body, 0, CX + body, 0)
  g.addColorStop(0, 'rgba(0,0,0,.26)'); g.addColorStop(0.18, 'rgba(0,0,0,.05)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(0.82, 'rgba(0,0,0,.06)'); g.addColorStop(1, 'rgba(0,0,0,.28)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, GW, GH)
  const hl = ctx.createLinearGradient(CX - body, 0, CX + body, 0)
  hl.addColorStop(0.25, 'rgba(255,255,255,0)'); hl.addColorStop(0.42, `rgba(255,255,255,${dark ? 0.1 : 0.14})`); hl.addColorStop(0.6, 'rgba(255,255,255,0)')
  ctx.fillStyle = hl; ctx.fillRect(0, 0, GW, GH)
  const v = ctx.createLinearGradient(0, 0, 0, GH); v.addColorStop(0, 'rgba(255,255,255,.06)'); v.addColorStop(1, 'rgba(0,0,0,.12)'); ctx.fillStyle = v; ctx.fillRect(0, 0, GW, GH)
  ctx.filter = 'blur(7px)'
  const fold = dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.1)'
  if (kind === 'top') both((s) => { stroke(ctx, [[X(s, -o.bw + 6), S.ap + 6], [X(s, -o.bw + 46), S.ap + 90, X(s, -o.bw + 30), o.len - 30]], fold, 12); if (!spec.gfx) stroke(ctx, [[X(s, -40), TOPY + 60], [X(s, -70), 300, X(s, -50), o.len]], fold, 9) })
  if (kind === 'tank') both((s) => stroke(ctx, [[X(s, -o.bw + 14), o.ahy + 20], [X(s, -o.bw + 44), o.ahy + 120, X(s, -o.bh + 34), o.len - 20]], fold, 11))
  if (kind === 'pants') both((s) => { stroke(ctx, [[X(s, -o.hw * 0.5), WAISTY + 60], [X(s, -(o.ko + o.ki) / 2), WAISTY + 350, X(s, -(o.ho + o.hi) / 2), o.len]], dark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.2)', 14); stroke(ctx, [[X(s, -6), WAISTY + o.rise], [X(s, -o.ki - 14), WAISTY + 330, X(s, -o.hi - 12), o.len]], fold, 14) })
  ctx.filter = 'none'
  ctx.restore()

  const edge = dark ? 'rgba(0,0,0,.55)' : 'rgba(40,25,35,.3)'
  ctx.strokeStyle = edge; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke(path)
  for (const sv of S.sleeves || []) drawSleeve(ctx, sv, S, spec, c, ink, dark, photo, edge)
  if (t === 'onepiece') both((s) => { ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.ellipse(X(s, -128), o.len - 40, 74, 120, s * 0.5, 0, 7); ctx.fill(); ctx.restore() })
  return canvas
}

function drawSleeve(ctx, sv, S, spec, c, ink, dark, photo, edge) {
  const o = S.o, s = sv.s, rad = (o.a * Math.PI) / 180, trim = spec.trim
  const ax = [-s * Math.sin(rad), Math.cos(rad)], px = [s * Math.cos(rad), Math.sin(rad)] // along / across the sleeve
  const at = (u, v) => [sv.co[0] + ax[0] * -u + px[0] * v, sv.co[1] + ax[1] * -u + px[1] * v] // u up from cuff, v across
  ctx.save(); ctx.clip(sv.path)
  ctx.fillStyle = c; ctx.fillRect(0, 0, GW, GH)
  if (spec.tex && photo) { ctx.fillStyle = texturePattern(ctx, photo, spec.tex); ctx.fillRect(0, 0, GW, GH) }
  if (spec.yoke) { ctx.fillStyle = spec.yoke; ctx.fillRect(0, 0, GW, TOPY + 62) }
  if (spec.knit) for (let v = 4; v < o.sw + 30; v += 7) stroke(ctx, [at(-10, v), at(o.sl + 40, v)], ink(0.05), 1.2)
  if (spec.quilt) for (let u = 40; u < o.sl; u += 54) { stroke(ctx, [at(u, -10), at(u, o.sw + 40)], 'rgba(0,0,0,.28)', 1.6); stroke(ctx, [at(u + 8, -10), at(u + 8, o.sw + 40)], 'rgba(0,0,0,.08)', 9); stroke(ctx, [at(u - 30, -10), at(u - 30, o.sw + 40)], 'rgba(255,255,255,.08)', 16) }
  if (spec.fuzzy) for (let i = 0; i < 1600; i++) { ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'; ctx.fillRect(Math.random() * GW, Math.random() * GH, 3, 3) }
  const up = spec.ribbed ? 30 : 12
  if (trim && !spec.ribbed) stroke(ctx, [at(7, -10), at(7, o.sw + 30)], trim, 15)
  else stroke(ctx, [at(up, -10), at(up, o.sw + 30)], ink(0.24), 1.6)
  if (spec.ribbed) for (let v = 3; v < o.sw + 20; v += 6) stroke(ctx, [at(0, v), at(up, v)], ink(0.12), 1.2)
  if (spec.puff) for (let v = 8; v < o.sw + 20; v += 11) stroke(ctx, [at(up, v), at(up + 36, v - 3)], ink(0.16), 1.6)
  const a0 = at(0, 0), a1 = at(0, o.sw), g = ctx.createLinearGradient(a0[0], a0[1], a1[0], a1[1])
  g.addColorStop(0, 'rgba(0,0,0,.3)'); g.addColorStop(0.3, 'rgba(0,0,0,.04)'); g.addColorStop(0.5, `rgba(255,255,255,${dark ? 0.08 : 0.1})`); g.addColorStop(0.75, 'rgba(0,0,0,.05)'); g.addColorStop(1, 'rgba(0,0,0,.26)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, GW, GH)
  if (spec.satin) { const h = ctx.createLinearGradient(a0[0], a0[1], a1[0], a1[1]); h.addColorStop(0.3, 'rgba(255,255,255,0)'); h.addColorStop(0.5, 'rgba(255,255,255,.28)'); h.addColorStop(0.7, 'rgba(255,255,255,0)'); ctx.fillStyle = h; ctx.fillRect(0, 0, GW, GH) }
  ctx.restore()
  ctx.strokeStyle = edge; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke(sv.path)
}

function detailTop(ctx, S, spec, c, ink, trim) {
  const o = S.o, nd = spec.nd ?? 34, rad = (o.a * Math.PI) / 180
  const open = spec.open // blazer / shirt: front opening
  // neck opening (inside back of the garment)
  if (!open) {
    const n = new Path2D(); n.moveTo(CX - o.nw, TOPY - 2)
    n.quadraticCurveTo(CX, TOPY - 12, CX + o.nw, TOPY - 2)
    if (spec.vneck) { n.lineTo(CX, TOPY + nd); n.closePath() } else { n.bezierCurveTo(CX + o.nw, TOPY + nd * 1.3, CX - o.nw, TOPY + nd * 1.3, CX - o.nw, TOPY - 2) }
    ctx.fillStyle = shade(c, -0.42); ctx.fill(n)
    const band = spec.rib === false ? 0 : spec.knit || spec.thick ? 15 : 9
    if (band && !spec.hood && spec.collar !== 'stand') { ctx.save(); ctx.lineWidth = band; ctx.strokeStyle = trim || shade(c, lumAdj(c)); ctx.stroke(n); ctx.lineWidth = 1; ctx.strokeStyle = ink(0.2); ctx.stroke(n); ctx.restore() }
    // back neck tape
    stroke(ctx, [[CX - o.nw, TOPY - 2], [CX, TOPY - 12, CX + o.nw, TOPY - 2]], ink(0.18), 2)
  }
  // hem
  if (spec.ribbed) { stroke(ctx, [[CX - o.bh, o.len - 32], [CX + o.bh, o.len - 32]], ink(0.22), 1.6); for (let x = CX - o.bh + 4; x < CX + o.bh; x += 6) stroke(ctx, [[x, o.len - 31], [x, o.len]], ink(0.11), 1.2); if (trim) { ctx.fillStyle = trim; ctx.globalAlpha = 0.9; ctx.fillRect(0, o.len - 31, GW, 40); ctx.globalAlpha = 1 } }
  else if (!spec.open) stroke(ctx, [[CX - o.bh, o.len - 13], [CX, o.len - 9, CX + o.bh, o.len - 13]], ink(0.2), 1.4)
  if (spec.ruched) for (let y = TOPY + 60; y < o.len - 10; y += 16) stroke(ctx, [[CX - 26, y], [CX, y + 9, CX + 26, y]], ink(0.2), 1.6)
  if (spec.twist) { stroke(ctx, [[CX - 70, o.len - 60], [CX, o.len - 20, CX + 10, o.len]], ink(0.22), 2); stroke(ctx, [[CX + 70, o.len - 66], [CX + 10, o.len - 34, CX - 14, o.len]], ink(0.22), 2); stroke(ctx, [[CX, TOPY + 60], [CX, o.len - 40]], ink(0.1), 1.4) }
  if (spec.pocket) { // kangaroo pocket
    const p = new Path2D(); p.moveTo(CX - 92, o.len - 40); p.lineTo(CX - 92, o.len - 96); p.lineTo(CX - 62, o.len - 138); p.lineTo(CX + 62, o.len - 138); p.lineTo(CX + 92, o.len - 96); p.lineTo(CX + 92, o.len - 40)
    ctx.strokeStyle = ink(0.24); ctx.lineWidth = 1.8; ctx.stroke(p)
  }
  if (spec.hood) { both((s) => stroke(ctx, [[X(s, -18), TOPY + 34], [X(s, -22), TOPY + 150]], shade(c, 0.5), 3.5)); stroke(ctx, [[CX - o.nw - 6, TOPY + 30], [CX, TOPY + 62, CX + o.nw + 6, TOPY + 30]], ink(0.25), 2) }
  if (spec.zip) { const end = spec.zip === 'quarter' ? TOPY + 170 : o.len; stroke(ctx, [[CX, TOPY + (spec.collar === 'stand' ? -30 : 20)], [CX, end]], ink(0.4), 3); stroke(ctx, [[CX + 5, TOPY], [CX + 5, end]], ink(0.12), 1.2); ctx.fillStyle = '#c9c9d2'; ctx.fillRect(CX - 4, TOPY + 30, 8, 16) }
  if (spec.collar === 'stand') stroke(ctx, [[CX - o.nw - 14, TOPY + 24], [CX, TOPY + 40, CX + o.nw + 14, TOPY + 24]], ink(0.25), 1.8)
  if (open === 'blazer') {
    const inn = new Path2D(); inn.moveTo(CX - o.nw + 4, TOPY - 2); inn.lineTo(CX + o.nw - 4, TOPY - 2); inn.lineTo(CX + 4, TOPY + 250); inn.lineTo(CX + 30, o.len + 10); inn.lineTo(CX - 20, o.len + 10); inn.lineTo(CX - 4, TOPY + 250); inn.closePath()
    ctx.fillStyle = shade(c, -0.55); ctx.fill(inn)
    both((s) => { const l = new Path2D(); l.moveTo(X(s, -o.nw - 4), TOPY - 4); l.lineTo(X(s, -o.nw - 44), TOPY + 96); l.lineTo(X(s, -o.nw - 14), TOPY + 108); l.lineTo(X(s, -4), TOPY + 250); l.lineTo(X(s, -o.nw + 6), TOPY - 4); l.closePath(); ctx.fillStyle = shade(c, 0.08); ctx.fill(l); ctx.strokeStyle = ink(0.35); ctx.lineWidth = 1.6; ctx.stroke(l); stroke(ctx, [[X(s, -120), TOPY + 380], [X(s, -50), TOPY + 380]], ink(0.3), 2) })
    ctx.fillStyle = ink(0.5); ctx.beginPath(); ctx.arc(CX - 18, TOPY + 300, 6, 0, 7); ctx.fill()
  }
  if (open === 'shirt') {
    stroke(ctx, [[CX - 14, TOPY + 30], [CX - 14, o.len]], ink(0.16), 1.4); stroke(ctx, [[CX + 14, TOPY + 30], [CX + 14, o.len]], ink(0.16), 1.4)
    for (let y = TOPY + 70; y < o.len - 30; y += 74) { ctx.fillStyle = ink(0.3); ctx.beginPath(); ctx.arc(CX, y, 4.5, 0, 7); ctx.fill() }
    const inn = new Path2D(); inn.moveTo(CX - o.nw, TOPY - 2); inn.lineTo(CX + o.nw, TOPY - 2); inn.lineTo(CX, TOPY + 52); inn.closePath(); ctx.fillStyle = shade(c, -0.3); ctx.fill(inn)
    both((s) => { const l = new Path2D(); l.moveTo(X(s, -o.nw - 2), TOPY - 6); l.lineTo(X(s, -o.nw - 26), TOPY + 40); l.lineTo(X(s, -8), TOPY + 66); l.lineTo(X(s, -o.nw + 14), TOPY - 2); l.closePath(); ctx.fillStyle = shade(c, 0.04); ctx.fill(l); ctx.strokeStyle = ink(0.3); ctx.lineWidth = 1.5; ctx.stroke(l) })
    stroke(ctx, [[CX - o.bh, o.len - 40], [CX - o.bh * 0.4, o.len, CX, o.len - 6]], ink(0.12), 1.4)
  }
  if (spec.wrap) { stroke(ctx, [[CX + o.nw, TOPY], [CX - 30, TOPY + 190, CX - o.bw + 6, TOPY + 250]], ink(0.3), 2); stroke(ctx, [[CX - o.nw, TOPY], [CX + 10, TOPY + 130]], ink(0.3), 2); stroke(ctx, [[CX - o.bw, TOPY + 250], [CX + o.bw, TOPY + 262]], ink(0.25), 7); for (let i = 0; i < 6; i++) stroke(ctx, [[CX - 60 + i * 26, TOPY + 266], [CX - 80 + i * 36, o.len]], ink(0.1), 2) }
}
const lumAdj = (c) => (lum(c) < 0.32 ? 0.1 : -0.07)

function detailTank(ctx, S, spec, c, ink, trim) {
  const o = S.o
  const nl = new Path2D(); nl.moveTo(CX + o.si, TOPY)
  if (TANKS[spec.t]?.straight) { nl.lineTo(CX + o.si - 2, TOPY + o.nd - 8); nl.quadraticCurveTo(CX, TOPY + o.nd + 14, CX - o.si + 2, TOPY + o.nd - 8); nl.lineTo(CX - o.si, TOPY) }
  else nl.bezierCurveTo(CX + o.si, TOPY + o.nd * 1.25, CX - o.si, TOPY + o.nd * 1.25, CX - o.si, TOPY)
  ctx.save(); ctx.lineWidth = trim ? 12 : 7; ctx.strokeStyle = trim || shade(c, lumAdj(c)); ctx.stroke(nl); ctx.restore()
  if (trim) both((s) => { ctx.save(); ctx.strokeStyle = trim; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(X(s, -o.so), TOPY); ctx.quadraticCurveTo(X(s, -o.so + 4), o.ahy - 30, X(s, -o.bw), o.ahy); ctx.stroke(); ctx.restore() })
  if (spec.hemTrim) { ctx.fillStyle = spec.hemTrim; ctx.fillRect(0, o.len - 12, GW, 30) }
  if (spec.lace) { for (let x = CX - o.bw; x < CX + o.bw; x += 12) { stroke(ctx, [[x, TOPY + o.nd + 4], [x + 6, TOPY + o.nd + 16, x + 12, TOPY + o.nd + 4]], ink(0.2), 1.3) } for (let y = TOPY + o.nd + 26; y < TOPY + o.nd + 70; y += 14) for (let x = CX - o.bw + ((y / 14) % 2) * 7; x < CX + o.bw; x += 14) { ctx.fillStyle = ink(0.09); ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill() } }
  if (spec.empire) { stroke(ctx, [[CX - o.bw - 6, o.ahy + 44], [CX, o.ahy + 54, CX + o.bw + 6, o.ahy + 44]], ink(0.25), 2); for (let i = -7; i <= 7; i++) stroke(ctx, [[CX + i * 14, o.ahy + 52], [CX + i * (o.bh / 7.4), o.len]], ink(0.07), 2) }
  if (spec.tiers) for (const y of spec.tiers) { stroke(ctx, [[0, y], [CX, y + 10, GW, y]], ink(0.22), 1.8); for (let x = 90; x < 520; x += 15) stroke(ctx, [[x, y + 4], [x + 2, y + 30]], ink(0.08), 1.6) }
  if (spec.cowlDrape) for (let i = 0; i < 4; i++) stroke(ctx, [[CX - o.si + 4, TOPY + 40 + i * 20], [CX, TOPY + 110 + i * 26, CX + o.si - 4, TOPY + 40 + i * 20]], ink(0.2), 2)
  if (spec.t !== 'onepiece' && !spec.hemTrim) stroke(ctx, [[CX - o.bh, o.len - 11], [CX, o.len - 4, CX + o.bh, o.len - 11]], ink(0.18), 1.4)
}

function detailPants(ctx, S, spec, c, ink) {
  const o = S.o, st = spec.denim ? (lum(c) > 0.45 ? 'rgba(170,120,60,.55)' : 'rgba(210,160,90,.6)') : ink(0.22)
  const wb = spec.elastic ? 34 : 28
  stroke(ctx, [[CX - o.hw, WAISTY + wb], [CX + o.hw, WAISTY + wb]], ink(0.28), 1.8)
  if (spec.elastic) { for (let x = CX - o.ww; x < CX + o.ww; x += 7) stroke(ctx, [[x, WAISTY + 2], [x, WAISTY + wb - 2]], ink(0.1), 1.2); if (spec.cord) both((s) => stroke(ctx, [[X(s, -8), WAISTY + wb - 6], [X(s, -16), WAISTY + wb + 70]], shade(c, 0.55), 3.5)) }
  else if (!spec.plain) {
    stroke(ctx, [[CX, WAISTY + wb], [CX, WAISTY + o.rise]], ink(0.2), 1.5)
    stroke(ctx, [[CX - 4, WAISTY + wb], [CX + 16, WAISTY + wb + 60, CX + 2, WAISTY + o.rise - 34]], st, 1.6)
    ctx.fillStyle = spec.denim ? '#b98b4e' : ink(0.4); ctx.beginPath(); ctx.arc(CX + 4, WAISTY + wb / 2, 5, 0, 7); ctx.fill()
    both((s) => { stroke(ctx, [[X(s, -o.ww + 10), WAISTY + wb], [X(s, -o.hw + 30), WAISTY + wb + 56, X(s, -o.hw + 2), WAISTY + wb + 70]], st, 1.6); for (const d of [-o.ww + 20, -30]) stroke(ctx, [[X(s, d), WAISTY + 2], [X(s, d), WAISTY + wb]], ink(0.25), 5) })
  } else stroke(ctx, [[CX, WAISTY + wb], [CX, WAISTY + o.rise]], ink(0.12), 1.4)
  if (o.len > 400) both((s) => {
    stroke(ctx, [[X(s, -o.hw + 3), WAISTY + 130], [X(s, -o.ko + 3), WAISTY + 350, X(s, -o.ho + 4), o.len]], spec.denim ? st : ink(0.1), 1.3)
    if (spec.crease) stroke(ctx, [[X(s, -o.hw * 0.52), WAISTY + 60], [X(s, -(o.ko + o.ki) / 2), WAISTY + 350, X(s, -(o.ho + o.hi) / 2), o.len]], ink(0.16), 1.4)
  })
  if (spec.cargo) both((s) => { const x = X(s, -o.ko - 4), y = WAISTY + 250; ctx.save(); ctx.strokeStyle = ink(0.3); ctx.lineWidth = 1.8; ctx.fillStyle = 'rgba(0,0,0,.05)'; const p = new Path2D(); p.roundRect(Math.min(x, x + s * 84), y, 84, 104, 5); ctx.fill(p); ctx.stroke(p); ctx.restore(); stroke(ctx, [[x, y + 30], [x + s * 84, y + 30]], ink(0.28), 1.8); if (spec.cargo === 2) { const p2 = new Path2D(); p2.roundRect(Math.min(x + s * 6, x + s * 80), y + 180, 74, 86, 5); ctx.strokeStyle = ink(0.26); ctx.lineWidth = 1.6; ctx.stroke(p2) } })
  if (spec.rips) for (const [s, y, w] of spec.rips) { const x = X(s, -(o.ko + o.ki) / 2); ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.42, 0, 0, 7); ctx.fill(); for (let i = -3; i <= 3; i++) stroke(ctx, [[x - w * 0.9, y + i * w * 0.11], [x, y + i * w * 0.11 + (i % 2) * 3, x + w * 0.9, y + i * w * 0.11]], 'rgba(255,255,255,.9)', 1.3); ctx.restore() }
  if (o.len > 400) { both((s) => stroke(ctx, [[X(s, -o.ho), o.len - (spec.elastic ? 26 : 14)], [X(s, -o.hi), o.len - (spec.elastic ? 26 : 14)]], spec.denim ? st : ink(0.2), 1.4)) }
  else both((s) => stroke(ctx, [[X(s, -o.ho), o.len - 16], [X(s, -o.hi), o.len - 12]], spec.denim ? st : ink(0.2), 1.4))
  if (spec.t === 'skort') for (let i = -4; i <= 4; i++) stroke(ctx, [[CX + i * 24, WAISTY + wb], [CX + i * 36, o.len]], ink(0.14), 1.6)
}

function extraShape(t, spec) {
  const p = new Path2D()
  if (t === 'beanie') {
    p.moveTo(CX - 150, 330); p.bezierCurveTo(CX - 160, 120, CX - 80, 70, CX, 70); p.bezierCurveTo(CX + 80, 70, CX + 160, 120, CX + 150, 330)
    p.lineTo(CX + 156, 410); p.quadraticCurveTo(CX, 432, CX - 156, 410); p.closePath()
    return { path: p, o: { bw: 150 }, detail: (ctx, ink) => { stroke(ctx, [[CX - 152, 322], [CX, 344, CX + 152, 322]], ink(0.35), 2.4); for (let x = CX - 150; x <= CX + 150; x += 9) stroke(ctx, [[x, 70], [x, 430]], ink(0.08), 1.6) } }
  }
  if (t === 'headband') {
    p.ellipse(CX, 230, 190, 130, 0, 0, Math.PI * 2); const h = new Path2D(); h.ellipse(CX, 214, 128, 66, 0, 0, Math.PI * 2); p.addPath(h)
    return { path: p, even: true, o: { bw: 190 }, detail: (ctx, ink) => { for (let i = 0; i < 2400; i++) { ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.05)'; ctx.fillRect(Math.random() * GW, Math.random() * 400, 3, 3) } } }
  }
  if (t === 'bikini') {
    // triangle top + bottoms
    for (const s of [1, -1]) { p.moveTo(X(s, -78), 96); p.lineTo(X(s, -150), 250); p.quadraticCurveTo(X(s, -80), 276, X(s, -10), 250); p.closePath() }
    p.moveTo(CX - 140, 400); p.lineTo(CX + 140, 400); p.lineTo(CX + 132, 440); p.quadraticCurveTo(CX + 50, 470, CX + 36, 560); p.lineTo(CX - 36, 560); p.quadraticCurveTo(CX - 50, 470, CX - 132, 440); p.closePath()
    return { path: p, o: { bw: 150 }, detail: (ctx) => { if (spec.c2) { ctx.fillStyle = spec.c2; ctx.fillRect(0, 380, GW, 300) } } , strings: true }
  }
  p.rect(150, 100, 300, 300); return { path: p, o: { bw: 150 } }
}

// strings / straps drawn outside the clipped body
export function drawExtras(canvas, spec) {
  const ctx = canvas.getContext('2d')
  if (spec.t === 'bikini') { const c = spec.c2 || spec.c; for (const s of [1, -1]) { stroke(ctx, [[X(s, -78), 98], [X(s, -40), 30, X(s, -6), 44]], c, 4); stroke(ctx, [[X(s, -150), 252], [X(s, -200), 262, X(s, -230), 300]], c, 4); stroke(ctx, [[X(s, -140), 404], [X(s, -190), 396, X(s, -206), 440]], c, 4) } stroke(ctx, [[CX - 12, 250], [CX + 12, 250]], c, 4) }
}

export function renderGarment(spec, photo) {
  const c = document.createElement('canvas')
  if (spec.t === 'headband') { // ring needs even-odd fill: draw via temp clip trick
    c.width = GW; c.height = GH; const ctx = c.getContext('2d'); const S = extraShape('headband', spec)
    ctx.save(); ctx.clip(S.path, 'evenodd'); ctx.fillStyle = spec.c; ctx.fillRect(0, 0, GW, GH); S.detail(ctx)
    const g = ctx.createLinearGradient(0, 100, 0, 360); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(0,0,0,.22)'); ctx.fillStyle = g; ctx.fillRect(0, 0, GW, GH); ctx.restore()
    ctx.strokeStyle = 'rgba(40,25,35,.3)'; ctx.lineWidth = 1.6; ctx.stroke(S.path); return c
  }
  drawGarment(c, spec, photo); drawExtras(c, spec)
  return c
}

// where the garment's top edge / hem sit, for stacking outfits and hanging
export function garmentMeta(spec) {
  const t = spec.t
  if (PANTS[t]) return { kind: 'bottom', bottom: ({ ...PANTS[t], ...spec }.len ?? 630) }
  if (TOPS[t]) return { kind: 'top', bottom: ({ ...TOPS[t], ...spec }.len ?? 470) }
  if (TANKS[t]) return { kind: 'top', bottom: ({ ...TANKS[t], ...spec }.len ?? 460) }
  return { kind: 'extra', bottom: t === 'bikini' ? 560 : 430 }
}

// sensible template for something the user adds by hand
export function specFor(item) {
  const m = {
    tee: item.fit === 'oversized' ? 'tee-over' : 'tee', 'baby tee': 'baby', 'crop tee': 'crop', 'crop top': 'puff', tank: 'tank', cami: item.fit === 'cropped' ? 'cami-crop' : 'cami',
    'long sleeve': item.fit === 'fitted' ? 'ls-fit' : 'ls', shirt: 'shirt', blouse: 'blouse', sweater: 'sweater', hoodie: 'hoodie', crewneck: 'crew', fleece: 'fleece', jacket: 'jacket', puffer: 'puffer', blazer: 'blazer',
    jeans: item.fit === 'flare' ? 'flare' : item.fit === 'wide' ? 'wide' : 'straight', pants: item.fit === 'flare' ? 'flare' : item.fit === 'wide' ? 'wide' : 'straight', cargos: 'wide', flares: 'flare', leggings: 'fitted', sweats: 'relaxed', shorts: 'shorts', skirt: 'skort',
    'mini dress': 'slip', sundress: 'sundress', 'maxi dress': 'maxi', beanie: 'beanie', headband: 'headband', bikini: 'bikini', 'one-piece': 'onepiece', 'rash guard': 'rash',
  }
  const t = m[item.sub] || 'tee'
  const extra = { sweater: { knit: 1, ribbed: 1 }, hoodie: { hood: 1, pocket: 1, ribbed: 1 }, crew: { ribbed: 1, thick: 1 }, fleece: { fuzzy: 1, collar: 'stand', zip: 'quarter' }, jacket: { collar: 'stand', zip: 1 }, puffer: { quilt: 1, collar: 'stand', zip: 1 }, blazer: { open: 'blazer' }, shirt: { open: 'shirt' }, relaxed: { elastic: 1, cord: 1 }, shorts: {}, fitted: { plain: 1 } }[t] || {}
  if (item.sub === 'jeans') extra.denim = 1
  if (item.sub === 'cargos') extra.cargo = 1
  return { t, ...extra }
}
