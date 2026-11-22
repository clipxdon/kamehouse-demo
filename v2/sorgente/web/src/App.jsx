import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import SplitText from './components/SplitText'
import Glyph from './components/Glyph'
import Marquee from './components/Marquee'
import TiltCard from './components/TiltCard'
import { SHOP, BRANDS, CATEGORIES, SERVICES, REVIEWS, HOURS, DIO } from './content'
import { scene, dio, reducedMotion, isMobile, hasWebGL } from './store'
import { installPress, drawGlyph, countTo, rollCaption, popBadge, markToday } from './motion'
import gachaStill from './assets/render-gacha.webp'
import dioStill from './assets/render-diorama.webp'

gsap.registerPlugin(ScrollTrigger)
const Scene = lazy(() => import('./three/Scene'))
const Diorama = lazy(() => import('./three/Diorama'))
const WEBGL = typeof window !== 'undefined' && hasWebGL()

const P = {
  hero: { spread: 1.5, open: 0 },
  shop: { spread: 1.45, open: 0 },
  catalog: { spread: 0.9, open: 1 },
  visit: { spread: 1.2, open: 0.35 },
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

function Logo() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" /><path d="M15 37 32 20l17 17v11H15z" /></svg>
    </span>
  )
}

function Nav() {
  return (
    <header className="nav">
      <a href="#top" onClick={go('top')} className="logo" aria-label="Kamehouse, torna su"><Logo />Kamehouse</a>
      <nav aria-label="Sezioni">
        <a href="#negozio" onClick={go('negozio')}>Negozio</a>
        <a href="#catalogo" onClick={go('catalogo')}>Cosa trovi</a>
        <a href="#dentro" onClick={go('dentro')}>Dentro</a>
        <a href="#servizi" onClick={go('servizi')}>Servizi</a>
      </nav>
      <a href="#visita" onClick={go('visita')} className="nav-cta">Vieni a trovarci</a>
    </header>
  )
}

function Hero({ anchor, showStill, interactive }) {
  const ref = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      poseOn(ref.current, P.hero)
      if (reducedMotion) { scene.hero = 0.92; return }
      gsap.from('.hero-meta > *', { opacity: 0, y: 16, duration: 0.9, ease: 'expo.out', stagger: 0.07, delay: 0.5 })
      // L'hero resta fermo mentre giri la manopola: la capsula esce, rotola verso di te e si apre
      ScrollTrigger.create({
        trigger: ref.current, start: isMobile ? 'bottom bottom' : 'top top', end: isMobile ? '+=70%' : '+=90%', pin: true, scrub: true,
        onUpdate: (s) => {
          scene.hero = s.progress
          const steps = ref.current.querySelectorAll('.hero-step')
          ;[0.04, 0.4, 0.8].forEach((th, i) => steps[i]?.classList.toggle('on', s.progress > th))
          ref.current.querySelector('.hero-hint')?.classList.toggle('off', s.progress > 0.03)
        },
      })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="top" className="hero" ref={ref}>
      <div className="hero-copy">
        <p className="kicker hero-meta"><span>Fumetteria</span><span>Anime e manga</span><span>Fossano</span></p>
        <h1 className="hero-title" aria-label="Kamehouse">
          <SplitText as="span" text="KAME" className="ht-1" immediate delay={0.1} />
          <SplitText as="span" text="HOUSE" className="ht-2" immediate delay={0.25} />
        </h1>
        <div className="hero-meta hero-bottom">
          <p className="lead">La casa dei collezionisti a Fossano: manga, action figure, Funko e carte da gioco, scelti uno per uno</p>
          <div className="ctas">
            <a className="btn btn-ink" href={SHOP.tel}>Chiama {SHOP.phone}</a>
            <a className="btn btn-paper" href={SHOP.maps} target="_blank" rel="noopener">Indicazioni</a>
          </div>
          <p className="rating"><b>5,0</b><span className="stars" aria-hidden="true">★★★★★</span>15 recensioni su Google</p>
        </div>
      </div>
      <div className="hero-stage" ref={anchor}>
        <img className={`still ${showStill ? 'on' : ''}`} src={gachaStill} alt="Macchinetta delle capsule di Kamehouse, illustrazione 3D" width="600" height="733" />
        {interactive && <div className="hero-steps" aria-hidden="true">
          <span className="hero-step">Gira la manopola</span>
          <span className="hero-step">Esce una capsula</span>
          <span className="hero-step">Aprila</span>
        </div>}
        {interactive && <span className="hero-hint" aria-hidden="true">Scorri per girare la manopola</span>}
      </div>
    </section>
  )
}

