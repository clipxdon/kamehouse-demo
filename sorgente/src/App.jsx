import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import SplitText from './components/SplitText'
import CountUp from './components/CountUp'
import Glyph from './components/Glyph'
import Marquee from './components/Marquee'
import TiltCard from './components/TiltCard'
import { SHOP, CREDIT, BRANDS, CATEGORIES, SERVICES, REVIEWS, HOURS } from './content'
import { scene, reducedMotion, isMobile } from './store'
import logo160 from './assets/logo-160.webp'
import logo512 from './assets/logo-512.webp'

gsap.registerPlugin(ScrollTrigger)
const Scene = lazy(() => import('./three/Scene'))

// Scene "poses" per section (desktop / mobile).
const P = isMobile
  ? {
      hero: { spread: 1, open: 0, x: 0, y: 0.6, camZ: 10 },
      shop: { spread: 1.5, open: 0, x: 0, y: 0, camZ: 11 },
      catalog: { spread: 0.9, open: 1, x: 0, y: 0, camZ: 9 },
      visit: { spread: 1.2, open: 0.4, x: 0, y: 0, camZ: 10 },
    }
  : {
      hero: { spread: 1, open: 0, x: 0, y: 0, camZ: 9 },
      shop: { spread: 1.45, open: 0, x: 1.6, y: 0, camZ: 10.5 },
      catalog: { spread: 0.85, open: 1, x: 0, y: 0, camZ: 8.2 },
      visit: { spread: 1.15, open: 0.35, x: -1.4, y: 0, camZ: 10 },
    }
const pose = (p) => gsap.to(scene, { ...p, duration: 1.4, ease: 'expo.out', overwrite: 'auto' })
const poseOn = (trigger, p) =>
  ScrollTrigger.create({ trigger, start: 'top 55%', end: 'bottom 45%', onEnter: () => pose(p), onEnterBack: () => pose(p) })

function useLenis() {
  useEffect(() => {
    if (reducedMotion) return
    const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    window.__lenis = lenis
    return () => { gsap.ticker.remove(raf); lenis.destroy() }
  }, [])
}

const go = (id) => (e) => {
  e.preventDefault()
  const el = document.getElementById(id)
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: 0 })
  else el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
}

function Nav() {
  return (
    <header className="nav">
      <a href="#top" onClick={go('top')} className="logo" aria-label="Kamehouse, torna su">
        <img className="logo-mark" src={logo160} alt="" width="40" height="40" />
        Kamehouse
      </a>
      <nav aria-label="Sezioni">
        <a href="#negozio" onClick={go('negozio')}>Negozio</a>
        <a href="#catalogo" onClick={go('catalogo')}>Cosa trovi</a>
        <a href="#tornei" onClick={go('tornei')}>Tornei</a>
        <a href="#servizi" onClick={go('servizi')}>Servizi</a>
        <a href="#visita" onClick={go('visita')} className="nav-cta">Vieni a trovarci</a>
      </nav>
    </header>
  )
}

function Hero() {
  const ref = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      poseOn(ref.current, P.hero)
      if (reducedMotion) return
      gsap.from('.hero-pop', { scale: 0, rotate: -40, duration: 1, ease: 'back.out(2.2)', delay: 1.1 })
      gsap.from('.hero-meta > *', { opacity: 0, y: 24, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.8 })
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true } })
      tl.to('.hero-title', { yPercent: -25, scale: 0.92, ease: 'none' }, 0)
        .to(scene, { spin: 1.4, ease: 'none' }, 0)
        .to('.hero-meta', { opacity: 0, y: -40, ease: 'none' }, 0)
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="top" className="hero" ref={ref}>
      <p className="kicker hero-meta"><span>Fumetteria</span><span>Anime &amp; Manga</span><span>Fossano (CN)</span></p>
      <h1 className="hero-title" aria-label="Kamehouse">
        <SplitText as="span" text="KAME" className="ht-1" immediate delay={0.15} />
        <SplitText as="span" text="HOUSE" className="ht-2" immediate delay={0.35} />
      </h1>
      <div className="hero-pop" aria-hidden="true">Nuovo<br />negozio!</div>
      <div className="hero-meta hero-bottom">
        <p className="lead">La casa dei collezionisti a Fossano: manga, action figure, Funko e carte da gioco, scelti uno per uno.</p>
        <div className="ctas">
          <a className="btn btn-ink" href={SHOP.tel}>Chiama {SHOP.phone}</a>
          <a className="btn btn-paper" href={SHOP.maps} target="_blank" rel="noopener">Indicazioni</a>
        </div>
        <p className="rating"><b>5,0</b> <span aria-hidden="true">★★★★★</span> 15 recensioni su Google</p>
      </div>
      <a href="#negozio" onClick={go('negozio')} className="scroll-hint">Gira pagina <span aria-hidden="true">↓</span></a>
    </section>
  )
}

