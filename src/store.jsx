import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { get, set } from 'idb-keyval'
import { SEED } from './wardrobe'

const KEY = 'closet-state-v1'
const EMPTY = { added: [], removed: [], favs: [], looks: [], buy: [] }
const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)
export const uid = () => Math.random().toString(36).slice(2, 10)

export function StoreProvider({ children }) {
  const [state, setState] = useState(EMPTY)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    get(KEY).then((s) => { if (s) setState({ ...EMPTY, ...s }) }).catch(() => {}).finally(() => setReady(true))
  }, [])
  const update = useCallback((fn) => setState((s) => {
    const n = fn(s)
    set(KEY, n).catch(() => {})
    return n
  }), [])

  const items = useMemo(() => [...SEED.filter((i) => !state.removed.includes(i.id)), ...state.added], [state.removed, state.added])
  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items])

  const api = useMemo(() => ({
    addItem: (item) => update((s) => ({ ...s, added: [...s.added, { ...item, id: 'u' + uid() }] })),
    removeItem: (id) => update((s) => id.startsWith('u')
      ? { ...s, added: s.added.filter((i) => i.id !== id) }
      : { ...s, removed: [...s.removed, id] }),
    toggleFav: (id) => update((s) => ({ ...s, favs: s.favs.includes(id) ? s.favs.filter((f) => f !== id) : [...s.favs, id] })),
    saveLook: (look) => update((s) => ({ ...s, looks: [{ ...look, id: uid(), date: Date.now() }, ...s.looks] })),
    removeLook: (id) => update((s) => ({ ...s, looks: s.looks.filter((l) => l.id !== id) })),
    addBuy: (b) => update((s) => ({ ...s, buy: [{ id: uid(), name: '', price: '', link: '', note: '', got: false, ...b }, ...s.buy] })),
    updateBuy: (id, patch) => update((s) => ({ ...s, buy: s.buy.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
    removeBuy: (id) => update((s) => ({ ...s, buy: s.buy.filter((b) => b.id !== id) })),
    restoreAll: () => update((s) => ({ ...s, removed: [] })),
  }), [update])

  return <Ctx.Provider value={{ ...state, items, byId, ready, ...api }}>{children}</Ctx.Provider>
}

// outfit <-> stored slots
const SLOTS = ['outer', 'top', 'base', 'dress', 'bottom', 'acc']
export const toSlots = (o) => Object.fromEntries(SLOTS.filter((k) => o[k]).map((k) => [k, o[k].id]))
export const fromSlots = (slots, byId) => Object.fromEntries(Object.entries(slots).filter(([, id]) => byId[id]).map(([k, id]) => [k, byId[id]]))
