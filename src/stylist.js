// Rule-based stylist: builds layered outfits from the wardrobe, scores them,
// and writes styling notes (tucks, layering, sleeves, finishing touches).

const NEUTRAL = new Set(['black', 'charcoal', 'grey', 'white', 'cream', 'beige', 'taupe', 'brown', 'navy', 'darkdenim', 'denim', 'lightdenim'])
const FAMILY = {
  black: 'dark', charcoal: 'dark', navy: 'dark', darkdenim: 'dark', brown: 'earth', taupe: 'earth', beige: 'earth', cream: 'light', white: 'light', grey: 'grey',
  denim: 'blue', lightdenim: 'blue', blue: 'blue', periwinkle: 'blue', lilac: 'purple', purple: 'purple', pink: 'pink', magenta: 'pink', coral: 'pink',
  red: 'red', rust: 'earth', orange: 'earth', yellow: 'yellow', gold: 'yellow', green: 'green', olive: 'green', sage: 'green',
}
const FRIENDS = [
  ['lilac', 'grey'], ['lilac', 'white'], ['lilac', 'lightdenim'], ['lilac', 'periwinkle'], ['lilac', 'pink'], ['pink', 'grey'], ['pink', 'lightdenim'], ['pink', 'cream'],
  ['rust', 'cream'], ['rust', 'navy'], ['rust', 'white'], ['rust', 'black'], ['sage', 'cream'], ['sage', 'white'], ['sage', 'beige'], ['sage', 'black'],
  ['olive', 'black'], ['olive', 'cream'], ['olive', 'beige'], ['blue', 'white'], ['blue', 'beige'], ['blue', 'lightdenim'], ['periwinkle', 'white'], ['periwinkle', 'grey'], ['periwinkle', 'cream'],
  ['green', 'lightdenim'], ['green', 'beige'], ['green', 'cream'], ['magenta', 'lightdenim'], ['magenta', 'black'], ['yellow', 'denim'], ['yellow', 'lightdenim'], ['yellow', 'white'],
  ['coral', 'lightdenim'], ['coral', 'cream'], ['coral', 'beige'], ['red', 'denim'], ['red', 'lightdenim'], ['red', 'black'], ['gold', 'black'], ['purple', 'black'], ['purple', 'grey'],
  ['brown', 'cream'], ['brown', 'lightdenim'], ['taupe', 'cream'], ['taupe', 'white'], ['taupe', 'black'], ['beige', 'white'], ['beige', 'black'], ['navy', 'cream'], ['navy', 'grey'], ['navy', 'beige'],
]
const friend = (a, b) => FRIENDS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))

export function colorScore(a, b) {
  if (a === b) return NEUTRAL.has(a) ? 1.2 : 1.6 // tonal
  if (friend(a, b)) return 2
  const na = NEUTRAL.has(a), nb = NEUTRAL.has(b)
  if (na && nb) return 1.3
  if (na || nb) return 1.1
  if (FAMILY[a] === FAMILY[b]) return 1.4
  return -1.5 // two unrelated brights
}

export const MOODS = [
  { id: 'any', label: 'Surprise me', emoji: '✨' },
  { id: 'clean', label: 'Clean girl', emoji: '🤍' },
  { id: 'street', label: 'Streetwear', emoji: '🛹' },
  { id: 'y2k', label: 'Y2K', emoji: '🦋' },
  { id: 'girly', label: 'Coquette', emoji: '🎀' },
  { id: 'cozy', label: 'Cozy', emoji: '☁️' },
  { id: 'night', label: 'Going out', emoji: '🪩' },
  { id: 'sporty', label: 'Athleisure', emoji: '🎧' },
  { id: 'campus', label: 'Campus', emoji: '📚' },
  { id: 'boho', label: 'Boho', emoji: '🌼' },
]
export const WEATHER = [
  { id: 'warm', label: 'Warm', emoji: '☀️' },
  { id: 'mild', label: 'Mild', emoji: '🌤️' },
  { id: 'cold', label: 'Cold', emoji: '❄️' },
]

