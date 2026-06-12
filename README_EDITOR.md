# Riiali sukupuu HTML-editori

Kevyt staattinen HTML-editori `henkilot.json`-aineiston katsomiseen, muokkaamiseen ja uusien henkilöiden lisäämiseen.

## Käyttö

Suositeltu tapa ajaa paikallisesti repon juuressa:

```bash
python3 -m http.server 8000
```

Avaa selaimessa:

```text
http://localhost:8000/editor.html
```

Jos `editor.html` ei ole repon juuressa vaan esimerkiksi kansiossa `editor/`, avaa vastaava polku selaimessa.

## Tiedostot

- `editor.html`: käyttöliittymä
- `editor.css`: ulkoasu
- `editor.js`: toiminnallisuus
- `henkilot.json`: oletusaineisto editorin rinnalla
- `data/henkilot.json`: varmuuskopio, jos haluat pitää datan data-kansiossa

## Tallennuslogiikka

Selain ei voi kirjoittaa suoraan Git-repon tiedostoon ilman erillistä backendia. Tämä editori tekee siksi näin:

1. Lataa `henkilot.json` selaimeen.
2. Muutokset tallentuvat selaimen localStorageen automaattisesti.
3. Kun olet valmis, paina `Vie JSON`.
4. Korvaa ladatulla tiedostolla repon `henkilot.json`.
5. Aja QA ja commit.

## Commit-komennot muutosten jälkeen

```bash
python3 scripts/qa_henkilot.py henkilot.json reports/qa-report.md
git status
git add henkilot.json reports/qa-report.md
git commit -m "Update Riiali family tree data"
git push
```

## Huomio

Tämä on tarkoituksella kevyt editori. Se ei ole tietokanta eikä tee taustalla commiteja. Hyvä niin, koska muuten selain alkaisi esittää DevOps-insinööriä.
