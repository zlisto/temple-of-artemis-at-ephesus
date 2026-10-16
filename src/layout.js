import { pickSpawn } from './mvw.js'
import W from './wonder.js'

// The walkable shape of this world, all read from wonder.js. Units are meters; +x = east, -z = north.
// Change the wonder there; World.jsx draws it and Player.jsx walks in it.

export const EYE = 1.65
export const R_PLAYER = 0.35
export const SPEED = W.speed ?? { walk: 5, run: 9 } // meters per second; Shift runs
export const BOUND = W.bound // you can walk anywhere within this distance of the center

// Arrival points (mvw/0.1): ?spawn=<id> picks one. `from_square` is where Metaverse Square's portal
// lands you, just in front of this world's portal back there.
export const PORTAL = W.portal
const ahead = (d) => ({ x: PORTAL.x + Math.sin(PORTAL.rot) * d, z: PORTAL.z + Math.cos(PORTAL.rot) * d })
export const SPAWNS = {
  default: W.spawn,
  from_square: { ...ahead(2.4), yaw: PORTAL.rot + Math.PI }, // in front of the portal, facing away from it
}
export const SPAWN = pickSpawn(SPAWNS)
export const GUIDE = W.guide

// raised floors: flat platforms { x0, x1, z0, z1, h } and ramps/stairs { x0, x1, z0, z1, h0, h1 }
// that climb from h0 at z1 (the south end) to h1 at z0. You can step up at most MAX_STEP at once,
// so a tall platform's edge works like a wall unless a ramp leads up to it.
export const MAX_STEP = 0.7
const PLATFORMS = W.platforms ?? []
export function floorAt(x, z) {
  let y = 0
  for (const p of PLATFORMS) {
    if (!(x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1)) continue
    const h = p.h ?? p.h0 + ((p.z1 - z) / (p.z1 - p.z0)) * (p.h1 - p.h0)
    y = Math.max(y, h)
  }
  return y
}

// things you can't walk through: circles { x, z, r } and boxes { x0, x1, z0, z1 }
const CIRCLES = [...(W.circles ?? []), { x: GUIDE.x, z: GUIDE.z, r: 0.45 }]
const BOXES = W.boxes ?? []
export function collide(pos) {
  const r = R_PLAYER
  for (const b of BOXES) {
    const cx = Math.max(b.x0, Math.min(b.x1, pos.x))
    const cz = Math.max(b.z0, Math.min(b.z1, pos.z))
    const ex = pos.x - cx
    const ez = pos.z - cz
    const d = Math.hypot(ex, ez)
    if (d >= r) continue
    if (d > 1e-6) {
      pos.x = cx + (ex / d) * r
      pos.z = cz + (ez / d) * r
    } else {
      const pushes = [pos.x - b.x0, b.x1 - pos.x, pos.z - b.z0, b.z1 - pos.z]
      const k = pushes.indexOf(Math.min(...pushes))
      if (k === 0) pos.x = b.x0 - r
      else if (k === 1) pos.x = b.x1 + r
      else if (k === 2) pos.z = b.z0 - r
      else pos.z = b.z1 + r
    }
  }
  for (const c of CIRCLES) {
    const dx = pos.x - c.x
    const dz = pos.z - c.z
    const d = Math.hypot(dx, dz)
    const rr = r + c.r
    if (d < rr && d > 1e-6) {
      pos.x = c.x + (dx / d) * rr
      pos.z = c.z + (dz / d) * rr
    }
  }
  const d = Math.hypot(pos.x, pos.z)
  if (d > BOUND) {
    pos.x *= BOUND / d
    pos.z *= BOUND / d
  }
  return pos
}

// where you are, in plain words (sent to the Metaverse Browser with presence())
export function locate(x, z) {
  if (Math.hypot(x - GUIDE.x, z - GUIDE.z) < 2.6) return `${W.name} · with ${W.guideName}`
  if (Math.hypot(x - PORTAL.x, z - PORTAL.z) < 3) return `${W.name} · by the portal to Metaverse Square`
  for (const a of W.areas ?? []) if (Math.hypot(x - a.x, z - a.z) < a.r) return `${W.name} · ${a.label}`
  return `${W.name} · ${W.elsewhere ?? 'outside'}`
}
