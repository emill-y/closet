import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* A real clothing rail: garments hang from hooks and swing like pendulums.
   Drag the rail to scroll; brush past a piece to set it swinging. */

const SPACING = 0.9
const VIEW_H = 3.0      // world units visible top-to-bottom
const MAX_W = 0.86      // every garment is about shoulder-width, like a real rail
const RAIL_Y = 2.08
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

// how long each kind of garment hangs, in world units
const DROP = {
  'baby tee': 1.08, 'crop tee': 1.06, 'crop top': 1.02, tank: 1.2, cami: 1.12, tee: 1.3,
  'long sleeve': 1.38, shirt: 1.58, blouse: 1.3, sweater: 1.38, hoodie: 1.52, crewneck: 1.44,
  fleece: 1.52, jacket: 1.52, puffer: 1.58, blazer: 1.72, jeans: 2.0, pants: 2.0, cargos: 2.0,
  flares: 2.04, leggings: 1.92, sweats: 1.92, shorts: 1.12, skirt: 1.16, 'mini dress': 1.74,
  sundress: 1.92, 'maxi dress': 2.3, bikini: 0.72, 'one-piece': 1.12, 'rash guard': 1.26,
  beanie: 0.56, headband: 0.4, bag: 0.8, shoes: 0.6, jewelry: 0.5, scarf: 1.2, belt: 0.8,
}
export function sizeOf(item) {
  const ar = Math.max(0.18, Math.min(item.ar || 0.92, 3))
  // fit inside a slot-wide, kind-tall box without distorting the photo
  const h = Math.min(MAX_W / ar, DROP[item.sub] || 1.3)
  return [h * ar, h]
}

const texCache = new Map()
function loadTex(url, cb) {
  const hit = texCache.get(url)
  if (hit) { hit.refs++; return cb(hit.tex) }
  const tex = new THREE.TextureLoader().load(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    t.minFilter = THREE.LinearMipmapLinearFilter
    cb(t)
  })
  texCache.set(url, { tex, refs: 1 })
}

function Garment({ item, index, rail, hover, setHover, onOpen }) {
  const pivot = useRef()
  const [tex, setTex] = useState(null)
  const asked = useRef(false)
  const sway = useRef({ a: Math.random() * 0.04 - 0.02, v: 0, phase: Math.random() * 7 })
  const [w, h] = useMemo(() => sizeOf(item), [item])

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h, 1, 1)
    g.translate(0, -h / 2, 0) // pivot at the hanger hook
    return g
  }, [w, h])
  useEffect(() => () => geo.dispose(), [geo])

  const mat = useMemo(() => tex && new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, toneMapped: false, side: THREE.DoubleSide }), [tex])
  const shadow = useMemo(() => tex && new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.085, color: '#5a3f52', depthWrite: false, toneMapped: false }), [tex])
  useEffect(() => () => { mat?.dispose(); shadow?.dispose() }, [mat, shadow])

  useFrame((state, dt) => {
    const g = pivot.current
    if (!g) return
    const x = index * SPACING
    const near = Math.abs(x - rail.pos) < 7.5
    g.visible = near
    if (!near) return
    if (!tex && !asked.current) { asked.current = true; loadTex(item.img, setTex) }

    const s = sway.current
    const d = Math.min(dt, 0.05)
    // pendulum: the rail's acceleration pushes it, a spring and damping bring it home
    s.v += -rail.accel * 0.9 * d * 60
    s.v += -s.a * 16 * d
    s.v *= 1 - 1.7 * d
    s.v += Math.sin(state.clock.elapsedTime * 0.7 + s.phase) * 0.00035
    s.a = clamp(s.a + s.v * d, -0.6, 0.6)
    const lift = hover === index ? 1 : 0
    g.position.x = x
    g.position.z += (lift * 0.42 - g.position.z) * Math.min(1, d * 9)
    g.position.y = RAIL_Y
    g.rotation.z += (s.a - g.rotation.z) * Math.min(1, d * 30)
    const sc = 1 + lift * 0.03
    g.scale.setScalar(g.scale.x + (sc - g.scale.x) * Math.min(1, d * 9))
  })

  const hookColor = '#c7a98f'
  return (
    <group ref={pivot} position={[index * SPACING, RAIL_Y, 0]}>
      {/* hook + hanger bar, mostly hidden behind the shoulders */}
      <mesh position={[0, 0.085, -0.02]}>
        <torusGeometry args={[0.052, 0.011, 8, 18, Math.PI * 1.45]} />
        <meshStandardMaterial color={hookColor} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.03, -0.02]}>
        <boxGeometry args={[0.016, 0.1, 0.016]} />
        <meshStandardMaterial color={hookColor} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.1, -0.02]} rotation={[0, 0, 0]}>
        <boxGeometry args={[Math.min(w * 0.62, 0.52), 0.022, 0.018]} />
        <meshStandardMaterial color={hookColor} metalness={0.4} roughness={0.4} />
      </mesh>
      {mat && (
        <>
          <mesh geometry={geo} material={shadow} position={[0.05, -0.04, -0.05]} scale={1.02} />
          <mesh
            geometry={geo}
            material={mat}
            position={[0, -0.09, 0]}
            onPointerOver={(e) => { e.stopPropagation(); setHover(index) }}
            onPointerOut={() => setHover((v) => (v === index ? -1 : v))}
            onPointerMove={(e) => { // brushing past a piece sets it swinging
              const mx = e.nativeEvent?.movementX || 0
              if (!rail.dragging && mx) sway.current.v += clamp(-mx * 0.0022, -0.09, 0.09)
            }}
            onClick={(e) => { e.stopPropagation(); if (!rail.moved) onOpen(item) }}
          />
        </>
      )}
    </group>
  )
}