function Shop() {
  const ref = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      poseOn(ref.current, P.shop)
      ScrollTrigger.create({
        trigger: '.p-c', start: 'top 85%', once: true,
        onEnter: () => { countTo(ref.current.querySelector('[data-n="rating"]'), 5, { decimals: 1 }); countTo(ref.current.querySelector('[data-n="fol"]'), 760, { suffix: '+' }); countTo(ref.current.querySelector('[data-n="days"]'), 5) },
      })
      if (reducedMotion) return
      const from = ['inset(0 100% 0 0)', 'inset(100% 0 0 0)', 'inset(0 0 0 100%)', 'inset(0 0 100% 0)']
      gsap.utils.toArray('.panel', ref.current).forEach((el, i) => {
        gsap.fromTo(el, { clipPath: from[i % from.length] }, {
          clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.inOut', delay: (i % 2) * 0.08,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="negozio" className="shop" ref={ref}>
      <div className="page-grid">
        <article className="panel p-a">
          <span className="vol">Capitolo 1 · Il negozio</span>
          <SplitText text="Ogni scaffale è una tavola" className="h2" />
          <p>Kamehouse è il negozio a tema anime e manga di Fossano. Fumetti, figure da collezione, giochi di carte e gadget convivono in uno spazio accogliente, pensato per chi colleziona da anni e per chi ha appena scoperto il primo volume.</p>
        </article>
        <article className="panel p-b halftone-pink">
          <div className="balloon">
            <p>Cerchi un numero introvabile o una figure in preordine? <b>Chiedi ad Angelo</b></p>
          </div>
          <p className="caption">Preparato, disponibile e sempre aggiornato sulle uscite: è il motivo per cui i clienti tornano.</p>
        </article>
        <article className="panel p-c">
          <div className="stat"><span className="num" data-n="rating">5,0</span><span>stelle su Google</span></div>
          <div className="stat"><span className="num" data-n="fol">760+</span><span>follower su Instagram</span></div>
          <div className="stat"><span className="num" data-n="days">5</span><span>giorni a settimana aperti</span></div>
        </article>
        <article className="panel p-d halftone-teal">
          <span className="big-sfx" aria-hidden="true">TOC TOC</span>
          <p><b>{SHOP.address}</b><br />{SHOP.city}</p>
          <a className="link-arrow" href={SHOP.maps} target="_blank" rel="noopener">Apri in Google Maps <span aria-hidden="true">→</span></a>
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
        const dist = () => track.current.scrollWidth - window.innerWidth + 48
        gsap.to(track.current, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true },
        })
      } else {
        gsap.utils.toArray('.cat-card', ref.current).forEach((el) =>
          gsap.from(el, { y: 40, opacity: 0, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }))
      }
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="catalogo" className="catalog" ref={ref}>
      <div className="cat-head">
        <span className="vol">Capitolo 2 · Cosa trovi</span>
        <SplitText text="Apri la capsula" className="h2" />
        <p>Sei scaffali, mille storie. Ecco cosa ti aspetta in Via Marconi</p>
      </div>
      <div className="cat-track" ref={track}>
        {CATEGORIES.map((c, i) => (
          <TiltCard key={c.id} className={`cat-card tone-${c.tone}`} onEnter={drawGlyph}>
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

function Inside() {
  const ref = useRef(null)
  const cap = useRef(null)
  const [step, setStep] = useState(0)
  const [near, setNear] = useState(false)
  const [active, setActive] = useState(false)
  const [failed, setFailed] = useState(!WEBGL)
  const static3d = reducedMotion || failed
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true) }, { rootMargin: '150% 0px' })
    io.observe(ref.current)
    const ctx = gsap.context(() => {
      if (static3d) return
      ScrollTrigger.create({
        trigger: ref.current, start: 'top top', end: () => '+=' + window.innerHeight * (isMobile ? 4 : 5), pin: true, scrub: true,
        onToggle: (s) => { setActive(s.isActive); scene.globalPaused = s.isActive },
        onUpdate: (s) => {
          dio.p = s.progress * (DIO.length - 1)
          const n = Math.round(dio.p)
          setStep((o) => (o === n ? o : n))
        },
      })
    }, ref)
    return () => { io.disconnect(); ctx.revert() }
  }, [static3d])
  useEffect(() => { rollCaption(cap.current) }, [step])
  const jump = (i) => () => {
    const st = ScrollTrigger.getAll().find((t) => t.trigger === ref.current && t.pin)
    if (!st) return
    const y = st.start + (st.end - st.start) * (i / (DIO.length - 1))
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo(0, y)
  }
  const d = DIO[step]
  return (
    <section id="dentro" className={`inside ${static3d ? 'is-static' : ''}`} ref={ref} aria-labelledby="dentro-title">
      <div className="dio-stage">
        {!static3d && near && (
          <Suspense fallback={null}><Diorama active={active} onError={() => setFailed(true)} /></Suspense>
        )}
        {static3d && <img className="dio-still" src={dioStill} alt="Il negozio in sezione: al piano terra scaffali di manga, vetrina e banco, nel seminterrato i tavoli da gioco" width="1200" height="900" loading="lazy" />}
      </div>
      <div className="dio-panel">
        <span className="vol">Capitolo 3 · Dentro Kamehouse</span>
        <h2 id="dentro-title" className="sr-only">Dentro Kamehouse</h2>
        {static3d ? (
          <ol className="dio-list">
            {DIO.map((x) => <li key={x.title}><b>{x.title}</b><span>{x.text}</span></li>)}
          </ol>
        ) : (
          <div className="dio-caption" ref={cap} aria-live="polite">
            <span className="dio-k">{d.k}</span>
            <h3 className="dio-title" aria-label={d.title}>{d.title.split(' ').map((w, wi) => (
              <span key={wi} className="cw" aria-hidden="true">{[...w].map((c, i) => <span key={i} className="cc">{c}</span>)}</span>
            ))}</h3>
            <p className="dio-text">{d.text}</p>
          </div>
        )}
        {!static3d && (
          <div className="dio-dots" role="group" aria-label="Fermate del percorso">
            {DIO.map((x, i) => (
              <button key={x.title} type="button" className={`dio-dot ${i === step ? 'on' : ''}`} onClick={jump(i)} aria-label={x.title} aria-current={i === step ? 'step' : undefined}>
                <i aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
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
          y: (i) => Math.abs(i - (n - 1) / 2) * 14, ease: 'none',
        })
      gsap.from('.t-list li', { x: -24, opacity: 0, stagger: 0.1, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: '.t-list', start: 'top 85%', once: true } })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="tornei" className="tournaments" ref={ref}>
      <div className="t-copy">
        <span className="vol">Capitolo 4 · Tornei</span>
        <SplitText text="Scendi le scale, si gioca" className="h2" />
        <p>Al piano di sotto c’è un seminterrato con diversi tavoli dove giocare, sfidarsi e organizzare tornei di carte. Porta il tuo mazzo, o costruiscilo qui.</p>
        <ul className="t-list">
          <li><b>Tavoli liberi</b> per giocare con gli amici</li>
          <li><b>Tornei di carte</b> organizzati in negozio</li>
          <li><b>Aperture di box</b> da vivere insieme</li>
        </ul>
        <a className="btn btn-yellow" href={SHOP.instagram} target="_blank" rel="noopener">Prossimi eventi su Instagram</a>
      </div>
      <div className="fan" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`play-card pc-${i}`}><span>★</span></div>)}
      </div>
    </section>
  )
}

