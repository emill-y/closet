import { COLORS } from '../wardrobe'
import { pieces } from '../stylist'

const P = {
  hanger: 'M12 8.5V7.2a2.2 2.2 0 1 0-2.2-2.2M12 8.5 3.6 14.4c-1 .7-.5 2.1.7 2.1h15.4c1.2 0 1.7-1.4.7-2.1L12 8.5Z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8L12 3.5Z',
  bag: 'M5 8h14l-1 12H6L5 8ZM9 8V6.5a3 3 0 0 1 6 0V8',
  plus: 'M12 5v14M5 12h14',
  heart: 'M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4C19 15.600 12 20 12 20Z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  x: 'M6 6l12 12M18 6 6 18',
  shuffle: 'M4 7h3.5c2 0 3 1 4.5 5s2.500 5 4.500 5H20M20 17l-2.500-2.500M20 17l-2.500 2.500M4 17h3.500c1 0 1.800-.300 2.500-1M20 7h-3.500c-1 0-1.800.300-2.500 1M20 7l-2.500-2.500M20 7l-2.500 2.500',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13',
  check: 'M5 12.500l4.500 4.500L19 7.500',
  link: 'M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1',
  wand: 'M5 19 16 8M14 6l4 4M18 3v3M16.500 4.500h3M7 4v2M6 5h2M20 13v2M19 14h2',
}
export function Icon({ n, size = 20, fill = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[n]} />
    </svg>
  )
}

export const Dot = ({ color }) => <span className="dot" style={{ background: COLORS[color] || color }} />

export function Chip({ active, onClick, children }) {
  return <button className={'chip' + (active ? ' on' : '')} onClick={onClick}>{children}</button>
}

export function Sheet({ onClose, children, wide }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className={'sheet glass' + (wide ? ' wide' : '')} onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn close" onClick={onClose} aria-label="Close"><Icon n="x" /></button>
        {children}
      </div>
    </div>
  )
}

// Flat-lay collage of an outfit
const LAYOUT = {
  outer: { l: 2, t: 3, w: 46, r: -6, z: 1 },
  base: { l: 60, t: 1, w: 34, r: 7, z: 2 },
  top: { l: 31, t: 9, w: 46, r: 3, z: 4 },
  bottom: { l: 27, t: 47, w: 48, r: -2, z: 3 },
  dress: { l: 26, t: 14, w: 54, r: 2, z: 4 },
  acc: { l: 72, t: 62, w: 25, r: 9, z: 5 },
}
const LABEL = { outer: 'layer', base: 'under', top: 'top', bottom: 'bottom', dress: 'dress', acc: 'extra' }
export function OutfitBoard({ outfit, onPiece, small, labels }) {
  const solo = pieces(outfit).length === 1
  return (
    <div className={'board' + (small ? ' small' : '')}>
      {Object.keys(LAYOUT).map((slot) => {
        const it = outfit[slot]; if (!it) return null
        let p = LAYOUT[slot]
        if (solo) p = { ...p, l: 24, t: 20, w: 52 }
        else if (slot === 'top' && !outfit.outer && !outfit.base) p = { ...p, l: 25, t: 5, w: 50 }
        else if (slot === 'dress' && !outfit.outer) p = { ...p, l: 21, t: 12, w: 58 }
        else if (slot === 'outer' && outfit.dress) p = { ...p, t: 6 }
        return (
          <button key={slot} className="tile" style={{ left: p.l + '%', top: p.t + '%', width: p.w + '%', transform: `rotate(${p.r}deg)`, zIndex: p.z }} onClick={() => onPiece?.(it, slot)}>
            <img src={it.img} alt={it.name} draggable="false" />
            {labels && <span className={'tile-tag' + (slot === 'outer' || slot === 'base' ? ' up' : '')}>{LABEL[slot]}</span>}
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
