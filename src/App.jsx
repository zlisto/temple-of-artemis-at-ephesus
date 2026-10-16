import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import World from './World.jsx'
import Player from './Player.jsx'
import TouchControls from './TouchControls.jsx'
import TalkAim from './guide/TalkAim.jsx'
import GuidePanel from './guide/GuidePanel.jsx'
import { EYE, SPAWN } from './layout.js'
import { onIdentity, presence } from './mvw.js'

// The world's name and blurb come from wonder.js.
import W from './wonder.js'

const NAME = W.name
const BLURB = W.blurb

export default function App() {
  const [locked, setLocked] = useState(false)
  const [where, setWhere] = useState('')
  const lockRef = useRef()
  const onLock = useCallback((v) => {
    setLocked(v)
    if (v) setFree(false) // the mouse is locked now; Esc brings back the menu as a pause screen
  }, [])
  // Every arrival, portal or not, starts on the menu: one clear click to walk in and lock the mouse.
  // `free` is a walking-without-the-mouse-locked state, used after closing the guide's chat (keys work,
  // the view follows the mouse, and the next click locks it).
  const [free, setFree] = useState(false)
  const freeRef = useRef(free)
  freeRef.current = free
  // tell the Metaverse Browser where you are whenever the area changes (mvw/0.1 `presence`)
  const onWhere = useCallback((w) => {
    setWhere(w)
    presence(w)
  }, [])
  // who's visiting: the Metaverse Browser sends { name, color }. Opened on its own, it stays null.
  const [me, setMe] = useState(null)
  useEffect(() => onIdentity(setMe), [])

  // phones have no pointer lock, so they get a joystick + drag-to-look instead
  const [isTouch] = useState(() => matchMedia('(pointer: coarse)').matches)
  const [touchOn, setTouchOn] = useState(false)
  const touchRef = useRef({ active: false, move: [0, 0], look: [0, 0], jump: false })
  const setTouch = (on) => {
    touchRef.current.active = on
    touchRef.current.move = [0, 0]
    setTouchOn(on)
  }
  // talking to the guide: aim the crosshair at them and click or press E (phones: tap him).
  // The mouse is released so you can click his questions; closing the chat puts you back in.
  const [aim, setAim] = useState(null)
  const [talking, setTalking] = useState(false)
  const startTalk = useCallback(() => {
    setFree(false)
    setTalking(true)
    document.exitPointerLock?.()
  }, [])
  // closing the chat goes straight back to mouse-look. Closing with × or a click outside does it at
  // once; Esc doesn't count as a click for the browser, so then the next click grabs the mouse.
  const endTalk = useCallback(() => {
    setTalking(false)
    if (touchOn) return
    setFree(true) // keys work right away, whether or not the mouse grab below is allowed
    lockRef.current?.()
  }, [touchOn])

  useEffect(() => {
    document.body.classList.toggle('freelook', free)
  }, [free])
  const playing = locked || touchOn || free || talking
  useEffect(() => {
    if (!free || talking) return
    if (isTouch) {
      setTouch(true) // phones: the joystick needs no click, so just turn it on
      setFree(false)
      return
    }
    // a click here always grabs the mouse for looking around, even with the guide in the crosshair;
    // once the mouse is grabbed, clicking him (or pressing E) starts the chat
    const click = (e) => !e.target.closest('button, a, .guide') && lockRef.current?.()
    addEventListener('mousedown', click)
    return () => removeEventListener('mousedown', click)
  }, [free, talking]) // eslint-disable-line react-hooks/exhaustive-deps

  // while chatting, a click anywhere outside the chat closes it and gives the mouse back to looking
  // around (the conversation is kept, so talking to him again picks up where you left off)
  useEffect(() => {
    if (!talking || touchOn) return
    const clickOut = (e) => {
      if (e.button !== 0 || e.target.closest('.guide, button, a')) return
      endTalk() // and back to mouse-look
    }
    addEventListener('mousedown', clickOut)
    return () => removeEventListener('mousedown', clickOut)
  }, [talking, touchOn, endTalk])

  return (
    <>
      <Canvas camera={{ fov: 72, near: 0.05, far: 1200, position: [SPAWN.x, EYE, SPAWN.z] }} dpr={[1, 1.75]}>
        <World talking={talking} onTalk={startTalk} />
        <TalkAim enabled={playing && !talking} onAim={setAim} onTalk={startTalk} />
        <Player lockRef={lockRef} freeRef={freeRef} touchRef={touchRef} onLock={onLock} onWhere={onWhere} />
      </Canvas>

      <div className="where">
        <span className="dot" style={me?.color ? { background: me.color } : undefined} />
        {where}
      </div>
      {playing && <div className="crosshair" />}
      {free && !talking && <div className="hint">Move the mouse to look · click to lock it · WASD to walk</div>}
      {aim && playing && !talking && (
        <div className="talkhint">
          {touchOn ? <button onClick={startTalk}>💬 Talk to {W.guideName}</button> : locked ? `Click or press E to talk to ${W.guideName}` : `Press E to talk to ${W.guideName}`}
        </div>
      )}
      {talking && <GuidePanel visitor={me?.name} onClose={endTalk} />}
      {touchOn && <TouchControls touchRef={touchRef} onPause={() => setTouch(false)} />}

      {!playing && (
        <div className="overlay" onClick={() => (isTouch ? setTouch(true) : lockRef.current?.())}>
          <div className="card">
            {/* the greeting: uses your name from the Metaverse Browser when there is one */}
            <div className="kicker">{W.place}{me?.name ? ` · welcome, ${me.name}` : ''}</div>
            <h1>{NAME}</h1>
            <p className="sub">{BLURB}</p>
            <button className="go">{isTouch ? 'Tap to walk in' : 'Click to walk in'}</button>
            {!isTouch && (
              <button
                className="go alt"
                onClick={(e) => {
                  e.stopPropagation()
                  setTouch(true)
                }}
              >
                Use on-screen joystick
              </button>
            )}
            <div className="keys">
              {isTouch ? (
                <>
                  <span><b>Left thumb</b> walk</span>
                  <span><b>Right thumb</b> drag to look</span>
                </>
              ) : (
                <>
                  <span><b>WASD</b> walk</span>
                  <span><b>Mouse</b> look</span>
                  <span><b>Shift</b> run</span>
                  <span><b>Space</b> jump</span>
                  <span><b>C</b> crouch</span>
                  <span><b>E</b> talk</span>
                  <span><b>Esc</b> pause</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