function Shop() {
  const ref = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      poseOn(ref.current, P.shop)
      if (reducedMotion) return
      const from = ['inset(0 100% 0 0)', 'inset(100% 0 0 0)', 'inset(0 0 0 100%)', 'inset(0 0 100% 0)', 'inset(50% 50% 50% 50%)']
      gsap.utils.toArray('.panel', ref.current).forEach((el, i) => {
        gsap.fromTo(el, { clipPath: from[i % from.length] }, {
          clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut', delay: (i % 3) * 0.08,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
      gsap.to('.balloon', { y: -10, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="negozio" className="shop" ref={ref}>
      <div className="page-grid">
        <article className="panel p-a">
          <span className="vol">Cap. 01 · Il negozio</span>
          <SplitText text="Ogni scaffale è una tavola." className="h2" />
          <p>Kamehouse è il nuovo negozio a tema anime e manga di Fossano. Fumetti, figure da collezione, giochi di carte e gadget convivono in uno spazio accogliente, pensato per chi colleziona da anni e per chi ha appena scoperto il primo volume.</p>
        </article>
        <article className="panel p-b halftone-pink">
          <div className="balloon">
            <p>Cerchi un numero introvabile o una figure in preordine? <b>Chiedi ad Angelo.</b></p>
          </div>
          <p className="caption">Preparato, disponibile e sempre aggiornato sulle uscite: è il motivo per cui i clienti tornano.</p>
        </article>
        <article className="panel p-c">
          <div className="stat"><span className="num">5,0</span><span>stelle su Google</span></div>
          <div className="stat"><span className="num"><CountUp to={760} suffix="+" /></span><span>follower su Instagram</span></div>
          <div className="stat"><span className="num"><CountUp to={5} /></span><span>giorni a settimana aperti</span></div>
        </article>
        <article className="panel p-d halftone-teal">
          <span className="big-sfx" aria-hidden="true">TOC TOC!</span>
          <p><b>{SHOP.address}</b><br />{SHOP.city}</p>
          <a className="link-arrow" href={SHOP.maps} target="_blank" rel="noopener">Apri in Google Maps →</a>
        </article>
      </div>
    </section>
  )
}

function Catalog() {
  const ref = useRef(null)
  const track = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      poseOn(ref.current, P.catalog)
      if (reducedMotion) return
      if (!isMobile) {
        const dist = () => track.current.scrollWidth - window.innerWidth + 64
        gsap.to(track.current, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true },
        })
      } else {
        gsap.utils.toArray('.cat-card', ref.current).forEach((el) =>
          gsap.from(el, { y: 60, rotate: -3, opacity: 0, duration: 0.9, ease: 'back.out(1.6)', scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
        )
      }
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="catalogo" className="catalog" ref={ref}>
      <div className="cat-head">
        <span className="vol">Cap. 02 · Cosa trovi</span>
        <SplitText text="Apri la capsula." className="h2" />
        <p>Sei scaffali, mille storie. Ecco cosa ti aspetta in Via Marconi.</p>
      </div>
      <div className="cat-track" ref={track}>
        {CATEGORIES.map((c, i) => (
          <TiltCard key={c.id} className={`cat-card tone-${c.tone}`}>
            <span className="cat-no">Vol. {String(i + 1).padStart(2, '0')}</span>
            <span className="cat-sfx" aria-hidden="true">{c.sfx}</span>
            <Glyph name={c.glyph} />
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </TiltCard>
        ))}
      </div>
    </section>
  )
}

function Tournaments() {
  const ref = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) return
      const cards = gsap.utils.toArray('.play-card', ref.current)
      const n = cards.length
      gsap.timeline({ scrollTrigger: { trigger: '.fan', start: 'top 80%', end: 'center 40%', scrub: 0.6 } })
        .fromTo(cards, { rotate: 0, x: 0, y: 40 }, {
          rotate: (i) => (i - (n - 1) / 2) * (isMobile ? 9 : 13),
          x: (i) => (i - (n - 1) / 2) * (isMobile ? 34 : 70),
          y: (i) => Math.abs(i - (n - 1) / 2) * 14,
          ease: 'none',
        })
      gsap.from('.t-list li', { x: -40, opacity: 0, stagger: 0.12, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: '.t-list', start: 'top 85%', once: true } })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="tornei" className="tournaments" ref={ref}>
      <div className="t-copy">
        <span className="vol">Cap. 03 · Tornei</span>
        <SplitText text="Scendi le scale. Si gioca." className="h2" />
        <p>Al piano di sotto c’è un seminterrato con diversi tavoli dove giocare, sfidarsi e organizzare tornei di carte. Porta il tuo mazzo, o costruiscilo qui.</p>
        <ul className="t-list">
          <li><b>Tavoli liberi</b> per giocare con gli amici</li>
          <li><b>Tornei di carte</b> organizzati in negozio</li>
          <li><b>Aperture di box</b> da vivere insieme</li>
        </ul>
        <a className="btn btn-yellow" href={SHOP.instagram} target="_blank" rel="noopener">Prossimi eventi su Instagram</a>
      </div>
      <div className="fan" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`play-card pc-${i}`}><span>★</span></div>
        ))}
      </div>
    </section>
  )
}

