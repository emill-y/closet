import { useEffect, useMemo, useRef, useState } from 'react'
import Rail, { makeRail } from './Rail'
import { Icon } from './ui'
import { CATS } from '../wardrobe'
import { useStore } from '../store'

export default function ClosetView({ onOpen, onStyle }) {
  const { items, favs, toggleFav } = useStore()
  const [cat, setCat] = useState('all')
  const [grid, setGrid] = useState(false)
  const [view, setView] = useState(0)
  const railRef = useRef(makeRail())

  const list = useMemo(() => {
    if (cat === 'all') return items
    if (cat === 'fav') return items.filter((i) => favs.includes(i.id))
    return items.filter((i) => i.cat === cat)
  }, [items, cat, favs])

  useEffect(() => { const r = railRef.current; r.target = r.lo ?? 0; r.pos = r.target; r.fling = 0; r.lastIdx = -1; setView(0) }, [cat])

  const idx = view
  const cur = list[Math.min(Math.max(idx, 0), list.length - 1)]
  const counts = useMemo(
    () => Object.fromEntries(CATS.map((c) => [c.id, c.id === 'all' ? items.length : items.filter((i) => i.cat === c.id).length])),
    [items],
  )
  const pct = list.length > 1 ? Math.min(1, Math.max(0, view / (list.length - 1))) : 0

  return (
    <div className="closet-view">
      <div className="closet-head">
        <div className="kicker mono">
          {cat === 'all' ? 'The wardrobe' : CATS.find((c) => c.id === cat)?.label || 'Favourites'}
          <span>|</span>
          {list.length} {list.length === 1 ? 'piece' : 'pieces'}
        </div>
      </div>

      <div className="filters">
        {CATS.filter((c) => counts[c.id]).map((c) => (
          <button key={c.id} className={'chip' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>
            {c.label}<i>{counts[c.id]}</i>
          </button>
        ))}
        <button className={'chip' + (cat === 'fav' ? ' on' : '')} onClick={() => setCat('fav')}>Loved<i>{favs.length}</i></button>
        <button className="chip" onClick={() => setGrid((g) => !g)}>{grid ? 'Rail view' : 'Grid view'}</button>
      </div>

      {!list.length ? (
        <div className="empty">Nothing hanging here yet — use <b>Add piece</b> to put something on the rail.</div>
      ) : grid ? (
        <div className="grid-view">
          {list.map((it) => (
            <div key={it.id} className="card">
              <button className="ph" onClick={() => onOpen(it)}>
                <img src={it.img} alt={it.name} loading="lazy" />
              </button>
              <div className="cap">
                <div>
                  <b>{it.name}</b>
                  <span className="mono">{it.sub}</span>
                </div>
                <button className={'icon-btn heart' + (favs.includes(it.id) ? ' on' : '')} onClick={() => toggleFav(it.id)} aria-label="Love this">
                  <Icon n="heart" size={16} fill={favs.includes(it.id)} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <Rail items={list} onOpen={onOpen} onView={setView} railRef={railRef} />
          <div className="railbar">
            <div className="now">
              {cur && (
                <>
                  <h2>{cur.name}</h2>
                  <div className="meta">
                    <span className="mono">{cur.sub}</span>
                    <span className="mono">·</span>
                    <span className="mono">{cur.fit}</span>
                    <button className={'icon-btn heart' + (favs.includes(cur.id) ? ' on' : '')} onClick={() => toggleFav(cur.id)} aria-label="Love this">
                      <Icon n="heart" size={15} fill={favs.includes(cur.id)} />
                    </button>
                    <button className="btn ghost" onClick={() => onStyle(cur)}>Style it</button>
                  </div>
                </>
              )}
            </div>
            <div className="track">
              <div className="thumb" style={{ left: `calc(${pct * 100}% - ${pct * 46}px)`, width: 46 }} />
            </div>
            <div className="hint-keys mono">
              <span>Drag to scroll</span><span>Brush past to swing</span><span>Click to open</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
