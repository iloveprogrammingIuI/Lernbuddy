import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  BookOpen, Headphones, Languages, LayoutGrid, BookMarked,
  GraduationCap, Compass, Target, ArrowRight, User, ChevronDown, Bot,
} from "lucide-react";
import ChatPanel from "./ChatPanel";
import GrammarPanel from "./GrammarPanel";
import VocabularyPanel from "./VocabularyPanel";

/* ------------------------------------------------------------------ */
/*  Sprachraum – Lern-Dashboard (Klassen 5–12)                        */
/* ------------------------------------------------------------------ */

type Section = {
  id: string;
  name: string;
  desc: string;
  icon: ReactNode;
  color: string;
};

const SECTIONS: Section[] = [
  { id: "grammatik", name: "Grammatik", desc: "Regeln verstehen. Sicher anwenden.", icon: <GraduationCap size={22} />, color: "#eef2f8" },
  { id: "vokabeln", name: "Vokabeln", desc: "Wörter üben. Langfristig merken.", icon: <Languages size={22} />, color: "#eef7f1" },
  { id: "hoerverstehen", name: "Hörverstehen", desc: "Gespräche, Texte, Alltagssprache.", icon: <Headphones size={22} />, color: "#fdf4ec" },
  { id: "leseverstehen", name: "Leseverstehen", desc: "Texte analysieren. Besser verstehen.", icon: <BookOpen size={22} />, color: "#f2f0fb" },
];

export default function App() {
  const [active, setActive] = useState("uebersicht");
  const [selectedClass, setSelectedClass] = useState("all");
  const [classMenuOpen, setClassMenuOpen] = useState(false);
  const classSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!classMenuOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!classSelectRef.current?.contains(event.target as Node)) {
        setClassMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setClassMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [classMenuOpen]);

  const nav = useMemo(
    () => [
      { id: "uebersicht", label: "Übersicht", icon: <LayoutGrid size={18} /> },
      { id: "grammatik", label: "Grammatik", icon: <GraduationCap size={18} /> },
      { id: "vokabeln", label: "Vokabeln", icon: <Languages size={18} /> },
      { id: "hoerverstehen", label: "Hörverstehen", icon: <Headphones size={18} /> },
      { id: "leseverstehen", label: "Leseverstehen", icon: <BookOpen size={18} /> },
      { id: "ki-chat", label: "KI-Lernchat", icon: <Bot size={18} /> },
    ],
    []
  );

  return (
    <div className="app-shell">
      {/* ---------- Sidebar ---------- */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><BookMarked size={20} /></span>
          <span className="brand-name">Sprachraum</span>
        </div>

        <nav className="main-nav">
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${active === item.id ? "active" : ""}`}
              onClick={() => setActive(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Compass size={15} />
          <div>
            <strong>Kleine Schritte.</strong>
            <span>Große Ziele.</span>
          </div>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="main-content">
        <header className="topbar">
          <div className="crumb">
            <span className="eyebrow">DEIN LERNPLATZ · KLASSE 5–12</span>
            <h1>Willkommen bei Sprachraum</h1>
            <p>Dein persönlicher Lernbegleiter für Englisch, Französisch und mehr.</p>
          </div>
          <div className="top-actions">
            <div className="class-select" ref={classSelectRef}>
              <span>Klassenstufe</span>
              <button
                className={`class-select-trigger ${classMenuOpen ? "open" : ""}`}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={classMenuOpen}
                aria-label={`Klassenstufe: ${selectedClass === "all" ? "Alle Klassen" : `Klasse ${selectedClass}`}`}
                onClick={() => setClassMenuOpen((open) => !open)}
              >
                <span>{selectedClass === "all" ? "Alle Klassen" : `Klasse ${selectedClass}`}</span>
                <ChevronDown size={16} />
              </button>
              {classMenuOpen && (
                <div className="class-options" role="listbox" aria-label="Klassenstufe auswählen">
                  {["all", "5", "6", "7", "8", "9", "10", "11", "12"].map((grade) => (
                    <button
                      className={`class-option ${selectedClass === grade ? "selected" : ""}`}
                      key={grade}
                      type="button"
                      role="option"
                      aria-selected={selectedClass === grade}
                      onClick={() => {
                        setSelectedClass(grade);
                        setClassMenuOpen(false);
                      }}
                    >
                      {grade === "all" ? "Alle Klassen" : `Klasse ${grade}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="avatar"><User size={17} /></button>
          </div>
        </header>

        {active === "ki-chat" ? (
          <div className="page-wrap">
            <ChatPanel />
          </div>
        ) : active === "grammatik" ? (
          <div className="page-wrap">
            <GrammarPanel grade={selectedClass === "all" ? null : Number(selectedClass)} />
          </div>
        ) : active === "vokabeln" ? (
          <div className="page-wrap">
            <VocabularyPanel grade={selectedClass === "all" ? null : Number(selectedClass)} />
          </div>
        ) : (
        <div className="page-wrap">
          {/* ---------- Hero ---------- */}
          <section className="hero-card">
            <div className="hero-text">
              <span className="hero-eyebrow">DEIN NÄCHSTER SCHRITT</span>
              <h2>Gut, dass du da bist.</h2>
              <p>
                Wähle einen Lernbereich oder mache dort weiter,
                wo du aufgehört hast.
              </p>
              <button className="primary" onClick={() => setActive("grammatik")}>
                Übung starten <ArrowRight size={16} />
              </button>
            </div>
            <div className="hero-art" aria-hidden>
              <div className="art-circle" />
              <BookOpen className="art-books" size={72} />
            </div>
          </section>

          {/* ---------- Lernbereiche ---------- */}
          <section className="areas">
            <h3 className="section-heading">Deine Lernbereiche</h3>
            <div className="area-grid">
              {SECTIONS.map((s) => (
                <button key={s.id} className="area-card" onClick={() => setActive(s.id)}>
                  <span className="area-icon" style={{ background: s.color }}>{s.icon}</span>
                  <strong>{s.name}</strong>
                  <small>{s.desc}</small>
                  <ArrowRight className="area-arrow" size={16} />
                </button>
              ))}
            </div>
          </section>

          {/* ---------- Sammlung ---------- */}
          <section className="collection">
            <span className="collection-icon"><Target size={22} /></span>
            <div className="collection-text">
              <strong>Zuletzt in deiner Sammlung</strong>
              <span>Noch keine Vokabeln gespeichert. Beginne mit dem ersten Wort!</span>
            </div>
            <button className="link">Alle Vokabeln ansehen <ArrowRight size={15} /></button>
          </section>

          <footer className="page-footer">
            <span>In deinem Tempo lernen. Jeden Tag ein bisschen weiter.</span>
            <span className="footer-right">Klasse 5 – 12</span>
          </footer>
        </div>
        )}
      </main>
    </div>
  );
}