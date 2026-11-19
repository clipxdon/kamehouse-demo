import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scene, isMobile, reducedMotion, PALETTE } from '../store'

// ---------- Backdrop: paper + halftone dots + soft speed lines (one cheap fragment shader)
function Backdrop() {
  const { size } = useThree()
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
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
            // halftone grid, dots grow toward the edges
            float cells = 70.0;
            vec2 g = fract(uv * vec2(cells * uRes.x / uRes.y, cells)) - 0.5;
            float edge = smoothstep(0.25, 0.95, length(p));
            float r = mix(0.04, 0.42, edge);
            float dotM = 1.0 - smoothstep(r - 0.06, r + 0.06, length(g));
            vec3 tint = mix(teal, pink, smoothstep(0.2, 0.9, uProg + p.y * 0.3));
            vec3 col = mix(paper, mix(paper, tint, 0.55), dotM);
            // radial speed lines
            float a = atan(p.y, p.x);
            float lines = step(0.93, fract(sin(floor(a * 60.0) * 91.7) * 43.1 + uTime * 0.08));
            col = mix(col, vec3(0.067), lines * smoothstep(0.35, 0.9, length(p)) * 0.10);
            col += (hash(uv * 900.0 + uTime) - 0.5) * 0.02;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    []
  )
  useFrame((s) => {
    mat.uniforms.uTime.value = reducedMotion ? 0 : s.clock.elapsedTime
    mat.uniforms.uProg.value = scene.progress
    mat.uniforms.uRes.value.set(size.width, size.height)
  })
  return (
    <mesh material={mat} frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}

// ---------- Toon (cel-shaded) look shared by everything
function useToonGradient() {
  return useMemo(() => {
    const t = new THREE.DataTexture(new Uint8Array([150, 215, 255]), 3, 1, THREE.RedFormat)
    t.minFilter = t.magFilter = THREE.NearestFilter
    t.needsUpdate = true
    return t
  }, [])
}

const OUTLINE = new THREE.MeshBasicMaterial({ color: PALETTE.ink, side: THREE.BackSide })

