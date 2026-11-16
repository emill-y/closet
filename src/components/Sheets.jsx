import { useEffect, useRef, useState } from 'react'
import { Chip, Dot, Icon, Sheet } from './ui'
import { COLORS, SUBS, FITS, VIBES } from '../wardrobe'
import { useStore } from '../store'
import { cutOut, warmUp } from '../cutout'

export function ItemSheet({ item, onClose, onStyle }) {
  const { favs, toggleFav, removeItem } = useStore()
  const [confirm, setConfirm] = useState(false)
  const fav = favs.includes(item.id)
  return (
    <Sheet onClose={onClose}>
      <div className="detail">
        <div className="shot"><img src={item.img} alt={item.name} /></div>
        <div className="info">
          <span className="mono">{item.cat === 'acc' ? 'accessory' : item.cat} / {item.sub}</span>
          <h2>{item.name}</h2>
          <div className="spec">
            <div><span className="mono">Colour</span><b><Dot color={item.color} /> {item.color.replace('denim', ' denim').trim()}</b></div>
            <div><span className="mono">Fit</span><b>{item.fit}</b></div>
            <div><span className="mono">Pattern</span><b>{item.pattern}</b></div>
            <div><span className="mono">Vibes</span><b>{item.vibes.join(', ')}</b></div>
          </div>
          <div className="row" style={{ justifyContent: 'flex-start', marginTop: 4 }}>
            <button className="btn primary" onClick={() => onStyle(item)}><Icon n="wand" size={15} /> Style this piece</button>
            <button className={'icon-btn heart' + (fav ? ' on' : '')} onClick={() => toggleFav(item.id)} aria-label="Love this">
              <Icon n="heart" fill={fav} />
            </button>
            <button className="icon-btn" onClick={() => (confirm ? (removeItem(item.id), onClose()) : setConfirm(true))} aria-label="Remove from closet">
              <Icon n="trash" />
            </button>
          </div>
          {confirm && <p className="hint">Tap the bin again to take it out of your closet.</p>}
        </div>
      </div>
    </Sheet>
  )
}

const CAT_OPTS = [['top', 'Top'], ['bottom', 'Bottom'], ['dress', 'Dress'], ['layer', 'Layer'], ['acc', 'Extra'], ['swim', 'Swim']]
const DEF_FIT = { top: 'regular', bottom: 'straight', dress: 'fitted', layer: 'oversized', acc: 'regular', swim: 'fitted' }
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const nearestColour = ([r, g, b]) => {
  let best = 'black', bd = Infinity
  for (const [name, hex] of Object.entries(COLORS)) {
    const [R, G, B] = hexRgb(hex)
    const d = (R - r) ** 2 + (G - g) ** 2 + (B - b) ** 2
    if (d < bd) { bd = d; best = name }
  }
  return best
}

/* If the model can't load, fall back to knocking out a plain backdrop. */
function plainBackdrop(bitmap) {
  const MAX = 640
  const sc = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * sc), h = Math.round(bitmap.height * sc)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const x = c.getContext('2d', { willReadFrequently: true })
  x.drawImage(bitmap, 0, 0, w, h)
  const d = x.getImageData(0, 0, w, h)
  const px = d.data
  const corner = (cx, cy) => { const i = (cy * w + cx) * 4; return [px[i], px[i + 1], px[i + 2]] }
  const cs = [corner(2, 2), corner(w - 3, 2), corner(2, h - 3), corner(w - 3, h - 3)]
  const bg = [0, 1, 2].map((k) => cs.reduce((s2, c2) => s2 + c2[k], 0) / 4)
  const spread = Math.max(...cs.map((c2) => Math.hypot(c2[0] - bg[0], c2[1] - bg[1], c2[2] - bg[2])))
  let minx = w, miny = h, maxx = 0, maxy = 0, hits = 0, r = 0, g = 0, b = 0
  if (spread < 46) {
    const tol = 44
    for (let i = 0, p = 0; i < px.length; i += 4, p++) {
      const dist = Math.hypot(px[i] - bg[0], px[i + 1] - bg[1], px[i + 2] - bg[2])
      if (dist < tol) { px[i + 3] = 0; continue }
      if (dist < tol * 1.7) px[i + 3] = Math.round(255 * ((dist - tol) / (tol * 0.7)))
      const cx = p % w, cy = (p / w) | 0
      if (cx < minx) minx = cx
      if (cx > maxx) maxx = cx
      if (cy < miny) miny = cy
      if (cy > maxy) maxy = cy
      hits++; r += px[i]; g += px[i + 1]; b += px[i + 2]
    }
    x.putImageData(d, 0, 0)
  }
  if (hits < w * h * 0.02) { minx = 0; miny = 0; maxx = w - 1; maxy = h - 1; hits = 0 }
  if (!hits) {
    const m = x.getImageData((w * 0.35) | 0, (h * 0.35) | 0, Math.max(1, (w * 0.3) | 0), Math.max(1, (h * 0.3) | 0)).data
    for (let i = 0; i < m.length; i += 4) { r += m[i]; g += m[i + 1]; b += m[i + 2]; hits++ }
  }
  const pad = 6
  minx = Math.max(0, minx - pad); miny = Math.max(0, miny - pad)
  maxx = Math.min(w - 1, maxx + pad); maxy = Math.min(h - 1, maxy + pad)
  const cw = maxx - minx + 1, ch = maxy - miny + 1
  const o = document.createElement('canvas')
  o.width = cw; o.height = ch
  o.getContext('2d').drawImage(c, minx, miny, cw, ch, 0, 0, cw, ch)
  return { img: o.toDataURL('image/png'), color: nearestColour([r / hits, g / hits, b / hits]), ar: +(cw / ch).toFixed(3) }
}

