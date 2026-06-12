# Puunäkymän vienti repoon

Aja repon juuressa:

```bash
cp ~/Downloads/riiali-tree-view-package/tree.html .
cp ~/Downloads/riiali-tree-view-package/tree.css .
cp ~/Downloads/riiali-tree-view-package/tree.js .
cp ~/Downloads/riiali-tree-view-package/README_TREE.md .
cp ~/Downloads/riiali-tree-view-package/COMMIT-TREE-OHJEET.md .

git status
git add tree.html tree.css tree.js README_TREE.md COMMIT-TREE-OHJEET.md
git commit -m "Add interactive family tree view"
git push
```

Testaa paikallisesti:

```bash
python3 -m http.server 8000
```

Avaa:

```text
http://localhost:8000/tree.html
```
