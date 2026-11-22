# Kamehouse Fossano · bozza sito 3D, versione 2

Evoluzione della prima bozza (stessi colori, stile fumetto, testi). Novità:
- Macchinetta delle capsule modellata in Blender (bpy headless): nell'hero lo scroll gira la manopola,
  apre lo sportello, fa uscire una capsula che rotola e si apre con una stella dentro.
- Diorama del negozio in sezione (Blender): piano terra con librerie di manga, vetrina delle figure, banco cassa
  e tavolo novità; scala verso il seminterrato con tavoli da gioco, bacheca tornei, lucine e insegna al neon.
  Sezione "Dentro Kamehouse" con percorso della telecamera in sei fermate e didascalie.
- Look cel-shading (MeshToonMaterial), contorni a china (inverted hull sulla macchinetta, spigoli sul diorama).
- Micro-interazioni anime.js (pressione pulsanti, icone che si ridisegnano, numeri, didascalie, badge orari).
- Passata unslop: font nuovi (Mochiy Pop One + Zen Kaku Gothic New), meno ombre, etichette in minuscolo,
  spaziature su griglia di 4px, niente punti esclamativi nei testi.
- Riserva: se WebGL manca o il modello non si carica, restano i render di Blender; con prefers-reduced-motion
  niente pin né transizioni (diorama come immagine con elenco).

## Pipeline 3D
```
cd blender && python build.py out --render --samples 24    # .blend, GLB e render di riserva (pip install bpy==5.3.0)
npx gltf-transform quantize out/diorama-raw.glb q.glb && gzip -9 -c q.glb > ../web/src/assets/diorama.glb.gz
gzip -9 -c out/gacha-raw.glb > ../web/src/assets/gacha.glb.gz   # non quantizzato: il contorno usa le normali
```
I GLB sono incorporati in base64, decodificati in ArrayBuffer e caricati con GLTFLoader.parse.

## Sviluppo
```
cd web && npm ci && npm run build   # dist/index.html, file unico
```
