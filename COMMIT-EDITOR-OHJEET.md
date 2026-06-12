# HTML-editorin vienti repoon

Pura paketti ja kopioi tiedostot repon juureen:

```bash
cd /polku/sukupuu-repoon
cp ~/Downloads/riiali-html-editor-package/editor.html .
cp ~/Downloads/riiali-html-editor-package/editor.css .
cp ~/Downloads/riiali-html-editor-package/editor.js .
cp ~/Downloads/riiali-html-editor-package/README_EDITOR.md .
```

Jos haluat mukaan myös varmuuskopiodatan:

```bash
cp -R ~/Downloads/riiali-html-editor-package/data .
```

Aja paikallisesti:

```bash
python3 -m http.server 8000
```

Avaa:

```text
http://localhost:8000/editor.html
```

Commit:

```bash
git status
git add editor.html editor.css editor.js README_EDITOR.md
git commit -m "Add lightweight HTML editor for family tree data"
git push
```
