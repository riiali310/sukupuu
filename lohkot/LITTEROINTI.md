# Litterointityönkulku (tokenitehokas)

Kartta on jaettu 44 lohkoon: rivit r01 (ylin) – r11 (alin), sarakkeet c1 (vasen) – c4 (oikea).
Lohkoissa on ~120 px limitys, joten saumalla olevat laatikot näkyvät kokonaan jommassakummassa.

## Per sessio

1. Aloita uusi keskustelu Clauden kanssa (ei pitkää historiaa mukana)
2. Lataa 1–3 lohkokuvaa + henkilot.json:n viimeisin versio VAIN jos linkityksiä tarvitaan
   (yleensä riittää pelkkä lohko + maininta mihin sukupolveen ollaan menossa)
3. Pyydä: "Litteroi tämän lohkon henkilölaatikot henkilot-schema.json-muotoon"
4. Tarkista tulos kartan zoomiversiosta, liitä master-tiedostoon, commitoi

## Vinkit

- Kartan omat laatikkonumerot + sukupolven roomalainen numero = valmis id-järjestelmä
- Tyhjät/pelkkää viivastoa sisältävät lohkot voi ohittaa (esim. r01_c1)
- Kun kaikki on koossa: JSON → GEDCOM -muunnos on pieni skripti, jonka Claude
  kirjoittaa yhdessä sessiossa → tiedosto aukeaa Grampsissa/Geniss
