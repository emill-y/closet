import { COLORS } from '../wardrobe'
import { pieces } from '../stylist'

const P = {
  hanger: 'M12 8.5V7.2a2.2 2.2 0 1 0-2.2-2.2M12 8.5 3.6 14.4c-1 .7-.5 2.1.7 2.1h15.4c1.2 0 1.7-1.4.7-2.1L12 8.5Z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8L12 3.5Z',
  bag: 'M5 8h14l-1 12H6L5 8ZM9 8V6.5a3 3 0 0 1 6 0V8',
  plus: 'M12 5v14M5 12h14',
  heart: 'M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4C19 15.6 12 20 12 20Z',
  x: 'M6 6l12 12M18 6 6 18',
  shuffle: 'M4 7h3.5c2 0 3 1 4.5 5s2.5 5 4.5 5H20M20 17l-2.5-2.5M20 17l-2.5 2.5M4 17h3.5c1 0 1.8-.3 2.5-1M20 7h-3.5c-1 0-1.8.3-2.5 1M20 7l-2.5-2.5M20 7l-2.5 2.5',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  wand: 'M5 19 16 8M14 6l4 4M18 3v3M16.5 4.5h3M7 4v2M6 5h2M20 13v2M19 14h2',
}
export function Icon({ n, size = 18, fill = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[n]} />
    </svg>
  )
}

export const Dot = ({ color }) => <span className="dot" style={{ background: COLORS[color] || color }} />

export function Chip({ active, onClick, children }) {
  return <button className={'chip' + (active ? ' on' : '')} onClick={onClick}>{children}</button>
}

export function Sheet({ onClose, children, narrow, bare }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className={'sheet' + (narrow ? ' narrow' : '')} onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn close" onClick={onClose} aria-label="Close"><Icon n="x" size={16} /></button>
        {children}
      </div>
    </div>
  )
}

/* Flat-lay: transparent cutouts arranged like clothes laid on a bed. */
const LAYOUT = {
  outer: { l: -1, t: 6, w: 50, h: 56, r: -7, z: 1 },
  base: { l: 62, t: 2, w: 37, h: 40, r: 8, z: 2 },
  top: { l: 27, t: 4, w: 48, h: 42, r: 2, z: 4 },
  bottom: { l: 24, t: 42, w: 50, h: 56, r: -2, z: 3 },
  dress: { l: 23, t: 6, w: 54, h: 84, r: 1, z: 4 },
  acc: { l: 74, t: 68, w: 24, h: 24, r: 10, z: 5 },
}
const LABEL = { outer: 'layer', base: 'under', top: 'top', bottom: 'bottom', dress: 'dress', acc: 'extra' }

export function OutfitBoard({ outfit, onPiece, labels }) {
  const all = pieces(outfit)
  const solo = all.length === 1
  return (
    <div className="board">
      {Object.keys(LAYOUT).map((slot) => {
        const it = outfit[slot]
        if (!it) return null
        let p = LAYOUT[slot]
        if (solo) p = { ...p, l: 20, t: 10, w: 60, h: 80, r: 0 }
        else if (slot === 'top' && !outfit.outer && !outfit.base) p = { ...p, l: 24, t: 2, w: 52 }
        else if (slot === 'dress' && !outfit.outer) p = { ...p, l: 20, t: 4, w: 60 }
        else if (slot === 'bottom' && !outfit.outer) p = { ...p, l: 26, w: 48 }
        return (
          <button key={slot} className="tile"
            style={{ left: p.l + '%', top: p.t + '%', width: p.w + '%', height: p.h + '%', transform: `rotate(${p.r}deg)`, zIndex: p.z }}
            onClick={() => onPiece?.(it, slot)} title={it.name}>
            <img src={it.img} alt={it.name} draggable="false" />
            {labels && <span className="tile-tag">{LABEL[slot]}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Stars({ n }) {
  return (
    <span className="stars" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={n >= i ? 'full' : n >= i - 0.5 ? 'half' : ''}>★</span>)}
    </span>
  )
}
