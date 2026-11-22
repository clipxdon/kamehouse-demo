// Diorama del negozio in sezione (GLB da Blender): lo scroll porta la telecamera dagli scaffali al seminterrato.
import { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import dioUrl from '../assets/diorama.glb.gz?url'
import META from '../assets/kamehouse.json'
import { dio, isMobile, reducedMotion } from '../store'
import { useGLB, toonify, addEdges } from './glb'

const S = META.diorama.stops
// Fermate: punto guardato, direzione da cui guardiamo, distanza
export const STOPS = [
  { t: S.overview, d: [1.0, 0.55, 1.3], r: isMobile ? 27 : 15.5, m: 0.06 },
  { t: S.shelves, d: [0.35, 0.3, 1.0], r: isMobile ? 7.6 : 5.6, m: 0.14 },
  { t: S.case, d: [1.35, 0.32, 0.55], r: isMobile ? 6.6 : 4.6, m: 0.14 },
  { t: S.counter, d: [0.75, 0.55, 1.0], r: isMobile ? 7.6 : 5.4, m: 0.12 },
  { t: S.stairs, d: [1.2, 0.5, 0.9], r: isMobile ? 9 : 6.8, m: 0.02 },
  { t: [S.tables[0] + 0.6, S.tables[1], S.tables[2] + 0.3], d: [0.3, 0.17, 1.2], r: isMobile ? 10.5 : 7.4, m: -0.04 },
]

const v = (a) => new THREE.Vector3(...a)
const smooth = (t) => t * t * (3 - 2 * t)

function Model() {
  const gltf = useGLB(dioUrl)
  const root = useMemo(() => {
    const s = gltf.scene
    const outlined = toonify(s, { glassOpacity: 0.18 })
    addEdges(outlined, { angle: 32, opacity: 0.85 })
    return s
  }, [gltf])
  return <primitive object={root} />
}

function Rig() {
  const { camera } = useThree()

  const look = useRef(v(S.overview))
  const pos = useRef(null)
  const tgt = useMemo(() => new THREE.Vector3(), [])
  const dir = useMemo(() => new THREE.Vector3(), [])
  const want = useMemo(() => new THREE.Vector3(), [])
  useFrame((st, dt) => {
    const p = THREE.MathUtils.clamp(dio.p, 0, STOPS.length - 1)
    const i = Math.min(Math.floor(p), STOPS.length - 2)
    const f = smooth(p - i)
    const a = STOPS[i], b = STOPS[i + 1]
    tgt.copy(v(a.t)).lerp(v(b.t), f)
    dir.copy(v(a.d).normalize()).lerp(v(b.d).normalize(), f).normalize()
    // a metà strada fra due fermate la telecamera si allontana un poco, come una gru
    const r = THREE.MathUtils.lerp(a.r, b.r, f) + Math.sin(f * Math.PI) * 1.4
    const t = reducedMotion ? 0 : st.clock.elapsedTime
    dir.x += Math.sin(t * 0.3) * 0.02
    want.copy(tgt).addScaledVector(dir, r)
    // su mobile la didascalia copre il terzo basso: guardiamo un po' più in basso, così la scena sale nell'inquadratura
    if (isMobile) tgt.y -= r * THREE.MathUtils.lerp(a.m, b.m, f)
    if (!pos.current) { pos.current = want.clone(); look.current.copy(tgt) }
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 4)
    pos.current.lerp(want, k)
    look.current.lerp(tgt, k)
    camera.position.copy(pos.current)
    camera.lookAt(look.current)
  })
  return null
}

class Guard extends Component {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  componentDidCatch(e) { console.warn('Diorama non caricato', e); this.props.onError?.() }
  render() { return this.state.err ? null : this.props.children }
}

export default function Diorama({ onError, active }) {
  const zb = META.diorama.zb
  return (
    <Canvas
      className="dio-canvas"
      dpr={[1, isMobile ? 1.5 : 1.75]}
      camera={{ position: [12, 6, 14], fov: 34, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      frameloop={active ? 'always' : 'demand'}
    >
      <color attach="background" args={['#FFF4E2']} />
      <ambientLight intensity={1.15} />
      <hemisphereLight args={['#fff6e6', '#b9d8d2', 0.6]} />
      <directionalLight position={[6, 9, 7]} intensity={1.9} />
      {!isMobile && [[-2.4, 0.4], [-0.3, 0.4], [-1.35, -1.4]].map(([x, y], i) => (
        <pointLight key={i} position={[x, zb + 1.9, -y]} intensity={3} distance={4.5} decay={1.6} color="#ffe7b0" />
      ))}
      <Rig />
      <Guard onError={onError}>
        <Suspense fallback={null}><Model /></Suspense>
      </Guard>
    </Canvas>
  )
}
