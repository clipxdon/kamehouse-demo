// Micro-interazioni con anime.js v4: pressione dei pulsanti, icone che si ridisegnano, numeri che scorrono.
import { animate, stagger, svg } from 'animejs'
import { reducedMotion } from './store'

const EASE = 'out(3)'

// Pulsanti e link principali: una piccola pressione, poi tornano al loro posto
export function installPress(root = document) {
  if (reducedMotion) return () => {}
  const sel = '.btn, .nav-cta, .soc, .dio-dot'
  const down = (e) => { const el = e.target.closest(sel); if (el) animate(el, { scale: 0.95, duration: 120, ease: EASE }) }
  const up = (e) => { const el = e.target.closest(sel); if (el) animate(el, { scale: 1, duration: 320, ease: 'outBack(2)' }) }
  root.addEventListener('pointerdown', down)
  root.addEventListener('pointerup', up)
  root.addEventListener('pointercancel', up)
  root.addEventListener('pointerleave', up, true)
  return () => {
    root.removeEventListener('pointerdown', down); root.removeEventListener('pointerup', up)
    root.removeEventListener('pointercancel', up); root.removeEventListener('pointerleave', up, true)
  }
}

// Le icone delle categorie si ridisegnano a tratto quando ci passi sopra
export function drawGlyph(card) {
  if (reducedMotion || !card) return
  const paths = card.querySelectorAll('.glyph path, .glyph circle, .glyph rect')
  if (!paths.length) return
  const d = svg.createDrawable(paths)
  animate(d, { draw: ['0 0', '0 1'], duration: 700, delay: stagger(60), ease: 'inOut(3)' })
}

export function countTo(el, to, { suffix = '', duration = 1300, decimals = 0 } = {}) {
  if (!el) return
  const fmt = (n) => n.toFixed(decimals).replace('.', ',') + suffix
  if (reducedMotion) { el.textContent = fmt(to); return }
  const o = { v: 0 }
  animate(o, { v: to, duration, ease: 'out(4)', onUpdate: () => { el.textContent = fmt(o.v) } })
}

// Didascalie del diorama: le lettere del titolo salgono, il testo entra subito dopo
export function rollCaption(el) {
  if (reducedMotion || !el) return
  animate(el.querySelectorAll('.cc'), { translateY: ['0.9em', '0em'], opacity: [0, 1], duration: 420, delay: stagger(14), ease: EASE })
  animate(el.querySelectorAll('.dio-text'), { translateY: [8, 0], opacity: [0, 1], duration: 420, delay: 120, ease: EASE })
}

// Il badge "Aperto ora" entra con una capsula che si chiude
export function popBadge(el) {
  if (reducedMotion || !el) return
  animate(el, { scale: [0.6, 1], opacity: [0, 1], duration: 480, ease: 'outBack(2.2)' })
}

// Riga di oggi negli orari
export function markToday(el) {
  if (reducedMotion || !el) return
  animate(el, { backgroundSize: ['0% 100%', '100% 100%'], duration: 700, delay: 200, ease: 'inOut(3)' })
}
