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

const TABS = [['closet', 'Closet', 'hanger'], ['ootd', 'OOTD', 'sparkle'], ['game', 'Runway', 'star'], ['buy', 'Wishlist', 'bag']]

function App() {
  const { items, ready, buy, byId, removeBuy } = useStore()
  const [tab, setTab] = useState('closet')
  const [open, setOpen] = useState(null)
  const [adding, setAdding] = useState(null)
  const [anchor, setAnchor] = useState(null)
  const style = (item) => { setAnchor(item); setOpen(null); setTab('ootd') }
  const todo = buy.filter((b) => !b.got).length

  return (
    <div className={'app tab-' + tab}>
      <div className="bg"><i /><i /><i /><i /></div>
      {tab === 'closet' && (
        <header className="brand">
          <h1>Eisha’s <em>closet</em></h1>
          <span className="eyebrow">{items.length} pieces</span>
        </header>
      )}
      <main>
        {ready && tab === 'closet' && <ClosetView onOpen={setOpen} onStyle={style} />}
        {ready && tab === 'ootd' && <Ootd anchor={anchor} setAnchor={setAnchor} onOpen={setOpen} />}
        {ready && tab === 'game' && <Game />}
        {ready && tab === 'buy' && <Buy onGot={(b) => setAdding({ name: b.name, onAdded: () => removeBuy(b.id) })} />}
      </main>
      <nav className="tabbar glass">
        {TABS.slice(0, 2).map(([id, label, icon]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}><Icon n={icon} /><span>{label}</span></button>)}
        <button className="add" onClick={() => setAdding({})} aria-label="Add a piece"><Icon n="plus" size={24} /></button>
        {TABS.slice(2).map(([id, label, icon]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            <Icon n={icon} /><span>{label}</span>{id === 'buy' && todo > 0 && <i className="badge">{todo}</i>}
          </button>
        ))}
      </nav>
      {open && byId[open.id] && <ItemSheet item={byId[open.id]} onClose={() => setOpen(null)} onStyle={style} />}
      {adding && <AddSheet preset={adding} onClose={() => setAdding(null)} />}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<StoreProvider><App /></StoreProvider>)
