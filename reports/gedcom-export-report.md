# GEDCOM export report

Input: `henkilot.json`
Output: `data/riiali.ged`

Henkilöitä: 256
Uniikkeja ID-arvoja: 256
Duplikaatti-ID:t: 0
Generoituja perheitä: 84
Vietyjä lapsilinkkejä: 248
Rikkinäisiä vanhempi_id-viitteitä: 0

## Huomioita

Tämä GEDCOM on konservatiivinen vienti. JSONin `puoliso`-kentät säilytetään henkilön NOTE-tekstissä, koska alkuperäisessä aineistossa puolisot ovat usein vapaatekstiä eikä heille ole aina omaa laatikko-ID:tä.

Perheet on muodostettu `vanhempi_id`-kentästä. GEDCOMissa toinen vanhempi voi siksi puuttua rakenteellisena henkilönä, vaikka puolison tiedot näkyvät muistiinpanossa.