function Services() {
  const ref = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) return
      gsap.from('.svc', { y: 32, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: '.svc-grid', start: 'top 85%', once: true } })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="servizi" className="services" ref={ref}>
      <span className="vol">Capitolo 5 · Servizi</span>
      <SplitText text="Non solo scaffali" className="h2" />
      <div className="svc-grid">
        {SERVICES.map((s) => (
          <article key={s.n} className="svc">
            <span className="svc-cap" aria-hidden="true" />
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </article>
        ))}
      </div>
      <p className="svc-note">Acquisti in negozio, ritiro in negozio e consegna a domicilio</p>
    </section>
  )
}

function Reviews() {
  const ref = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) return
      gsap.from('.rv', { y: 30, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: '.rv-grid', start: 'top 82%', once: true } })
      gsap.to('.rv-star', { rotate: 180, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section className="reviews" ref={ref} aria-labelledby="rv-title">
      <div className="rv-head">
        <div className="rv-score" aria-hidden="true"><i className="rv-star" /><span>5,0</span></div>
        <div>
          <span className="vol">Capitolo 6 · Dicono di noi</span>
          <h2 id="rv-title" className="h2">Cinque stelle su cinque, recensione dopo recensione</h2>
        </div>
      </div>
      <div className="rv-grid">
        {REVIEWS.map((r, i) => (
          <figure key={i} className="rv">
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
      ScrollTrigger.create({
        trigger: '.hours', start: 'top 85%', once: true,
        onEnter: () => { popBadge(ref.current.querySelector('.status')); markToday(ref.current.querySelector('.hours .today')) },
      })
      if (reducedMotion) return
      gsap.from('.pin', { y: -60, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '.map-card', start: 'top 80%', once: true } })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="visita" className="visit" ref={ref}>
      <span className="vol">Ultimo capitolo · Vieni a trovarci</span>
      <SplitText text="Ci vediamo in negozio" className="h2" />
      <div className="visit-grid">
        <div className="card hours-card">
          <h3>Orari {now && <span className={`status ${open ? 'on' : 'off'}`}><i aria-hidden="true" />{open ? 'Aperto ora' : 'Chiuso ora'}</span>}</h3>
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
          <p className="phone">Tel. <span className="mono">{SHOP.phone}</span></p>
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
      <p className="f-big" aria-hidden="true">KAMEHOUSE</p>
      <div className="f-row">
        <p>© 2026 Kamehouse Fossano · {SHOP.address}, {SHOP.city} · Tel. {SHOP.phone}</p>
        <p>Bozza dimostrativa, versione 2. I marchi citati appartengono ai rispettivi proprietari.</p>
      </div>
    </footer>
  )
}

export default function App() {
  useLenis()
  const anchor = useRef(null)
  const [show3d, setShow3d] = useState(false)
  const [modelOk, setModelOk] = useState(false)
  const [modelFail, setModelFail] = useState(!WEBGL)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { scene.progress = s.progress; setPaused((p) => (p === scene.globalPaused ? p : scene.globalPaused)) } })
    if (WEBGL) {
      const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 150))
      idle(() => setShow3d(true))
    }
    const off = installPress()
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh())
    return () => { st.kill(); off() }
  }, [])
  return (
    <>
      {show3d && (
        <Suspense fallback={null}>
          <Scene anchor={anchor} paused={paused} onLoaded={() => setModelOk(true)} onModelError={() => setModelFail(true)} />
        </Suspense>
      )}
      <div className="paper-fallback" aria-hidden="true" />
      <Nav />
      <main>
        <Hero anchor={anchor} showStill={!modelOk || modelFail} interactive={!reducedMotion && !modelFail} />
        <Marquee items={BRANDS} className="mq-yellow" />
        <Shop />
        <Catalog />
        <Inside />
        <Tournaments />
        <Services />
        <Reviews />
        <Visit />
      </main>
      <Footer />
    </>
  )
}
