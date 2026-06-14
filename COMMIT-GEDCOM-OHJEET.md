# GEDCOM-paketin vieminen repoon

Pura zip Downloads-kansiossa ja kopioi tiedostot repon juureen.

```bash
cd ~/Downloads
unzip riiali-gedcom-package.zip -d riiali-gedcom-package
cd /Users/mikko.riiali/site
cp ~/Downloads/riiali-gedcom-package/scripts/export_gedcom.py scripts/export_gedcom.py
cp ~/Downloads/riiali-gedcom-package/data/riiali.ged data/riiali.ged
cp ~/Downloads/riiali-gedcom-package/reports/gedcom-export-report.md reports/gedcom-export-report.md
cp ~/Downloads/riiali-gedcom-package/README_GEDCOM.md README_GEDCOM.md
cp ~/Downloads/riiali-gedcom-package/COMMIT-GEDCOM-OHJEET.md COMMIT-GEDCOM-OHJEET.md
```

Tarkista ja commitoi:

```bash
python3 scripts/export_gedcom.py henkilot.json data/riiali.ged --report reports/gedcom-export-report.md
git status
git add scripts/export_gedcom.py data/riiali.ged reports/gedcom-export-report.md README_GEDCOM.md COMMIT-GEDCOM-OHJEET.md
git commit -m "Add GEDCOM export for Riiali family tree"
git push
```