const TOPPABLE = ['sweater', 'hoodie', 'crewneck', 'fleece'] // layers that can be worn as the top
const OUTERS = ['jacket', 'puffer', 'blazer', 'hoodie', 'fleece', 'sweater', 'crewneck']
const BASES = ['long sleeve'] // can go under a short sleeve
const UNDER_OPEN = ['cami', 'tank', 'baby tee', 'crop tee', 'crop top']

const pick = (a) => a[Math.floor(Math.random() * a.length)]
const has = (it, v) => it && it.vibes.includes(v)
export const pieces = (o) => [o.outer, o.top, o.base, o.dress, o.bottom, o.acc].filter(Boolean)

function candidate(items, anchor, mood) {
  const by = (f) => items.filter(f)
  const tops = by((i) => i.cat === 'top'), bottoms = by((i) => i.cat === 'bottom'), dresses = by((i) => i.cat === 'dress')
  const layers = by((i) => i.cat === 'layer'), accs = by((i) => i.cat === 'acc')
  const o = {}
  const r = Math.random()
  // place the anchor first
  if (anchor) {
    if (anchor.cat === 'dress') o.dress = anchor
    else if (anchor.cat === 'bottom') o.bottom = anchor
    else if (anchor.cat === 'acc') o.acc = anchor
    else if (anchor.cat === 'top') {
      if (anchor.sub === 'shirt' && Math.random() < 0.6) o.outer = anchor
      else if (BASES.includes(anchor.sub) && Math.random() < 0.3) o.base = anchor
      else o.top = anchor
    } else if (anchor.cat === 'layer') {
      if (TOPPABLE.includes(anchor.sub) && Math.random() < 0.5) o.top = anchor
      else o.outer = anchor
    } else return null
  }
  // with no bottoms in the wardrobe, lean on dresses rather than giving up
  const noBottoms = !bottoms.length
  const dressOdds = ['night', 'girly', 'boho'].includes(mood) ? 0.45 : 0.16
  const wantDress = o.dress || (!o.top && !o.bottom && !o.base && dresses.length && (noBottoms || r < dressOdds))
  if (wantDress) {
    o.dress = o.dress || pick(dresses)
  } else {
    if (!o.bottom) {
      if (bottoms.length) o.bottom = pick(bottoms)
      else if (!o.top && !o.base && !o.outer) return null
    }
    if (!o.top) {
      const pool = [...tops, ...tops, ...layers.filter((l) => TOPPABLE.includes(l.sub))].filter((t) => t !== o.outer && t !== o.base)
      if (!pool.length) return null
      o.top = pick(pool)
    }
    // long sleeve under a short sleeve tee / tank / cami
    if (!o.base && o.top.cat === 'top' && !['long sleeve', 'shirt', 'blouse'].includes(o.top.sub) && Math.random() < 0.22) {
      const b = tops.filter((t) => BASES.includes(t.sub) && t.fit !== 'oversized' && t !== o.top)
      if (b.length) o.base = pick(b)
    }
    if (o.base && o.top && (['long sleeve', 'shirt', 'blouse'].includes(o.top.sub) || o.top.cat === 'layer')) delete o.base
  }
  if (!o.outer && Math.random() < 0.5) {
    let pool = layers.filter((l) => OUTERS.includes(l.sub) && l !== o.top)
    const shirt = tops.filter((t) => t.sub === 'shirt' && t !== o.top)
    if (o.top && UNDER_OPEN.includes(o.top.sub)) pool = [...pool, ...shirt, ...shirt]
    // bulky top → only real outerwear on top of it
    if (o.top && o.top.cat === 'layer') pool = pool.filter((l) => ['puffer', 'jacket', 'blazer'].includes(l.sub))
    if (o.dress) pool = pool.filter((l) => l.sub !== 'fleece')
    if (pool.length) o.outer = pick(pool)
  }
  if (o.outer && o.outer === o.top) return null
  if (!o.acc && accs.length && Math.random() < 0.3) o.acc = pick(accs)
  return o
}

