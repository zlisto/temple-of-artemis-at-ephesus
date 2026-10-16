import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Building blocks shared by the wonder scenes: materials, columns, steps, trees, water, boats.

const mats = new Map()
export const mat = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o }))
  return mats.get(k)
}
export const GOLD = { metalness: 0.85, roughness: 0.28 }
export const BRONZE = { metalness: 0.75, roughness: 0.38 }

export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 24),
  fluted: new THREE.CylinderGeometry(1, 1.08, 1, 20), // a column shaft with a slight taper
  cone: new THREE.ConeGeometry(1, 1, 24),
  sph: new THREE.SphereGeometry(1, 24, 16),
  pyr: new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1).rotateY(Math.PI / 4), // square base, side 1
}

export const Box = ({ p, s, r = [0, 0, 0], c, o, m: material }) => (
  <mesh geometry={GEO.box} material={material ?? mat(c, o)} position={p} scale={s} rotation={r} />
)
export const Cyl = ({ p, s, r = [0, 0, 0], c, o, m: material }) => (
  <mesh geometry={GEO.cyl} material={material ?? mat(c, o)} position={p} scale={s} rotation={r} />
)

// many copies of one mesh: items = [{ p: [x, y, z], s: [sx, sy, sz], r: yaw }]
export function Instanced({ items, geometry, material }) {
  const ref = useRef()
  useLayoutEffect(() => {
    if (!ref.current) return // nothing to draw
    const mtx = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    items.forEach((it, i) => {
      e.set(0, it.r ?? 0, 0)
      q.setFromEuler(e)
      mtx.compose(new THREE.Vector3(...it.p), q, new THREE.Vector3(...(it.s ?? [1, 1, 1])))
      ref.current.setMatrixAt(i, mtx)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [items])
  if (!items.length) return null
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} frustumCulled={false} />
}

// a row of columns: points [[x, z], ...], each with base, shaft and capital, standing on y0
export function Columns({ points, y0 = 0, h = 8, r = 0.5, color = '#efe9dc', order = 'doric' }) {
  const items = useMemo(() => {
    const shaft = points.map(([x, z]) => ({ p: [x, y0 + h / 2, z], s: [r, h, r] }))
    const base = points.map(([x, z]) => ({ p: [x, y0 + 0.15, z], s: [r * 2.6, 0.3, r * 2.6] }))
    const cap = points.map(([x, z]) => ({ p: [x, y0 + h + 0.15, z], s: [r * (order === 'ionic' ? 3.2 : 2.6), 0.3, r * 2.6] }))
    const volute = order === 'ionic' ? points.map(([x, z]) => ({ p: [x, y0 + h - 0.05, z], s: [r * 1.5, 0.25, r * 1.5] })) : []
    return { shaft, base, cap, volute }
  }, [points, y0, h, r, order])
  const m = mat(color, { roughness: 0.65 })
  return (
    <>
      <Instanced items={items.shaft} geometry={GEO.fluted} material={m} />
      <Instanced items={items.base} geometry={GEO.box} material={m} />
      <Instanced items={items.cap} geometry={GEO.box} material={m} />
      <Instanced items={items.volute} geometry={GEO.sph} material={m} />
    </>
  )
}

// a stepped platform (stylobate): n steps, each `rise` high, shrinking by `inset` per step
export function Steps({ x = 0, z = 0, w, d, n = 3, rise = 0.4, inset = 0.6, color = '#e8e1d2' }) {
  return Array.from({ length: n }, (_, i) => (
    <Box key={i} p={[x, rise * (i + 0.5), z]} s={[w - inset * 2 * i, rise, d - inset * 2 * i]} c={color} o={{ roughness: 0.75 }} />
  ))
}

// a triangular gable (pediment) facing +z/-z, for temple fronts
export function Pediment({ x = 0, y, z, w, h, depth = 0.8, color = '#ece5d6' }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-w / 2, 0)
    s.lineTo(w / 2, 0)
    s.lineTo(0, h)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }).translate(0, 0, -depth / 2)
  }, [w, h, depth])
  return <mesh geometry={geo} material={mat(color)} position={[x, y, z]} />
}

