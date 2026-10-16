import { useMemo } from 'react'
import { Box, Columns, Cypress, GEO, GOLD, Hills, Instanced, Pediment, Roof, Water, mat } from './kit.jsx'
import { ALL_COLUMNS, CELLA, OUTER, PLAT } from './wonder.js'

// The Temple of Artemis at Ephesus: a white marble platform with a double ring of tall Ionic
// columns, the front ones carved with figures around their lower drums, a deep porch, a pitched
// roof with a pediment, and inside, the shrine of Artemis of the Ephesians.

const MARBLE = '#f3efe6'
const FLOOR = PLAT.h
const COL_H = 12

function ArtemisStatue({ x, z }) {
  const gold = mat('#d4a73a', GOLD)
  const dark = mat('#5a3f2a', { roughness: 0.6 })
  return (
    <group position={[x, FLOOR, z]}>
      <Box p={[0, 0.6, 0]} s={[3, 1.2, 3]} c="#e6dfd0" />
      {/* the tall, column-like body in a decorated garment, narrowing to the feet */}
      <mesh geometry={GEO.cyl} material={dark} position={[0, 2.8, 0]} scale={[0.55, 3.2, 0.5]} />
      {/* the famous rows of rounded shapes across the chest */}
      {[0, 1, 2].map((row) =>
        [-1, -0.33, 0.33, 1].map((k) => (
          <mesh key={`${row}${k}`} geometry={GEO.sph} material={gold} position={[k * 0.3, 4.3 - row * 0.32, 0.48]} scale={[0.15, 0.17, 0.12]} />
        )),
      )}
      <Box p={[0, 3.0, 0.5]} s={[0.7, 1.6, 0.05]} c="#8a5a2a" />
      {/* arms held forward, a tall polos crown */}
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * 0.62, 4.1, 0.4]} r={[-0.9, 0, 0]} s={[0.18, 0.9, 0.18]} c="#5a3f2a" />
      ))}
      <mesh geometry={GEO.sph} material={dark} position={[0, 5.0, 0]} scale={0.38} />
      <mesh geometry={GEO.cyl} material={gold} position={[0, 5.65, 0]} scale={[0.38, 0.7, 0.38]} />
      <pointLight position={[0, 6, 3]} color="#ffe0a8" intensity={25} distance={14} decay={1.5} />
    </group>
  )
}

export default function Scene() {
  const top = FLOOR + COL_H + 0.3
  const W = PLAT.x1 - PLAT.x0
  const D = PLAT.z1 - PLAT.z0
  // sculpted bands on the lower drums of the outer front columns (columnae caelatae)
  const carved = useMemo(() => OUTER.filter(([, z]) => Math.abs(z) > 32).map(([x, z]) => ({ p: [x, FLOOR + 1.6, z], s: [1.15, 1.8, 1.15] })), [])
  const ent = useMemo(
    () => [
      { p: [0, top + 1, PLAT.z1 - 2.5], s: [W - 2, 2, 5] },
      { p: [0, top + 1, PLAT.z0 + 2.5], s: [W - 2, 2, 5] },
      { p: [PLAT.x0 + 2.5, top + 1, 0], s: [5, 2, D - 2] },
      { p: [PLAT.x1 - 2.5, top + 1, 0], s: [5, 2, D - 2] },
    ],
    [top, W, D],
  )
  const cellaL = CELLA.z1 - CELLA.z0
  const cellaC = (CELLA.z0 + CELLA.z1) / 2
  return (
    <>
      <Hills color="#86a060" r={380} h={45} />
      {/* the coast and marshes of Ephesus to the west */}
      <Water x0={-400} x1={400} z0={150} z1={500} y={0.04} color="#4a8fa8" />
      {/* the stepped platform and its front staircase */}
      <Box p={[0, FLOOR / 2, 0]} s={[W, FLOOR, D]} c="#e8e2d5" />
      {Array.from({ length: 6 }, (_, i) => (
        <Box key={i} p={[0, (FLOOR / 6) * (i + 0.5), 39.7 - i * 0.66]} s={[W, FLOOR / 6, 0.7]} c={i % 2 ? '#e8e2d5' : '#ded6c6'} />
      ))}
      <Columns points={ALL_COLUMNS} y0={FLOOR} h={COL_H} r={0.85} color={MARBLE} order="ionic" />
      <Instanced items={carved} geometry={GEO.cyl} material={mat('#d9cfbf')} />
      <Instanced items={ent} geometry={GEO.box} material={mat(MARBLE)} />
      <Roof y={top + 2} w={W + 0.6} d={D + 0.6} h={5} color="#c4703f" />
      <Pediment y={top + 2} z={PLAT.z1 - 0.2} w={W} h={4.8} color={MARBLE} />
      <Pediment y={top + 2} z={PLAT.z0 + 0.2} w={W} h={4.8} color={MARBLE} />
      {/* the three windows in the front pediment, and a blue painted frieze */}
      {[-5, 0, 5].map((x) => (
        <Box key={x} p={[x, top + 3.6, PLAT.z1 + 0.25]} s={[1.6, 2, 0.1]} c="#2a2a32" />
      ))}
      <Box p={[0, top + 1.5, PLAT.z1 + 0.02]} s={[W - 1, 0.8, 0.06]} c="#3a5f9a" />
      {/* the inner room (sekos) with its door, and the shrine of the goddess */}
      <Box p={[CELLA.x0 - 0.25, FLOOR + 5, cellaC]} s={[0.5, 10, cellaL]} c={MARBLE} />
      <Box p={[CELLA.x1 + 0.25, FLOOR + 5, cellaC]} s={[0.5, 10, cellaL]} c={MARBLE} />
      <Box p={[0, FLOOR + 5, CELLA.z0 - 0.25]} s={[CELLA.x1 - CELLA.x0 + 1, 10, 0.5]} c={MARBLE} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * (CELLA.door + (CELLA.x1 + 0.5 - CELLA.door) / 2), FLOOR + 5, CELLA.z1 + 0.25]} s={[CELLA.x1 + 0.5 - CELLA.door, 10, 0.5]} c={MARBLE} />
      ))}
      <Box p={[0, FLOOR + 8.5, CELLA.z1 + 0.25]} s={[CELLA.door * 2, 3, 0.5]} c={MARBLE} />
      <Box p={[0, FLOOR + 0.02, cellaC]} s={[CELLA.x1 - CELLA.x0, 0.04, cellaL]} c="#d9d0bf" />
      {/* the naiskos: a little shrine with four columns around the statue */}
      <Columns points={[[-2.2, -19.5], [2.2, -19.5], [-2.2, -14.5], [2.2, -14.5]]} y0={FLOOR} h={6} r={0.25} color="#efe8da" order="ionic" />
      <Box p={[0, FLOOR + 6.6, -17]} s={[5.4, 0.6, 6]} c="#e6dccb" />
      <ArtemisStatue x={0} z={-17} />
      <pointLight position={[0, FLOOR + 8, 10]} color="#ffe4b8" intensity={30} distance={30} decay={1.5} />
      {/* olive trees and cypresses around the sanctuary */}
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2
        const x = Math.sin(a) * 58
        const z = Math.cos(a) * 62
        if (Math.abs(x) < 16 && z > 40) return null
        return i % 3 ? <mesh key={i} geometry={GEO.sph} material={mat('#7d8f5a')} position={[x, 2.4, z]} scale={[2.6, 2, 2.6]} /> : <Cypress key={i} x={x} z={z} h={9} />
      })}
    </>
  )
}