export function scoreOutfit(o, mood = 'any', weather = 'mild') {
  const ps = pieces(o)
  if (ps.length < 1) return -99
  let s = 0
  // colour harmony across visible pieces
  let pairs = 0, col = 0
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) { col += colorScore(ps[i].color, ps[j].color); pairs++ }
  s += pairs ? (col / pairs) * 3 : 3
  const brights = new Set(ps.filter((p) => !NEUTRAL.has(p.color)).map((p) => FAMILY[p.color]))
  if (brights.size > 2) s -= 3
  // one statement at a time
  const loud = ps.filter((p) => p.pattern !== 'solid' && p.cat !== 'acc')
  const visibleLoud = loud.filter((p) => !(p === o.top && o.outer && ['hoodie', 'crewneck', 'sweater', 'fleece'].includes(o.outer.sub)))
  if (visibleLoud.length > 1) s -= 2.5 * (visibleLoud.length - 1)
  if (visibleLoud.length === 1) s += 0.6
  // silhouette balance
  const t = o.top, b = o.bottom
  if (t && b) {
    const small = ['cropped', 'fitted'].includes(t.fit), big = t.fit === 'oversized'
    const wide = ['wide', 'relaxed'].includes(b.fit), slim = ['fitted', 'flare', 'short'].includes(b.fit)
    if (small && (wide || b.fit === 'flare' || b.fit === 'straight')) s += 2
    if (big && slim) s += 2
    if (big && wide) s += mood === 'street' || mood === 'cozy' ? 1 : -0.8
    if (small && b.fit === 'fitted') s += mood === 'sporty' ? 1 : -0.3
  }
  // layering makes it interesting
  if (o.base) {
    s += 0.7
    if (o.base.fit === 'oversized') s -= 2
    if (colorScore(o.base.color, o.top.color) >= 1.1 && o.base.color !== o.top.color) s += 0.8
    if (o.base.color === o.top.color) s -= 1.5
  }
  if (o.outer) {
    s += 0.4
    if (o.outer.sub === 'blazer' && o.top && ['hoodie', 'baby tee', 'cami', 'tee', 'crop tee', 'tank'].includes(o.top.sub)) s += 1.2
    if (o.outer.sub === 'puffer' && o.top && ['hoodie', 'crewneck'].includes(o.top.sub)) s += 1.2
    if (o.outer.sub === 'shirt') s += 1
    if (['hoodie', 'crewneck', 'fleece', 'sweater'].includes(o.outer.sub) && o.top && o.top.cat === 'layer') s -= 6
    if (o.dress && ['sweater', 'blazer', 'crewneck'].includes(o.outer.sub)) s += 1.2
    if (o.dress && has(o.dress, 'night') && ['hoodie', 'puffer', 'jacket'].includes(o.outer.sub)) s -= 2.5
  }
  if (o.acc) {
    if (o.acc.sub === 'headband' && !(has(o.top, 'cozy') || has(o.top, 'sporty') || weather === 'cold')) s -= 1.5
    if (weather === 'warm' && o.acc.warmth === 3) s -= 4
  }
  // mood
  if (mood !== 'any') {
    const hit = ps.filter((p) => p.vibes.includes(mood)).length
    s += (hit / ps.length) * 7
    if (hit === 0) s -= 4
    const hero = o.dress || o.top
    if (hero && !hero.vibes.includes(mood)) s -= 2.5
  } else {
    // shared vibe across pieces = cohesive
    const counts = {}
    ps.forEach((p) => p.vibes.forEach((v) => (counts[v] = (counts[v] || 0) + 1)))
    s += (Math.max(0, ...Object.values(counts)) / ps.length) * 3
  }
  if (ps.some((p) => p.vibes.includes('holiday')) && mood !== 'holiday') s -= 12
  // weather
  const warmest = Math.max(...ps.map((p) => p.warmth))
  const shorts = b && b.fit === 'short'
  if (weather === 'cold') {
    if (warmest < 3) s -= 4
    if (shorts) s -= 4
    if (o.dress && !o.outer) s -= 3
    if (o.top && ['cami', 'tank'].includes(o.top.sub) && !o.outer && !o.base) s -= 4
  } else if (weather === 'warm') {
    if (warmest === 3) s -= 5
    if (o.outer && o.outer.sub !== 'shirt') s -= 1.5
    if (o.base) s -= 2
    if (shorts || o.dress) s += 1.2
    if (b && b.sub === 'sweats') s -= 2
  } else {
    if (shorts && warmest === 3) s += 0.5 // shorts + big sweatshirt
    if (o.outer && o.outer.sub === 'puffer') s -= 1
  }
  return s
}

