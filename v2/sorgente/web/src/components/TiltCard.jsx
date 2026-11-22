// React Bits "TiltedCard": leggera inclinazione 3D che segue il puntatore, con un riflesso morbido.
import { useRef } from 'react'
import { gsap } from 'gsap'
import { reducedMotion, isMobile } from '../store'

export default function TiltCard({ children, className = '', max = 6, onEnter }) {
  const ref = useRef(null)
  const off = reducedMotion || isMobile
  const move = (e) => {
    if (off) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    gsap.to(ref.current, { rotateY: px * max, rotateX: -py * max, duration: 0.5, ease: 'power3.out' })
    ref.current.style.setProperty('--gx', `${(px + 0.5) * 100}%`)
    ref.current.style.setProperty('--gy', `${(py + 0.5) * 100}%`)
  }
  const leave = () => { if (!off) gsap.to(ref.current, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' }) }
  return (
    <div className="tilt-wrap">
      <div ref={ref} className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave} onPointerEnter={() => onEnter?.(ref.current)}>{children}</div>
    </div>
  )
}
