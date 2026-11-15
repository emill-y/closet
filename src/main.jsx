import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { StoreProvider, useStore } from './store'
import { Icon } from './components/ui'
import ClosetView from './components/ClosetView'
import Ootd from './components/Ootd'
import Game from './components/Game'
import Buy from './components/Buy'
import { ItemSheet, AddSheet } from './components/Sheets'

const TABS = [
  ['closet', 'Closet', 'hanger'],
  ['ootd', 'Style', 'sparkle'],
  ['game', 'Runway', 'star'],
  ['buy', 'Wishlist', 'bag'],
]

function App() {
  const { items, ready, buy, byId, removeBuy } = useStore()
  const [tab, setTab] = useState('closet')
  const [open, setOpen] = useState(null)
  const [adding, setAdding] = useState(null)
  const [anchor, setAnchor] = useState(null)
  const style = (item) => { setAnchor(item); setOpen(null); setTab('ootd') }
  const todo = buy.filter((b) => !b.got).length

  return (
    <div className="app">
      <div className="bg" />
      <header className="topbar">
        <div className="wordmark">Eisha&rsquo;s <b>closet</b></div>
        <nav className="nav">
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
              {label}
              {id === 'buy' && todo > 0 && <i className="badge">{todo}</i>}
            </button>
          ))}
        </nav>
        <div className="bar-right">
          <span className="mono">{items.length} pieces</span>
          <button className="add-btn" onClick={() => setAdding({})}><Icon n="plus" size={14} /> Add piece</button>
        </div>
      </header>

      <main>
        {ready && tab === 'closet' && <ClosetView onOpen={setOpen} onStyle={style} />}
        {ready && tab === 'ootd' && <Ootd anchor={anchor} setAnchor={setAnchor} onOpen={setOpen} />}
        {ready && tab === 'game' && <Game />}
        {ready && tab === 'buy' && <Buy onGot={(b) => setAdding({ name: b.name, onAdded: () => removeBuy(b.id) })} />}
      </main>

      <nav className="tabbar">
        {TABS.map(([id, label, icon]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            <Icon n={icon} size={18} />{label}
            {id === 'buy' && todo > 0 && <i className="badge">{todo}</i>}
          </button>
        ))}
      </nav>

      {open && byId[open.id] && <ItemSheet item={byId[open.id]} onClose={() => setOpen(null)} onStyle={style} />}
      {adding && <AddSheet preset={adding} onClose={() => setAdding(null)} />}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<StoreProvider><App /></StoreProvider>)
