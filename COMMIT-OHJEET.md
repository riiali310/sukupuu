# Commit-ohjeet

Aja nämä repon juuressa sen jälkeen, kun olet purkanut tai kopioinut paketin sisällön sinne.

```bash
python3 scripts/qa_henkilot.py henkilot.json reports/qa-report.md
git status
git add henkilot.json henkilot-schema.json README.md COMMIT-OHJEET.md scripts/qa_henkilot.py reports/qa-report.md data/henkilot.csv data/henkilot_with_children.json data/sukupuu.graph.json
git commit -m "Add QA tools and exports for Riiali family tree"
git push
```

Jos `git commit` sanoo, ettei ole muutoksia, kaikki oli jo ajan tasalla. Kerrankin kone voi olla oikeassa.
