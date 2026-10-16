import { useLayoutEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import Portal from './Portal.jsx'
import Guide from './guide/Guide.jsx'
import Scene from './Scene.jsx'
import { DOORS, PORTAL } from './layout.js'
import W from './wonder.js'

// Everything you see: sky, light and ground from wonder.js, the wonder itself (Scene.jsx), the
// guide, and the portal back to Metaverse Square.

// speckled ground: base color with lighter and darker grains, tiled
function groundTex(base, seed = 3) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = base
  g.fillRect(0, 0, 256, 256)
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 3500; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
    g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2.5, 1 + rnd() * 2.5)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(60, 60)
  t.anisotropy = 8
  return t
}

// soft reflections for metal (gold, bronze) and stone, from a generated studio environment
function Reflections() {
  const { gl, scene } = useThree()
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.45
    return () => {
      env.dispose()
      pm.dispose()
    }
  }, [gl, scene])
  return null
}

export default function World({ talking = false, onTalk }) {
  const e = W.env
  const ground = useMemo(() => groundTex(e.ground), [e.ground])
  return (
    <>
      <Reflections />
      <color attach="background" args={[e.sky]} />
      <fog attach="fog" args={[e.fog ?? e.sky, e.fogNear ?? 60, e.fogFar ?? 260]} />
      <hemisphereLight args={[e.hemiSky ?? '#fff4e2', e.hemiGround ?? '#8a7a5a', e.hemi ?? 1.0]} />
      <directionalLight position={e.sun ?? [40, 60, 30]} intensity={e.sunIntensity ?? 1.6} color={e.sunColor ?? '#fff1d6'} />
      <ambientLight intensity={0.15} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[600, 64]} />
        <meshStandardMaterial map={ground} roughness={1} />
      </mesh>

      <Scene />
      <Guide talking={talking} onTalk={onTalk} />
      <Portal x={PORTAL.x} z={PORTAL.z} rot={PORTAL.rot} href={PORTAL.href} spawn={PORTAL.spawn} back="from_square" label="Metaverse Square" sub="every world · portal" />
      {DOORS.map((d) => (
        <Portal key={d.id} x={d.x} z={d.z} rot={d.rot} href={d.href} spawn={d.spawn} back={d.back} label={d.label} sub={d.sub} color={d.color} />
      ))}
    </>
  )
}
