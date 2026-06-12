# Riialin suku – zoomattava sukupuu

Selailtava versio Heikki Pirisen sukututkimuskartasta (1985–1987).

## Julkaisu GitHub Pagesissa

1. Luo uusi repo (esim. `sukupuu`) GitHub-tilillesi
2. Kopioi tämän kansion koko sisältö repon juureen:
   - `index.html`
   - `sukupuu.dzi`
   - `sukupuu_files/` (tiilikuvat, ~2300 tiedostoa)
3. Pushaa: `git add . && git commit -m "Sukupuu" && git push`
4. Repon asetuksissa: **Settings → Pages → Source: Deploy from a branch → main / root**
5. Sivu aukeaa osoitteessa `https://<käyttäjä>.github.io/sukupuu/`

## Paikallinen testaus

Tiilet ladataan fetchillä, joten avaa pieni palvelin kansiossa:

    python3 -m http.server 8000

ja mene osoitteeseen http://localhost:8000

## Tekniikka

- Alkuperäinen skannaus renderöity 200 DPI:llä (6300 × 16928 px)
- Pilkottu Deep Zoom -tiiliksi (libvips, 256 px tiilet, JPEG Q82)
- Katselin: OpenSeadragon 4.1 (CDN)
- Koko ~18 MB, mutta selain lataa vain näkyvät tiilet
