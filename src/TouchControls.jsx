import { useRef, useState } from 'react'

const STICK_R = 50 // px the knob can travel

const capture = (el, id) => {
  try {
    el.setPointerCapture(id)
  } catch {
    // pointer already gone (very fast tap); nothing to capture
  }
}

// Phone controls: left thumb joystick to walk, drag anywhere else to look.
export default function TouchControls({ touchRef, onPause }) {
  const stickEl = useRef(null)
  const stickId = useRef(null)
  const lookId = useRef(null)
  const lookLast = useRef([0, 0])
  const [knob, setKnob] = useState([0, 0])

  const stickDown = (e) => {
    e.stopPropagation()
    stickId.current = e.pointerId
    capture(stickEl.current, e.pointerId)
    stickMove(e)
  }
  const stickMove = (e) => {
    if (e.pointerId !== stickId.current) return
    const r = stickEl.current.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > STICK_R) {
      dx *= STICK_R / d
      dy *= STICK_R / d
    }
    touchRef.current.move = [dx / STICK_R, dy / STICK_R]
    setKnob([dx, dy])
  }
  const stickUp = (e) => {
    if (e.pointerId !== stickId.current) return
    stickId.current = null
    touchRef.current.move = [0, 0]
    setKnob([0, 0])
  }

  const lookDown = (e) => {
    if (lookId.current !== null) return
    lookId.current = e.pointerId
    capture(e.currentTarget, e.pointerId)
    lookLast.current = [e.clientX, e.clientY]
  }
  const lookMove = (e) => {
    if (e.pointerId !== lookId.current) return
    touchRef.current.look[0] += e.clientX - lookLast.current[0]
    touchRef.current.look[1] += e.clientY - lookLast.current[1]
    lookLast.current = [e.clientX, e.clientY]
  }
  const lookUp = (e) => {
    if (e.pointerId === lookId.current) lookId.current = null
  }

  return (
    <div className="touchlayer" onPointerDown={lookDown} onPointerMove={lookMove} onPointerUp={lookUp} onPointerCancel={lookUp}>
      <div ref={stickEl} className="stick" onPointerDown={stickDown} onPointerMove={stickMove} onPointerUp={stickUp} onPointerCancel={stickUp}>
        <div className="knob" style={{ transform: `translate(${knob[0]}px, ${knob[1]}px)` }} />
      </div>
      <button
        className="jump"
        onPointerDown={(e) => {
          e.stopPropagation()
          touchRef.current.jump = true
        }}
      >
        jump
      </button>
      <button
        className="pause"
        onPointerDown={(e) => {
          e.stopPropagation()
          onPause()
        }}
      >
        pause
      </button>
      <div className="touchhint">left thumb walk · drag to look</div>
    </div>
  )
}