// ---------- styling notes ----------
const SHOES = {
  clean: ['white leather sneakers', 'slim black loafers', 'ballet flats'], street: ['chunky sneakers', 'Sambas', 'platform high-tops'],
  y2k: ['platform sandals', 'chunky sneakers', 'kitten-heel boots'], girly: ['Mary Janes with white frilly socks', 'ballet flats', 'white platform sneakers'],
  cozy: ['mini Uggs', 'chunky sneakers with scrunched socks', 'slipper clogs'], night: ['knee-high black boots', 'strappy heels', 'pointed kitten heels'],
  sporty: ['retro runners', 'white crew socks + sneakers', 'slides'], campus: ['Sambas', 'New Balance 530s', 'Converse'], boho: ['strappy sandals', 'suede boots', 'espadrilles'],
  beach: ['strappy sandals', 'slides'], edgy: ['combat boots', 'platform loafers'], preppy: ['loafers with white socks', 'Mary Janes'], casual: ['white sneakers', 'Sambas'],
}
const EXTRAS = {
  clean: ['gold hoops', 'a slick bun + claw clip', 'a shoulder bag'], street: ['a crossbody bag', 'silver chain', 'baseball cap'],
  y2k: ['a baguette bag', 'tinted sunglasses', 'layered silver necklaces'], girly: ['a hair bow', 'pearl necklace', 'dainty gold layers'],
  cozy: ['a big tote', 'claw clip', 'chunky scarf'], night: ['a mini shoulder bag', 'statement hoops', 'glossy lip'],
  sporty: ['a slick ponytail', 'belt bag', 'headphones around the neck'], campus: ['a tote bag', 'small hoops', 'headphones'],
  boho: ['layered necklaces', 'stacked rings', 'a woven bag'], beach: ['oval sunglasses', 'a straw tote'], edgy: ['a silver chain belt', 'chunky rings'],
  preppy: ['a ribbon in your hair', 'a slim belt', 'small pearl studs'], casual: ['small gold hoops', 'a tote'],
}

function dominantVibe(o, mood) {
  if (mood && mood !== 'any') return mood
  const c = {}
  pieces(o).forEach((p) => p.vibes.forEach((v) => (c[v] = (c[v] || 0) + 1)))
  return Object.entries(c).sort((a, b) => b[1] - a[1] + (Math.random() - 0.5) * 0.4)[0]?.[0] || 'casual'
}

const TITLES = {
  clean: ['Off-duty model', 'Pilates princess', 'Quiet luxury errand run', 'That-girl uniform'], street: ['Downtown cool', 'Skate park adjacent', 'Thrift haul hero', 'Off-duty DJ'],
  y2k: ['2003 mall queen', 'Low-rise era', 'Flip phone energy', 'Butterfly clip core'], girly: ['Soft launch', 'Bow season', 'Sugar & lace', 'Main character brunch'],
  cozy: ['Sunday reset', 'Library fireplace', 'Matcha & a blanket', 'Slow morning'], night: ['Dinner at 9', 'After-dark glam', 'Ready by 10', 'Dance floor first'],
  sporty: ['Hot girl walk', 'Post-pilates coffee', 'Tenniscore', 'Airport outfit'], campus: ['Front row at lecture', 'Study date', 'Berkeley morning', 'Game day casual'],
  boho: ['Farmers market', 'Golden hour picnic', 'Flea market find', 'Canyon weekend'], beach: ['Boardwalk sunset', 'Coastal weekend'], edgy: ['Front row at the show', 'Moto muse'],
  preppy: ['Old money errands', 'Ivy library'], casual: ['Easy Saturday', 'Coffee run'],
}

