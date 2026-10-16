// From zlisto/evans-hall-3d (src/Labubu.jsx), unchanged apart from this line.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A Labubu built from primitives (no model files).
// Customize with props:
//   fur         any CSS color ('#5a3d2e' classic brown, '#ff8fc7' pink, ...)
//   expression  'grin' | 'happy' | 'surprised' | 'sleepy' | 'mischief'
//   shirt       null | 'yale' | 'stripes' | any CSS color (plain tee)
//   pants       null | any CSS color
//   overalls    true → bib + straps in the pants color (pass pants too)
//   hat         null | 'bucket' | any CSS color (bucket hat in that color)
//   anim        'idle' | 'hop' | 'dance' | 'wave' | 'spin' | 'circle' | 'catch'
//   circle      { center: [x, z], radius, speed } when anim = 'circle'
//   sitting     true → legs stick forward (put the root on a chair seat)
//   height      meters (default 1)
//   phase       animation offset so a crowd doesn't move in sync

export const SKIN = '#f3c9a5'
export const YALE_BLUE = '#00356b'
export const EXPRESSIONS = ['grin', 'happy', 'surprised', 'sleepy', 'mischief']

// ---------- shared textures (built once, cached)
const cache = new Map()
const once = (key, make) => {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key)
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'))
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// grayscale fur noise, tinted by material color
export const furTex = () =>
  once('fur', () => {
    const t = canvasTex(256, 256, (g) => {
      g.fillStyle = '#d8d8d8'
      g.fillRect(0, 0, 256, 256)
      for (let i = 0; i < 5000; i++) {
        const v = 150 + Math.floor(Math.random() * 105)
        g.strokeStyle = `rgba(${v},${v},${v},0.55)`
        g.lineWidth = 1
        const x = Math.random() * 256
        const y = Math.random() * 256
        g.beginPath()
        g.moveTo(x, y)
        g.lineTo(x + Math.random() * 4 - 2, y + 4 + Math.random() * 6)
        g.stroke()
      }
    })
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3, 3)
    return t
  })

function star(g, x, y, r) {
  g.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2
    const rr = i % 2 ? r * 0.28 : r
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  g.closePath()
  g.fill()
}