// a pitched roof running along z over a w × d footprint
export function Roof({ x = 0, y, z = 0, w, d, h, color = '#b5643a' }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-w / 2, 0)
    s.lineTo(w / 2, 0)
    s.lineTo(0, h)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2)
  }, [w, d, h])
  return <mesh geometry={geo} material={mat(color, { roughness: 0.9 })} position={[x, y, z]} />
}

export function Palm({ x, z, h = 7, lean = 0.1, r = 0 }) {
  return (
    <group position={[x, 0, z]} rotation={[0, r, lean]}>
      <Cyl p={[0, h / 2, 0]} s={[0.18, h, 0.18]} c="#8a6a48" />
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2
        return <Box key={i} p={[Math.sin(a) * 1.3, h - 0.2, Math.cos(a) * 1.3]} r={[Math.cos(a) * 0.5, a, -Math.sin(a) * 0.5]} s={[0.5, 0.06, 2.8]} c="#4f7d2e" />
      })}
    </group>
  )
}

export function Cypress({ x, z, h = 8 }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 0.6, 0]} s={[0.18, 1.2, 0.18]} c="#5a3d2b" />
      <mesh geometry={GEO.sph} material={mat('#2f5a32')} position={[0, h * 0.55, 0]} scale={[0.9, h * 0.5, 0.9]} />
    </group>
  )
}

export function Bush({ x, z, s = 1, c = '#4f7d3a' }) {
  return <mesh geometry={GEO.sph} material={mat(c)} position={[x, 0.5 * s, z]} scale={[1.2 * s, 0.8 * s, 1.2 * s]} />
}

// open water with a gentle shimmer: a big plane at y, over [x0..x1] × [z0..z1]
export function Water({ x0, x1, z0, z1, y = 0.05, color = '#2f7fa8' }) {
  const ref = useRef()
  const hsl = useMemo(() => new THREE.Color(color).getHSL({}), [color])
  useFrame(({ clock }) => {
    ref.current.material.color.setHSL(hsl.h, hsl.s, hsl.l + Math.sin(clock.elapsedTime * 0.8) * 0.02)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, y, (z0 + z1) / 2]}>
      <planeGeometry args={[x1 - x0, z1 - z0]} />
      <meshStandardMaterial color={color} roughness={0.15} metalness={0.3} />
    </mesh>
  )
}

// a small wooden sailing boat, bobbing
export function Boat({ x, z, r = 0, sail = '#efe6d0', phase = 0 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    ref.current.position.y = 0.15 + Math.sin(t * 1.2) * 0.12
    ref.current.rotation.z = Math.sin(t * 0.9) * 0.05
  })
  return (
    <group ref={ref} position={[x, 0.15, z]} rotation={[0, r, 0]}>
      <Box p={[0, 0.35, 0]} s={[1.8, 0.7, 6]} c="#7a4a26" />
      <Box p={[0, 0.75, 2.6]} r={[0.5, 0, 0]} s={[1.4, 0.3, 1.2]} c="#7a4a26" />
      <Cyl p={[0, 3.2, 0]} s={[0.08, 5, 0.08]} c="#5a3a22" />
      <Box p={[0, 3.6, 0.1]} s={[3.2, 3.2, 0.05]} c={sail} />
    </group>
  )
}

// a far ring of low hills so the horizon isn't bare
export function Hills({ color = '#c9b07a', r = 300, n = 18, h = 25 }) {
  const items = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2
        const k = 0.7 + ((i * 37) % 10) / 15
        return { p: [Math.sin(a) * r, -h * 0.35, Math.cos(a) * r], s: [60 * k, h * k, 40 * k], r: a }
      }),
    [r, n, h],
  )
  return <Instanced items={items} geometry={GEO.sph} material={mat(color, { roughness: 1 })} />
}
