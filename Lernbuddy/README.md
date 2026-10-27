# Lernbuddy – KI-Lernchat, Grammatik und Vokabeltrainer

Lernbuddy verbindet das React-Frontend mit einem lokalen FastAPI-Backend. Es
enthält einen KI-Lernchat für OpenAI-kompatible Anbieter wie TokenHarbor, ein
Grammatikmodul für Englisch und Französisch sowie einen Vokabeltrainer mit
eigenen Lernsets, Satz-/Lückentextübungen und lokal gespeichertem Fortschritt.
Der KI-Anbieter-Key bleibt im Python-Backend und wird nicht an den Browser
geschickt.

## Einmalige Einrichtung

1. Öffne die schon vorbereitete `.env`-Datei im Projektordner:

   ```dotenv
   AI_BASE_URL=https://tokenharbor.ai/v1
   AI_MODEL=deepseek-v4.1-flash:free
   AI_API_KEY=HIER_DEIN_API_KEY
   ```

   Ersetze `HIER_DEIN_API_KEY` durch deinen TokenHarbor-Key. Den Key nur in
   dieser lokalen Datei eintragen, nicht in den Chat oder in den React-Code.
   Verwende für ein anderes Gateway dessen kompatiblen `/v1`-Endpunkt und den
   dort freigeschalteten Modellnamen.
3. Installiere die Backend-Abhängigkeiten:

   ```powershell
   python -m pip install -r backend\requirements.txt
   ```
4. Installiere das Frontend:

   ```powershell
   Set-Location frontend
   npm install
   Set-Location ..
   ```

## Starten

Öffne zwei PowerShell-Terminals im Projektordner.

Terminal 1 – Backend:

```powershell
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Terminal 2 – Web-App:

```powershell
Set-Location frontend
npm run dev
```

Öffne die von Vite angezeigte lokale Adresse (normalerweise
`http://127.0.0.1:5173`). Wähle **KI-Lernchat**, **Grammatik** oder
**Vokabeln** in der Navigation. Die Klassenstufen-Auswahl filtert die
Grammatikthemen und wird beim Anlegen eines Lernsets übernommen.

## Grammatik-API

Das Backend bindet `backend/grammar_backend.py` in dieselbe FastAPI-App wie den
KI-Chat ein. Das Frontend ruft die API über den Vite-Proxy auf. Englisch und
Französisch sind in der Grammatikansicht auswählbar; Französisch kann zusätzlich
nach GER-Niveau gefiltert werden:

- `GET /api/v1/grammar?language=en&grade=5` – Themenliste, nach Sprache (`en`,
  `fr`) und optional nach Klassenstufe (5–12) filtern.
- `GET /api/v1/grammar?language=fr&cefr_level=A1` – französische Themen nach
  GER-Niveau filtern (derzeit A1 und A2).
- `GET /api/v1/grammar/{slug}` – Erklärung und Übungen zu einem Thema. Richtige
  Antworten werden vor dem Versuch nicht an den Browser geschickt.
- `POST /api/v1/grammar/{slug}/check` – Antwort prüfen und Lernfortschritt
  speichern.
- `GET /api/v1/grammar-progress` – Fortschritt des lokalen Standardkontos lesen.

Der Fortschritt wird standardmäßig in
`backend\sprachraum_grammar.db` als SQLite-Datei gespeichert. Die ältere
`backend/grammar_exercises_backend.py` bleibt eine eigenständige API und wird
von der Lernbuddy-App nicht separat gestartet; die eingebundene Grammatik-API
enthält die Übungsfunktionen bereits.

