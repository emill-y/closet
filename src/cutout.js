/* Background removal that runs entirely in the browser.
   silueta (42 MB, fetched once then cached) through onnxruntime-web — no server, nothing uploaded. */

const SIZE = 320
const MEAN = [0.485, 0.456, 0.406]
const STD = [0.229, 0.224, 0.225]
const MAX_OUT = 720

let ready = null
function load() {
  if (!ready) {
    ready = (async () => {
      const ort = await import('onnxruntime-web/wasm')
      ort.env.wasm.numThreads = 1 // no COOP/COEP headers needed
      ort.env.wasm.simd = true
      ort.env.wasm.wasmPaths = '/ort/'
      const session = await ort.InferenceSession.create('/models/u2netp.onnx', {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      })
      return { ort, session }
    })().catch((e) => { ready = null; throw e })
  }
  return ready
}
export const warmUp = () => load().catch(() => {})

function canvasOf(w, h) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

async function predict(src) {
  const { ort, session } = await load()
  const c = canvasOf(SIZE, SIZE)
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(src, 0, 0, SIZE, SIZE)
  const d = ctx.getImageData(0, 0, SIZE, SIZE).data

  let peak = 1
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] > peak) peak = d[i]
    if (d[i + 1] > peak) peak = d[i + 1]
    if (d[i + 2] > peak) peak = d[i + 2]
  }
  const n = SIZE * SIZE
  const f = new Float32Array(3 * n)
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    f[p] = (d[i] / peak - MEAN[0]) / STD[0]
    f[n + p] = (d[i + 1] / peak - MEAN[1]) / STD[1]
    f[2 * n + p] = (d[i + 2] / peak - MEAN[2]) / STD[2]
  }
  const out = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', f, [1, 3, SIZE, SIZE]) })
  const raw = out[session.outputNames[0]].data
  let lo = Infinity, hi = -Infinity
  for (let i = 0; i < raw.length; i++) { if (raw[i] < lo) lo = raw[i]; if (raw[i] > hi) hi = raw[i] }
  const span = hi - lo || 1
  const m = new Uint8ClampedArray(n * 4)
  for (let i = 0; i < n; i++) {
    const v = ((raw[i] - lo) / span) * 255
    m[i * 4] = m[i * 4 + 1] = m[i * 4 + 2] = v
    m[i * 4 + 3] = 255
  }
  const mc = canvasOf(SIZE, SIZE)
  mc.getContext('2d').putImageData(new ImageData(m, SIZE, SIZE), 0, 0)
  return mc
}

/* How unlike the photo's border each pixel is. Rescues flat-lays on a wood
   floor or a bed, where the model often sees nothing salient at all. */
function borderPrior(px, w, h) {
  const band = Math.max(3, Math.round(Math.min(w, h) * 0.05))
  const ring = []
  const sample = (x, y) => { const i = (y * w + x) * 4; ring.push([px[i], px[i + 1], px[i + 2]]) }
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < band; x++) { sample(x, y); sample(w - 1 - x, y) }
  }
  for (let x = 0; x < w; x += 2) {
    for (let y = 0; y < band; y++) { sample(x, y); sample(x, h - 1 - y) }
  }
  // a handful of representative background colours
  const K = 4
  const cents = []
  for (let k = 0; k < K; k++) cents.push(ring[Math.floor((k + 0.5) * ring.length / K)].slice())
  for (let it = 0; it < 6; it++) {
    const sums = cents.map(() => [0, 0, 0, 0])
    for (const c of ring) {
      let bi = 0, bd = Infinity
      for (let k = 0; k < K; k++) {
        const d = (c[0] - cents[k][0]) ** 2 + (c[1] - cents[k][1]) ** 2 + (c[2] - cents[k][2]) ** 2
        if (d < bd) { bd = d; bi = k }
      }
      sums[bi][0] += c[0]; sums[bi][1] += c[1]; sums[bi][2] += c[2]; sums[bi][3]++
    }
    for (let k = 0; k < K; k++) if (sums[k][3]) cents[k] = [sums[k][0] / sums[k][3], sums[k][1] / sums[k][3], sums[k][2] / sums[k][3]]
  }
  const dist = new Float32Array(w * h)
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    let bd = Infinity
    for (let k = 0; k < K; k++) {
      const d = Math.hypot(px[i] - cents[k][0], px[i + 1] - cents[k][1], px[i + 2] - cents[k][2])
      if (d < bd) bd = d
    }
    dist[p] = bd
  }
  // scale against how varied the background itself is
  const ringD = []
  for (let y = 0; y < h; y += 3) for (let x = 0; x < band; x++) ringD.push(dist[y * w + x], dist[y * w + w - 1 - x])
  ringD.sort((a, b) => a - b)
  const scale = Math.max(ringD[Math.floor(ringD.length * 0.97)] || 0, 10) * 1.6
  const out = new Float32Array(w * h)
  for (let p = 0; p < w * h; p++) out[p] = Math.min(1, dist[p] / scale)
  return out
}

