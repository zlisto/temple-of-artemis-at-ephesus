import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { EYE, MAX_STEP, SPAWN, SPEED, collide, floorAt, locate } from './layout.js'

// First-person walking, the same controls as the other Metaverse Web worlds, plus raised floors.
// PC: WASD move, mouse look, Shift run, Space jump, C crouch.
// Phone: TouchControls fills touchRef = { active, move: [x, y], look: [dx, dy], jump }.
const CROUCH_EYE = 1.05
const JUMP_SPEED = 4.2
const GRAVITY = 12
const LOOK_SPEED = 0.005 // radians per touch pixel
const MOUSE_SPEED = 0.002 // radians per mouse pixel, the same as PointerLockControls

export default function Player({ lockRef, touchRef, freeRef, onLock, onWhere }) {
  const { camera, gl } = useThree()
  const controls = useMemo(() => new PointerLockControls(camera, gl.domElement), [camera, gl])
  const keys = useRef({})
  const where = useRef('')
  const eye = useRef(EYE)
  const jumpY = useRef(0)
  const vy = useRef(0)
  const floorY = useRef(null) // height of the ground underfoot (temple platforms), eased so steps feel like stairs
  const fwd = useMemo(() => new THREE.Vector3(), [])
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), [])

  useEffect(() => {
    // start at the spawn point picked from ?spawn= (see layout.js)
    camera.position.set(SPAWN.x, EYE, SPAWN.z)
    camera.rotation.set(0, SPAWN.yaw ?? 0, 0, 'YXZ')
    lockRef.current = () => controls.lock()
    const on = () => onLock(true)
    const off = () => {
      keys.current = {} // keys held during Esc never get a keyup
      onLock(false)
    }
    controls.addEventListener('lock', on)
    controls.addEventListener('unlock', off)
    const down = (e) => {
      keys.current[e.code] = true
      if (e.code === 'Space') e.preventDefault()
    }
    const up = (e) => (keys.current[e.code] = false)
    const blur = () => (keys.current = {})
    // Arrived through a portal (freeRef): browsers only lock the mouse after a click, so until then
    // the view follows the mouse as it moves over the page. The first click locks it for real.
    const look = (e) => {
      if (!freeRef?.current || controls.isLocked) return
      const cap = (v) => Math.max(-60, Math.min(60, v)) // the first event after a page load can jump
      euler.setFromQuaternion(camera.quaternion)
      euler.y -= cap(e.movementX) * MOUSE_SPEED
      euler.x = Math.max(-1.45, Math.min(1.45, euler.x - cap(e.movementY) * MOUSE_SPEED))
      camera.quaternion.setFromEuler(euler)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    window.addEventListener('mousemove', look)
    return () => {
      window.removeEventListener('mousemove', look)
      controls.removeEventListener('lock', on)
      controls.removeEventListener('unlock', off)
      controls.dispose()
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [camera, controls, lockRef, onLock, freeRef, euler])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const touch = touchRef.current
    // freeRef: arrived through a portal, so the keys work before the first click locks the mouse
    const active = controls.isLocked || touch.active || freeRef?.current

    // touch look: turn the camera by how far the finger dragged
    if (touch.active && (touch.look[0] || touch.look[1])) {
      euler.setFromQuaternion(camera.quaternion)
      euler.y -= touch.look[0] * LOOK_SPEED
      euler.x = Math.max(-1.45, Math.min(1.45, euler.x - touch.look[1] * LOOK_SPEED))
      camera.quaternion.setFromEuler(euler)
    }
    touch.look[0] = 0
    touch.look[1] = 0

    // walk along the floor in the direction you're looking
    camera.getWorldDirection(fwd)
    fwd.y = 0
    fwd.normalize()
    const k = keys.current
    let f = 0
    let s = 0
    let sprint = false
    if (active) {
      f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0)
      s = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0)
      sprint = k.ShiftLeft || k.ShiftRight
    }
    if (touch.active && (touch.move[0] || touch.move[1])) {
      f = -touch.move[1]
      s = touch.move[0]
      sprint = Math.hypot(f, s) > 0.95
    }
    let mx = fwd.x * f - fwd.z * s
    let mz = fwd.z * f + fwd.x * s
    const l = Math.hypot(mx, mz)
    if (l > 0.05) {
      if (l > 1) {
        mx /= l
        mz /= l
      }
      const speed = active && k.KeyC ? 1.8 : sprint ? SPEED.run : SPEED.walk
      const pos = collide({ x: camera.position.x + mx * speed * dt, z: camera.position.z + mz * speed * dt })
      // a step up taller than MAX_STEP is a wall (ramps rise gently enough to walk); slide along it
      const here = floorAt(camera.position.x, camera.position.z)
      if (floorAt(pos.x, pos.z) - here <= MAX_STEP) {
        camera.position.x = pos.x
        camera.position.z = pos.z
      } else if (floorAt(pos.x, camera.position.z) - here <= MAX_STEP) camera.position.x = pos.x
      else if (floorAt(camera.position.x, pos.z) - here <= MAX_STEP) camera.position.z = pos.z
    }

    // jump and crouch
    const wantJump = (active && k.Space) || touch.jump
    touch.jump = false
    if (active && wantJump && jumpY.current === 0) vy.current = JUMP_SPEED
    vy.current -= GRAVITY * dt
    jumpY.current = Math.max(0, jumpY.current + vy.current * dt)
    if (jumpY.current === 0) vy.current = 0
    const eyeTarget = active && k.KeyC ? CROUCH_EYE : EYE
    eye.current += (eyeTarget - eye.current) * Math.min(1, dt * 12)
    const fy = floorAt(camera.position.x, camera.position.z)
    floorY.current = floorY.current === null ? fy : floorY.current + (fy - floorY.current) * Math.min(1, dt * 8)
    camera.position.y = floorY.current + eye.current + jumpY.current

    // report the area you're in, only when it changes
    const w = locate(camera.position.x, camera.position.z)
    if (w !== where.current) {
      where.current = w
      onWhere(w)
    }
  })
  return null
}
