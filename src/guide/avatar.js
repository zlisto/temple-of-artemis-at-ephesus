// From zlisto/evans-hall-3d (src/avatar.js), unchanged apart from this line.
import { createElement, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TALKERS } from './talk.js'

// Shared bits for the chat-able professor avatars (Zaman.jsx, Schott.jsx, ...).
// Avatars are built in meters and face +z.

const mats = new Map()
export const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o }))
  return mats.get(k)
}
export const SPH = new THREE.SphereGeometry(1, 24, 16)
export const CYL = new THREE.CylinderGeometry(1, 1, 1, 20)
export const BOX = new THREE.BoxGeometry(1, 1, 1)
export const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)
export const TORUS = new THREE.TorusGeometry(1, 0.14, 8, 20)

export const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o }) => createElement('mesh', { geometry: g, material: m(c, o), position: p, scale: s, rotation: r })

const angleTo = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from)) // shortest signed turn

// Registers the avatar for the crosshair and drives the shared motion: idle scanning, turning to
// face you while you chat, and looking up at your eyes. Returns refs for root and head, plus
// `gesture`, a ref that is 1 while talking (for arm animation in the avatar's own useFrame).
export function useTalker(slug, { position, rotation, talking, headY = 1.62 }) {
  const root = useRef()
  const head = useRef()
  const yaw = useRef(rotation)
  const gesture = useRef(0)
  const here = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    TALKERS.set(slug, root.current)
    return () => TALKERS.delete(slug)
  }, [slug])

  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime
    const r = root.current
    r.getWorldPosition(here)
    let target = rotation + Math.sin(t * 0.4) * 0.35 // idle: scanning the room
    if (talking) target = Math.atan2(camera.position.x - here.x, camera.position.z - here.z)
    yaw.current += angleTo(yaw.current, target) * Math.min(1, dt * (talking ? 5 : 2))
    r.rotation.y = yaw.current
    r.position.y = position[1] + Math.sin(t * 2.2) * 0.006 // breathing

    const dy = camera.position.y - (here.y + headY)
    const dist = Math.hypot(camera.position.x - here.x, camera.position.z - here.z) || 1
    head.current.rotation.x = talking ? THREE.MathUtils.clamp(-Math.atan2(dy, dist), -0.4, 0.4) : Math.sin(t * 0.9) * 0.05
    head.current.rotation.z = talking ? Math.sin(t * 1.7) * 0.06 : 0
    gesture.current = talking ? 1 : 0
  })

  // tap-to-talk in touch / joystick mode; mouse mode uses the crosshair instead
  const clickProps = (onTalk) => ({
    onClick: (e) => {
      if (document.pointerLockElement) return
      e.stopPropagation()
      onTalk?.(slug)
    },
  })
  return { root, head, gesture, clickProps }
}