/* keep the biggest blob and plug any holes inside it */
function tidy(bin, w, h) {
  const seen = new Uint8Array(w * h)
  const stack = new Int32Array(w * h)
  let best = null, bestSize = 0
  for (let s = 0; s < w * h; s++) {
    if (!bin[s] || seen[s]) continue
    let top = 0, size = 0
    stack[top++] = s; seen[s] = 1
    const blob = []
    while (top) {
      const p = stack[--top]
      blob.push(p); size++
      const x = p % w, y = (p / w) | 0
      if (x > 0 && bin[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack[top++] = p - 1 }
      if (x < w - 1 && bin[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack[top++] = p + 1 }
      if (y > 0 && bin[p - w] && !seen[p - w]) { seen[p - w] = 1; stack[top++] = p - w }
      if (y < h - 1 && bin[p + w] && !seen[p + w]) { seen[p + w] = 1; stack[top++] = p + w }
    }
    if (size > bestSize) { bestSize = size; best = blob }
  }
  const keep = new Uint8Array(w * h)
  if (!best) return keep
  for (const p of best) keep[p] = 1
  // flood the outside, so every unreached gap is an interior hole
  const outside = new Uint8Array(w * h)
  let top = 0
  const push = (p) => { if (!keep[p] && !outside[p]) { outside[p] = 1; stack[top++] = p } }
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x) }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1) }
  while (top) {
    const p = stack[--top]
    const x = p % w, y = (p / w) | 0
    if (x > 0) push(p - 1)
    if (x < w - 1) push(p + 1)
    if (y > 0) push(p - w)
    if (y < h - 1) push(p + w)
  }
  for (let p = 0; p < w * h; p++) if (!outside[p]) keep[p] = 1
  return keep
}

/**
 * Cut the garment out of a photo.
 * Returns { canvas, ar, rgb } — rgb is the garment's average colour.
 */
export async function cutOut(bitmap) {
  const scale = Math.min(1, MAX_OUT / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const maskSmall = await predict(bitmap)
  const big = canvasOf(w, h)
  const bx = big.getContext('2d', { willReadFrequently: true })
  bx.imageSmoothingQuality = 'high'
  bx.drawImage(maskSmall, 0, 0, w, h)
  const mdata = bx.getImageData(0, 0, w, h).data

  const src = canvasOf(w, h)
  const sx = src.getContext('2d', { willReadFrequently: true })
  sx.drawImage(bitmap, 0, 0, w, h)
  const img = sx.getImageData(0, 0, w, h)
  const px = img.data

  const area = w * h
  const model = new Float32Array(area)
  for (let p = 0; p < area; p++) model[p] = mdata[p * 4] / 255

  const conf = new Float32Array(area)
  const pick = (source) => {
    const covered = (t) => { let n = 0; for (let p = 0; p < area; p++) if (source[p] > t) n++; return n / area }
    let cut = 0.5
    if (covered(cut) < 0.03) cut = 0.3
    if (covered(cut) < 0.03) cut = 0.18
    const bin = new Uint8Array(area)
    for (let p = 0; p < area; p++) bin[p] = source[p] > cut ? 1 : 0
    const k = tidy(bin, w, h)
    let n = 0
    for (let p = 0; p < area; p++) if (k[p]) n++
    return { keep: k, cover: n / area }
  }

  conf.set(model)
  let { keep, cover } = pick(conf)
  if (cover < 0.05) {
    // the model latched onto nothing useful — go by how unlike the backdrop
    // each pixel is, which is what saves flat-lays on wood or bedding
    const prior = borderPrior(px, w, h)
    for (let p = 0; p < area; p++) conf[p] = Math.max(model[p] * 0.7, prior[p])
    const alt = pick(conf)
    if (alt.cover > cover) ({ keep, cover } = alt)
    else conf.set(model)
  }

  let minx = w, miny = h, maxx = -1, maxy = -1
  let r = 0, g = 0, b = 0, hits = 0
  for (let p = 0, i = 0; p < area; p++, i += 4) {
    if (!keep[p]) { px[i + 3] = 0; continue }
    // soften the rim using the model's own confidence
    px[i + 3] = Math.max(60, Math.round(conf[p] * 255))
    const x = p % w, y = (p / w) | 0
    if (x < minx) minx = x
    if (x > maxx) maxx = x
    if (y < miny) miny = y
    if (y > maxy) maxy = y
    if (conf[p] > 0.86) { r += px[i]; g += px[i + 1]; b += px[i + 2]; hits++ }
  }
  if (maxx < 0) return null
  sx.putImageData(img, 0, 0)

  const pad = 4
  minx = Math.max(0, minx - pad); miny = Math.max(0, miny - pad)
  maxx = Math.min(w - 1, maxx + pad); maxy = Math.min(h - 1, maxy + pad)
  const cw = maxx - minx + 1, ch = maxy - miny + 1
  const out = canvasOf(cw, ch)
  out.getContext('2d').drawImage(src, minx, miny, cw, ch, 0, 0, cw, ch)
  return {
    canvas: out,
    ar: +(cw / ch).toFixed(3),
    rgb: hits ? [r / hits, g / hits, b / hits] : [128, 128, 128],
  }
}