function Services() {
  const ref = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) return
      gsap.utils.toArray('.svc', ref.current).forEach((el, i) =>
        gsap.from(el, { yPercent: 30, rotate: i % 2 ? 3 : -3, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
      )
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="servizi" className="services" ref={ref}>
      <span className="vol">Cap. 04 · Servizi</span>
      <SplitText text="Non solo scaffali." className="h2" />
      <div className="svc-grid">
        {SERVICES.map((s) => (
          <article key={s.n} className="svc">
            <span className="svc-n">{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </article>
        ))}
      </div>
      <p className="svc-note">Acquisti in negozio, ritiro in negozio e consegna a domicilio.</p>
    </section>
  )
}

function Reviews() {
  const ref = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) return
      gsap.from('.rv', { scale: 0.6, opacity: 0, rotate: (i) => (i % 2 ? 6 : -6), stagger: 0.12, duration: 0.9, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.rv-grid', start: 'top 80%', once: true } })
      gsap.to('.rv-star', { rotate: 360, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section className="reviews" ref={ref} aria-labelledby="rv-title">
      <div className="rv-head">
        <div className="rv-score" aria-hidden="true"><i className="rv-star" /><span>5,0</span></div>
        <div>
          <span className="vol">Cap. 05 · Dicono di noi</span>
          <h2 id="rv-title" className="h2">5 stelle su 5, recensione dopo recensione.</h2>
        </div>
      </div>
      <div className="rv-grid">
        {REVIEWS.map((r, i) => (
          <figure key={i} className={`rv rv-${i}`}>
            <blockquote>“{r.q}”</blockquote>
            <figcaption>{r.a}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function useRomeNow() {
  const [now, setNow] = useState(null)
  useEffect(() => {
    const read = () => {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
      const get = (t) => parts.find((p) => p.type === t)?.value
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
      setNow({ day, min: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) })
    }
    read()
    const id = setInterval(read, 60000)
    return () => clearInterval(id)
  }, [])
  return now
}

function isOpen(now) {
  if (!now || now.day === 0 || now.day === 2) return false
  const close = now.day === 6 ? 19 * 60 + 15 : 19 * 60 + 30
  return (now.min >= 615 && now.min < 750) || (now.min >= 930 && now.min < close)
}

function Visit() {
  const ref = useRef(null)
  const now = useRomeNow()
  const open = isOpen(now)
  useEffect(() => {
    const ctx = gsap.context(() => {
      poseOn(ref.current, P.visit)
      if (reducedMotion) return
      gsap.from('.hours li', { x: 30, opacity: 0, stagger: 0.06, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: '.hours', start: 'top 85%', once: true } })
      gsap.from('.pin', { y: -80, duration: 1.1, ease: 'bounce.out', scrollTrigger: { trigger: '.map-card', start: 'top 80%', once: true } })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="visita" className="visit" ref={ref}>
      <span className="vol">Ultimo capitolo · Vieni a trovarci</span>
      <SplitText text="Ci vediamo in negozio." className="h2" />
      <div className="visit-grid">
        <div className="card hours-card">
          <h3>Orari {now && <span className={`status ${open ? 'on' : 'off'}`}>{open ? 'Aperto ora' : 'Chiuso ora'}</span>}</h3>
          <ul className="hours">
            {HOURS.map((h) => (
              <li key={h.d} className={`${now && now.day === h.i ? 'today' : ''} ${h.h === 'Chiuso' ? 'closed' : ''}`}>
                <span>{h.d}</span><span>{h.h}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card map-card">
          <div className="map" aria-hidden="true">
            <span className="street s1" /><span className="street s2" /><span className="street s3" />
            <span className="pin"><svg viewBox="0 0 40 52"><path d="M20 50S4 30 4 18a16 16 0 0 1 32 0c0 12-16 32-16 32z" /><circle cx="20" cy="18" r="6" /></svg></span>
          </div>
          <p className="addr"><b>{SHOP.address}</b><br />{SHOP.city}</p>
          <div className="ctas">
            <a className="btn btn-ink" href={SHOP.tel}>Chiama</a>
            <a className="btn btn-paper" href={SHOP.whatsapp} target="_blank" rel="noopener">WhatsApp</a>
            <a className="btn btn-paper" href={SHOP.maps} target="_blank" rel="noopener">Indicazioni</a>
          </div>
        </div>
        <div className="card social-card">
          <h3>Seguici</h3>
          <p>Novità, preordini, unboxing e aperture di box ogni settimana.</p>
          <a href={SHOP.instagram} target="_blank" rel="noopener" className="soc">Instagram <span>@kamehouse_fossano</span></a>
          <a href={SHOP.tiktok} target="_blank" rel="noopener" className="soc">TikTok <span>@kamehouse_fossano</span></a>
          <a href={SHOP.facebook} target="_blank" rel="noopener" className="soc">Facebook <span>Kamehouse Fossano</span></a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      {/* SVG sized to the word's own metrics: always fits the footer width */}
      <svg className="f-big" viewBox="10 -777 8400 812" aria-hidden="true" focusable="false">
        <text x="0" y="0" fontSize="1000" textLength="8419" lengthAdjust="spacingAndGlyphs">KAMEHOUSE</text>
      </svg>
      <div className="f-row">
        <img className="f-logo" src={logo512} alt="Logo di Kamehouse Fossano" width="96" height="96" loading="lazy" />
        <div className="f-text">
          <p>© {new Date().getFullYear()} {SHOP.legalName} · {SHOP.address}, {SHOP.city} · P.IVA {SHOP.vat} · Tel. {SHOP.phone}</p>
          <p><a href={SHOP.privacy}>Privacy e cookie</a> · I marchi citati appartengono ai rispettivi proprietari. · Sito realizzato da {CREDIT.url ? <a href={CREDIT.url} target="_blank" rel="noopener">{CREDIT.name}</a> : CREDIT.name}</p>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  useLenis()
  const [show3d, setShow3d] = useState(false)
  useEffect(() => {
    const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { scene.progress = s.progress } })
    // Load the 3D layer once the page is idle, so the text paints first.
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200))
    idle(() => setShow3d(true))
    const onLoad = () => ScrollTrigger.refresh()
    document.fonts && document.fonts.ready.then(onLoad)
    return () => st.kill()
  }, [])
  return (
    <>
      {show3d && <Suspense fallback={null}><Scene /></Suspense>}
      <div className="paper-fallback" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <Marquee items={BRANDS} className="mq-yellow" />
        <Shop />
        <Catalog />
        <Tournaments />
        <Services />
        <Reviews />
        <Visit />
      </main>
      <Footer />
    </>
  )
}