Die englischen Ergänzungsaufgaben und französischen Themen liegen in
`backend/grammar_supplemental.py`; die Inhalte sind eigenständig formuliert.
Die recherchierten Lernseiten dienten als Orientierung für Themenstruktur,
Schwierigkeitsstaffelung und Übungsformate, nicht als Text- oder Aufgabenquelle
zum Kopieren: [englisch-hilfen.de](https://www.englisch-hilfen.de/exercises.htm),
[Lawless French](https://www.lawlessfrench.com/grammar/),
[Le Conjugueur](https://leconjugueur.lefigaro.fr/) und das
[Lehrerfortbildungsportal Baden-Württemberg](https://lehrerfortbildung-bw.de/).
Das Französisch-Modul startet mit fünf Themen und 20 Aufgaben (être/avoir,
Artikel, regelmäßige -er-Verben, Verneinung und futur proche). Zusätzlich sind
acht neue Englisch-Aufgaben hinzugekommen.

## Integrierter Vokabeltrainer

Der Vokabeltrainer ist Teil derselben FastAPI-App und wird über die Navigation
**Vokabeln** geöffnet. Schülerinnen und Schüler können Lernsets erstellen,
Wörter mit Wortart und Beispielsatz speichern, Bildlisten mit OCR zur Vorschau
einlesen sowie Vokabeln als Karteikarten oder schriftlich abfragen. Satz- und
Lückentextaufgaben können ebenfalls gespeichert und geübt werden. Antworten
werden in Abschnitten von bis zu acht Aufgaben abgefragt; falsche Antworten
werden nach vier weiteren Karten erneut eingeplant.

- `GET /api/units` – Lernsets auflisten.
- `POST /api/units` – ein Lernset mit Sprache und optionaler Klassenstufe
  anlegen.
- `POST /api/units/{id}/vocabulary` – ein Wort samt Übersetzung und optionalen
  Angaben speichern.
- `GET /api/units/{id}/learning-session?mode=write&section=1` – eine
  Abfrage laden. Unterstützte Modi: `flashcards`, `write`, `sentences` und
  `cloze`; die Übersetzungsrichtung kann für Vokabeln und Sätze
  mit `direction=source_to_target` oder `direction=target_to_source` gewählt
  werden. Lückentexte bleiben davon unabhängig.
- `POST /api/units/{id}/vocabulary/{item_id}/check` – Übersetzung prüfen und
  Versuch speichern.
- `POST /api/units/{id}/sentences` und `POST /api/units/{id}/clozes` –
  Beispielsätze bzw. eigene Lückentexte anlegen.
- `POST /api/units/{id}/vocabulary/scan` – Bild zur OCR-Vorschau hochladen;
  erkannte Einträge werden erst nach manueller Prüfung gespeichert.
- `GET /api/units/{id}/progress` – Ergebnisübersicht abrufen.

Die Vokabeldaten liegen in `backend\sprachraum_vocab.db`; der Grammatikfortschritt
bleibt getrennt in `backend\sprachraum_grammar.db`. Die gelieferten PDFs wurden
als Projektanforderungen berücksichtigt: Englisch und Französisch, Klassen
5–12, kleine Lernabschnitte, Beispielsätze und verständliche Fortschrittsanzeige.
Die Dokumente beschreiben außerdem OCR, Satz- und Lückentexttraining,
Schreibkorrektur sowie Lehrer-/Administratorrollen. Vokabeln, Sätze und
Lückentexte sind in der Oberfläche anlegbar und abfragbar; eine gemeinsame
gemischte Lerneinheit ist noch nicht umgesetzt. OCR benötigt zusätzlich
`pytesseract`, Pillow und eine separat installierte Tesseract-Anwendung; der
Import ist auf Bilder begrenzt, PDF-Import ist noch nicht verfügbar.
Schreibkorrektur mit KI, Rollen, Konten und schulischer Mehrbenutzerzugriff
sind ebenfalls noch nicht implementiert. Daher ist das Projekt derzeit eine
lokale Lern-App und noch kein produktionsreifes Schul-LMS.

Der Backend-Server bindet absichtlich nur an `127.0.0.1`. So ist er nicht für
andere Geräte im Netzwerk freigegeben. Teile oder veröffentliche die `.env`
nicht; sie wird von Git ignoriert. API-Aufrufe können bei deinem Anbieter
Kosten verursachen.
