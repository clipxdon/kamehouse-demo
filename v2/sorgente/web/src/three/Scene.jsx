// Livello 3D fisso dietro la pagina: carta a retino, capsule che fluttuano e la macchinetta modellata in Blender.
import { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gachaUrl from '../assets/gacha.glb.gz?url'
import META from '../assets/kamehouse.json'
import { scene, isMobile, reducedMotion, PALETTE } from '../store'
import { useGLB, toonify, addHulls, toonGradient, hullMaterial } from './glb'

const CAM_Z = 9, FOV = 36

// ---------- Fondo: carta, retino che cresce verso i bordi, tinta che passa dal verde acqua al rosa con lo scroll
function Backdrop() {
  const { size } = useThree()
  const mat = useMemo(() => new THREE.ShaderMaterial({
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uProg: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime; uniform float uProg; uniform vec2 uRes;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      void main(){
        vec2 uv = vUv;
        vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
        vec3 paper = vec3(1.0, 0.957, 0.886);
        vec3 teal = vec3(0.078, 0.722, 0.651);
        vec3 pink = vec3(1.0, 0.36, 0.54);
        float cells = 64.0;
        vec2 g = fract(uv * vec2(cells * uRes.x / uRes.y, cells)) - 0.5;
        float edge = smoothstep(0.35, 1.0, length(p));
        float r = mix(0.02, 0.36, edge);
        float dotM = 1.0 - smoothstep(r - 0.05, r + 0.05, length(g));
        vec3 tint = mix(teal, pink, smoothstep(0.25, 0.95, uProg + p.y * 0.25));
        vec3 col = mix(paper, mix(paper, tint, 0.42), dotM);
        col += (hash(uv * 900.0 + floor(uTime * 12.0)) - 0.5) * 0.016;
        gl_FragColor = vec4(col, 1.0);
      }`,
  }), [])
  useFrame((s) => {
    mat.uniforms.uTime.value = reducedMotion ? 0 : s.clock.elapsedTime
    mat.uniforms.uProg.value = scene.progress
    mat.uniforms.uRes.value.set(size.width, size.height)
  })
  return <mesh material={mat} frustumCulled={false} renderOrder={-1}><planeGeometry args={[2, 2]} /></mesh>
}

// ---------- Capsule che fluttuano sullo sfondo (si aprono in "Cosa trovi")
const R = 0.5
const topGeo = new THREE.SphereGeometry(R, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2)
const botGeo = new THREE.SphereGeometry(R, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
const bandGeo = new THREE.TorusGeometry(R, 0.035, 8, 40)
const prizeGeo = new THREE.OctahedronGeometry(0.22, 0)
const OUTLINE = new THREE.MeshBasicMaterial({ color: PALETTE.ink, side: THREE.BackSide })

function Capsule({ d }) {
  const g = useRef(), lid = useRef(), prize = useRef()
  const grad = toonGradient()
  const mats = useMemo(() => ({
    top: new THREE.MeshToonMaterial({ color: d.color, gradientMap: grad, side: THREE.DoubleSide }),
    bot: new THREE.MeshToonMaterial({ color: '#FBFAF6', gradientMap: grad, side: THREE.DoubleSide }),
    prize: new THREE.MeshToonMaterial({ color: d.prize, gradientMap: grad }),
  }), [d, grad])
  useFrame((s) => {
    const t = reducedMotion ? 0 : s.clock.elapsedTime
    const sp = scene.spread
    g.current.position.set(d.pos[0] * sp + Math.sin(t * d.sp + d.ph) * 0.15, d.pos[1] * sp + Math.cos(t * d.sp * 0.8 + d.ph) * 0.2, d.pos[2])
    g.current.rotation.set(d.rot[0] + t * 0.12 * d.sp + scene.spin * d.dir, d.rot[1] + t * 0.18 * d.sp + scene.spin, d.rot[2])
    const lo = THREE.MathUtils.clamp(scene.open * 1.3 - d.delay, 0, 1)
    lid.current.position.y = lo * 0.55
    lid.current.rotation.x = -lo * 1.1
    prize.current.position.y = lo * 0.45
    prize.current.rotation.y = t * 1.2
    prize.current.scale.setScalar(0.4 + lo * 0.9)
  })
  return (
    <group ref={g} scale={d.s}>
      <group ref={lid}>
        <mesh geometry={topGeo} material={mats.top} />
        <mesh geometry={topGeo} material={OUTLINE} scale={1.06} />
      </group>
      <mesh geometry={botGeo} material={mats.bot} />
      <mesh geometry={botGeo} material={OUTLINE} scale={1.06} />
      <mesh geometry={bandGeo} material={OUTLINE} rotation-x={Math.PI / 2} />
      <group ref={prize}>
        <mesh geometry={prizeGeo} material={mats.prize} />
        <mesh geometry={prizeGeo} material={OUTLINE} scale={1.12} />
      </group>
    </group>
  )
}

function Capsules() {
  const list = useMemo(() => {
    const n = isMobile ? 5 : 9
    const cols = [PALETTE.teal, PALETTE.pink, PALETTE.yellow, '#7C6CF2', '#FF8A3D']
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.4
      const rad = 3 + rnd() * 1.6
      return {
        pos: [Math.cos(a) * rad * (isMobile ? 0.95 : 1.3), Math.sin(a) * rad * 0.62, -3.5 - rnd() * 3],
        rot: [rnd() * 3, rnd() * 3, rnd() * 3], s: 0.5 + rnd() * 0.5, sp: 0.5 + rnd() * 0.7, ph: rnd() * 10,
        dir: rnd() > 0.5 ? 1 : -1, delay: rnd() * 0.3, color: cols[i % 5], prize: cols[(i + 2) % 5],
      }
    })
  }, [])
  const group = useRef()
  useFrame((_, dt) => {
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, scene.pointer.x * 0.3, 3, dt)
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, -scene.pointer.y * 0.2, 3, dt)
  })
  return <group ref={group}>{list.map((d, i) => <Capsule key={i} d={d} />)}</group>
}

// ---------- Macchinetta delle capsule (GLB da Blender), agganciata a un elemento della pagina
const ease = (t) => t * t * (3 - 2 * t)
const seg = (h, a, b) => ease(THREE.MathUtils.clamp((h - a) / (b - a), 0, 1))

function Gacha({ anchor, onLoaded }) {
  const gltf = useGLB(gachaUrl)
  useEffect(() => { onLoaded?.() }, [])
  const { camera, size } = useThree()
  const root = useRef()
  const parts = useMemo(() => {
    const s = gltf.scene
    const outlined = toonify(s, { glassOpacity: 0.2 })
    addHulls(outlined.filter((o) => !o.name.startsWith('Capsule')), 0.014)
    addHulls(outlined.filter((o) => o.name.startsWith('Capsule')), 0.008)
    const get = (n) => s.getObjectByName(n)
    // il premio dentro la capsula che esce: una stella gialla
    const shape = new THREE.Shape()
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.05 : 0.12
      i ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    const sg = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1 })
    sg.center()
    const star = new THREE.Mesh(sg, new THREE.MeshToonMaterial({ color: PALETTE.yellow, gradientMap: toonGradient() }))
    star.add(new THREE.Mesh(sg, hullMaterial(0.012)))
    star.scale.setScalar(0.001)
    const out = get('CapsulaUscita')
    out.add(star)
    return { s, knob: get('Manopola'), flap: get('Sportello'), out, lid: get('CapsulaCoperchio'), star, out0: out.position.clone() }
  }, [gltf])

  const H = META.gacha.height
  const tmp = useMemo(() => new THREE.Vector3(), [])
  useFrame((st, dt) => {
    const el = anchor.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vh = 2 * Math.tan((FOV * Math.PI) / 360) * CAM_Z
    const k = vh / size.height
    const cx = (r.left + r.width / 2 - size.width / 2) * k
    const cy = -(r.top + r.height / 2 - size.height / 2) * k
    const sc = (r.height * k * 0.86) / H
    const g = root.current
    g.visible = r.bottom > -40 && r.top < size.height + 40
    g.position.set(cx, cy - (H / 2 - 0.08) * sc, 0)
    g.scale.setScalar(sc)
    const t = reducedMotion ? 0 : st.clock.elapsedTime
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -0.42 + scene.pointer.x * 0.22 + Math.sin(t * 0.4) * 0.04, 3, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.06 + scene.pointer.y * 0.06, 3, dt)

    // sequenza guidata dallo scroll dell'hero
    const h = scene.hero
    const P = parts
    P.knob.rotation.z = -seg(h, 0.02, 0.32) * Math.PI * 2           // la manopola fa un giro intero
    P.flap.rotation.x = -seg(h, 0.28, 0.4) * 1.15 + seg(h, 0.62, 0.72) * 1.15
    const ex = seg(h, 0.32, 0.46), fall = seg(h, 0.42, 0.56), roll = seg(h, 0.5, 0.78)
    P.out.position.set(P.out0.x + roll * 0.9, P.out0.y - fall * 0.08 + Math.sin(roll * Math.PI) * 0.05, P.out0.z + ex * 0.42 + roll * 0.3)
    P.out.rotation.z = -roll * Math.PI * 2
    P.out.rotation.x = 0
    const op = seg(h, 0.78, 0.9)
    P.out.rotation.z = THREE.MathUtils.lerp(P.out.rotation.z, -Math.PI * 2, op)
    P.lid.position.set(0, op * 0.2, -op * 0.08)
    P.lid.rotation.x = -op * 1.0
    P.star.scale.setScalar(0.001 + op * 1.3)
    P.star.position.y = op * 0.3
    P.star.rotation.y = t * 1.5
    tmp.set(0, 0, 0)
  })
  return <group ref={root}><primitive object={parts.s} /></group>
}

function Pointer() {
  useEffect(() => {
    if (reducedMotion || isMobile) return
    const on = (e) => {
      scene.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      scene.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', on, { passive: true })
    return () => window.removeEventListener('pointermove', on)
  }, [])
  return null
}

// Se il modello non si carica, mostriamo il render di Blender al suo posto
class Guard extends Component {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  componentDidCatch(e) { console.warn('Modello 3D non caricato', e); this.props.onError?.() }
  render() { return this.state.err ? null : this.props.children }
}

function Pauser() {
  const { invalidate } = useThree()
  useEffect(() => {
    if (!reducedMotion) return
    const id = setInterval(() => invalidate(), 250)
    return () => clearInterval(id)
  }, [invalidate])
  return null
}

export default function Scene({ anchor, paused, onModelError, onLoaded }) {
  return (
    <div className="canvas-wrap" aria-hidden="true">
      <Canvas
        dpr={[1, isMobile ? 1.5 : 1.75]}
        camera={{ position: [0, 0, CAM_Z], fov: FOV }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        frameloop={reducedMotion || paused ? 'demand' : 'always'}
      >
        <Backdrop />
        <Pointer />
        <Pauser />
        <ambientLight intensity={1.25} />
        <directionalLight position={[4, 6, 6]} intensity={2.1} />
        <Capsules />
        <Guard onError={onModelError}>
          <Suspense fallback={null}><Gacha anchor={anchor} onLoaded={onLoaded} /></Suspense>
        </Guard>
      </Canvas>
    </div>
  )
}
