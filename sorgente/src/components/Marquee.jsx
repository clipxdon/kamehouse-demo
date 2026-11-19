// React Bits "ScrollVelocity"-style band: a looping marquee whose speed and direction follow the scroll.
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { reducedMotion } from '../store'

export default function Marquee({ items, className = '' }) {
  const track = useRef(null)
  useEffect(() => {
    if (reducedMotion) return
    const el = track.current
    let x = 0, boost = 0, dir = -1
    const st = ScrollTrigger.create({
      trigger: el, start: 'top bottom', end: 'bottom top',
      onUpdate: (s) => { boost = Math.min(Math.abs(s.getVelocity()) / 300, 8); dir = s.direction > 0 ? -1 : 1 },
    })
    const tick = () => {
      const half = el.scrollWidth / 2
      x += dir * (0.6 + boost)
      boost *= 0.92
      if (x <= -half) x += half
      if (x > 0) x -= half
      el.style.transform = `translate3d(${x}px,0,0)`
    }
    gsap.ticker.add(tick)
    return () => { gsap.ticker.remove(tick); st.kill() }
  }, [])
  const row = items.map((t, i) => <span key={i} className="mq-item">{t}<i aria-hidden="true">✦</i></span>)
  return (
    <div className={`marquee ${className}`} aria-label={items.join(', ')}>
      <div className="mq-track" ref={track} aria-hidden="true">{row}{row}</div>
    </div>
  )
}
