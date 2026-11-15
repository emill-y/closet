import { useEffect, useMemo, useRef, useState } from 'react'
import Closet3D from './Closet3D'
import { Chip, Dot, Icon } from './ui'
import { CATS } from '../wardrobe'
import { useStore } from '../store'

export default function ClosetView({ onOpen, onStyle }) {
  const { items, favs, toggleFav } = useStore()
  const [cat, setCat] = useState('all')
  const [grid, setGrid] = useState(false)
  const [focus, setFocus] = useState(0)
  const motionRef = useRef({ pos: 0, target: 0, vel: 0 })

  const list = useMemo(() => {
    if (cat === 'all') return items
    if (cat === 'fav') return items.filter((i) => favs.includes(i.id))
    return items.filter((i) => i.cat === cat)
  }, [items, cat, favs])
  useEffect(() => { motionRef.current.target = 0; motionRef.current.pos = Math.min(2, list.length - 1); setFocus(0) }, [cat])

  const cur = list[Math.min(focus, list.length - 1)]
  const counts = useMemo(() => Object.fromEntries(CATS.map((c) => [c.id, c.id === 'all' ? items.length : items.filter((i) => i.cat === c.id).length])), [items])

  return (
    <div className="closet-view">
      <div className="filters">
        <div className="chips scroll-x">
          {CATS.filter((c) => counts[c.id]).map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.label} <i>{counts[c.id]}</i></Chip>
          ))}
          <Chip active={cat === 'fav'} onClick={() => setCat('fav')}>♡ Faves <i>{favs.length}</i></Chip>
        </div>
        <button className="icon-btn glass" onClick={() => setGrid((g) => !g)} aria-label={grid ? 'Show rail' : 'Show grid'}>
          <Icon n={grid ? 'hanger' : 'grid'} />
        </button>
      </div>

      {!list.length ? (
        <div className="empty">Nothing here yet — tap <b>+</b> to add a piece.</div>
      ) : grid ? (
        <div className="grid-view">
          {list.map((it) => (
            <button key={it.id} className="grid-card glass" onClick={() => onOpen(it)}>
              <img src={it.img} alt={it.name} loading="lazy" />
              <span>{it.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <Closet3D items={list} focus={focus} onFocus={setFocus} onOpen={onOpen} motionRef={motionRef} />
          {cur && (
            <div className="caption glass">
              <div className="cap-text">
                <h2>{cur.name}</h2>
                <p><Dot color={cur.color} /> {cur.sub} · {cur.fit} · {cur.vibes.slice(0, 2).join(' / ')}</p>
              </div>
              <button className={'icon-btn' + (favs.includes(cur.id) ? ' loved' : '')} onClick={() => toggleFav(cur.id)} aria-label="Favourite">
                <Icon n="heart" fill={favs.includes(cur.id)} />
              </button>
              <button className="btn primary" onClick={() => onStyle(cur)}><Icon n="wand" size={16} /> Style it</button>
            </div>
          )}
          <div className="scrub">
            <input type="range" min="0" max={Math.max(0, list.length - 1)} step="1" value={Math.min(focus, list.length - 1)} onChange={(e) => { motionRef.current.target = +e.target.value }} aria-label="Scroll through closet" />
            <span>{Math.min(focus, list.length - 1) + 1} / {list.length}</span>
          </div>
        </>
      )}
    </div>
  )
}