function Scene({ items, rail, hover, setHover, onOpen, onView }) {
  const { camera, size } = useThree()
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05)
    const aspect = size.width / size.height
    const vh = VIEW_H * (aspect < 1 ? 1.22 : 1)
    const vw = vh * aspect
    const run = (items.length - 1) * SPACING
    // keep the rail filling the frame instead of letting it slide off-centre
    const edge = SPACING * 0.62
    let lo = vw / 2 - edge
    let hi = run - vw / 2 + edge
    if (lo > hi) lo = hi = run / 2
    if (!rail.dragging) {
      rail.target += rail.fling * d
      rail.fling *= 1 - 3.2 * d
      if (Math.abs(rail.fling) < 0.01) rail.fling = 0
    }
    rail.lo = lo; rail.hi = hi
    if (rail.target < lo) { rail.target += (lo - rail.target) * Math.min(1, d * 10); rail.fling *= 0.6 }
    if (rail.target > hi) { rail.target += (hi - rail.target) * Math.min(1, d * 10); rail.fling *= 0.6 }
    const prev = rail.pos
    rail.pos += (rail.target - rail.pos) * Math.min(1, d * 12)
    const vel = (rail.pos - prev) / Math.max(d, 0.001)
    rail.accel = (vel - rail.vel) * 0.016
    rail.vel = vel
    const k = clamp(Math.round(rail.pos / SPACING), 0, items.length - 1)
    if (k !== rail.lastIdx) { rail.lastIdx = k; onView(k) }
    const z = (vh / 2) / Math.tan((camera.fov * Math.PI) / 360)
    const y = RAIL_Y + 0.32 - vh / 2
    camera.position.set(rail.pos, y, z)
    camera.lookAt(rail.pos, y, 0)
  })
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 4, 5]} intensity={0.8} />
      {/* the rail itself */}
      <mesh position={[(items.length - 1) * SPACING / 2, RAIL_Y + 0.085, -0.06]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, items.length * SPACING + 6, 14]} />
        <meshStandardMaterial color="#b9a596" metalness={0.45} roughness={0.42} />
      </mesh>
      {items.map((it, i) => (
        <Garment key={it.id} item={it} index={i} rail={rail} hover={hover} setHover={setHover} onOpen={onOpen} />
      ))}
    </>
  )
}

export default function Rail({ items, onOpen, onView, railRef }) {
  const wrap = useRef()
  const [hover, setHover] = useState(-1)
  const drag = useRef(null)
  const rail = railRef.current

  useEffect(() => {
    const el = wrap.current
    const wheel = (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(d) < 0.5) return
      e.preventDefault()
      rail.target += clamp(d, -140, 140) * 0.0075
      rail.fling = 0
    }
    const key = (e) => {
      if (/INPUT|TEXTAREA/.test(e.target.tagName)) return
      if (e.key === 'ArrowRight') rail.target += SPACING
      if (e.key === 'ArrowLeft') rail.target -= SPACING
    }
    el.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('keydown', key)
    return () => { el.removeEventListener('wheel', wheel); window.removeEventListener('keydown', key) }
  }, [rail])

  const unit = () => (wrap.current ? 7.2 / wrap.current.clientWidth : 0.01)

  // Drag handling lives on the window so the canvas still receives its own
  // click events — capturing the pointer on the wrapper would swallow them.
  useEffect(() => {
    const move = (e) => {
      const d = drag.current
      if (!d) return
      const dx = e.clientX - d.x
      if (Math.abs(dx) > 5) rail.moved = true
      const now = performance.now()
      d.v = (e.clientX - d.lx) / Math.max(1, now - d.lt)
      d.lx = e.clientX
      d.lt = now
      rail.target = d.t - dx * unit()
    }
    const up = () => {
      const d = drag.current
      if (!d) return
      drag.current = null
      rail.dragging = false
      rail.fling = clamp(-d.v * 900, -2600, 2600) * unit()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [rail])

  const down = (e) => {
    drag.current = { x: e.clientX, t: rail.target, lx: e.clientX, lt: performance.now(), v: 0 }
    rail.dragging = true
    rail.moved = false
    rail.fling = 0
  }

  return (
    <div
      ref={wrap}
      className={'rail' + (hover >= 0 ? ' pointing' : '')}
      onPointerDown={down}
    >
      <Canvas dpr={[1, 2]} camera={{ fov: 32, position: [0, 1.24, 6], near: 0.1, far: 60 }} gl={{ alpha: true, antialias: true }}>
        <Scene items={items} rail={rail} hover={hover} setHover={setHover} onOpen={onOpen} onView={onView} />
      </Canvas>
    </div>
  )
}

export function makeRail() {
  return {
    pos: 0, target: 0, vel: 0, accel: 0, fling: 0, dragging: false, moved: false, lastIdx: 0,
    lo: 0, hi: 0,
  }
}
