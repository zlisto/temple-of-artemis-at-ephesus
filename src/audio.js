// Procedural sound for a world: every sound is synthesized with the Web Audio API, no audio files.
// The same file goes in every world; each world's song lives in its own song.js.

let ctx = null
let master = null // everything → master → compressor → speakers
let music = null // the song's bus, so it can fade out on its own
let wet = null // reverb send
let noise = null
let muted = false
const ksCache = new Map()

export const midi = (m) => 440 * 2 ** ((m - 69) / 12)

function impulse(seconds, decay) {
  const n = Math.floor(ctx.sampleRate * seconds)
  const b = ctx.createBuffer(2, n, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** decay
  }
  return b
}

export function audio() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 1
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 3
    master.connect(comp).connect(ctx.destination)
    music = ctx.createGain()
    music.connect(master)
    const verb = ctx.createConvolver()
    verb.buffer = impulse(3.2, 2.6)
    wet = ctx.createGain()
    wet.gain.value = 0.9
    wet.connect(verb).connect(music)
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    // arriving through a portal there's no start-screen click, so the browser may hold audio
    // until the first key or click; resume then
    const unlock = () => ctx.state === 'suspended' && ctx.resume()
    addEventListener('keydown', unlock)
    addEventListener('pointerdown', unlock)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// a gain node that feeds the music bus dry plus some reverb
function out(gain, send = 0.3, pan = 0) {
  const g = ctx.createGain()
  g.gain.value = gain
  let node = g
  if (pan) {
    const p = ctx.createStereoPanner()
    p.pan.value = pan
    g.connect(p)
    node = p
  }
  node.connect(music)
  if (send) {
    const s = ctx.createGain()
    s.gain.value = send
    node.connect(s).connect(wet)
  }
  return g
}

const env = (param, t, peak, attack, hold, release) => {
  param.setValueAtTime(0, t)
  param.linearRampToValueAtTime(peak, t + attack)
  param.setValueAtTime(peak, t + attack + hold)
  param.exponentialRampToValueAtTime(0.0001, t + attack + hold + release)
}

// ---------- instruments

// warm pad: two detuned triangles per note through a soft lowpass, slow swell
export function pad(t, notes, dur, gain = 0.05, cutoff = 900) {
  const o = out(1, 0.6)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = cutoff
  lp.connect(o)
  const e = ctx.createGain()
  env(e.gain, t, gain, dur * 0.35, dur * 0.3, dur * 0.6)
  e.connect(lp)
  for (const m of notes)
    for (const det of [-7, 7]) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = midi(m)
      osc.detune.value = det
      osc.connect(e)
      osc.start(t)
      osc.stop(t + dur * 1.3)
    }
}

// electric piano: a little FM tine that rings and fades
export function epiano(t, m, gain = 0.08, pan = 0) {
  const f = midi(m)
  const o = out(1, 0.45, pan)
  const car = ctx.createOscillator()
  const mod = ctx.createOscillator()
  const idx = ctx.createGain()
  car.frequency.value = f
  mod.frequency.value = f
  idx.gain.setValueAtTime(f * 1.4, t)
  idx.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.6)
  mod.connect(idx).connect(car.frequency)
  const e = ctx.createGain()
  env(e.gain, t, gain, 0.005, 0.02, 1.8)
  car.connect(e).connect(o)
  for (const s of [car, mod]) {
    s.start(t)
    s.stop(t + 2)
  }
}

// soft round bass
export function bass(t, m, dur, gain = 0.12) {
  const o = out(1, 0.05)
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = midi(m)
  const e = ctx.createGain()
  env(e.gain, t, gain, 0.03, dur * 0.4, dur * 0.6)
  osc.connect(e).connect(o)
  osc.start(t)
  osc.stop(t + dur + 0.1)
}

// plucked string (Karplus-Strong): dotara, ektara, tanpura. slide = semitones to glide up from (meend)
function ksBuffer(f, seconds, loss, bright) {
  const key = `${f.toFixed(2)}|${seconds}|${loss}|${bright}`
  if (ksCache.has(key)) return ksCache.get(key)
  const sr = ctx.sampleRate
  const n = Math.floor(sr * seconds)
  const N = Math.max(2, Math.round(sr / f))
  const ring = new Float32Array(N)
  let prev = 0
  for (let i = 0; i < N; i++) {
    prev += bright * (Math.random() * 2 - 1 - prev)
    ring[i] = prev
  }
  const b = ctx.createBuffer(1, n, sr)
  const d = b.getChannelData(0)
  let k = 0
  for (let i = 0; i < n; i++) {
    const a = ring[k]
    const next = ring[(k + 1) % N]
    d[i] = a
    ring[k] = loss * 0.5 * (a + next)
    k = (k + 1) % N
  }
  ksCache.set(key, b)
  return b
}

export function pluck(t, m, { gain = 0.3, seconds = 2, loss = 0.996, bright = 0.7, pan = 0, send = 0.3, slide = 0 } = {}) {
  const src = ctx.createBufferSource()
  src.buffer = ksBuffer(midi(m), seconds, loss, bright)
  if (slide) {
    src.playbackRate.setValueAtTime(2 ** (-slide / 12), t)
    src.playbackRate.linearRampToValueAtTime(1, t + 0.12)
  }
  const o = out(gain, send, pan)
  src.connect(o)
  src.start(t)
}

