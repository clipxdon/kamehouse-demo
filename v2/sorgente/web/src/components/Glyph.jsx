// Original, generic line glyphs (no franchise artwork): thick ink strokes in comic style.
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' }
export default function Glyph({ name }) {
  const g = {
    book: (<><path {...P} d="M10 18c12-6 24-6 38 2v52c-14-8-26-8-38-2z" /><path {...P} d="M86 18c-12-6-24-6-38 2v52c14-8 26-8 38-2z" /><path {...P} d="M18 30h18M18 40h18M60 30h18M60 40h18" /></>),
    figure: (<><circle {...P} cx="48" cy="20" r="10" /><path {...P} d="M48 30v26M30 40l18-6 18 6M38 76l10-20 10 20" /><path {...P} d="M26 84h44" /><path {...P} d="M20 92h56" /></>),
    vinyl: (<><rect {...P} x="26" y="14" width="44" height="36" rx="12" /><circle cx="40" cy="32" r="4" fill="currentColor" /><circle cx="56" cy="32" r="4" fill="currentColor" /><path {...P} d="M38 50v8h20v-8M34 58h28v26H34z" /></>),
    cards: (<><rect {...P} x="18" y="22" width="36" height="52" rx="5" transform="rotate(-12 36 48)" /><rect {...P} x="42" y="20" width="36" height="52" rx="5" transform="rotate(10 60 46)" /><path {...P} d="M60 38l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" /></>),
    star: (<><path {...P} d="M48 10l10 22 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3z" /><path {...P} d="M84 12l4 6M88 30h6M12 14l-4 6" /></>),
    key: (<><circle {...P} cx="34" cy="34" r="16" /><path {...P} d="M46 46l30 30M64 64l8-8M72 72l8-8" /></>),
  }
  return <svg viewBox="0 0 96 96" className="glyph" aria-hidden="true">{g[name]}</svg>
}
