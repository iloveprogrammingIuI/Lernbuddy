"""Sprachraum - Lern-Dashboard als Terminal-UI (Python + rich).

Start:  python sprachraum.py
Navigation:
    1-5  - Bereich waehlen
    q    - beenden
"""

from __future__ import annotations

import sys

# --- Windows-Konsole auf UTF-8 umstellen (sonst cp1252 -> UnicodeEncodeError) ---
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        pass

try:
    from rich.align import Align
    from rich.console import Console, Group
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text
except ImportError:
    sys.exit("Bitte zuerst installieren:  python -m pip install rich")


# legacy_windows=False erzwingt modernes Rendering (kein cp1252 mehr)
console = Console(legacy_windows=False)

# --------------------------------------------------------------------------- #
#  Daten (1:1 aus dem Web-Frontend uebernommen)
# --------------------------------------------------------------------------- #

NAV = [
    ("1", "Übersicht", "▦"),
    ("2", "Grammatik", "▤"),
    ("3", "Vokabeln", "▥"),
    ("4", "Hörverstehen", "◍"),
    ("5", "Leseverstehen", "▭"),
]

SECTIONS = [
    ("Grammatik", "Regeln verstehen. Sicher anwenden.", "▤"),
    ("Vokabeln", "Wörter üben. Langfristig merken.", "▥"),
    ("Hörverstehen", "Gespräche, Texte, Alltagssprache.", "◍"),
    ("Leseverstehen", "Texte analysieren. Besser verstehen.", "▭"),
]

NAVY = "bold #1f3a5f"
MUTED = "#6b7280"
FAINT = "#9aa1ad"
ACCENT = "#1f3a5f"


# --------------------------------------------------------------------------- #
#  Bausteine
# --------------------------------------------------------------------------- #

def sidebar() -> Panel:
    """Linke Navigationsleiste."""
    lines = Text()
    lines.append("  ▣  Sprachraum\n\n", style="bold #1f3a5f")

    for key, label, icon in NAV:
        lines.append(f"  {icon}  ", style=MUTED)
        active = key == "1"
        lines.append(label, style="bold #1f3a5f" if active else "bold #374151")
        lines.append(f"   [{key}]\n", style=FAINT)

    lines.append("\n\n  - Kleine Schritte.\n", style=FAINT)
    lines.append("    Große Ziele.\n", style=FAINT)
    return Panel(lines, border_style=FAINT, width=28, padding=(1, 0))


def topbar() -> Group:
    eyebrow = Text("DEIN LERNPLATZ · KLASSE 5–12", style=FAINT)
    title = Text("Willkommen bei Sprachraum", style="bold #1f2937")
    subtitle = Text(
        "Dein persönlicher Lernbegleiter für Englisch, Französisch und mehr.",
        style=MUTED,
    )
    return Group(eyebrow, title, subtitle)


def hero() -> Panel:
    body = Text()
    body.append("DEIN NÄCHSTER SCHRITT\n\n", style=FAINT)
    body.append("Gut, dass du da bist.\n\n", style="bold #1f3a5f")
    body.append(
        "Wähle einen Lernbereich oder mache dort weiter,\n"
        "wo du aufgehört hast.\n\n",
        style=MUTED,
    )
    body.append("▶ Übung starten", style="bold white on #1f3a5f")
    return Panel(body, border_style="#e7e9ee", padding=(1, 2))


def areas_table() -> Table:
    """Die vier Lernbereich-Karten nebeneinander."""
    table = Table.grid(expand=True, padding=(0, 1))
    for _ in SECTIONS:
        table.add_column(ratio=1)

    header = []
    footer = []
    for name, desc, icon in SECTIONS:
        card = Text()
        card.append(f"{icon}  ", style=ACCENT)
        card.append(f"{name}\n", style="bold #1f2937")
        card.append(desc, style=MUTED)
        header.append(card)
        footer.append(Text("→ öffnen", style=FAINT))

    table.add_row(*header)
    table.add_row(*(Text("") for _ in SECTIONS))
    table.add_row(*footer)
    return table


def collection() -> Panel:
    body = Text()
    body.append("◎  ", style=ACCENT)
    body.append("Zuletzt in deiner Sammlung\n", style="bold #1f2937")
    body.append(
        "Noch keine Vokabeln gespeichert. Beginne mit dem ersten Wort!",
        style=MUTED,
    )
    body.append("\n\nAlle Vokabeln ansehen  →", style=f"bold {ACCENT}")
    return Panel(body, border_style="#e7e9ee", padding=(1, 2))


def footer() -> Text:
    line = Text()
    line.append("⏱ In deinem Tempo lernen. Jeden Tag ein bisschen weiter.", style=FAINT)
    line.append("                 📊 Klasse 5 – 12", style=FAINT)
    return line


# --------------------------------------------------------------------------- #
#  Zusammenbau
# --------------------------------------------------------------------------- #

def render() -> None:
    console.clear()
    console.print()

    left = sidebar()
    right = Group(
        topbar(),
        Text(),
        hero(),
        Text(),
        Text("Deine Lernbereiche", style="bold #1f2937"),
        Text(),
        areas_table(),
        Text(),
        collection(),
        Text(),
        footer(),
    )

    grid = Table.grid(expand=True)
    grid.add_column(width=30, vertical="top")
    grid.add_column(ratio=1, vertical="top")
    grid.add_row(left, right)

    console.print(Panel(grid, border_style="#e7e9ee", padding=(1, 2)))


def run_interactive() -> None:
    render()
    console.print(
        "\n[dim]Wähle einen Bereich (1-5) oder [bold]q[/bold] zum Beenden:[/dim] ",
        end="",
    )
    try:
        choice = input()
    except (EOFError, KeyboardInterrupt):
        return
    if choice.strip().lower() == "q":
        console.print("[dim]Bis bald![/dim]")
        return
    match = next((n for k, n, _ in NAV if k == choice.strip()), None)
    if match:
        console.clear()
        console.print(
            Panel(
                Align.center(Text(f"\n{match}\n", style="bold #1f3a5f"), vertical="middle"),
                title=match,
                border_style="#e7e9ee",
                padding=(2, 4),
                subtitle="[dim]Platzhalter - hier kommt dein Lerninhalt hin.[/dim]",
            )
        )
    else:
        console.print("[red]Unbekannte Auswahl.[/red]")


if __name__ == "__main__":
    run_interactive()