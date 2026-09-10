# Lidl Vásárló Szimulátor

Egyjátékos, 3D, böngészőben futó bevásárlós szimulátor. PWA-ként telepíthető PC-re és Androidra is. Three.js-szel készült, build lépés nélkül (natív ES modulok, importmap).

## Játékmenet

- Kapsz egy random bevásárlólistát (4 tétel), szabadon járkálhatsz a boltban és felveheted a termékeket (`E` gomb / mobilon `FELVESZ` gomb, ha a lebegő termék közelében állsz).
- Időnként **"Akciós roham"** esemény indul: egy kiemelt akciós termék jelenik meg 9 másodpercre, ha időben felveszed, bónusz hűségpontot kapsz.
- Ha van legalább 1 termék a kosaradban, és odamész valamelyik pénztárhoz, elindul a **gyorspénztár mini-játék**: időzített gombnyomással kell eltalálnod a zöld zónát.
- A fizetés után hűségpontot kapsz, amit az **Öltözőszekrényben** ruhákra/kozmetikákra költhetsz (ezek ténylegesen megváltoztatják a karakter kinézetét: kabát szín, sál, sapka, kosár szín).

## Irányítás

- **PC**: `WASD` / nyilak a mozgáshoz, `Shift` a futáshoz, `E` a felvételhez.
- **Mobil**: bal alsó virtuális joystick a mozgáshoz, jobb alsó gombok (`FELVESZ`, `FUT`).

## Helyi futtatás

Mivel ES modulokat használ, egyszerű `file://` megnyitás nem működik böngésző CORS-korlátozás miatt — kell egy egyszerű helyi szerver:

```bash
cd lidl-simulator
python3 -m http.server 8080
# majd nyisd meg: http://localhost:8080
```

vagy Node-dal:

```bash
npx serve .
```

## GitHub Pages-re feltöltés

1. Hozz létre egy GitHub repót, és told fel ezt a mappát a tartalmával (`index.html`-nek a repo gyökerében kell lennie, vagy a Pages beállításnál add meg az almappát).
2. A repo **Settings → Pages** menüjében válaszd ki a `main` branch-et (vagy amit használsz), forrásként a gyökér mappát.
3. Pár perc múlva élesben lesz a `https://<felhasznalonev>.github.io/<repo-nev>/` címen.
4. Androidon Chrome-mal megnyitva a böngésző felajánlja a "Alkalmazás telepítése" opciót — ez teszi PWA-vá.

**Fontos:** ha a repo neve nem egyezik meg a domain gyökerével (pl. `github.io/lidl-simulator/`), ellenőrizd, hogy a `manifest.json`-ban és a service workerben szereplő relatív útvonalak (`./`) megfelelően működnek-e — jelenleg mindenhol relatív útvonalakat használtunk, szóval alkönyvtárból is működnie kell.

## Projektstruktúra

Minden fájl a gyökérben van, nincsenek almappák (ez azért fontos, mert böngészőből, Android telefonról a GitHub webes felülete nem enged mappát feltölteni — így viszont az "Upload files" gombbal egyszerre az összes fájl felönthető).

```
lidl-simulator/
├── index.html          # Fő HTML, HUD struktúra, PWA linkek
├── manifest.json         # PWA manifest
├── service-worker.js     # Offline cache
├── style.css              # Lidl márkaszínekre épülő UI
├── main.js                # Fő játékhurok, input, kamera, játékfolyam
├── store.js                # 3D bolt felépítése (polcok, pénztár, fények)
├── character.js            # Játékos + NPC 3D modellek
├── products.js              # Termékkatalógus
├── game.js                   # Játékállapot, pontozás, mentés (localStorage)
├── joystick.js                # Virtuális joystick mobilra
├── icon-192.png, icon-512.png, icon-maskable-512.png   # PWA ikonok
└── gen_icons.py                # Segédszkript az ikonok újragenerálásához (Pillow kell hozzá, nem kell feltölteni GitHub-ra)
```

## Ismert korlátok / jó folytatási pontok

- **Kamera**: jelenleg fix szögű "kamerakövetés" (nem forog a karakterrel) — egyszerű és stabil, de ha később dinamikusabb, karakter mögötti kamerát szeretnél, ez a `updateCamera()` függvény a `js/main.js`-ben.
- **Ütközés**: egyszerű AABB doboz-ütközés, nem pixelpontos, de a polcok/falak között jól működik.
- **NPC-k**: random pontok között sétálnak, nem kerülik ki a játékost vagy egymást — ha szeretnéd, ezt lehet finomítani.
- **Hangok**: jelenleg nincs zene/hangeffekt — a Web Audio API-val vagy pl. Howler.js-szel könnyen bővíthető.
- **Termékkatalógus**: `js/products.js`-ben bármikor bővíthető új termékekkel, kategóriákkal.

Jó fejlesztést hozzá! 🛒
