import { Fragment, useEffect, useRef, useState } from 'react'
import W from '../wonder.js'

// The chat window that opens when you talk to the guide. Their lines are fixed (wonder.js):
// you pick a question, it shows up as your message, and the answer follows after a short pause.

// tiny, safe formatting: **bold**, `code`, "- " bullets, clickable https:// links
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|https:\/\/[^\s)]+[^\s).,:])/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <b key={i}>{part.slice(2, -2)}</b>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>
    if (part.startsWith('https://'))
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer">
          {part.replace('https://', '')}
        </a>
      )
    return <Fragment key={i}>{part}</Fragment>
  })
}
function Rich({ text }) {
  const blocks = []
  for (const line of text.split('\n')) {
    const bullet = line.match(/^\s*-\s+(.*)/)
    const last = blocks[blocks.length - 1]
    if (bullet) {
      if (last?.type === 'ul') last.items.push(bullet[1])
      else blocks.push({ type: 'ul', items: [bullet[1]] })
    } else if (line.trim()) blocks.push({ type: 'p', text: line })
  }
  return blocks.map((b, i) =>
    b.type === 'ul' ? (
      <ul key={i}>
        {b.items.map((it, j) => (
          <li key={j}>{inline(it)}</li>
        ))}
      </ul>
    ) : (
      <p key={i}>{inline(b.text)}</p>
    ),
  )
}

// the conversation is kept while the page is open, so closing and reopening picks up where you were
let saved = null

export default function GuidePanel({ visitor, onClose }) {
  const [messages, setMessages] = useState(() => saved ?? [{ who: 'guide', text: W.greeting(visitor) }])
  const [typing, setTyping] = useState(false)
  const log = useRef()
  useEffect(() => {
    saved = messages
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])
  useEffect(() => {
    const esc = (e) => e.code === 'Escape' && onClose()
    addEventListener('keydown', esc)
    return () => removeEventListener('keydown', esc)
  }, [onClose])

  const asked = new Set(messages.filter((m) => m.who === 'you').map((m) => m.text))
  const ask = (fact) => {
    if (typing) return
    setMessages((m) => [...m, { who: 'you', text: fact.q }])
    setTyping(true)
    setTimeout(() => {
      setMessages((m) => [...m, { who: 'guide', text: fact.a }])
      setTyping(false)
    }, 650)
  }

  return (
    <div className="guide" role="dialog" aria-label={`Talking with ${W.guideName}`}>
      <header>
        <div className="guide-avatar">{W.guideIcon}</div>
        <div className="guide-title">
          {W.guideName}
          <span>{W.guideRole}</span>
        </div>
        <button className="guide-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <div className="guide-log" ref={log}>
        {messages.map((m, i) => (
          <div key={i} className={`guide-msg ${m.who === 'you' ? 'you' : 'tauhid'}`}>
            <Rich text={m.text} />
          </div>
        ))}
        {typing && <div className="guide-msg tauhid typing">…</div>}
      </div>
      <div className="guide-asks">
        {W.facts.map((f) => (
          <button key={f.q} className={asked.has(f.q) ? 'asked' : ''} onClick={() => ask(f)} disabled={typing}>
            {f.q}
          </button>
        ))}
      </div>
      <div className="guide-foot">Click outside the chat, Esc or × to keep exploring</div>
    </div>
  )
}
