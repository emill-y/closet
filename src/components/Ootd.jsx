import { useEffect, useRef, useState } from 'react'
import { Chip, Icon, OutfitBoard } from './ui'
import { MOODS, WEATHER, generate } from '../stylist'
import { useStore, toSlots, fromSlots } from '../store'

export function LookCard({ look, onPiece, onSave, saved, onBuy, bought = [] }) {
  return (
    <article className="look glass">
      <OutfitBoard outfit={look} onPiece={onPiece} labels />
      <div className="look-body">
        <span className="eyebrow">{look.vibe}</span>
        <h3>{look.title}</h3>
        <ol className="notes">{look.notes.map((n, i) => <li key={i}>{n}</li>)}</ol>
        {look.finish?.length > 0 && (
          <div className="finish">
            <span className="eyebrow">finish it with</span>
            <div className="finish-row">
              {look.finish.map((f) => (
                <button key={f} className={'pill' + (bought.includes(f) ? ' done' : '')} onClick={() => onBuy?.(f)} title="Add to wishlist">
                  {f} <Icon n={bought.includes(f) ? 'check' : 'plus'} size={13} />
                </button>
              ))}
            </div>
          </div>
        )}
        {onSave && (
          <button className={'btn wide ' + (saved ? 'ghost' : 'primary')} onClick={onSave} disabled={saved}>
            <Icon n="heart" size={16} fill={saved} /> {saved ? 'Saved to lookbook' : 'Save this look'}
          </button>
        )}
      </div>
    </article>
  )
}

export default function Ootd({ anchor, setAnchor, onOpen }) {
  const { items, byId, looks, saveLook, removeLook, addBuy, buy } = useStore()
  const [tab, setTab] = useState('today')
  const [mood, setMood] = useState('any')
  const [weather, setWeather] = useState('mild')
  const [results, setResults] = useState([])
  const [savedKeys, setSavedKeys] = useState([])
  const seen = useRef(new Set())
  const rail = useRef()

  const run = () => {
    const r = generate(items, { mood, weather, anchor: anchor && byId[anchor.id], count: 3, avoid: seen.current })
    r.forEach((o) => seen.current.add(o.key))
    if (!r.length) seen.current = new Set()
    setResults(r)
    rail.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }
  useEffect(() => { if (items.length) run() }, [mood, weather, anchor?.id, items.length]) // eslint-disable-line

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const wish = buy.map((b) => b.name)

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">{today}</span>
        <h1>Outfit <em>of the day</em></h1>
        <div className="seg glass">
          <button className={tab === 'today' ? 'on' : ''} onClick={() => setTab('today')}>Stylist</button>
          <button className={tab === 'book' ? 'on' : ''} onClick={() => setTab('book')}>Lookbook · {looks.length}</button>
        </div>
      </header>

      {tab === 'today' ? (
        <>
          {anchor && (
            <div className="anchor glass">
              <img src={anchor.img} alt="" />
              <div><span className="eyebrow">styling around</span><b>{anchor.name}</b></div>
              <button className="icon-btn" onClick={() => setAnchor(null)} aria-label="Clear"><Icon n="x" size={16} /></button>
            </div>
          )}
          <div className="chips scroll-x">{MOODS.map((m) => <Chip key={m.id} active={mood === m.id} onClick={() => setMood(m.id)}>{m.emoji} {m.label}</Chip>)}</div>
          <div className="chips scroll-x">{WEATHER.map((w) => <Chip key={w.id} active={weather === w.id} onClick={() => setWeather(w.id)}>{w.emoji} {w.label}</Chip>)}</div>

          <button className="btn primary big gen" onClick={run}><Icon n="shuffle" size={18} /> Generate new fits</button>
          {results.length ? (
            <div className="look-rail scroll-x" ref={rail}>
              {results.map((look) => (
                <LookCard key={look.key} look={look} onPiece={onOpen} bought={wish}
                  onBuy={(f) => !wish.includes(f) && addBuy({ name: f, note: `For “${look.title}”` })}
                  saved={savedKeys.includes(look.key)}
                  onSave={() => { saveLook({ slots: toSlots(look), title: look.title, notes: look.notes, finish: look.finish, vibe: look.vibe }); setSavedKeys((k) => [...k, look.key]) }} />
              ))}
            </div>
          ) : (
            <div className="empty">I couldn’t build a look for that combo — try another mood, or add a few more pieces.</div>
          )}
        </>
      ) : looks.length ? (
        <div className="look-grid">
          {looks.map((l) => {
            const o = fromSlots(l.slots, byId)
            return (
              <div key={l.id} className="look glass mini">
                <OutfitBoard outfit={o} onPiece={onOpen} small />
                <div className="look-body">
                  <span className="eyebrow">{l.vibe}{l.stars ? ` · ${l.stars.toFixed(1)}★` : ''}</span>
                  <h3>{l.title}</h3>
                  {l.notes?.[0] && <p className="one-note">{l.notes[0]}</p>}
                  <button className="icon-btn del" onClick={() => removeLook(l.id)} aria-label="Delete look"><Icon n="trash" size={16} /></button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty">No saved looks yet. Save a fit from the stylist or the runway and it lands here.</div>
      )}
    </div>
  )
}