function eye(g, x, y, mode, flip) {
  if (mode === 'closed') {
    g.strokeStyle = '#3a2416'
    g.lineWidth = 9
    g.beginPath()
    g.arc(x, y + 14, 34, Math.PI * 1.15, Math.PI * 1.85)
    g.stroke()
    return
  }
  const big = mode === 'wide' ? 1.15 : 1
  g.fillStyle = '#fffaf2'
  g.beginPath()
  g.ellipse(x, y, 48 * big, 58 * big, 0, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#d9a774'
  g.lineWidth = 4
  g.stroke()
  g.fillStyle = '#2b1a10'
  g.beginPath()
  g.ellipse(x, y + 4, 34 * big, 44 * big, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#e8b64c'
  star(g, x + (flip ? -8 : 8), y - 6, 15)
  star(g, x + (flip ? 12 : -12), y + 18, 7)
  if (mode === 'sleepy') {
    // heavy lids
    g.fillStyle = SKIN
    g.fillRect(x - 60, y - 70, 120, 62)
    g.strokeStyle = '#3a2416'
    g.lineWidth = 6
    g.beginPath()
    g.moveTo(x - 46, y - 8)
    g.quadraticCurveTo(x, y + 2, x + 46, y - 8)
    g.stroke()
  }
}

function teethGrin(g, cx, y, w, open = 26, tilt = 0) {
  // smile line + row of pointy teeth hanging below it
  const left = cx - w / 2
  const right = cx + w / 2
  g.fillStyle = '#3a1e14'
  g.beginPath()
  g.moveTo(left, y + tilt)
  g.quadraticCurveTo(cx, y + open * 2.2, right, y - tilt)
  g.quadraticCurveTo(cx, y + open * 0.9, left, y + tilt)
  g.fill()
  g.fillStyle = '#ffffff'
  const n = 9
  for (let i = 0; i < n; i++) {
    const u0 = i / n
    const u1 = (i + 1) / n
    const um = (u0 + u1) / 2
    const at = (u) => {
      const x = left + (right - left) * u
      const yy = y + tilt * (1 - 2 * u) + open * 0.9 * 4 * u * (1 - u) * 0.95
      return [x, yy]
    }
    const a = at(u0)
    const b = at(u1)
    const m = at(um)
    g.beginPath()
    g.moveTo(a[0], a[1])
    g.lineTo(b[0], b[1])
    g.lineTo(m[0], m[1] + open * 0.75)
    g.closePath()
    g.fill()
  }
}

export const faceTex = (expression) =>
  once(`face-${expression}`, () =>
    canvasTex(512, 440, (g) => {
      g.fillStyle = SKIN
      g.fillRect(0, 0, 512, 440)
      // rosy cheeks + freckles
      g.fillStyle = 'rgba(240,140,120,0.35)'
      for (const x of [110, 402]) {
        g.beginPath()
        g.ellipse(x, 250, 46, 30, 0, 0, Math.PI * 2)
        g.fill()
      }
      g.fillStyle = '#b06a4a'
      for (const [x, y] of [[96, 236], [112, 248], [126, 232], [386, 236], [400, 248], [416, 232], [236, 268], [276, 268], [256, 278]])
        g.fillRect(x, y, 5, 5)

      const L = [168, 170]
      const R = [344, 170]
      if (expression === 'happy') {
        eye(g, ...L, 'closed')
        eye(g, ...R, 'closed')
      } else if (expression === 'surprised') {
        eye(g, ...L, 'wide')
        eye(g, ...R, 'wide', true)
      } else if (expression === 'sleepy') {
        eye(g, ...L, 'sleepy')
        eye(g, ...R, 'sleepy', true)
      } else if (expression === 'mischief') {
        eye(g, ...L, 'open')
        eye(g, ...R, 'closed')
        g.strokeStyle = '#3a2416'
        g.lineWidth = 7
        g.beginPath()
        g.moveTo(118, 96)
        g.lineTo(210, 112)
        g.stroke()
      } else {
        eye(g, ...L, 'open')
        eye(g, ...R, 'open', true)
      }
      // nose
      g.fillStyle = '#3a2416'
      g.beginPath()
      g.ellipse(256, 250, 14, 10, 0, 0, Math.PI * 2)
      g.fill()
      // mouth
      if (expression === 'surprised') {
        g.fillStyle = '#3a1e14'
        g.beginPath()
        g.ellipse(256, 330, 34, 40, 0, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#ffffff'
        for (let i = 0; i < 4; i++) {
          g.beginPath()
          g.moveTo(232 + i * 12, 300)
          g.lineTo(244 + i * 12, 300)
          g.lineTo(238 + i * 12, 316)
          g.fill()
        }
      } else if (expression === 'sleepy') {
        teethGrin(g, 256, 312, 220, 12)
      } else if (expression === 'mischief') {
        teethGrin(g, 270, 306, 300, 24, 22)
      } else {
        teethGrin(g, 256, 300, 360, expression === 'happy' ? 34 : 26)
      }
    }),
  )

export const shirtTex = (kind) =>
  once(`shirt-${kind}`, () =>
    canvasTex(512, 256, (g) => {
      if (kind === 'stripes') {
        for (let y = 0; y < 256; y += 32) {
          g.fillStyle = (y / 32) % 2 ? '#f4f1ea' : '#1c1c1e'
          g.fillRect(0, y, 512, 32)
        }
        return
      }
      g.fillStyle = kind === 'yale' ? YALE_BLUE : '#ffffff'
      g.fillRect(0, 0, 512, 256)
      if (kind === 'yale') {
        g.fillStyle = '#ffffff'
        g.font = 'bold 120px Georgia, serif'
        g.textAlign = 'center'
        g.fillText('Y', 256, 170)
      }
    }),
  )

// ---------- materials, cached by color
const mat = (key, make) => once(`m-${key}`, make)
const furMat = (c) => mat(`fur-${c}`, () => new THREE.MeshStandardMaterial({ color: c, map: furTex(), bumpMap: furTex(), bumpScale: 2, roughness: 1 }))
const plainMat = (c, rough = 0.8) => mat(`plain-${c}-${rough}`, () => new THREE.MeshStandardMaterial({ color: c, roughness: rough }))
const skinMat = () => plainMat(SKIN, 0.55)
const faceMat = (e) => mat(`face-${e}`, () => new THREE.MeshStandardMaterial({ map: faceTex(e), roughness: 0.5 }))
function shirtMat(shirt) {
  if (shirt === 'yale') return mat('shirt-yale', () => new THREE.MeshStandardMaterial({ map: shirtTex('yale'), roughness: 0.85 }))
  if (shirt === 'stripes') return mat('shirt-stripes', () => new THREE.MeshStandardMaterial({ map: shirtTex('stripes'), roughness: 0.85 }))
  return plainMat(shirt, 0.85)
}

// ---------- shared geometry
export const G = {
  sphere: new THREE.SphereGeometry(1, 28, 20),
  face: new THREE.SphereGeometry(1, 32, 20, Math.PI / 2 - 0.78, 1.56, Math.PI / 2 - 0.62, 1.32),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 24),
  shirt: (() => {
    const g = new THREE.CylinderGeometry(0.8, 1.05, 1, 32)
    g.rotateY(Math.PI) // texture center (the "Y") faces forward
    return g
  })(),
  limb: new THREE.CapsuleGeometry(1, 1, 6, 12),
  box: new THREE.BoxGeometry(1, 1, 1),
}

function Ball({ p, s, m, r = [0, 0, 0] }) {
  return <mesh geometry={G.sphere} material={m} position={p} scale={s} rotation={r} />
}

export default function Labubu({
  fur = '#5a3d2e',
  expression = 'grin',
  shirt = null,
  pants = null,
  overalls = false,
  hat = null,
  sitting = false,
  anim = 'idle',
  circle,
  height = 1,
  phase = 0,
  position = [0, 0, 0],
  rotation = 0,
}) {
  const root = useRef()
  const body = useRef()
  const armL = useRef()
  const armR = useRef()
  const F = furMat(fur)
  const S = skinMat()
  const shirtM = shirt ? shirtMat(shirt) : null
  const pantsM = pants ? plainMat(pants, 0.9) : null
  const hatM = hat ? plainMat(hat === 'bucket' ? '#e9dfc8' : hat, 0.95) : null
  const dark = plainMat('#3a2416', 0.6)
  const gold = useMemo(() => mat('gold', () => new THREE.MeshStandardMaterial({ color: '#c9a44a', metalness: 0.8, roughness: 0.3 })), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    const b = body.current
    if (!b) return
    b.position.y = 0
    b.rotation.set(0, 0, 0)
    b.scale.set(1, 1, 1)
    armL.current.rotation.set(0, 0, 0.55)
    armR.current.rotation.set(0, 0, -0.55)
    const breathe = 1 + Math.sin(t * 2) * 0.015
    if (anim === 'hop') {
      const h = Math.abs(Math.sin(t * 3.2))
      b.position.y = h * 0.35
      b.scale.set(1 + (1 - h) * 0.08, 1 - (1 - h) * 0.1, 1 + (1 - h) * 0.08)
      armL.current.rotation.z = 0.55 + h * 1.6
      armR.current.rotation.z = -0.55 - h * 1.6
    } else if (anim === 'dance') {
      b.rotation.z = Math.sin(t * 3) * 0.18
      b.rotation.y = Math.sin(t * 1.5) * 0.4
      b.position.y = Math.abs(Math.sin(t * 6)) * 0.06
      armL.current.rotation.z = 1.6 + Math.sin(t * 6) * 0.5
      armR.current.rotation.z = -1.6 + Math.sin(t * 6 + 1) * 0.5
    } else if (anim === 'wave') {
      armR.current.rotation.z = -2.4 + Math.sin(t * 8) * 0.45
      b.rotation.z = Math.sin(t * 2) * 0.05
      b.scale.setScalar(breathe)
    } else if (anim === 'spin') {
      b.rotation.y = t * 3
      b.position.y = Math.abs(Math.sin(t * 6)) * 0.08
      armL.current.rotation.z = 1.5
      armR.current.rotation.z = -1.5
    } else if (anim === 'circle' && circle) {
      const a = t * (circle.speed ?? 0.8)
      root.current.position.set(circle.center[0] + Math.cos(a) * circle.radius, position[1], circle.center[1] + Math.sin(a) * circle.radius)
      root.current.rotation.y = -a + ((circle.speed ?? 0.8) > 0 ? 0 : Math.PI) // face the way it runs
      b.position.y = Math.abs(Math.sin(t * 9)) * 0.07
      armL.current.rotation.x = Math.sin(t * 9) * 0.6
      armR.current.rotation.x = -Math.sin(t * 9) * 0.6
    } else if (anim === 'catch') {
      const k = (Math.sin(t * Math.PI / 1.6) + 1) / 2 // matches the ball's toss timing
      armL.current.rotation.z = 0.8 + k * 1.4
      armR.current.rotation.z = -0.8 - k * 1.4
      b.position.y = k * 0.05
    } else {
      b.scale.setScalar(breathe)
      b.rotation.y = Math.sin(t * 0.7) * 0.25
    }
  })

  const legs = [-0.085, 0.085]
  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]} scale={height}>
      <group ref={body}>
        {/* legs + feet */}
        {legs.map((x) =>
          sitting ? (
            <group key={x}>
              <mesh geometry={G.cyl} material={pantsM || F} position={[x, 0.15, 0.12]} rotation={[Math.PI / 2, 0, 0]} scale={[pantsM ? 0.078 : 0.07, 0.2, pantsM ? 0.078 : 0.07]} />
              <Ball p={[x, 0.17, 0.23]} s={[0.065, 0.09, 0.035]} m={S} />
            </group>
          ) : (
            <group key={x}>
              <mesh geometry={G.cyl} material={pantsM || F} position={[x, 0.12, 0]} scale={[pantsM ? 0.078 : 0.07, 0.18, pantsM ? 0.078 : 0.07]} />
              <Ball p={[x, 0.03, 0.03]} s={[0.065, 0.035, 0.09]} m={S} />
            </group>
          ),
        )}
        {/* body */}
        <Ball p={[0, 0.34, 0]} s={[0.2, 0.23, 0.18]} m={F} />
        {pantsM && <mesh geometry={G.cyl} material={pantsM} position={[0, 0.22, 0]} scale={[0.19, 0.12, 0.17]} />}
        {shirtM && <mesh geometry={G.shirt} material={shirtM} position={[0, 0.39, 0]} scale={[0.207, 0.22, 0.188]} />}
        {overalls && pantsM && (
          <>
            <mesh geometry={G.box} material={pantsM} position={[0, 0.38, 0.172]} scale={[0.15, 0.15, 0.025]} />
            <mesh geometry={G.box} material={pantsM} position={[-0.065, 0.46, 0.15]} rotation={[-0.4, 0, 0]} scale={[0.03, 0.14, 0.02]} />
            <mesh geometry={G.box} material={pantsM} position={[0.065, 0.46, 0.15]} rotation={[-0.4, 0, 0]} scale={[0.03, 0.14, 0.02]} />
            <mesh geometry={G.cyl} material={gold} position={[0, 0.4, 0.187]} rotation={[Math.PI / 2, 0, 0]} scale={[0.025, 0.005, 0.025]} />
          </>
        )}
        {!shirtM && !overalls && (
          <mesh geometry={G.cyl} material={gold} position={[0, 0.47, 0.17]} rotation={[Math.PI / 2 - 0.3, 0, 0]} scale={[0.028, 0.005, 0.028]} />
        )}
        {/* arms pivot at the shoulders */}
        {[
          [armL, 1], // armL/armR are the figure's own left/right; +z rotation swings outward
          [armR, -1],
        ].map(([ref, side]) => (
          <group key={side} ref={ref} position={[0.17 * side, 0.47, 0]}>
            <mesh geometry={G.limb} material={F} position={[0, -0.09, 0]} scale={[0.045, 0.06, 0.045]} />
            {shirtM && <mesh geometry={G.cyl} material={shirtM} position={[0, -0.04, 0]} scale={[0.056, 0.07, 0.056]} />}
            <Ball p={[0, -0.18, 0.01]} s={[0.04, 0.045, 0.035]} m={S} />
          </group>
        ))}
        {/* head: fur hood, face, ears */}
        <group position={[0, 0.7, 0]}>
          <Ball p={[0, 0, 0]} s={[0.27, 0.25, 0.25]} m={F} />
          <mesh geometry={G.face} material={faceMat(expression)} position={[0, -0.02, 0.012]} scale={[0.245, 0.235, 0.255]} />
          {[-1, 1].map((side) => (
            <group key={side} position={[0.115 * side, 0.27, -0.02]} rotation={[0, 0, -0.14 * side]}>
              <Ball p={[0, 0, 0]} s={[0.075, 0.17, 0.05]} m={F} />
              <Ball p={[0, -0.01, 0.03]} s={[0.042, 0.12, 0.025]} m={S} />
              <Ball p={[0, -0.02, 0.05]} s={[0.012, 0.055, 0.008]} m={dark} />
            </group>
          ))}
          {hatM && (
            <group position={[0, 0.17, 0]} rotation={[-0.12, 0, 0]}>
              <mesh geometry={G.cyl} material={hatM} scale={[0.25, 0.09, 0.24]} />
              <mesh geometry={G.cyl} material={hatM} position={[0, -0.04, 0.02]} scale={[0.31, 0.012, 0.3]} />
              <mesh geometry={G.cyl} material={plainMat('#3a2a1c')} position={[0, -0.02, 0]} scale={[0.252, 0.02, 0.242]} />
            </group>
          )}
        </group>
      </group>
    </group>
  )
}

// a ball tossed back and forth between two spots (for anim="catch" pairs)
export function TossBall({ from, to, y = 0, height = 1, color = '#ff4fa3' }) {
  const ref = useRef()
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.4 }), [color])
  useFrame(({ clock }) => {
    const T = 1.6
    const t = clock.elapsedTime % (2 * T)
    const fwd = t < T
    const u = (fwd ? t : t - T) / T
    const [a, b] = fwd ? [from, to] : [to, from]
    ref.current.position.set(a[0] + (b[0] - a[0]) * u, y + height * (0.75 + 1.6 * u * (1 - u)), a[1] + (b[1] - a[1]) * u)
  })
  return <mesh ref={ref} geometry={G.sphere} material={m} scale={0.12 * height} />
}