export function describe(o, mood, weather) {
  const notes = []
  const { top: t, bottom: b, base, outer, dress, acc } = o
  const longBottom = b && b.fit !== 'short'
  if (base && t) {
    notes.push(`Layer the ${base.name.toLowerCase()} under the ${t.name.toLowerCase()} — let the sleeves${t.fit === 'cropped' ? ' and an inch of hem' : ''} show for that stacked look.`)
  }
  if (t && b && !dress) {
    if (t.sub === 'long sleeve' && t.fit === 'fitted') notes.push(`Tuck just one side of the ${t.name.toLowerCase()} into the waistband and leave the other loose — then push the sleeves up to your forearms.`)
    else if (t.sub === 'long sleeve') notes.push(`French-tuck the front of the ${t.name.toLowerCase()} and blouse it out a little so the waist shows but it still looks effortless.`)
    else if (t.sub === 'tee' && t.fit === 'oversized' && longBottom) notes.push(pick([
      `Tuck one front corner of the ${t.name.toLowerCase()} into your waistband (off-centre!) and roll the sleeves twice.`,
      `Gather the ${t.name.toLowerCase()} at the back and knot it or tuck it under your bra band so it sits cropped and boxy.`,
    ]))
    else if (t.sub === 'tee' && t.fit === 'oversized') notes.push(`Leave the ${t.name.toLowerCase()} long over the shorts so only a peek of hem shows — roll the sleeves for shape.`)
    else if (t.sub === 'tee') notes.push(`Half-tuck the ${t.name.toLowerCase()} at the front and cuff the sleeves once so it reads fitted, not boxy.`)
    else if (t.sub === 'shirt') notes.push(`Button the ${t.name.toLowerCase()} only in the middle, tuck one side, and roll the sleeves to the elbow.`)
    else if (['hoodie', 'crewneck', 'sweater', 'fleece'].includes(t.sub)) notes.push(b.fit === 'short'
      ? `Let the ${t.name.toLowerCase()} hang over the shorts — the “no-pants” proportion is the whole point.`
      : `Tuck just the front hem of the ${t.name.toLowerCase()} up under itself for a cropped, bubble shape over the ${b.name.toLowerCase()}.`)
    else if (t.fit === 'cropped' && ['wide', 'relaxed'].includes(b.fit)) notes.push(`Tiny top, big pants: wear the ${b.name.toLowerCase()} slung a little low so a sliver of waist shows.`)
    else if (t.fit === 'cropped' && b.fit === 'flare') notes.push(`Fitted on top, flare on the bottom — pull the ${b.name.toLowerCase()} up high on the waist so your legs go on forever.`)
    else if (t.fit === 'cropped' && b.fit === 'straight') notes.push(`Let the ${t.name.toLowerCase()} end right at the waistband of the ${b.name.toLowerCase()} — a belt makes it look intentional.`)
    else if (t.fit === 'cropped' && b.fit === 'short') notes.push(`Short on short: keep the ${t.name.toLowerCase()} untucked so there’s a clean gap above the ${b.name.toLowerCase()}.`)
    else if (['cami', 'tank'].includes(t.sub)) notes.push(`Tuck the ${t.name.toLowerCase()} in all the way for a clean line${outer ? ' under the layer' : ''}.`)
  }
  if (outer) {
    const n = outer.name.toLowerCase()
    if (outer.sub === 'blazer') notes.push(pick([`Push the ${n} sleeves up to the elbows and wear it open.`, `Drape the ${n} over your shoulders like a cape — arms out.`]))
    else if (outer.sub === 'puffer') notes.push(t && t.sub === 'hoodie' ? `Zip the ${n} halfway and pull the hood out over the collar.` : `Wear the ${n} open and slightly off the shoulders.`)
    else if (outer.sub === 'shirt') notes.push(`Wear the ${n} fully open as a light jacket, sleeves rolled — or tie it at the waist when it warms up.`)
    else if (outer.sub === 'sweater' || outer.sub === 'crewneck') notes.push(dress
      ? `Pull the ${n} over the dress so the skirt peeks out underneath — instant two-piece.`
      : `Don't put the ${n} on — tie it around your shoulders (or your waist) as the colour accent.`)
    else if (outer.sub === 'hoodie' || outer.sub === 'fleece') notes.push(`Throw the ${n} on unzipped/loose, or tie it around your waist to break up the outfit.`)
    else notes.push(`Leave the ${n} unzipped and pushed back off the shoulders a bit.`)
  }
  if (dress && !outer) notes.push(`Let the ${dress.name.toLowerCase()} be the whole moment — keep everything else minimal.`)
  if (b && ['jeans', 'cargos', 'pants'].includes(b.sub) && ['straight', 'wide'].includes(b.fit) && Math.random() < 0.5) notes.push(`Let the hem of the ${b.name.toLowerCase()} stack over your shoes rather than cuffing.`)
  if (acc) notes.push(acc.sub === 'beanie' ? `Beanie pushed back off the hairline, hair out front.` : `Finish with the ${acc.name.toLowerCase()}.`)
  const v = dominantVibe(o, mood)
  const shoes = pick(SHOES[v] || SHOES.casual)
  const extras = [...(EXTRAS[v] || EXTRAS.casual)].sort(() => Math.random() - 0.5).slice(0, 2)
  return { notes: notes.slice(0, 4), finish: [shoes, ...extras], title: pick(TITLES[v] || TITLES.casual), vibe: v }
}

