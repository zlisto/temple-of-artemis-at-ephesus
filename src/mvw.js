// Metaverse Web client, protocol mvw/0.1 (spec: PROTOCOL.md in the metaverse folder).
// The same file goes in every world. A world works on its own; inside the Metaverse Browser
// it also gets your identity, reports where you are, and hands portal trips to the browser.

export const PROTOCOL = 'mvw/0.1'
export const inBrowser = window.parent !== window
const params = new URLSearchParams(location.search)

// which spawn point to start at: ?spawn=<id> picks one of the world's spawns
export const spawnId = params.get('spawn')
export const pickSpawn = (spawns) => spawns[spawnId] ?? spawns.default

let identity = null
const listeners = new Set()
export function onIdentity(fn) {
  listeners.add(fn)
  if (identity) fn(identity)
  return () => listeners.delete(fn)
}

const post = (msg) => inBrowser && window.parent.postMessage({ protocol: PROTOCOL, ...msg }, '*')

window.addEventListener('message', (e) => {
  if (e.source !== window.parent || e.data?.protocol !== PROTOCOL) return
  if (e.data.type === 'enter') {
    identity = e.data.identity
    listeners.forEach((fn) => fn(identity))
  }
})
post({ type: 'ready' })

// tell the browser where you are in this world (shown in its status bar, readable by agents)
export const presence = (where) => post({ type: 'presence', where })

// walk through a portal. `back` is the spawn here to return to when you press Back.
export function navigate(href, spawn, back) {
  // don't release the mouse here: that would flash the world's pause menu on the way out.
  // Leaving the page (or the browser swapping the frame) releases it anyway.
  if (inBrowser) return post({ type: 'navigate', href, spawn, back }) // the browser waits for the whoosh
  const u = new URL(href)
  if (spawn) u.searchParams.set('spawn', spawn)
  setTimeout(() => (location.href = u.toString()), 450) // let the portal whoosh play
}
