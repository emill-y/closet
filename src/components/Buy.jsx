import { useState } from 'react'
import { Icon } from './ui'
import { useStore } from '../store'

const IDEAS = ['White leather sneakers', 'Gold hoops', 'Black shoulder bag', 'Low-rise baggy jeans', 'Brown leather jacket', 'White tank (ribbed)', 'Denim mini skirt', 'Knee-high black boots', 'Slim belt', 'Oval sunglasses']
const price = (p) => parseFloat(String(p).replace(/[^0-9.]/g, '')) || 0

export default function Buy({ onGot }) {
  const { buy, addBuy, updateBuy, removeBuy } = useStore()
  const [f, setF] = useState({ name: '', price: '', link: '' })
  const [more, setMore] = useState(false)
  const todo = buy.filter((b) => !b.got), got = buy.filter((b) => b.got)
  const total = todo.reduce((s, b) => s + price(b.price), 0)
  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim()) return
    addBuy({ ...f, name: f.name.trim(), link: f.link.trim() && !/^https?:/i.test(f.link.trim()) ? 'https://' + f.link.trim() : f.link.trim() })
    setF({ name: '', price: '', link: '' }); setMore(false)
  }
  const names = buy.map((b) => b.name.toLowerCase())

  const row = (b) => (
    <li key={b.id} className={'buy-item glass' + (b.got ? ' got' : '')}>
      <button className={'check' + (b.got ? ' on' : '')} onClick={() => updateBuy(b.id, { got: !b.got })} aria-label="Mark bought">{b.got && <Icon n="check" size={15} />}</button>
      <div className="buy-main">
        <b>{b.name}</b>
        {b.note && <span>{b.note}</span>}
        {b.got && <button className="link" onClick={() => onGot(b)}>+ add a photo to closet</button>}
      </div>
      {b.link && <a className="icon-btn" href={b.link} target="_blank" rel="noreferrer" aria-label="Open link"><Icon n="link" size={16} /></a>}
      <input className="price" placeholder="$" value={b.price} onChange={(e) => updateBuy(b.id, { price: e.target.value })} inputMode="decimal" aria-label="Price" />
      <button className="icon-btn" onClick={() => removeBuy(b.id)} aria-label="Remove"><Icon n="trash" size={16} /></button>
    </li>
  )

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">{todo.length} to get{total ? ` · $${total.toFixed(2)}` : ''}</span>
        <h1>Wish<em>list</em></h1>
      </header>
      <form className="buy-form glass" onSubmit={submit}>
        <div className="row tight">
          <input className="input" placeholder="What are you hunting for?" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onFocus={() => setMore(true)} />
          <button className="btn primary" type="submit" aria-label="Add"><Icon n="plus" size={18} /></button>
        </div>
        {more && (
          <div className="row tight">
            <input className="input sm" placeholder="$ price" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} inputMode="decimal" />
            <input className="input" placeholder="Link (optional)" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} />
          </div>
        )}
      </form>
      {todo.length > 0 && <ul className="buy-list">{todo.map(row)}</ul>}
      {!buy.length && <div className="empty">Your cart is empty. Add something above, or tap a “finish it with” suggestion in the stylist.</div>}
      <div>
        <span className="eyebrow">closet gaps worth filling</span>
        <div className="chips wrap" style={{ marginTop: 8 }}>
          {IDEAS.filter((i) => !names.includes(i.toLowerCase())).map((i) => <button key={i} className="pill" onClick={() => addBuy({ name: i })}>{i} <Icon n="plus" size={13} /></button>)}
        </div>
      </div>
      {got.length > 0 && (<><span className="eyebrow">bought</span><ul className="buy-list">{got.map(row)}</ul></>)}
    </div>
  )
}