async function prepare(file) {
  const bitmap = await createImageBitmap(file)
  try {
    const r = await cutOut(bitmap)
    if (r) return { img: r.canvas.toDataURL('image/png'), color: nearestColour(r.rgb), ar: r.ar }
  } catch (e) {
    console.warn('cutout model unavailable, using plain-backdrop fallback', e)
  } finally {
    bitmap.close?.()
  }
  return plainBackdrop(await createImageBitmap(file))
}

export function AddSheet({ onClose, preset }) {
  const { addItem } = useStore()
  const file = useRef()
  const [queue, setQueue] = useState([])
  const [done, setDone] = useState(0)
  const [busy, setBusy] = useState('')
  const [f, setF] = useState(null)

  const blank = (p) => ({ name: preset?.name || '', cat: 'top', sub: 'tee', fit: 'regular', vibes: ['casual'], pattern: 'solid', warmth: 1, ...p })
  const pickFiles = async (e) => {
    const files = [...e.target.files]
    if (!files.length) return
    const out = []
    for (let i = 0; i < files.length; i++) {
      setBusy(files.length > 1 ? `Cutting out ${i + 1} of ${files.length}…` : 'Cutting out the background…')
      await new Promise((r) => setTimeout(r)) // let the label paint
      try { out.push(await prepare(files[i])) } catch { /* unreadable, skip */ }
    }
    setBusy('')
    if (out.length) { setQueue(out); setF(blank(out[0])) }
  }
  useEffect(() => { warmUp() }, [])
  useEffect(() => { if (queue.length && !f) setF(blank(queue[0])) }, [queue]) // eslint-disable-line

  const setCat = (cat) => setF((s) => ({ ...s, cat, sub: SUBS[cat][0], fit: DEF_FIT[cat], warmth: cat === 'layer' ? 3 : 1 }))
  const save = () => {
    addItem({ ...f, name: f.name.trim() || `New ${f.sub}` })
    setDone((d) => d + 1)
    const rest = queue.slice(1)
    setQueue(rest)
    if (rest.length) setF(blank(rest[0]))
    else { preset?.onAdded?.(); onClose() }
  }

  return (
    <Sheet onClose={onClose} narrow={!f}>
      <div className="add-body">
        <span className="mono">New in</span>
        <h2 className="serif" style={{ fontSize: 30, lineHeight: 1.05 }}>Add to the rail</h2>
        <input ref={file} type="file" accept="image/*" multiple hidden onChange={pickFiles} />
        {!f ? (
          <>
            <button className="drop" onClick={() => file.current.click()} disabled={busy}>
              <Icon n="plus" size={26} />
              <b>{busy || 'Choose photos'}</b>
              <span>One or a whole batch. The background is cut away automatically — any room, any backdrop.</span>
            </button>
            <p className="hint">Everything happens on this device — the cutout runs in your browser and nothing is uploaded.</p>
          </>
        ) : (
          <div className="add-form">
            <div className="add-top">
              <img src={f.img} alt="" />
              <div className="fields">
                {queue.length > 1 && <span className="mono">{done + 1} of {done + queue.length}</span>}
                <input className="input" placeholder="Name it (e.g. Brown leather jacket)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus />
                <div className="chips wrap">{CAT_OPTS.map(([id, l]) => <Chip key={id} active={f.cat === id} onClick={() => setCat(id)}>{l}</Chip>)}</div>
              </div>
            </div>
            <label>Type</label>
            <div className="chips wrap">{SUBS[f.cat].map((s) => <Chip key={s} active={f.sub === s} onClick={() => setF({ ...f, sub: s })}>{s}</Chip>)}</div>
            <label>Colour <small>— auto-picked, tap to fix</small></label>
            <div className="swatches">
              {Object.entries(COLORS).map(([n, hex]) => (
                <button key={n} title={n} className={'swatch' + (f.color === n ? ' on' : '')} style={{ background: hex }} onClick={() => setF({ ...f, color: n })} />
              ))}
            </div>
            <label>Fit</label>
            <div className="chips wrap">{FITS.map((s) => <Chip key={s} active={f.fit === s} onClick={() => setF({ ...f, fit: s })}>{s}</Chip>)}</div>
            <label>Vibes</label>
            <div className="chips wrap">
              {VIBES.map((v) => (
                <Chip key={v} active={f.vibes.includes(v)} onClick={() => setF({ ...f, vibes: f.vibes.includes(v) ? f.vibes.filter((x) => x !== v) : [...f.vibes, v] })}>{v}</Chip>
              ))}
            </div>
            <div className="chips wrap" style={{ marginTop: 10 }}>
              {[['solid', 'Solid'], ['graphic', 'Graphic'], ['print', 'Print']].map(([id, l]) => (
                <Chip key={id} active={f.pattern === id} onClick={() => setF({ ...f, pattern: id })}>{l}</Chip>
              ))}
              <Chip active={f.warmth === 3} onClick={() => setF({ ...f, warmth: f.warmth === 3 ? 1 : 3 })}>Warm piece</Chip>
            </div>
            <button className="btn primary big wide" style={{ marginTop: 14 }} onClick={save} disabled={!f.vibes.length}>
              <Icon n="hanger" size={15} /> Hang it up{queue.length > 1 ? ' · next' : ''}
            </button>
          </div>
        )}
      </div>
    </Sheet>
  )
}