// ---------- Gacha capsule: coloured top shell, paper bottom, ink outline, a prize inside
const R = 0.5
const topGeo = new THREE.SphereGeometry(R, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2)
const botGeo = new THREE.SphereGeometry(R, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
const bandGeo = new THREE.TorusGeometry(R, 0.035, 8, 40)
const prizeGeo = new THREE.OctahedronGeometry(0.22, 0)

function Capsule({ data, grad }) {
  const g = useRef()
  const lid = useRef()
  const prize = useRef()
  const mats = useMemo(
    () => ({
      top: new THREE.MeshToonMaterial({ color: data.color, gradientMap: grad, side: THREE.DoubleSide }),
      bot: new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: grad, side: THREE.DoubleSide }),
      prize: new THREE.MeshToonMaterial({ color: data.prize, gradientMap: grad }),
    }),
    [data, grad]
  )
  useFrame((s) => {
    const t = reducedMotion ? 0 : s.clock.elapsedTime
    const o = scene.open
    const sp = scene.spread
    g.current.position.set(
      data.pos[0] * sp + Math.sin(t * data.sp + data.ph) * 0.15,
      data.pos[1] * sp + Math.cos(t * data.sp * 0.8 + data.ph) * 0.22,
      data.pos[2]
    )
    g.current.rotation.set(data.rot[0] + t * 0.15 * data.sp + scene.spin * data.dir, data.rot[1] + t * 0.22 * data.sp + scene.spin, data.rot[2])
    const lo = Math.min(1, Math.max(0, o * 1.3 - data.delay))
    lid.current.position.y = lo * 0.55
    lid.current.rotation.x = -lo * 1.1
    prize.current.position.y = lo * 0.45
    prize.current.rotation.y = t * 1.5
    const ps = 0.4 + lo * 0.9
    prize.current.scale.setScalar(ps)
  })
  return (
    <group ref={g} scale={data.s}>
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

// ---------- Comic "burst" stickers with original onomatopoeia, drawn on a canvas texture
function makeBurst(word, fill) {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const draw = () => {
    const x = c.getContext('2d')
    x.clearRect(0, 0, 512, 512)
    x.save()
    x.translate(256, 256)
    x.beginPath()
    const spikes = 14
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 ? 150 : 240 - (i % 4) * 14
      const a = (i / (spikes * 2)) * Math.PI * 2
      x.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    x.closePath()
    x.fillStyle = fill
    x.strokeStyle = PALETTE.ink
    x.lineWidth = 14
    x.lineJoin = 'round'
    x.fill()
    x.stroke()
    x.rotate(-0.12)
    x.font = `${word.length > 4 ? 76 : 104}px "Dela Gothic One", Impact, sans-serif`
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.lineWidth = 12
    x.strokeStyle = PALETTE.ink
    x.strokeText(word, 0, 6)
    x.fillStyle = '#fff'
    x.fillText(word, 0, 6)
    x.restore()
  }
  draw()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  if (document.fonts) document.fonts.load('104px "Dela Gothic One"').then(() => { draw(); tex.needsUpdate = true })
  return tex
}

function Burst({ word, fill, pos, s, ph }) {
  const ref = useRef()
  const tex = useMemo(() => makeBurst(word, fill), [word, fill])
  useFrame((st) => {
    const t = reducedMotion ? 0 : st.clock.elapsedTime
    ref.current.position.set(pos[0] * scene.spread, pos[1] * scene.spread + Math.sin(t + ph) * 0.12, pos[2])
    ref.current.rotation.z = Math.sin(t * 0.7 + ph) * 0.12
    const k = s * (1 + Math.sin(t * 2.2 + ph) * 0.03)
    ref.current.scale.set(k, k, k)
  })
  return (
    <mesh ref={ref}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  )
}

function World() {
  const grad = useToonGradient()
  const group = useRef()
  const capsules = useMemo(() => {
    const n = isMobile ? 8 : 15
    const cols = [PALETTE.teal, PALETTE.pink, PALETTE.yellow, PALETTE.teal, PALETTE.pink]
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.5
      const rad = 2.2 + rnd() * 2.4
      return {
        pos: [Math.cos(a) * rad * (isMobile ? 0.6 : 1.25), Math.sin(a) * rad * 0.62, -rnd() * 4 + 0.5],
        rot: [rnd() * 3, rnd() * 3, rnd() * 3],
        s: 0.6 + rnd() * 0.65,
        sp: 0.5 + rnd() * 0.8,
        ph: rnd() * 10,
        dir: rnd() > 0.5 ? 1 : -1,
        delay: rnd() * 0.3,
        color: cols[i % cols.length],
        prize: cols[(i + 2) % cols.length],
      }
    })
  }, [])
  const bursts = isMobile
    ? [{ word: 'NEW!', fill: PALETTE.yellow, pos: [-1.0, -2.9, -1], s: 1.1, ph: 1 }]
    : [
        { word: 'NEW!', fill: PALETTE.yellow, pos: [3.6, 1.9, -1], s: 1.5, ph: 1 },
        { word: 'POP!', fill: PALETTE.pink, pos: [-4.1, -1.7, -2], s: 1.3, ph: 3 },
        { word: 'WOW!', fill: PALETTE.teal, pos: [4.2, -2.1, -3], s: 1.2, ph: 5 },
      ]
  useFrame((_, dt) => {
    const g = group.current
    g.position.x = THREE.MathUtils.damp(g.position.x, scene.x + scene.pointer.x * 0.25, 3, dt)
    g.position.y = THREE.MathUtils.damp(g.position.y, scene.y - scene.pointer.y * 0.2, 3, dt)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, scene.pointer.x * 0.12, 3, dt)
  })
  return (
    <group ref={group}>
      {capsules.map((d, i) => <Capsule key={i} data={d} grad={grad} />)}
      {bursts.map((b) => <Burst key={b.word} {...b} />)}
    </group>
  )
}

function Rig() {
  const { camera } = useThree()
  useFrame((_, dt) => {
    camera.position.z = THREE.MathUtils.damp(camera.position.z, scene.camZ, 3.5, dt)
  })
  return null
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

// Stop rendering when the tab is hidden, and render once when motion is reduced.
function Invalidator() {
  const { invalidate } = useThree()
  useEffect(() => {
    if (!reducedMotion) return
    const id = setInterval(() => invalidate(), 300)
    return () => clearInterval(id)
  }, [invalidate])
  return null
}

export default function Scene() {
  return (
    <div className="canvas-wrap" aria-hidden="true">
      <Canvas
        dpr={[1, isMobile ? 1.5 : 1.75]}
        camera={{ position: [0, 0, 9], fov: 40 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        frameloop={reducedMotion ? 'demand' : 'always'}
      >
        <Backdrop />
        <Rig />
        <Pointer />
        <Invalidator />
        <ambientLight intensity={1.3} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} />
        <World />
      </Canvas>
    </div>
  )
}
