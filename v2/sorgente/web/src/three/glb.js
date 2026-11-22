// Caricamento dei modelli Blender: il GLB (quantizzato + gzip) è nella pagina come base64.
// Lo decodifichiamo in un ArrayBuffer e lo passiamo a GLTFLoader.parse: niente fetch di data: URI,
// così funziona nelle anteprime con CSP rigida, da file locale e su GitHub Pages.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { PALETTE } from '../store'

const CACHE = new Map()

async function bytesOf(url) {
  if (url.startsWith('data:')) {
    const bin = atob(url.slice(url.indexOf(',') + 1))
    const u8 = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
    return u8
  }
  return new Uint8Array(await (await fetch(url)).arrayBuffer())
}
async function gunzip(u8) {
  if (u8[0] !== 0x1f || u8[1] !== 0x8b) return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
  const ds = new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))
  return await new Response(ds).arrayBuffer()
}

// Hook in stile Suspense: lancia la promessa finché il modello non è pronto, l'errore se fallisce.
export function useGLB(url) {
  let r = CACHE.get(url)
  if (!r) {
    r = { status: 'pending' }
    r.promise = (async () => {
      const buf = await gunzip(await bytesOf(url))
      return await new Promise((res, rej) => new GLTFLoader().parse(buf, '', res, rej))
    })().then((g) => { r.status = 'done'; r.value = g }, (e) => { r.status = 'error'; r.error = e })
    CACHE.set(url, r)
  }
  if (r.status === 'pending') throw r.promise
  if (r.status === 'error') throw r.error
  return r.value
}

// Gradiente a tre bande per il look cel-shading
let GRAD = null
export function toonGradient() {
  if (!GRAD) {
    GRAD = new THREE.DataTexture(new Uint8Array([140, 205, 255]), 3, 1, THREE.RedFormat)
    GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter
    GRAD.needsUpdate = true
  }
  return GRAD
}

const COLORS = {
  Teal: PALETTE.teal, Rosa: PALETTE.pink, Giallo: PALETTE.yellow, Inchiostro: '#23222B', Carta: PALETTE.paper,
  Bianco: '#FBFAF6', Arancio: '#FF8A3D', Viola: '#7C6CF2', Legno: '#D69A62', LegnoScuro: '#9A6A43',
  Pavimento: '#F4EBDB', PavimentoScuro: '#4D5868', Muro: '#A8EBDF', MuroLato: '#FFE1E9', MuroScuro: '#34505F',
  Sezione: '#1D1C24', Tappeto: '#2F8A7A', Feltro: '#1E9A87', Metallo: '#C3CAD1',
}

// Sostituisce i materiali di Blender con materiali toon, vetro e luci; restituisce le mesh da contornare.
export function toonify(root, { glassOpacity = 0.22 } = {}) {
  const grad = toonGradient()
  const made = new Map()
  const outlined = []
  root.traverse((o) => {
    if (!o.isMesh) return
    const name = o.material?.name || ''
    let m = made.get(name)
    if (!m) {
      if (name === 'Vetro') {
        m = new THREE.MeshPhysicalMaterial({ color: '#E6FFFB', transparent: true, opacity: glassOpacity, roughness: 0.05, metalness: 0, clearcoat: 1, depthWrite: false })
      } else if (name === 'Luce') {
        m = new THREE.MeshBasicMaterial({ color: '#FFF3CC', toneMapped: false })
      } else if (name === 'Neon') {
        m = new THREE.MeshBasicMaterial({ color: '#FF7AA2', toneMapped: false })
      } else if (name === 'Schermo') {
        m = new THREE.MeshBasicMaterial({ color: '#3BE3CC' })
      } else {
        m = new THREE.MeshToonMaterial({ color: COLORS[name] || '#cccccc', gradientMap: grad })
      }
      m.name = name
      made.set(name, m)
    }
    o.material = m
    if (!['Vetro', 'Luce', 'Neon', 'Schermo'].includes(name)) outlined.push(o)
  })
  return outlined
}

// Contorno a china con "inverted hull": la mesh ricopiata, gonfiata lungo le normali, con le facce dietro in nero.
export function hullMaterial(thickness = 0.012) {
  const m = new THREE.MeshBasicMaterial({ color: '#16151C', side: THREE.BackSide })
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uT = { value: thickness }
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uT;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * uT;')
  }
  return m
}
export function addHulls(meshes, thickness) {
  const mat = hullMaterial(thickness)
  meshes.forEach((o) => {
    const h = new THREE.Mesh(o.geometry, mat)
    h.name = o.name + '_hull'
    h.raycast = () => {}
    o.add(h)
  })
}

// Contorno a linee sugli spigoli (per il diorama, fatto quasi tutto di scatole)
export function addEdges(meshes, { angle = 35, color = '#16151C', opacity = 0.9 } = {}) {
  const mat = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })
  meshes.forEach((o) => {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, angle), mat)
    e.raycast = () => {}
    o.add(e)
  })
}
