# squirrel — dein Code-Server

Das hier ist eine **VS-Code-Instanz im Browser** (code-server) auf plugged.host.
Du brauchst nichts zu installieren: einfach die Adresse im Browser öffnen und einloggen.

## Öffnen

- Adresse: `https://de1.plugged.host:31734` (bzw. die Adresse, die in der Panel-Übersicht steht)
- Login: Passwort aus der Startup-Variable `PASSWORD` (Panel → Settings/Startup)

> Wichtig: Das Passwort steht standardmäßig auf `changeme` — bitte im Panel unter
> **Startup → PASSWORD** auf etwas Eigenes ändern und den Server neu starten.

## Wo liegen meine Dateien?

| Pfad | Inhalt |
|---|---|
| `/projects` | **Hier gehören deine Projekte hin.** Das ist der Ordner, den du im Explorer siehst. |
| `/projects/website` | Beispielordner, kannst du löschen oder nutzen. |
| `/.config/code-server/config.yaml` | Konfiguration von code-server (Port, Auth). |
| `/.local/share/code-server/User/settings.json` | Deine VS-Code-Einstellungen. |
| `/.local/lib/code-server-latest/` | Die code-server-Installation (nicht anfassen). |

## Erste Schritte im Browser

1. **Ordner öffnen:** `File → Open Folder` → `/projects`
2. **Terminal:** `` Ctrl+` `` (oder Menü `Terminal → New Terminal`) — dort läuft `bash`,
   du kannst also `python`, `node`, `git` usw. benutzen, soweit im Image vorhanden.
3. **Datei anlegen:** Im Explorer auf das Datei-Symbol mit dem `+`.
4. **Speichern:** passiert automatisch 2 Sekunden nach dem Tippen (Auto-Save ist an).

## Nützliche Terminal-Befehle

```bash
cd /projects          # in den Projektordner wechseln
ls -la                # Dateien anzeigen
git init              # neues Git-Repo
python3 -m http.server 8000   # kleiner Webserver zum Testen
```

## Extensions installieren

Im Browser links auf das Extensions-Symbol (Vierklötze) → suchen → Install.
Alternativ per Terminal:

```bash
sh ~/.local/lib/code-server-latest/bin/code-server --install-extension <publisher.name>
```

## Grenzen dieses Servers

- **144 MB RAM** — das ist wenig. Große Projekte, `npm install` mit vielen Paketen
  oder schwere Extensions können den Server ausbremsen oder abstürzen lassen.
- **41 GB Disk** — reichlich Platz für Code, aber kein Platz für riesige Datensätze.
- Nach **48 h ohne Panel-Aktivität** wird der Server gestoppt, nach 72 h hiberniert.
- Es gibt **kein HTTPS-Zertifikat direkt am Server** — der Zugriff läuft über die
  Panel-Adresse. Das Passwort schützt den Zugang.
