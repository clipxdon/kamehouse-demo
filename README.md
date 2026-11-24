# Kamehouse Fossano — demo sito vetrina 3D

Bozza dimostrativa di sito vetrina per la fumetteria Kamehouse di Fossano (CN).

- `index.html`: build pronta (file singolo), servita da GitHub Pages.
- `sorgente/`: codice React + Three.js (React Three Fiber), GSAP ScrollTrigger, Lenis.
  `cd sorgente && npm ci && npm run build` rigenera `dist/index.html`.

## Sito definitivo (branch `sito-definitivo`)

Il cliente ha scelto la **v1** come sito vetrina (incontro del 23/11/2026). Su questo branch il sorgente v1 viene portato in produzione.

Fatto:
- footer senza "bozza dimostrativa", con ragione sociale, P.IVA (obbligatoria sul sito di un'attività) e link alla privacy;
- `sorgente/public/privacy.html`: informativa privacy e cookie per un sito vetrina senza moduli né tracciamento;
- font in locale (`src/fonts`, sottoinsieme latino in WOFF, licenza OFL): nessuna richiesta a Google;
- dominio kamehousefossano.it (acquistato su Aruba il 24/11/2026): canonical, Open Graph, dati strutturati, `robots.txt`, `sitemap.xml`.

Da fare prima della pubblicazione:
- [ ] dati del cliente in `src/content.js` e `public/privacy.html`: ragione sociale, P.IVA, email, hosting, data;
- [ ] link definitivo di donAutomation in `CREDIT` (`src/content.js`);
- [ ] eventuali modifiche richieste dal cliente: foto vere, logo, testi, orari;
- [ ] hosting su Cloudflare Pages e collegamento del dominio da Aruba;
- [ ] immagine di anteprima per i social (Open Graph) quando ci sono le foto vere;
- [ ] build (`npm ci && npm run build`), copia di `dist/` nella cartella pubblicata, prova su telefono.

## Versione 2

- `v2/index.html`: seconda bozza con modelli 3D fatti in Blender (macchinetta delle capsule e diorama del negozio), servita su `/v2/`.
- `v2/sorgente/`: script Blender (`blender/build.py`) e codice del sito (`web/`).
