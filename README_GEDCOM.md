# GEDCOM-vienti

Tämä paketti lisää Riiali-sukupuun JSON-aineistolle GEDCOM-viennin.

## Tiedostot

- `scripts/export_gedcom.py` vie `henkilot.json`-tiedoston GEDCOM-muotoon.
- `data/riiali.ged` on valmiiksi generoitu GEDCOM-tiedosto.
- `reports/gedcom-export-report.md` kertoo viennin tulokset ja rajoitukset.

## Käyttö

Aja repon juuressa:

```bash
python3 scripts/export_gedcom.py henkilot.json data/riiali.ged --report reports/gedcom-export-report.md
```

Tämän jälkeen voit tuoda tiedoston `data/riiali.ged` esimerkiksi Grampsiin.

## Tärkeä rajaus

Vienti on tarkoituksella konservatiivinen. JSONin `puoliso`-kentät viedään henkilön muistiinpanoihin, eikä niistä keksitä uusia GEDCOM-henkilöitä. Tämä estää virheellisten henkilöiden ja suhteiden luomisen. Perheet muodostetaan `vanhempi_id`-kentistä.

Kun dataa on tarkistettu Grampsissa, puolisoita ja tarkempia perhesuhteita voi alkaa normalisoida erikseen. Ei hosuta, muuten sukupuusta tulee nopeasti luovan kirjoittamisen harjoitus.
