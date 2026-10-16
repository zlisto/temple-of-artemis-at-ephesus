// From zlisto/evans-hall-3d (src/TalkAim.jsx), unchanged apart from this line.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { REACH, TALKERS } from './talk.js'

// Casts a ray through the crosshair every frame. When it lands on a chat-able character within
// REACH, onAim(slug) fires; a left click (pointer lock) or the E key then starts the chat.
export default function TalkAim({ enabled, onAim, onTalk }) {
  const { camera, gl } = useThree()
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const center = useMemo(() => new THREE.Vector2(0, 0), [])
  const aim = useRef(null)

  useFrame(() => {
    let hit = null
    if (enabled) {
      ray.setFromCamera(center, camera)
      ray.far = REACH
      let best = Infinity
      for (const [slug, obj] of TALKERS) {
        const h = ray.intersectObject(obj, true)[0]
        if (h && h.distance < best) {
          best = h.distance
          hit = slug
        }
      }
    }
    if (hit !== aim.current) {
      aim.current = hit
      onAim(hit)
    }
  })

  useEffect(() => {
    const click = (e) => {
      if (e.button === 0 && aim.current && document.pointerLockElement === gl.domElement) onTalk(aim.current)
    }
    const key = (e) => {
      if (e.code === 'KeyE' && aim.current && !e.target.closest?.('input, textarea')) onTalk(aim.current)
    }
    window.addEventListener('mousedown', click)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('mousedown', click)
      window.removeEventListener('keydown', key)
    }
  }, [gl, onTalk])
  return null
}