const key = (o) => pieces(o).map((p) => p.id).sort().join('|')

export function generate(items, { mood = 'any', weather = 'mild', anchor = null, count = 1, avoid = new Set() } = {}) {
  const pool = items.filter((i) => i.cat !== 'swim')
  const seen = new Map()
  for (let n = 0; n < 500; n++) {
    const o = candidate(pool, anchor, mood)
    if (!o) continue
    const k = key(o)
    if (seen.has(k) || avoid.has(k)) continue
    seen.set(k, { o, s: scoreOutfit(o, mood, weather) + Math.random() * 1.5 })
  }
  const ranked = [...seen.values()].sort((a, b) => b.s - a.s)
  const out = [], used = new Set()
  for (const { o, s } of ranked) {
    // keep the set varied: don't repeat the same non-anchor hero piece
    const hero = (o.dress || o.top)?.id, bot = o.bottom?.id
    if (out.length && ((hero !== anchor?.id && used.has(hero)) || (bot && bot !== anchor?.id && used.has(bot) && Math.random() < 0.7))) continue
    used.add(hero); if (bot) used.add(bot)
    out.push({ ...o, ...describe(o, mood, weather), score: s, key: key(o), mood, weather })
    if (out.length >= count) break
  }
  return out
}

// ---------- game ----------
export const THEMES = [
  { id: 'coffee', name: 'Coffee Run', emoji: '☕', want: ['casual', 'clean', 'cozy'], blurb: 'Effortless, like you didn’t try (you did).' },
  { id: 'popstar', name: 'Y2K Popstar', emoji: '🎤', want: ['y2k', 'night', 'girly'], blurb: 'It’s 2003 and you’re on TRL.' },
  { id: 'cleangirl', name: 'Clean Girl', emoji: '🫧', want: ['clean', 'sporty'], blurb: 'Slick bun, neutrals, nothing extra.' },
  { id: 'concert', name: 'Concert Night', emoji: '🎸', want: ['edgy', 'night', 'street'], blurb: 'Front row, band tee energy.' },
  { id: 'firstdate', name: 'First Date', emoji: '💌', want: ['girly', 'night', 'clean'], blurb: 'Cute but like… casually cute.' },
  { id: 'lecture', name: '8am Lecture', emoji: '📚', want: ['campus', 'cozy', 'casual'], blurb: 'Rolled out of bed, still ate.' },
  { id: 'street', name: 'Streetwear Icon', emoji: '🛹', want: ['street', 'edgy', 'y2k'], blurb: 'Baggy, layered, a little chaotic.' },
  { id: 'coquette', name: 'Coquette Picnic', emoji: '🎀', want: ['girly', 'boho'], blurb: 'Lace, pastels and a basket of strawberries.' },
  { id: 'airport', name: 'Airport Outfit', emoji: '✈️', want: ['cozy', 'sporty', 'clean'], blurb: 'Comfy enough for a red-eye, cute enough for paparazzi.' },
  { id: 'gno', name: 'Girls’ Night Out', emoji: '🪩', want: ['night', 'girly', 'edgy'], blurb: 'Sparkle. That’s the brief.' },
  { id: 'farmers', name: 'Farmers Market', emoji: '🌼', want: ['boho', 'casual', 'girly'], blurb: 'Sunny, flowy, tote bag mandatory.' },
  { id: 'gameday', name: 'Game Day', emoji: '🏈', want: ['campus', 'sporty', 'street'], blurb: 'School spirit but make it fashion.' },
  { id: 'oldmoney', name: 'Old Money', emoji: '🥂', want: ['preppy', 'clean'], blurb: 'Sweater over the shoulders. Inherited everything.' },
  { id: 'beachday', name: 'Beach Day', emoji: '🐚', want: ['beach', 'boho'], blurb: 'Suit under, cover-up over, salt in your hair.', swim: true },
]

