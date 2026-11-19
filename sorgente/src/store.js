// Shared mutable scene state: GSAP/ScrollTrigger writes, the R3F loop reads (no React re-renders).
export const scene = {
  spread: 1,     // how far capsules drift from the centre
  open: 0,       // 0 = capsules closed, 1 = open with the prize popping out
  x: 0,          // group horizontal offset
  y: 0,
  camZ: 9,
  spin: 0,       // extra scroll-driven rotation
  progress: 0,   // page scroll 0..1
  pointer: { x: 0, y: 0 },
}

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isMobile =
  typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches

export const PALETTE = {
  teal: '#14B8A6',
  pink: '#FF5C8A',
  ink: '#111114',
  paper: '#FFF4E2',
  yellow: '#FFD23F',
}
