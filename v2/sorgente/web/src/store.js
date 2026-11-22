// Stato condiviso: GSAP/ScrollTrigger scrive, il ciclo di R3F legge (nessun re-render di React).
export const scene = {
  spread: 1,      // quanto le capsule si allontanano dal centro
  open: 0,        // 0 = capsule chiuse, 1 = aperte con il premio
  spin: 0,
  progress: 0,    // scroll della pagina 0..1
  hero: 0,        // scroll dentro l'hero 0..1: manopola, sportello, capsula che esce
  pointer: { x: 0, y: 0 },
  globalPaused: false,
}
export const dio = { p: 0 }  // avanzamento del percorso nel diorama (0..fermate-1)

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const isMobile =
  typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches

export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch { return false }
}

export const PALETTE = { teal: '#14B8A6', pink: '#FF5C8A', ink: '#16151C', paper: '#FFF4E2', yellow: '#FFD23F' }
