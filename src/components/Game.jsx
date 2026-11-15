import { useEffect, useMemo, useState } from 'react'
import { Chip, Icon, OutfitBoard, Stars } from './ui'
import { THEMES, judge, autoStyle, describe, pieces } from '../stylist'
import { useStore, toSlots } from '../store'

const TABS = [['top', 'Tops'], ['bottom', 'Bottoms'], ['dress', 'Dresses'], ['layer', 'Layers'], ['acc', 'Extras'], ['swim', 'Swim']]
const TOPPABLE = ['sweater', 'hoodie', 'crewneck', 'fleece']
const ROUND = 90

function wear(o, it) {
  const slot = Object.keys(o).find((k) => o[k]?.id === it.id)
  if (slot) { const n = { ...o }; delete n[slot]; return n }
  const n = { ...o }
  if (it.cat === 'dress') { delete n.top; delete n.bottom; delete n.base; n.dress = it }
  else if (it.cat === 'bottom') { delete n.dress; n.bottom = it }
  else if (it.cat === 'acc') n.acc = it
  else if (it.cat === 'swim') { delete n.dress; n.top = it }
  else if (it.cat === 'top') {
    if (it.sub === 'shirt' && n.top && !n.outer) n.outer = it
    else if (it.sub === 'long sleeve' && n.top && n.top.cat === 'top' && n.top.sub !== 'long sleeve' && !n.base) n.base = it
    else { delete n.dress; n.top = it }
  } else if (it.cat === 'layer') {
    if (!n.top && !n.dress && TOPPABLE.includes(it.sub)) n.top = it
    else n.outer = it
  }
  return n
}

export default function Game() {
  const { items, saveLook } = useStore()
  const [stage, setStage] = useState('lobby')
  const [theme, setTheme] = useState(() => THEMES[Math.floor(Math.random() * THEMES.length)])
  const [timed, setTimed] = useState(true)
  const [left, setLeft] = useState(ROUND)
  const [outfit, setOutfit] = useState({})
  const [tab, setTab] = useState('top')
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)

  const pool = useMemo(() => items.filter((i) => i.cat === tab), [items, tab])
  const worn = pieces(outfit).map((p) => p.id)

  useEffect(() => {
    if (stage !== 'dress' || !timed) return
    if (left <= 0) { finish(); return }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [stage, timed, left]) // eslint-disable-line

  const start = (isTimed) => { setTimed(isTimed); setLeft(ROUND); setOutfit({}); setResult(null); setSaved(false); setTab(theme.swim ? 'swim' : 'top'); setStage('dress') }
  const finish = () => { setResult(judge(outfit, theme)); setStage('result') }
  const shuffleTheme = () => setTheme((t) => { let n; do n = THEMES[Math.floor(Math.random() * THEMES.length)]; while (n.id === t.id); return n })

  if (stage === 'lobby') return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">your wardrobe, their runway</span>
        <h1>Dress <em>to impress</em></h1>
      </header>
      <div className="theme-card glass">
        <span className="eyebrow">this round’s theme</span>
        <div className="theme-emoji">{theme.emoji}</div>
        <h2>{theme.name}</h2>
        <p>{theme.blurb}</p>
        <button className="btn ghost" onClick={shuffleTheme}><Icon n="shuffle" size={16} /> Spin again</button>
      </div>
      <div className="chips wrap">{THEMES.map((t) => <Chip key={t.id} active={t.id === theme.id} onClick={() => setTheme(t)}>{t.emoji} {t.name}</Chip>)}</div>
      <div className="row">
        <button className="btn primary big" onClick={() => start(true)}><Icon n="star" size={18} /> Start · {ROUND}s</button>
        <button className="btn ghost big" onClick={() => start(false)}>Free style</button>
      </div>
    </div>
  )

  if (stage === 'dress') return (
    <div className="page game">
      <div className="game-top glass">
        <div><span className="eyebrow">theme</span><b>{theme.emoji} {theme.name}</b></div>
        {timed && <div className={'timer' + (left <= 10 ? ' hot' : '')}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</div>}
        <button className="btn primary" onClick={finish} disabled={!worn.length}>Runway →</button>
      </div>
      <div className="stage glass">
        {worn.length ? <OutfitBoard outfit={outfit} onPiece={(it) => setOutfit((o) => wear(o, it))} labels /> : <div className="empty">Tap pieces below to get dressed.<br />Tap a piece on the board to take it off.</div>}
        <div className="stage-actions">
          <button className="btn ghost" onClick={() => setOutfit(autoStyle(items, theme))}><Icon n="wand" size={16} /> Style me</button>
          <button className="btn ghost" onClick={() => setOutfit({})} disabled={!worn.length}>Clear</button>
        </div>
      </div>
      <div className="chips scroll-x">{TABS.filter(([id]) => items.some((i) => i.cat === id)).map(([id, label]) => <Chip key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Chip>)}</div>
      <div className="picker">
        {pool.map((it) => (
          <button key={it.id} className={'pick' + (worn.includes(it.id) ? ' on' : '')} onClick={() => setOutfit((o) => wear(o, it))}>
            <img src={it.img} alt={it.name} loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  )

  const d = result ? describe(outfit, theme.want[0]) : null
  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">{theme.emoji} {theme.name}</span>
        <h1>{result ? <>You’re a <em>{result.rank}</em></> : <>No outfit, <em>no score</em></>}</h1>
      </header>
      {result && (
        <>
          <div className="runway glass">
            <OutfitBoard outfit={outfit} />
            <div className="score"><b>{result.avg.toFixed(1)}</b><Stars n={Math.round(result.avg * 2) / 2} /></div>
          </div>
          <div className="judges">
            {result.judges.map((j) => (
              <div key={j.name} className="judge glass">
                <span className="j-emoji">{j.emoji}</span>
                <div><b>{j.name}</b> <Stars n={j.stars} /><p>{j.line}</p></div>
              </div>
            ))}
          </div>
          {!result.complete && <p className="hint">Tip: a full look needs a top + bottom, or a dress.</p>}
        </>
      )}
      <div className="row">
        {result && (
          <button className={'btn big ' + (saved ? 'ghost' : 'primary')} disabled={saved}
            onClick={() => { saveLook({ slots: toSlots(outfit), title: `${theme.name} look`, notes: d.notes, finish: d.finish, vibe: theme.name, stars: result.avg }); setSaved(true) }}>
            <Icon n="heart" size={16} fill={saved} /> {saved ? 'Saved' : 'Save look'}
          </button>
        )}
        <button className="btn ghost big" onClick={() => { shuffleTheme(); setStage('lobby') }}>Play again</button>
      </div>
    </div>
  )
}