// bansuri-style flute: sine with breath noise and delayed vibrato
export function flute(t, m, dur, gain = 0.05, slide = 0) {
  const f = midi(m)
  const o = out(1, 0.5, -0.15)
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(f * 2 ** (-slide / 12), t)
  osc.frequency.linearRampToValueAtTime(f, t + (slide ? 0.15 : 0.01))
  const vib = ctx.createOscillator()
  const vibAmt = ctx.createGain()
  vib.frequency.value = 5.2
  vibAmt.gain.setValueAtTime(0, t)
  vibAmt.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(dur, 0.6))
  vib.connect(vibAmt).connect(osc.frequency)
  const e = ctx.createGain()
  env(e.gain, t, gain, 0.08, Math.max(0, dur - 0.2), 0.25)
  osc.connect(e).connect(o)
  const br = ctx.createBufferSource()
  br.buffer = noise
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = f * 2
  bp.Q.value = 2
  const be = ctx.createGain()
  env(be.gain, t, gain * 0.25, 0.05, Math.max(0, dur - 0.2), 0.2)
  br.connect(bp).connect(be).connect(o)
  for (const s of [osc, vib, br]) {
    s.start(t)
    s.stop(t + dur + 0.4)
  }
}

// hand drums (dholak / khol): bols dha, ge, na, ti, ka, dhi
export function drum(t, bol, gain = 0.4) {
  const o = out(gain, 0.12)
  const low = bol === 'dha' || bol === 'ge' || bol === 'dhi'
  const high = bol !== 'ge'
  if (low) {
    const osc = ctx.createOscillator()
    osc.frequency.setValueAtTime(150, t)
    osc.frequency.exponentialRampToValueAtTime(62, t + 0.22)
    const e = ctx.createGain()
    env(e.gain, t, 0.9, 0.003, 0.02, 0.4)
    osc.connect(e).connect(o)
    osc.start(t)
    osc.stop(t + 0.5)
  }
  if (high) {
    const soft = bol === 'ka' || bol === 'ti'
    const osc = ctx.createOscillator()
    osc.frequency.value = soft ? 520 : 380
    const e = ctx.createGain()
    env(e.gain, t, soft ? 0.25 : 0.45, 0.002, 0.005, soft ? 0.08 : 0.16)
    osc.connect(e).connect(o)
    osc.start(t)
    osc.stop(t + 0.3)
    const n = ctx.createBufferSource()
    n.buffer = noise
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = soft ? 3500 : 2400
    bp.Q.value = 1.5
    const ne = ctx.createGain()
    env(ne.gain, t, soft ? 0.25 : 0.4, 0.001, 0.003, 0.06)
    n.connect(bp).connect(ne).connect(o)
    n.start(t, Math.random())
    n.stop(t + 0.12)
  }
}

// ---------- the song loop: calls step(i, time) for each step, a little ahead of time
let timer = null
export function playSong(stepSeconds, step) {
  audio()
  if (timer) return
  music.gain.cancelScheduledValues(ctx.currentTime)
  music.gain.setValueAtTime(0, ctx.currentTime)
  music.gain.linearRampToValueAtTime(1, ctx.currentTime + 2)
  let i = 0
  let next = ctx.currentTime + 0.1
  timer = setInterval(() => {
    while (next < ctx.currentTime + 0.25) {
      step(i++, next)
      next += stepSeconds
    }
  }, 30)
}

// fade the song out, e.g. while walking through a portal
export function fadeOut(seconds = 0.4) {
  if (!ctx) return
  music.gain.cancelScheduledValues(ctx.currentTime)
  music.gain.setValueAtTime(music.gain.value, ctx.currentTime)
  music.gain.linearRampToValueAtTime(0, ctx.currentTime + seconds)
}

export function setMuted(m) {
  muted = m
  if (master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.1)
}

// the portal whoosh: a band of noise sweeping up and away, plus a low swoop
export function whoosh() {
  audio()
  const t = ctx.currentTime + 0.02
  const n = ctx.createBufferSource()
  n.buffer = noise
  n.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.2
  bp.frequency.setValueAtTime(250, t)
  bp.frequency.exponentialRampToValueAtTime(3200, t + 0.45)
  bp.frequency.exponentialRampToValueAtTime(400, t + 1.1)
  const p = ctx.createStereoPanner()
  p.pan.setValueAtTime(-0.7, t)
  p.pan.linearRampToValueAtTime(0.7, t + 1.1)
  const e = ctx.createGain()
  env(e.gain, t, 0.6, 0.35, 0.1, 0.7)
  n.connect(bp).connect(e).connect(p).connect(master)
  n.start(t)
  n.stop(t + 1.3)
  const o = ctx.createOscillator()
  o.frequency.setValueAtTime(90, t)
  o.frequency.exponentialRampToValueAtTime(300, t + 0.5)
  o.frequency.exponentialRampToValueAtTime(60, t + 1.1)
  const oe = ctx.createGain()
  env(oe.gain, t, 0.18, 0.3, 0.1, 0.7)
  o.connect(oe).connect(master)
  o.start(t)
  o.stop(t + 1.3)
}
