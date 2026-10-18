# Fast Berührt – Leni Noss

One-Pager zum Kostümbild-Projekt „Fast Berührt“.
Online: https://leninoss.github.io/portfolio/

## Inhalte ändern (ohne Programmieren)

Alle Texte, Bilder und Credits stehen in **einer Datei**: [`_data/projekt.yml`](_data/projekt.yml).

1. Auf GitHub die Datei öffnen und oben rechts auf den Stift (✏️ „Edit“) klicken.
2. Text ändern. Die Einrückung (Leerzeichen am Zeilenanfang) muss dabei bleiben.
3. Unten auf **Commit changes** klicken.
4. Nach etwa 1–2 Minuten ist die Seite aktualisiert. Den Fortschritt siehst du im Reiter „Actions“.

### Bild austauschen oder hinzufügen

1. Das Originalbild (JPG, gern groß) im Ordner [`bilder/`](bilder/) hochladen: „Add file“ → „Upload files“.
   Dateiname nur mit Kleinbuchstaben, Zahlen und Bindestrichen, z. B. `buehne-applaus.jpg`.
2. In `_data/projekt.yml` den Namen **ohne** `.jpg` eintragen, z. B. `bild: buehne-applaus`, und eine kurze Bildbeschreibung unter `alt:`.

Die verkleinerten Versionen fürs Web werden automatisch erzeugt.

### Video-Loop einsetzen

Kurze, stumme MP4 (wenige Sekunden, möglichst unter 5 MB) in [`assets/video/`](assets/video/) hochladen. In `projekt.yml` beim gewünschten Moment statt `platzhalter:` dann `video: dateiname.mp4` eintragen, optional `poster: bildname`.

### Platzhalter

Steht irgendwo `platzhalter: "…"`, erscheint ein grauer Kasten. Sobald Bild oder Video da sind, ersetzt du die Zeile.

## Technik

- Jekyll 4, gebaut von einer GitHub Action ([`.github/workflows/pages.yml`](.github/workflows/pages.yml))
- Bildgrößen: [`scripts/bilder.mjs`](scripts/bilder.mjs) (sharp) → `assets/bilder/` (nicht im Repo)
- Design-Tokens: [`assets/css/variables.css`](assets/css/variables.css): Farben, Schrift, Abstände, Formate, Bewegung
- Layout: [`assets/css/main.css`](assets/css/main.css), 9/6/3-Spalten-Raster
- Bewegung: [`assets/js/main.js`](assets/js/main.js), Vanilla JS
- Schrift: Barlow / Barlow Condensed (SIL Open Font License), self-hosted

### Lokal ansehen

```sh
npm install && bundle install   # einmalig
npm run serve                   # → http://localhost:4000/portfolio/
```
