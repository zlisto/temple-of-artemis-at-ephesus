import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { navigate } from './mvw.js'
import { fadeOut, whoosh } from './audio.js'

// A glowing doorway to another world (mvw/0.1). Walk through it and you go to `href`,
// arriving at that world's `spawn`. Same file in every world.
// x, z: center on the floor; rot: which way it faces (0 = +z); w, h: opening size;
// back: the spawn id in THIS world to come back to.

function swirlTex(color) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const bg = g.createRadialGradient(128, 128, 10, 128, 128, 128)
  bg.addColorStop(0, '#ffffff')
  bg.addColorStop(0.25, color)
  bg.addColorStop(1, '#14061a')
  g.fillStyle = bg
  g.fillRect(0, 0, 256, 256)
  g.strokeStyle = 'rgba(255,255,255,0.55)'
  g.lineWidth = 5
  for (let arm = 0; arm < 4; arm++) {
    g.beginPath()
    for (let t = 0; t < 1; t += 0.01) {
      const a = arm * (Math.PI / 2) + t * 7
      const r = 8 + t * 125
      const x = 128 + Math.cos(a) * r
      const y = 128 + Math.sin(a) * r
      t ? g.lineTo(x, y) : g.moveTo(x, y)
    }
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.center.set(0.5, 0.5)
  return t
}

function labelTex(text, sub, color) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 144
  const g = c.getContext('2d')
  g.fillStyle = 'rgba(11,11,13,0.9)'
  g.beginPath()
  g.roundRect(4, 4, 504, 136, 28)
  g.fill()
  g.strokeStyle = color
  g.lineWidth = 6
  g.stroke()
  g.textAlign = 'center'
  g.fillStyle = '#ffffff'
  g.font = 'bold 50px system-ui, sans-serif'
  g.fillText(text, 256, 68, 470)
  g.fillStyle = color
  g.font = '30px system-ui, sans-serif'
  g.fillText(sub, 256, 114, 470)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function Portal({ x, z, rot = 0, w = 2, h = 2.6, href, spawn, back, label, sub = 'portal · walk through', color = '#ff4fa3', frame = true }) {
  const swirl = useRef()
  const fired = useRef(false)
  const armed = useRef(false)
  const { tex, lab, glow } = useMemo(
    () => ({
      tex: swirlTex(color),
      lab: labelTex(label, sub, color),
      glow: new THREE.MeshBasicMaterial({ color, toneMapped: false }),
    }),
    [color, label, sub],
  )
  const n = [Math.sin(rot), Math.cos(rot)] // facing direction
  const t = [Math.cos(rot), -Math.sin(rot)] // along the opening

  useFrame(({ camera, clock }) => {
    tex.rotation = -clock.elapsedTime * 1.2
    swirl.current.material.opacity = 0.62 + Math.sin(clock.elapsedTime * 3) * 0.08
    const dx = camera.position.x - x
    const dz = camera.position.z - z
    const along = dx * t[0] + dz * t[1]
    const depth = dx * n[0] + dz * n[1]
    // arm once you've stepped away, so arriving next to a portal doesn't bounce you back
    if (Math.abs(depth) > 1.2 || Math.abs(along) > w) armed.current = true
    if (armed.current && !fired.current && Math.abs(along) < w / 2 && Math.abs(depth) < 0.45 && camera.position.y < h + 0.5) {
      fired.current = true
      fadeOut()
      whoosh() // the world plays it: it has the visitor's clicks, so its audio is always allowed
      navigate(href, spawn, back)
      setTimeout(() => (fired.current = armed.current = false), 1500)
    }
  })

  const post = 0.09
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh ref={swirl} position={[0, h / 2, 0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent opacity={0.65} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      {frame && (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} material={glow} position={[s * (w / 2 + post / 2), h / 2, 0]}>
              <boxGeometry args={[post, h, post]} />
            </mesh>
          ))}
          <mesh material={glow} position={[0, h + post / 2, 0]}>
            <boxGeometry args={[w + post * 2, post, post]} />
          </mesh>
        </>
      )}
      {[0, Math.PI].map((r) => (
        <mesh key={r} position={[0, h + 0.32, 0]} rotation={[0, r, 0]}>
          <planeGeometry args={[1.3, 0.37]} />
          <meshBasicMaterial map={lab} transparent toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[0, h / 2, 0.4]} color={color} intensity={2} distance={4} />
    </group>
  )
}