const JUDGES = [
  { name: 'Coco', emoji: '💅', hi: ['Obsessed. Screenshotting this.', 'The layering?? She studied.', 'You understood the assignment.'], mid: ['Cute! One more layer and it’s a 10.', 'I see the vision, it’s almost there.'], lo: ['Babe… this is a different theme.', 'It’s giving laundry day.'] },
  { name: 'Mika', emoji: '🕶️', hi: ['Proportions are immaculate.', 'Colour story is so clean.', 'This would trend.'], mid: ['Solid. Colours could talk to each other more.', 'Good bones — push the silhouette.'], lo: ['The colours are fighting.', 'Something’s missing here.'] },
  { name: 'Juno', emoji: '🪩', hi: ['On theme AND original. Ate.', 'Main character behaviour.', 'I’d copy this tomorrow.'], mid: ['On theme-ish! I’ll allow it.', 'Fun, but play it up more.'], lo: ['Where’s the theme though?', 'Needs a full outfit, bestie.'] },
]

export function judge(o, theme) {
  const ps = pieces(o)
  if (!ps.length) return null
  const complete = !!(o.dress || (o.top && o.bottom) || (theme.swim && ps.some((p) => p.cat === 'swim')))
  const hit = ps.filter((p) => p.vibes.some((v) => theme.want.includes(v))).length / ps.length
  let pairs = 0, col = 0
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) { col += colorScore(ps[i].color, ps[j].color); pairs++ }
  const cohesion = pairs ? Math.max(0, Math.min(1, (col / pairs + 1.5) / 3.5)) : 0.6
  const loud = ps.filter((p) => p.pattern !== 'solid').length
  const layering = Math.min(1, (ps.length - 1) / 3)
  const themeS = hit * 5, colorS = cohesion * 5 - Math.max(0, loud - 1) * 0.8
  const creativeS = 2.2 + layering * 2.8 - (complete ? 0 : 1.5)
  const clamp = (x) => Math.max(1, Math.min(5, Math.round(x * 2) / 2))
  const scores = [clamp(themeS * 0.6 + creativeS * 0.4), clamp(colorS * 0.7 + themeS * 0.3), clamp(themeS * 0.5 + creativeS * 0.5 + (Math.random() - 0.5))]
  const penalty = complete ? 0 : 1.5
  const final = scores.map((s) => Math.max(1, s - penalty))
  const avg = final.reduce((a, b) => a + b, 0) / 3
  return {
    avg, complete,
    judges: JUDGES.map((j, i) => ({ name: j.name, emoji: j.emoji, stars: final[i], line: pick(final[i] >= 4 ? j.hi : final[i] >= 2.5 ? j.mid : j.lo) })),
    rank: avg >= 4.5 ? 'Top Model' : avg >= 3.8 ? 'Trendsetter' : avg >= 3 ? 'Rising Star' : avg >= 2 ? 'New Model' : 'Fashion Victim',
  }
}

export function autoStyle(items, theme) {
  if (theme.swim) {
    const swim = items.filter((i) => i.cat === 'swim' && i.sub !== 'rash guard'), o = {}
    if (swim.length) o.top = pick(swim)
    const b = items.filter((i) => i.sub === 'shorts' && i.vibes.includes('beach')); if (b.length) o.bottom = pick(b)
    const sh = items.filter((i) => i.sub === 'shirt'); if (sh.length) o.outer = pick(sh)
    return o
  }
  let best = null
  for (const mood of theme.want) for (const o of generate(items, { mood, count: 3 })) {
    const j = judge(o, theme); if (!best || j.avg > best.j.avg) best = { o, j }
  }
  if (!best) return {}
  const { top, bottom, base, outer, dress, acc } = best.o
  return { top, bottom, base, outer, dress, acc }
}
