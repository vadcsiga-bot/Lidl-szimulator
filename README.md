# Lidl Vásárló Szimulátor

Egyjátékos, 3D, böngészőben futó bevásárlós szimulátor. PWA-ként telepíthető PC-re és Androidra is. Three.js-szel készült, build lépés nélkül (natív ES modulok, importmap).

## Játékmenet

- Kapsz egy random bevásárlólistát (4 tétel), szabadon járkálhatsz a boltban és felveheted a termékeket (`E` gomb / mobilon `FELVESZ` gomb, ha a lebegő termék közelében állsz).
- Időnként **"Akciós roham"** esemény indul: egy kiemelt akciós termék jelenik meg 9 másodpercre, ha időben felveszed, bónusz hűségpontot kapsz.
- Ha van legalább 1 termék a kosaradban, és odamész valamelyik pénztárhoz, elindul a **gyorspénztár mini-játék**: időzített gombnyomással kell eltalálnod a zöld zónát.
- A fizetés után hűségpontot kapsz, amit az **Öltözőszekrényben** költhetsz el.
- A főmenüben egy rövid, barátságos **GYIK** is elérhető azoknak, akik gyorsan át akarják futni a szabályokat.

## Öltözőszekrény

Nem egyetlen "outfitet" választasz, hanem réteges rendszerben öltöztetheted a karaktert — külön-külön kioldható és felszerelhető: **sál, sapka, felső (póló/pulóver/kabát), nadrág (hosszú/rövid), zokni (csak rövidnadrágnál látszik), cipő, hátizsák, kosárszín**. Minden ruhadarab a bolt márkaszíneiben (királykék / citromsárga) érhető el, és a hűségpontokból oldható fel. Amit egyszer megvettél, örökre a tiéd — csak rá kell koppintani, hogy fel-/levedd.

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
├── store.js                # 3D bolt felépítése (polcok, pénztár, fények, bejárat)
├── character.js            # Játékos + NPC 3D modellek, réteges öltözet-rendszer
├── products.js              # Termékkatalógus
├── game.js                   # Játékállapot, wardrobe adatok, pontozás, mentés (localStorage)
├── joystick.js                # Virtuális joystick mobilra
├── logo.svg                    # Bolti logó (menü, betöltő képernyő)
├── logo-maskable.svg            # Ugyanaz, nagyobb biztonsági margóval (Android maskable ikon)
└── icon-192.png, icon-512.png, icon-maskable-512.png   # PWA ikonok (logo.svg-ből renderelve)
```

## Ismert korlátok / jó folytatási pontok

- **Kamera**: jelenleg fix szögű "kamerakövetés" (nem forog a karakterrel) — egyszerű és stabil, de ha később dinamikusabb, karakter mögötti kamerát szeretnél, ez a `updateCamera()` függvény a `js/main.js`-ben.
- **Ütközés**: egyszerű AABB doboz-ütközés, nem pixelpontos, de a polcok/falak között jól működik.
- **NPC-k**: random pontok között sétálnak, nem kerülik ki a játékost vagy egymást — ha szeretnéd, ezt lehet finomítani.
- **Hangok**: jelenleg nincs zene/hangeffekt — a Web Audio API-val vagy pl. Howler.js-szel könnyen bővíthető.
- **Termékkatalógus**: `js/products.js`-ben bármikor bővíthető új termékekkel, kategóriákkal.

Jó fejlesztést hozzá! 🛒
