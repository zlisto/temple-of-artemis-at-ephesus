import { useMemo } from 'react'
import * as THREE from 'three'
import Labubu from './Labubu.jsx'
import { useTalker } from './avatar.js'
import W from '../wonder.js'
import { floorAt } from '../layout.js'

// The world's guide: a Labubu dressed for the period (W.outfit), who tells you about the wonder
// when you talk to them. Accessories are built in Labubu units (head center y ≈ 0.7, face front
// z ≈ 0.25, hands at x ≈ ±0.17, y ≈ 0.29) and scaled with the figure.

const SPH = new THREE.SphereGeometry(1, 24, 16)
const CAP = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 24)
const CONE = new THREE.ConeGeometry(1, 1, 20)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const TOR = new THREE.TorusGeometry(1, 0.12, 8, 32)
const ARC = new THREE.TorusGeometry(1, 0.16, 8, 24, Math.PI)
const SKIRT = new THREE.CylinderGeometry(0.19, 0.31, 1, 32, 1, true)

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.75, side: THREE.DoubleSide, ...o }))
  return mats.get(k)
}
const GOLD = { metalness: 0.85, roughness: 0.3 }

function stripes(a, b, n = 10) {
  const c = document.createElement('canvas')
  c.width = 8
  c.height = 128
  const g = c.getContext('2d')
  for (let i = 0; i < n; i++) {
    g.fillStyle = i % 2 ? b : a
    g.fillRect(0, (i * 128) / n, 8, 128 / n + 1)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide })
}

const Mesh = ({ g = SPH, mat, c, o, p, s, r = [0, 0, 0] }) => <mesh geometry={g} material={mat ?? m(c, o)} position={p} scale={s} rotation={r} />

