import { useEffect, useRef, useState } from 'react'
import { Chip, Dot, Icon, Sheet } from './ui'
import { COLORS, SUBS, FITS, VIBES } from '../wardrobe'
import { useStore } from '../store'

export function ItemSheet({ item, onClose, onStyle }) {
  const { favs, toggleFav, removeItem } = useStore()
  const [confirm, setConfirm] = useState(false)
  const fav = favs.includes(item.id)
  return (
    <Sheet onClose={onClose}>
      <img className="hero-img" src={item.img} alt={item.name} />
      <span className="eyebrow">{item.sub}</span>
      <h2 className="sheet-title">{item.name}</h2>
      <div className="tags">
        <span className="pill static"><Dot color={item.color} /> {item.color.replace('denim', ' denim').trim()}</span>
        <span className="pill static">{item.fit}</span>
        {item.vibes.map((v) => <span key={v} className="pill static">{v}</span>)}
      </div>
      <div className="row">
        <button className="btn primary big" onClick={() => onStyle(item)}><Icon n="wand" size={18} /> Style this piece</button>
        <button className={'icon-btn glass lg' + (fav ? ' loved' : '')} onClick={() => toggleFav(item.id)} aria-label="Favourite"><Icon n="heart" fill={fav} /></button>
        <button className="icon-btn glass lg" onClick={() => (confirm ? (removeItem(item.id), onClose()) : setConfirm(true))} aria-label="Remove from closet"><Icon n="trash" /></button>
      </div>
      {confirm && <p className="hint">Tap the bin again to remove it from your closet.</p>}
    </Sheet>
  )
}

const CAT_OPTS = [['top', 'Top'], ['bottom', 'Bottom'], ['dress', 'Dress'], ['layer', 'Layer'], ['acc', 'Extra'], ['swim', 'Swim']]
const DEF_FIT = { top: 'regular', bottom: 'straight', dress: 'fitted', layer: 'oversized', acc: 'regular', swim: 'fitted' }
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

// centre-crop to a 480px square and guess the main colour from the middle of the photo
function prepare(file) {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(img.width, img.height), c = document.createElement('canvas')
      c.width = c.height = 480
      const x = c.getContext('2d')
      x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 480, 480)
      const d = x.getImageData(168, 168, 144, 144).data
      let r = 0, g = 0, b = 0, n = d.length / 4
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2] }
      r /= n; g /= n; b /= n
      let best = 'black', bd = 1e9
      for (const [name, hex] of Object.entries(COLORS)) {
        const [R, G, B] = hexRgb(hex), dist = (R - r) ** 2 + (G - g) ** 2 + (B - b) ** 2
        if (dist < bd) { bd = dist; best = name }
      }
      URL.revokeObjectURL(img.src)
      res({ img: c.toDataURL('image/jpeg', 0.82), color: best })
    }
    img.onerror = rej
    img.src = URL.createObjectURL(file)
  })
}

export function AddSheet({ onClose, preset }) {
  const { addItem } = useStore()
  const file = useRef()
  const [queue, setQueue] = useState([])
  const [done, setDone] = useState(0)
  const [f, setF] = useState(null)

  const blank = (p) => ({ name: preset?.name || '', cat: 'top', sub: 'tee', fit: 'regular', vibes: ['casual'], pattern: 'solid', warmth: 1, ...p })
  const pickFiles = async (e) => {
    const out = []
    for (const fl of [...e.target.files]) { try { out.push(await prepare(fl)) } catch { /* skip unreadable */ } }
    if (out.length) { setQueue(out); setF(blank(out[0])) }
  }
  useEffect(() => { if (queue.length && !f) setF(blank(queue[0])) }, [queue]) // eslint-disable-line

  const setCat = (cat) => setF((s) => ({ ...s, cat, sub: SUBS[cat][0], fit: DEF_FIT[cat], warmth: cat === 'layer' ? 3 : 1 }))
  const save = () => {
    addItem({ ...f, name: f.name.trim() || `New ${f.sub}` })
    setDone((d) => d + 1)
    const rest = queue.slice(1)
    setQueue(rest)
    if (rest.length) setF(blank(rest[0])); else { preset?.onAdded?.(); onClose() }
  }

  return (
    <Sheet onClose={onClose}>
      <span className="eyebrow">new in</span>
      <h2 className="sheet-title">Add to <em>closet</em></h2>
      <input ref={file} type="file" accept="image/*" multiple hidden onChange={pickFiles} />
      {!f ? (
        <>
          <button className="drop glass" onClick={() => file.current.click()}>
            <Icon n="plus" size={28} />
            <b>Choose photos</b>
            <span>Pick one or a whole batch — lay it flat or hang it up, centred in the frame.</span>
          </button>
          <p className="hint">Photos stay on this device (saved in your browser).</p>
        </>
      ) : (
        <div className="add-form">
          <div className="add-top">
            <img src={f.img} alt="" />
            <div className="fields">
              {queue.length > 1 && <span className="eyebrow">{done + 1} of {done + queue.length}</span>}
              <input className="input" placeholder="Name it (e.g. Brown leather jacket)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <div className="chips wrap">{CAT_OPTS.map(([id, l]) => <Chip key={id} active={f.cat === id} onClick={() => setCat(id)}>{l}</Chip>)}</div>
            </div>
          </div>
          <label>Type</label>
          <div className="chips wrap">{SUBS[f.cat].map((s) => <Chip key={s} active={f.sub === s} onClick={() => setF({ ...f, sub: s })}>{s}</Chip>)}</div>
          <label>Colour <small>(auto-picked — tap to fix)</small></label>
          <div className="swatches">{Object.entries(COLORS).map(([n, hex]) => <button key={n} title={n} className={'swatch' + (f.color === n ? ' on' : '')} style={{ background: hex }} onClick={() => setF({ ...f, color: n })} />)}</div>
          <label>Fit</label>
          <div className="chips wrap">{FITS.map((s) => <Chip key={s} active={f.fit === s} onClick={() => setF({ ...f, fit: s })}>{s}</Chip>)}</div>
          <label>Vibes</label>
          <div className="chips wrap">{VIBES.map((v) => <Chip key={v} active={f.vibes.includes(v)} onClick={() => setF({ ...f, vibes: f.vibes.includes(v) ? f.vibes.filter((x) => x !== v) : [...f.vibes, v] })}>{v}</Chip>)}</div>
          <div className="chips wrap">
            {[['solid', 'Solid'], ['graphic', 'Graphic'], ['print', 'Print']].map(([id, l]) => <Chip key={id} active={f.pattern === id} onClick={() => setF({ ...f, pattern: id })}>{l}</Chip>)}
            <Chip active={f.warmth === 3} onClick={() => setF({ ...f, warmth: f.warmth === 3 ? 1 : 3 })}>❄️ Warm piece</Chip>
          </div>
          <button className="btn primary big wide" onClick={save} disabled={!f.vibes.length}><Icon n="hanger" size={18} /> Hang it up{queue.length > 1 ? ' · next' : ''}</button>
        </div>
      )}
    </Sheet>
  )
}
