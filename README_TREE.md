# Riialin sukupuu: puunäkymä

Tämä kevyt puunäkymä lukee `henkilot.json`-tiedoston ja rakentaa interaktiivisen sukupuun `vanhempi_id`-kenttien perusteella.

## Tiedostot

- `tree.html` selainkäyttöliittymä
- `tree.css` puunäkymän tyylit
- `tree.js` datan lataus, haku, suodatus ja puun rakentaminen

## Paikallinen käyttö

Aja repon juuressa:

```bash
python3 -m http.server 8000
```

Avaa selaimessa:

```text
http://localhost:8000/tree.html
```

## GitHub Pages

Kun tiedostot on viety repoon, näkymä löytyy osoitteesta:

```text
https://riiali310.github.io/sukupuu/tree.html
```

## Huomioita

Selain lataa datan tiedostosta `henkilot.json`. Jos sivu avataan suoraan tiedostona tuplaklikkaamalla, selain voi estää JSONin latauksen. Käytä paikallista palvelinta tai GitHub Pagesia.

Puunäkymä näyttää vain vanhempi-lapsi-rakenteen. Puolisoita ei käytetä varsinaisina solmuina, vaan ne näkyvät henkilön tiedoissa.
