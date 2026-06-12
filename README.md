# Riialin suvun sukupuuaineisto

Tämä paketti sisältää valmiin JSON-aineiston, QA-skriptin ja vientitiedostot Riialin suvun lohkokuvista litteroidulle sukupuulle.

## Tiedostot

- `henkilot.json`: varsinainen pääaineisto, vie tämä repoon pääversiona.
- `henkilot-schema.json`: kevyt skeema ja kenttäohje.
- `scripts/qa_henkilot.py`: tarkistaa JSONin peruslaadun.
- `reports/qa-report.md`: valmiiksi ajettu tarkistusraportti.
- `data/henkilot.csv`: Excelissä avattava tarkistusversio.
- `data/henkilot_with_children.json`: sama aineisto, mutta `lapset_ids` generoitu `vanhempi_id`-kentistä.
- `data/sukupuu.graph.json`: node/edge-muotoinen vienti visualisointia varten.

## Aineiston tila

- Henkilöitä: 256
- Lohkot: r01-r11, sarakkeet c1-c4 näkyviltä osin
- ID-logiikka: `sukupolvi-laatikkonumero`, esimerkiksi `V-9`
- Sukunimi on kirjattu vain ei-Riialeille tai silloin, kun se näkyy nimen osana kartassa.
- Päivämäärät on normalisoitu muotoon `YYYY`, `YYYY-MM` tai `YYYY-MM-DD` sen mukaan, mitä lähteessä näkyy.

## Käyttöönotto repoon

Kopioi paketin sisältö repon juureen. Jos repossa on jo `henkilot.json`, korvaa se tällä versiolla.

```bash
cp -R riiali-repo-package/* /polku/repoon/
cd /polku/repoon
python3 scripts/qa_henkilot.py henkilot.json reports/qa-report.md
git add henkilot.json henkilot-schema.json scripts/qa_henkilot.py reports/qa-report.md data/henkilot.csv data/henkilot_with_children.json data/sukupuu.graph.json
git commit -m "Add QA tools and exports for Riiali family tree"
git push
```

## QA-komennot

```bash
python3 -m json.tool henkilot.json > /tmp/henkilot-check.json
python3 scripts/qa_henkilot.py henkilot.json reports/qa-report.md
```

Skripti palauttaa virhekoodin 1, jos se löytää kovia virheitä kuten duplikaatti-ID:n, rikkinäisen `vanhempi_id`-viittauksen, puuttuvan lähteen tai virheellisen päivämäärämuodon.

## Avoimet tarkistukset

Katso `reports/qa-report.md`. Erityisesti meta-listan `kesken` ja epävarmat `huomiot`-kohdat kannattaa käydä seuraavaksi läpi alkuperäisistä kuvista.
