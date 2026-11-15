import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const SPACING = 0.5, GAP = 0.95, CARD = 1.5, RAIL_Y = 1.55
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y)
  const g = new THREE.ShapeGeometry(s, 10)
  const p = g.attributes.position, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x) / w, (p.getY(i) - y) / h)
  return g
}

function useShared() {
  return useMemo(() => {
    const v = (x, y) => new THREE.Vector3(x, y, 0)
    const hook = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v(-0.075, -0.03), v(-0.07, 0.05), v(0, 0.095), v(0.07, 0.05), v(0.045, -0.05), v(0, -0.11), v(0, -0.24)]), 40, 0.017, 8)
    const body = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v(0, -0.22), v(-0.6, -0.43), v(-0.66, -0.48), v(-0.6, -0.52), v(0, -0.52), v(0.6, -0.52), v(0.66, -0.48), v(0.6, -0.43)], true, 'catmullrom', 0.12), 90, 0.02, 8, true)
    return {
      hook, body,
      card: roundedRect(CARD, CARD, 0.13),
      frame: roundedRect(CARD + 0.1, CARD + 0.1, 0.17),
      clip: new THREE.BoxGeometry(0.07, 0.13, 0.035),
      metal: new THREE.MeshStandardMaterial({ color: '#f6c9d6', metalness: 0.9, roughness: 0.16 }),
      pearl: new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0.1, roughness: 0.25, clearcoat: 1, transparent: true, opacity: 0.92, side: THREE.DoubleSide }),
      placeholder: new THREE.MeshBasicMaterial({ color: '#f4e6ee', side: THREE.DoubleSide }),
    }
  }, [])
}

const texCache = new Map()
function loadTex(url, cb) {
  if (texCache.has(url)) return cb(texCache.get(url))
  new THREE.TextureLoader().load(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
    texCache.set(url, t); cb(t)
  })
}

function Hanger({ item, index, shared, motion, onTap }) {
  const g = useRef(), swing = useRef()
  const [tex, setTex] = useState(() => texCache.get(item.img) || null)
  const asked = useRef(false)
  const mat = useMemo(() => (tex ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide }) : null), [tex])
  useEffect(() => () => mat?.dispose(), [mat])
  useEffect(() => { asked.current = false; setTex(texCache.get(item.img) || null) }, [item.img])

  useFrame(({ clock }) => {
    const d = index - motion.pos, a = Math.abs(d)
    const node = g.current
    if (a > 11) { node.visible = false; return }
    node.visible = true
    if (!tex && !asked.current) { asked.current = true; loadTex(item.img, setTex) }
    const near = 1 - Math.min(a, 1), side = clamp(d, -1, 1)
    node.position.set(d * SPACING + side * GAP, RAIL_Y, near * 1.15 - Math.min(a, 6) * 0.05)
    node.rotation.y = -side * 1.02
    const s = 1 + near * 0.16
    node.scale.setScalar(s)
    const t = clock.elapsedTime
    swing.current.rotation.z = Math.sin(t * 1.1 + index * 1.7) * 0.012 + clamp(motion.vel * 0.55, -0.22, 0.22) * (0.6 + 0.4 * Math.sin(index * 2.3))
    swing.current.rotation.x = Math.sin(t * 0.9 + index) * 0.01
  })

  return (
    <group ref={g} onClick={(e) => { e.stopPropagation(); onTap(index) }}>
      <group ref={swing}>
        <mesh geometry={shared.hook} material={shared.metal} />
        <mesh geometry={shared.body} material={shared.metal} />
        <mesh geometry={shared.clip} material={shared.metal} position={[-0.42, -0.56, 0]} />
        <mesh geometry={shared.clip} material={shared.metal} position={[0.42, -0.56, 0]} />
        <group position={[0, -0.56 - CARD / 2 - 0.02, 0]}>
          <mesh geometry={shared.frame} material={shared.pearl} position={[0, 0, -0.012]} />
          <mesh geometry={shared.card} material={mat || shared.placeholder} />
        </group>
      </group>
    </group>
  )
}

function Scene({ items, motion, onFocus, onTap }) {
  const shared = useShared()
  const { gl, scene, camera, size } = useThree()
  const last = useRef(-1)
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
    return () => pm.dispose()
  }, [gl, scene])
  useFrame((_, dt) => {
    const max = Math.max(0, items.length - 1)
    motion.target = clamp(motion.target, -0.35, max + 0.35)
    const prev = motion.pos
    motion.pos += (motion.target - motion.pos) * Math.min(1, dt * 9)
    motion.vel += ((motion.pos - prev) / Math.max(dt, 0.001) - motion.vel) * Math.min(1, dt * 6)
    const f = clamp(Math.round(motion.pos), 0, max)
    if (f !== last.current) { last.current = f; onFocus(f) }
    const aspect = size.width / size.height
    const z = clamp(4.9 / aspect, 7.2, 11.5)
    const drop = aspect < 1 ? 0.95 : 0.6 // push the rail up so the caption never covers the piece
    camera.position.set(0, 0.42 - drop, z)
    camera.lookAt(0, 0.32 - drop, 0)
  })
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 6]} intensity={1.2} />
      <mesh position={[0, RAIL_Y, 0]} rotation={[0, 0, Math.PI / 2]} material={shared.metal}>
        <cylinderGeometry args={[0.04, 0.04, 60, 20]} />
      </mesh>
      {items.map((it, i) => <Hanger key={it.id} item={it} index={i} shared={shared} motion={motion} onTap={onTap} />)}
    </>
  )
}

export default function Closet3D({ items, focus, onFocus, onOpen, motionRef }) {
  const wrap = useRef()
  const motion = motionRef.current
  const drag = useRef(null)
  const moved = useRef(false)
  const snapT = useRef()

  useEffect(() => {
    const el = wrap.current
    const snap = () => { motion.target = Math.round(motion.target) }
    const wheel = (e) => {
      e.preventDefault()
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      motion.target += clamp(d, -120, 120) * 0.0085
      clearTimeout(snapT.current); snapT.current = setTimeout(snap, 160)
    }
    const key = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight') motion.target = Math.round(motion.target) + 1
      if (e.key === 'ArrowLeft') motion.target = Math.round(motion.target) - 1
    }
    el.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('keydown', key)
    return () => { el.removeEventListener('wheel', wheel); window.removeEventListener('keydown', key); clearTimeout(snapT.current) }
  }, [motion])

  const down = (e) => { drag.current = { x: e.clientX, t: motion.target, lx: e.clientX, lt: performance.now(), v: 0 }; moved.current = false }
  const move = (e) => {
    const d = drag.current; if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 6) moved.current = true
    const now = performance.now()
    d.v = (e.clientX - d.lx) / Math.max(1, now - d.lt); d.lx = e.clientX; d.lt = now
    motion.target = d.t - dx * (3.4 / Math.min(wrap.current.clientWidth, 900))
  }
  const up = () => {
    const d = drag.current; if (!d) return
    drag.current = null
    motion.target = Math.round(motion.target - d.v * 2.2) // flick
  }
  const tap = (i) => {
    if (moved.current) return
    if (i === Math.round(motion.pos)) onOpen(items[i])
    else motion.target = i
  }

  return (
    <div ref={wrap} className="closet3d" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}>
      <Canvas dpr={[1, 2]} camera={{ fov: 35, position: [0, 0.4, 8], near: 0.1, far: 60 }} gl={{ alpha: true, antialias: true }}>
        <Scene items={items} motion={motion} onFocus={onFocus} onTap={tap} />
      </Canvas>
    </div>
  )
}