// each accessory by name; colors come from the outfit when it has them
const PARTS = {
  // Egypt: striped nemes headcloth with lappets, and a broad beaded collar
  nemes: ({ a = '#d4a73a', b = '#1f4f9a' }) => {
    const mat = useMemo(() => stripes(a, b, 14), [a, b])
    return (
      <>
        <Mesh g={CAP} mat={mat} p={[0, 0.76, -0.01]} s={[0.29, 0.25, 0.28]} />
        {[-1, 1].map((sx) => (
          <Mesh key={sx} g={BOX} mat={mat} p={[0.22 * sx, 0.6, 0.1]} r={[0, 0, 0.12 * sx]} s={[0.07, 0.32, 0.1]} />
        ))}
        <Mesh g={BOX} c="#b88a2a" o={GOLD} p={[0, 0.77, 0.23]} s={[0.36, 0.035, 0.05]} />
      </>
    )
  },
  collar: ({ a = '#d4a73a', b = '#2a7f8f' }) => (
    <>
      <Mesh g={TOR} c={b} p={[0, 0.5, 0.02]} r={[Math.PI / 2 - 0.15, 0, 0]} s={[0.19, 0.19, 0.5]} />
      <Mesh g={TOR} c={a} o={GOLD} p={[0, 0.53, 0.02]} r={[Math.PI / 2 - 0.15, 0, 0]} s={[0.16, 0.16, 0.4]} />
    </>
  ),
  scroll: () => (
    <group position={[-0.22, 0.3, 0.12]} rotation={[0, 0, Math.PI / 2]}>
      <Mesh g={CYL} c="#efe3bd" s={[0.035, 0.22, 0.035]} />
      {[-1, 1].map((k) => (
        <Mesh key={k} g={CYL} c="#7a4a26" p={[0, 0.12 * k, 0]} s={[0.04, 0.025, 0.04]} />
      ))}
    </group>
  ),
  // Babylon: tall cylindrical cap with a gold band, a long curled beard
  babylonCap: ({ a = '#1f3f8a', b = '#d4a73a' }) => (
    <>
      <Mesh g={CYL} c={a} p={[0, 1.0, -0.01]} s={[0.12, 0.2, 0.12]} />
      <Mesh g={CYL} c={b} o={GOLD} p={[0, 0.92, -0.01]} s={[0.125, 0.04, 0.125]} />
      <Mesh g={CYL} c={b} o={GOLD} p={[0, 1.1, -0.01]} s={[0.122, 0.015, 0.122]} />
    </>
  ),
  curledBeard: ({ a = '#2a1a12' }) => (
    <>
      <Mesh g={BOX} c={a} p={[0, 0.43, 0.21]} r={[0.15, 0, 0]} s={[0.17, 0.2, 0.06]} />
      {[0.5, 0.44, 0.38].map((y) => (
        <Mesh key={y} g={CYL} c="#3a2a1c" p={[0, y, 0.24]} r={[0, 0, Math.PI / 2]} s={[0.012, 0.17, 0.012]} />
      ))}
    </>
  ),
  watering: () => (
    <group position={[-0.24, 0.27, 0.1]}>
      <Mesh g={CYL} c="#a5663a" s={[0.07, 0.11, 0.07]} />
      <Mesh g={CYL} c="#a5663a" p={[-0.08, 0.04, 0]} r={[0, 0, 0.9]} s={[0.012, 0.14, 0.012]} />
    </group>
  ),
  // Greece: laurel wreaths, a draped himation over one shoulder
  laurel: ({ a = '#4f7d2e' }) => (
    <>
      <Mesh g={TOR} c={a} p={[0, 0.88, 0]} r={[Math.PI / 2 - 0.12, 0, 0]} s={[0.23, 0.23, 0.5]} />
      {Array.from({ length: 14 }, (_, i) => {
        const t = (i / 14) * Math.PI * 2
        return <Mesh key={i} c={a} p={[Math.sin(t) * 0.235, 0.89 + Math.cos(t) * 0.03, Math.cos(t) * 0.235]} r={[0, t, 0.6]} s={[0.035, 0.014, 0.02]} />
      })}
    </>
  ),
  himation: ({ a = '#f2ede2' }) => <Mesh g={BOX} c={a} p={[0.02, 0.37, 0.18]} r={[0, 0, 0.62]} s={[0.075, 0.52, 0.03]} />,
  torch: () => (
    <group position={[-0.23, 0.3, 0.1]}>
      <Mesh g={CYL} c="#6b4a2a" p={[0, 0.08, 0]} s={[0.018, 0.3, 0.018]} />
      <Mesh g={CONE} c="#ff9a2e" o={{ emissive: '#ff7a1a', emissiveIntensity: 2 }} p={[0, 0.28, 0]} s={[0.04, 0.1, 0.04]} />
    </group>
  ),
  // Ephesus: a silver crescent diadem, a quiver on the back, a bow
  crescent: ({ a = '#dfe4ea' }) => (
    <>
      <Mesh g={TOR} c={a} o={GOLD} p={[0, 0.88, 0]} r={[Math.PI / 2 - 0.12, 0, 0]} s={[0.225, 0.225, 0.3]} />
      <Mesh g={ARC} c={a} o={GOLD} p={[0, 0.98, 0.17]} r={[0, 0, 0]} s={[0.07, 0.07, 0.07]} />
    </>
  ),
  quiver: () => (
    <group position={[0.06, 0.45, -0.2]} rotation={[0.25, 0, -0.4]}>
      <Mesh g={CYL} c="#7a4a26" s={[0.05, 0.32, 0.05]} />
      {[-0.02, 0.015, 0.03].map((x, i) => (
        <Mesh key={i} g={CYL} c="#e9e2d0" p={[x, 0.2, 0]} s={[0.006, 0.12, 0.006]} />
      ))}
    </group>
  ),
  bow: () => <Mesh g={ARC} c="#6b4a2a" p={[-0.24, 0.32, 0.08]} r={[0, Math.PI / 2, Math.PI / 2]} s={[0.22, 0.22, 0.2]} />,
  // Caria: a royal purple band with a gold diadem; a sculptor's mallet
  diadem: ({ a = '#5a2a6e', b = '#d4a73a' }) => (
    <>
      <Mesh g={TOR} c={a} p={[0, 0.87, 0]} r={[Math.PI / 2 - 0.1, 0, 0]} s={[0.235, 0.235, 0.6]} />
      <Mesh g={BOX} c={b} o={GOLD} p={[0, 0.9, 0.22]} s={[0.07, 0.05, 0.02]} />
    </>
  ),
  mallet: () => (
    <group position={[-0.23, 0.3, 0.1]} rotation={[0, 0, 0.3]}>
      <Mesh g={CYL} c="#6b4a2a" s={[0.014, 0.22, 0.014]} />
      <Mesh g={BOX} c="#8a6a4a" p={[0, 0.12, 0]} s={[0.1, 0.06, 0.06]} />
    </group>
  ),
  // Rhodes: Helios's crown of golden rays, a bronzesmith's hammer
  rays: ({ a = '#e8b93a' }) => (
    <>
      <Mesh g={TOR} c={a} o={GOLD} p={[0, 0.87, 0]} r={[Math.PI / 2 - 0.12, 0, 0]} s={[0.235, 0.235, 0.4]} />
      {Array.from({ length: 9 }, (_, i) => {
        const t = -1.3 + (i / 8) * 2.6
        return (
          <Mesh key={i} g={CONE} c={a} o={GOLD} p={[Math.sin(t) * 0.24, 0.98, Math.cos(t) * 0.22]} r={[Math.cos(t) * 0.5, 0, -Math.sin(t) * 0.5]} s={[0.025, 0.16, 0.025]} />
        )
      })}
    </>
  ),
  hammer: () => (
    <group position={[-0.23, 0.3, 0.1]} rotation={[0, 0, 0.3]}>
      <Mesh g={CYL} c="#5a3a22" s={[0.013, 0.24, 0.013]} />
      <Mesh g={BOX} c="#555a60" o={{ metalness: 0.8, roughness: 0.35 }} p={[0, 0.13, 0]} s={[0.1, 0.045, 0.045]} />
    </group>
  ),
  // Alexandria: a sailor's felt pilos cap, a glowing lantern
  pilos: ({ a = '#8a6a48' }) => <Mesh g={CONE} c={a} p={[0, 1.0, -0.01]} s={[0.13, 0.22, 0.13]} />,
  lantern: () => (
    <group position={[0.24, 0.24, 0.1]}>
      <Mesh g={BOX} c="#6b5a3a" o={GOLD} s={[0.08, 0.11, 0.08]} />
      <Mesh g={BOX} c="#ffd27a" o={{ emissive: '#ffae3a', emissiveIntensity: 2.5 }} s={[0.065, 0.09, 0.085]} />
      <Mesh g={TOR} c="#6b5a3a" o={GOLD} p={[0, 0.08, 0]} s={[0.025, 0.025, 0.025]} />
      <pointLight color="#ffb04a" intensity={0.8} distance={2.5} />
    </group>
  ),
}

