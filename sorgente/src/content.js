export const SHOP = {
  name: 'Kamehouse Fossano',
  phone: '350 032 1208',
  tel: 'tel:+393500321208',
  whatsapp: 'https://wa.me/393500321208',
  address: 'Via Guglielmo Marconi 100',
  city: '12045 Fossano (CN)',
  maps: 'https://www.google.com/maps/search/?api=1&query=Kamehouse+Fossano+Via+Guglielmo+Marconi+100',
  instagram: 'https://www.instagram.com/kamehouse_fossano/',
  facebook: 'https://www.facebook.com/people/Kamehouse-Fossano/61566570082751/',
  tiktok: 'https://www.tiktok.com/@kamehouse_fossano',
}

export const BRANDS = ['Bandai', 'Tamashii Nations', 'Banpresto', 'Funko', 'Abystyle', 'Tsume', 'Manga', 'Carte TCG', 'Preordini', 'Action figure', 'Statue']

export const CATEGORIES = [
  { id: 'manga', sfx: 'SFOGLIA!', title: 'Manga e fumetti', text: "Le uscite della settimana, i volumi da recuperare e le serie complete. Se un numero manca, lo cerchiamo noi.", tone: 'teal', glyph: 'book' },
  { id: 'figure', sfx: 'WOW!', title: 'Action figure e statue', text: 'Figure articolate, statue da collezione e diorami dai marchi più amati dai collezionisti, con una vetrina che si fa notare.', tone: 'pink', glyph: 'figure' },
  { id: 'vinyl', sfx: 'POP!', title: 'Funko e vinyl', text: "Le teste grandi più famose dello scaffale, edizioni speciali e pezzi da completare per la tua collezione.", tone: 'yellow', glyph: 'vinyl' },
  { id: 'tcg', sfx: 'PESCA!', title: 'Carte collezionabili', text: 'Booster, box e accessori per i giochi di carte, aperture in negozio e invio al grading per le carte migliori.', tone: 'teal', glyph: 'cards' },
  { id: 'pre', sfx: 'NEW!', title: 'Preordini e novità', text: 'Prenota in anticipo le uscite più attese: ti avvisiamo appena arrivano e le teniamo da parte per te.', tone: 'pink', glyph: 'star' },
  { id: 'gadget', sfx: 'ZAP!', title: 'Gadget e accessori', text: "Tazze, portachiavi, zaini e idee regalo a tema anime e manga, anche per chi sta appena iniziando.", tone: 'yellow', glyph: 'key' },
]

export const SERVICES = [
  { n: '01', title: 'Preordini', text: 'Riserva le uscite in arrivo e ritirale in negozio senza pensieri.' },
  { n: '02', title: 'Spedizioni con tracking', text: 'Ogni pacco viene controllato a mano, parte con il tracciamento attivo e arriva protetto a casa tua.' },
  { n: '03', title: 'Grading delle carte', text: "Raccogliamo le carte da far valutare e le spediamo insieme a fine mese: tu pensi solo a sceglierle." },
  { n: '04', title: 'Punto ritiro pacchi', text: 'Kamehouse è anche punto di ritiro e spedizione: passa a ritirare il tuo pacco e dai un’occhiata alle novità.' },
]

export const REVIEWS = [
  { q: 'Angelo super preparato e disponibile, negozio molto accogliente e fornito.', a: 'Danilo D.' },
  { q: 'Seminterrato con diversi tavoli per giocare e fare vari tornei.', a: 'Recensione Google' },
  { q: 'Rapidissimo nell’invio e imballaggio perfetto. Grazie.', a: 'A. M.' },
  { q: 'Un negozio di manga, modellini, accessori e action figure ben fornito ed accogliente.', a: 'Gianfranco C.' },
]

// 0 = domenica
export const HOURS = [
  { d: 'Lunedì', i: 1, h: '10:15–12:30 · 15:30–19:30' },
  { d: 'Martedì', i: 2, h: 'Chiuso' },
  { d: 'Mercoledì', i: 3, h: '10:15–12:30 · 15:30–19:30' },
  { d: 'Giovedì', i: 4, h: '10:15–12:30 · 15:30–19:30' },
  { d: 'Venerdì', i: 5, h: '10:15–12:30 · 15:30–19:30' },
  { d: 'Sabato', i: 6, h: '10:15–12:30 · 15:30–19:15' },
  { d: 'Domenica', i: 0, h: 'Chiuso' },
]