export default function Guide({ talking = false, onTalk }) {
  const { x, z, rot } = W.guide
  const y = floorAt(x, z) // stand on the causeway, platform or whatever floor is here
  const o = W.outfit
  const H = o.height ?? 1.55
  const { root, head, clickProps } = useTalker('guide', { position: [x, y, z], rotation: rot, talking, headY: 1.1 * H })
  return (
    <group ref={root} position={[x, y, z]} rotation={[0, rot, 0]} {...clickProps(onTalk)}>
      <group ref={head} />
      <group scale={H}>
        <Labubu fur={o.fur} expression={o.expression ?? 'happy'} shirt={o.shirt} anim={talking ? 'wave' : 'idle'} height={1} />
        {/* a long garment (robe, chiton, kilt) flaring to the hem */}
        {o.skirt && <mesh geometry={SKIRT} material={m(o.skirt)} position={[0, (o.skirtLength ?? 0.4) / 2, 0]} scale={[1, o.skirtLength ?? 0.4, 0.92]} />}
        {o.trim && <mesh geometry={TOR} material={m(o.trim, GOLD)} position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.31, 0.285, 0.25]} />}
        {(o.parts ?? []).map(([name, props], i) => {
          const Part = PARTS[name]
          return Part ? <Part key={i} {...(props ?? {})} /> : null
        })}
      </group>
    </group>
  )
}
