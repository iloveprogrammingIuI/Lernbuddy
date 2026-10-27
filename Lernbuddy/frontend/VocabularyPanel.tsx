import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Plus, RotateCcw } from "lucide-react";

type Unit = {
  id: string;
  name: string;
  language: string;
  class_level: string;
  vocabulary_count: number;
  sentence_count: number;
  cloze_count: number;
  sections_of_8: number;
};

type VocabularyItem = {
  id: string;
  source_text: string;
  target_text: string;
  part_of_speech: string;
  example_sentence: string;
};

type PracticeItem = {
  id: string;
  prompt: string;
  hint?: string;
  back?: string;
};

type PracticeMode = "flashcards" | "write" | "sentences" | "cloze";
type TranslationDirection = "source_to_target" | "target_to_source";

type PracticeResult = {
  correct: boolean;
  correct_answer: string;
  message: string;
  repeat_required: boolean;
};

type Progress = {
  total_answers: number;
  correct_answers: number;
  wrong_answers: number;
  accuracy_percent: number;
};

async function readApiResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Die Vokabeldaten konnten nicht geladen werden.",
    );
  }
  return result as T;
}

export default function VocabularyPanel({ grade }: { grade: number | null }) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [unitName, setUnitName] = useState("");
  const [unitLanguage, setUnitLanguage] = useState("Englisch");
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [exampleSentence, setExampleSentence] = useState("");
  const [sentenceSource, setSentenceSource] = useState("");
  const [sentenceTarget, setSentenceTarget] = useState("");
  const [clozeSentence, setClozeSentence] = useState("");
  const [clozeAnswer, setClozeAnswer] = useState("");
  const [clozeHint, setClozeHint] = useState("");
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanSuggestions, setScanSuggestions] = useState<VocabularyItem[]>([]);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("write");
  const [direction, setDirection] = useState<TranslationDirection>("source_to_target");
  const [answer, setAnswer] = useState("");
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [section, setSection] = useState(1);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadUnits() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/units");
      const data = await readApiResponse<Unit[]>(response);
      setUnits(data);
      if (!selectedUnitId && data.length) setSelectedUnitId(data[0].id);
      if (selectedUnitId && !data.some((unit) => unit.id === selectedUnitId)) {
        setSelectedUnitId(data[0]?.id ?? "");
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Lernsets konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUnits();
  }, []);

  useEffect(() => {
    if (!selectedUnitId) {
      setItems([]);
      setPracticeItems([]);
      setShowFlashcardAnswer(false);
      setProgress(null);
      return;
    }

    const controller = new AbortController();
    async function loadUnitContent() {
      setError("");
      try {
        const [vocabularyResponse, progressResponse] = await Promise.all([
          fetch(`/api/units/${encodeURIComponent(selectedUnitId)}/vocabulary`, { signal: controller.signal }),
          fetch(`/api/units/${encodeURIComponent(selectedUnitId)}/progress`, { signal: controller.signal }),
        ]);
        const vocabulary = await readApiResponse<{ rows: VocabularyItem[] }>(vocabularyResponse);
        const unitProgress = await readApiResponse<Progress>(progressResponse);
        setItems(vocabulary.rows);
        setProgress(unitProgress);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Lernset konnte nicht geladen werden.");
        }
      }
    }
    void loadUnitContent();
    return () => controller.abort();
  }, [selectedUnitId]);

  async function createUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!unitName.trim() || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: unitName.trim(),
          language: unitLanguage,
          class_level: grade ? String(grade) : "",
        }),
      });
      const unit = await readApiResponse<Unit>(response);
      setUnits((current) => [{
        ...unit,
        vocabulary_count: 0,
        sentence_count: 0,
        cloze_count: 0,
        sections_of_8: 0,
      }, ...current]);
      setSelectedUnitId(unit.id);
      setUnitName("");
      setNotice("Lernset wurde erstellt.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Lernset konnte nicht erstellt werden.");
    } finally {
      setSaving(false);
    }
  }

  async function addVocabulary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUnitId || !sourceText.trim() || !targetText.trim() || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/units/${encodeURIComponent(selectedUnitId)}/vocabulary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_text: sourceText.trim(),
          target_text: targetText.trim(),
          part_of_speech: partOfSpeech.trim(),
          example_sentence: exampleSentence.trim(),
        }),
      });
      await readApiResponse<VocabularyItem>(response);
      setSourceText("");
      setTargetText("");
      setPartOfSpeech("");
      setExampleSentence("");
      setNotice("Vokabel wurde hinzugefügt.");
      await loadUnits();
      const vocabularyResponse = await fetch(`/api/units/${encodeURIComponent(selectedUnitId)}/vocabulary`);
      const vocabulary = await readApiResponse<{ rows: VocabularyItem[] }>(vocabularyResponse);
      setItems(vocabulary.rows);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Vokabel konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  async function startPractice() {
    if (!selectedUnitId) return;
    setError("");
    setResult(null);
    setAnswer("");
    setPracticeIndex(0);
    try {
      const response = await fetch(
        `/api/units/${encodeURIComponent(selectedUnitId)}/learning-session?mode=${practiceMode}&section=${section}&direction=${direction}`,
      );
      const session = await readApiResponse<{
        items: Array<{ id: string; prompt?: string; sentence?: string; hint?: string; front?: string; back?: string }>;
      }>(response);
      const loadedItems = session.items.map((item) => ({
        id: item.id,
        prompt: item.front ?? item.prompt ?? item.sentence ?? "",
        hint: item.hint,
        back: item.back,
      }));
      setPracticeItems(loadedItems);
      setShowFlashcardAnswer(false);
      if (!loadedItems.length) setNotice("In diesem Abschnitt gibt es noch keine Aufgaben.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Übung konnte nicht gestartet werden.");
    }
  }

  async function checkAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const current = practiceItems[practiceIndex];
    if (!selectedUnitId || !current || !answer.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const endpoint = practiceMode === "cloze"
        ? "clozes"
        : practiceMode === "sentences"
          ? "sentences"
          : "vocabulary";
      const response = await fetch(
        `/api/units/${encodeURIComponent(selectedUnitId)}/${endpoint}/${encodeURIComponent(current.id)}/check`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: answer.trim(), direction }),
        },
      );
      setResult(await readApiResponse<PracticeResult>(response));
      const progressResponse = await fetch(`/api/units/${encodeURIComponent(selectedUnitId)}/progress`);
      setProgress(await readApiResponse<Progress>(progressResponse));
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Antwort konnte nicht geprüft werden.");
    } finally {
      setSaving(false);
    }
  }

  async function rateFlashcard(correct: boolean) {
    const current = practiceItems[practiceIndex];
    if (!selectedUnitId || !current || !current.back || saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/units/${encodeURIComponent(selectedUnitId)}/vocabulary/${encodeURIComponent(current.id)}/check`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answer: correct ? current.back : "",
            direction,
          }),
        },
      );
      setResult(await readApiResponse<PracticeResult>(response));
      const progressResponse = await fetch(`/api/units/${encodeURIComponent(selectedUnitId)}/progress`);
      setProgress(await readApiResponse<Progress>(progressResponse));
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Karte konnte nicht bewertet werden.");
    } finally {
      setSaving(false);
    }
  }

  async function addSentence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUnitId || !sentenceSource.trim() || !sentenceTarget.trim() || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/units/${encodeURIComponent(selectedUnitId)}/sentences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: sentenceSource.trim(), target_text: sentenceTarget.trim() }),
      });
      await readApiResponse<{ id: string }>(response);
      setSentenceSource("");
      setSentenceTarget("");
      setNotice("Beispielsatz wurde gespeichert.");
      await loadUnits();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Satz konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  async function addCloze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUnitId || !clozeSentence.trim() || !clozeAnswer.trim() || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/units/${encodeURIComponent(selectedUnitId)}/clozes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: clozeSentence.trim(),
          answer: clozeAnswer.trim(),
          hint: clozeHint.trim(),
        }),
      });
      await readApiResponse<{ id: string }>(response);
      setClozeSentence("");
      setClozeAnswer("");
      setClozeHint("");
      setNotice("Lückentext wurde gespeichert.");
      await loadUnits();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Lückentext konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  async function scanVocabulary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUnitId || !scanFile || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    setScanSuggestions([]);
    try {
      const formData = new FormData();
      formData.append("file", scanFile);
      const response = await fetch(
        `/api/units/${encodeURIComponent(selectedUnitId)}/vocabulary/scan`,
        { method: "POST", body: formData },
      );
      const result = await readApiResponse<{ suggested_table: Array<{
        source_text: string;
        target_text: string;
        part_of_speech: string;
        example_sentence: string;
      }> }>(response);
      setScanSuggestions(result.suggested_table.map((item) => ({
        id: crypto.randomUUID(),
        ...item,
      })));
      setNotice("OCR-Vorschläge prüfen und vor dem Import korrigieren.");
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Bild konnte nicht erkannt werden.");
    } finally {
      setSaving(false);
    }
  }

  async function importScanSuggestions() {
    if (!selectedUnitId || !scanSuggestions.length || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/units/${encodeURIComponent(selectedUnitId)}/vocabulary/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: scanSuggestions
              .filter((item) => item.source_text.trim() && item.target_text.trim())
              .map(({ source_text, target_text, part_of_speech, example_sentence }) => ({
                source_text,
                target_text,
                part_of_speech,
                example_sentence,
              })),
          }),
        },
      );
      const imported = await readApiResponse<{ created_count: number }>(response);
      setScanSuggestions([]);
      setScanFile(null);
      setNotice(`${imported.created_count} Vokabeln wurden importiert.`);
      await loadUnits();
      const vocabularyResponse = await fetch(`/api/units/${encodeURIComponent(selectedUnitId)}/vocabulary`);
      const vocabulary = await readApiResponse<{ rows: VocabularyItem[] }>(vocabularyResponse);
      setItems(vocabulary.rows);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "OCR-Vorschläge konnten nicht importiert werden.");
    } finally {
      setSaving(false);
    }
  }

  function updateScanSuggestion(index: number, field: keyof VocabularyItem, value: string) {
    setScanSuggestions((current) => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    ));
  }

  function changeScanFile(event: ChangeEvent<HTMLInputElement>) {
    setScanFile(event.target.files?.[0] ?? null);
    setScanSuggestions([]);
  }

  function nextPracticeItem() {
    const repeatCurrentItem = Boolean(result?.repeat_required);
    if (repeatCurrentItem) {
      const itemToRepeat = practiceItems[practiceIndex];
      setPracticeItems((current) => {
        const updated = [...current];
        updated.splice(Math.min(practiceIndex + 5, updated.length), 0, itemToRepeat);
        return updated;
      });
    }
    if (practiceIndex + 1 < practiceItems.length || repeatCurrentItem) {
      setPracticeIndex((current) => current + 1);
      setAnswer("");
      setResult(null);
      setShowFlashcardAnswer(false);
    } else {
      setPracticeItems([]);
      setNotice("Abschnitt abgeschlossen. Falsche Antworten kannst du später erneut üben.");
    }
  }

  const currentUnit = units.find((unit) => unit.id === selectedUnitId);
  const currentPracticeItem = practiceItems[practiceIndex];

  return (
    <section className="vocabulary-panel" aria-label="Vokabeltrainer">
      <header className="vocabulary-header">
        <span className="grammar-header-icon"><BookOpen size={23} /></span>
        <div>
          <span className="hero-eyebrow">WÖRTER LERNEN & WIEDERHOLEN</span>
          <h2>Dein Vokabeltrainer</h2>
          <p>Lernsets anlegen, eigene Wörter speichern und in kleinen Abschnitten üben.</p>
        </div>
      </header>

      {error && <p className="grammar-error" role="alert">{error}</p>}
      {notice && <p className="vocabulary-notice" role="status">{notice}</p>}
      {loading && <p className="grammar-status">Lernsets werden geladen…</p>}

      <div className="vocabulary-layout">
        <section className="vocabulary-card">
          <h3>Ein Lernset auswählen</h3>
          {units.length > 0 && (
            <label className="vocabulary-field">
              <span>Meine Lernsets</span>
              <select value={selectedUnitId} onChange={(event) => {
                setSelectedUnitId(event.target.value);
                setSection(1);
                setPracticeItems([]);
              }}>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} · {unit.language} · {unit.vocabulary_count} Wörter
                  </option>
                ))}
              </select>
            </label>
          )}

          <form className="vocabulary-form" onSubmit={(event) => void createUnit(event)}>
            <h4><Plus size={16} /> Neues Lernset</h4>
            <label className="vocabulary-field">
              <span>Name des Lernsets</span>
              <input value={unitName} onChange={(event) => setUnitName(event.target.value)} maxLength={100} required placeholder="z. B. Unit 1 – At school" />
            </label>
            <div className="vocabulary-form-row">
              <label className="vocabulary-field">
                <span>Sprache</span>
                <select value={unitLanguage} onChange={(event) => setUnitLanguage(event.target.value)}>
                  <option>Englisch</option>
                  <option>Französisch</option>
                  <option>Deutsch</option>
                </select>
              </label>
              <button className="primary" type="submit" disabled={saving || !unitName.trim()}>
                {saving ? "Speichern…" : "Lernset erstellen"}
              </button>
            </div>
          </form>
        </section>

        {currentUnit && (
          <section className="vocabulary-card">
            <div className="vocabulary-section-heading">
              <div>
                <h3>{currentUnit.name}</h3>
                <p>{currentUnit.language}{currentUnit.class_level ? ` · Klasse ${currentUnit.class_level}` : ""}</p>
              </div>
              {progress && (
                <span className="vocabulary-progress">
                  {progress.accuracy_percent}% richtig · {progress.total_answers} Versuche
                </span>
              )}
            </div>
            <form className="vocabulary-form" onSubmit={(event) => void addVocabulary(event)}>
              <h4><Plus size={16} /> Vokabel hinzufügen</h4>
              <div className="vocabulary-form-row">
                <label className="vocabulary-field">
                  <span>Fremdsprachiges Wort</span>
                  <input value={sourceText} onChange={(event) => setSourceText(event.target.value)} required placeholder="apple" />
                </label>
                <label className="vocabulary-field">
                  <span>Deutsche Übersetzung</span>
                  <input value={targetText} onChange={(event) => setTargetText(event.target.value)} required placeholder="der Apfel" />
                </label>
              </div>
              <div className="vocabulary-form-row">
                <label className="vocabulary-field">
                  <span>Wortart (optional)</span>
                  <input value={partOfSpeech} onChange={(event) => setPartOfSpeech(event.target.value)} placeholder="Nomen" />
                </label>
                <label className="vocabulary-field">
                  <span>Beispielsatz (optional)</span>
                  <input value={exampleSentence} onChange={(event) => setExampleSentence(event.target.value)} placeholder="I eat an apple." />
                </label>
              </div>
              <button className="primary" type="submit" disabled={saving || !sourceText.trim() || !targetText.trim()}>
                {saving ? "Speichern…" : "Vokabel speichern"}
              </button>
            </form>
            <form className="vocabulary-form" onSubmit={(event) => void scanVocabulary(event)}>
              <h4><Plus size={16} /> Vokabelliste aus einem Bild übernehmen</h4>
              <label className="vocabulary-field">
                <span>Foto oder Bild (OCR, maximal 12 MB)</span>
                <input type="file" accept="image/*" capture="environment" onChange={changeScanFile} />
              </label>
              <p className="vocabulary-help">
                Die Bild-Erkennung benötigt Tesseract OCR sowie pytesseract und Pillow. PDF-Import ist noch nicht verfügbar. Prüfe alle erkannten Wörter, bevor sie gespeichert werden.
              </p>
              <button className="secondary" type="submit" disabled={!scanFile || saving}>
                {saving ? "Erkenne…" : "Bild auslesen"}
              </button>
            </form>
            {scanSuggestions.length > 0 && (
              <div className="vocabulary-scan-preview">
                <h4>Erkannte Wörter prüfen</h4>
                {scanSuggestions.map((item, index) => (
                  <div className="vocabulary-form-row" key={item.id}>
                    <input aria-label={`Fremdsprachiges Wort ${index + 1}`} value={item.source_text} onChange={(event) => updateScanSuggestion(index, "source_text", event.target.value)} />
                    <input aria-label={`Übersetzung ${index + 1}`} value={item.target_text} onChange={(event) => updateScanSuggestion(index, "target_text", event.target.value)} placeholder="Übersetzung ergänzen" />
                    <input aria-label={`Beispielsatz ${index + 1}`} value={item.example_sentence} onChange={(event) => updateScanSuggestion(index, "example_sentence", event.target.value)} placeholder="Beispielsatz (optional)" />
                  </div>
                ))}
                <button className="primary" type="button" disabled={saving || !scanSuggestions.some((item) => item.source_text.trim() && item.target_text.trim())} onClick={() => void importScanSuggestions()}>
                  {saving ? "Importiere…" : "Geprüfte Wörter importieren"}
                </button>
              </div>
            )}
            <form className="vocabulary-form" onSubmit={(event) => void addSentence(event)}>
              <h4><Plus size={16} /> Beispielsatz zum Übersetzen speichern</h4>
              <div className="vocabulary-form-row">
                <label className="vocabulary-field">
                  <span>Satz in der Fremdsprache</span>
                  <input value={sentenceSource} onChange={(event) => setSentenceSource(event.target.value)} required placeholder="I go to school by bus." />
                </label>
                <label className="vocabulary-field">
                  <span>Deutsche Übersetzung</span>
                  <input value={sentenceTarget} onChange={(event) => setSentenceTarget(event.target.value)} required placeholder="Ich fahre mit dem Bus zur Schule." />
                </label>
              </div>
              <button className="secondary" type="submit" disabled={saving || !sentenceSource.trim() || !sentenceTarget.trim()}>
                Satz speichern
              </button>
            </form>
            <form className="vocabulary-form" onSubmit={(event) => void addCloze(event)}>
              <h4><Plus size={16} /> Eigenen Lückentext erstellen</h4>
              <label className="vocabulary-field">
                <span>Satz mit Lücke (___)</span>
                <input value={clozeSentence} onChange={(event) => setClozeSentence(event.target.value)} required placeholder="Yesterday, we ___ to the park." />
              </label>
              <div className="vocabulary-form-row">
                <label className="vocabulary-field">
                  <span>Gesuchte Lösung</span>
                  <input value={clozeAnswer} onChange={(event) => setClozeAnswer(event.target.value)} required placeholder="went" />
                </label>
                <label className="vocabulary-field">
                  <span>Hinweis (optional)</span>
                  <input value={clozeHint} onChange={(event) => setClozeHint(event.target.value)} placeholder="go – Vergangenheit" />
                </label>
              </div>
              <button className="secondary" type="submit" disabled={saving || !clozeSentence.includes("___") || !clozeAnswer.trim()}>
                Lückentext speichern
              </button>
            </form>
          </section>
        )}
      </div>

      {currentUnit && (
        <section className="vocabulary-card vocabulary-practice">
          <div className="vocabulary-section-heading">
            <div>
              <h3>Üben</h3>
              <p>{currentUnit.vocabulary_count} Wörter, {currentUnit.sentence_count} Sätze, {currentUnit.cloze_count} Lückentexte · maximal 8 pro Abschnitt</p>
            </div>
            {progress && <span className="vocabulary-progress">{progress.correct_answers} richtig · {progress.wrong_answers} noch üben</span>}
          </div>

          {currentPracticeItem ? (
            <form className="vocabulary-question" onSubmit={(event) => void checkAnswer(event)}>
              <span className="grammar-topic-grades">Wort {practiceIndex + 1} von {practiceItems.length}</span>
              <h4>{currentPracticeItem.prompt}</h4>
              {currentPracticeItem.hint && <span className="vocabulary-hint">Hinweis: {currentPracticeItem.hint}</span>}
              {practiceMode === "flashcards" ? (
                result ? (
                  <>
                    <p className={`grammar-feedback ${result.correct ? "success" : "retry"}`} role="status">
                      <strong>{result.correct ? "Gewusst!" : "Wiederholen"}</strong>
                      <span>{currentPracticeItem.back}</span>
                    </p>
                    <button className="primary vocabulary-next" type="button" onClick={nextPracticeItem}>
                      Nächste Karte <ArrowRight size={16} />
                    </button>
                  </>
                ) : showFlashcardAnswer ? (
                  <div className="vocabulary-flashcard-actions">
                    <p>{currentPracticeItem.back}</p>
                    <button className="secondary" type="button" onClick={() => void rateFlashcard(false)} disabled={saving}>Noch einmal</button>
                    <button className="primary" type="button" onClick={() => void rateFlashcard(true)} disabled={saving}>Gewusst</button>
                  </div>
                ) : (
                  <button className="primary" type="button" onClick={() => setShowFlashcardAnswer(true)}>
                    Lösung anzeigen
                  </button>
                )
              ) : !result ? (
                <div className="vocabulary-answer-row">
                  <input
                    aria-label={
                      practiceMode === "cloze"
                        ? "Lückentext-Antwort"
                        : direction === "source_to_target"
                          ? "Deutsche Übersetzung"
                          : "Übersetzung in der Fremdsprache"
                    }
                    autoComplete="off"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder={
                      practiceMode === "cloze"
                        ? "Ergänze die Lücke…"
                        : direction === "source_to_target"
                          ? "Deine deutsche Übersetzung…"
                          : "Deine Übersetzung in der Fremdsprache…"
                    }
                    required
                  />
                  <button className="primary" type="submit" disabled={saving || !answer.trim()}>
                    {saving ? "Prüfe…" : "Prüfen"}
                  </button>
                </div>
              ) : (
                <>
                  <p className={`grammar-feedback ${result.correct ? "success" : "retry"}`} role="status">
                    <strong>{result.correct ? "Richtig!" : "Noch einmal ansehen"}</strong>
                    <span>{result.correct_answer}</span>
                  </p>
                  <button className="primary vocabulary-next" type="button" onClick={nextPracticeItem}>
                    {practiceIndex + 1 < practiceItems.length ? "Nächstes Wort" : "Abschnitt beenden"}
                    <ArrowRight size={16} />
                  </button>
                </>
              )}
            </form>
          ) : (
            <div className="vocabulary-start">
              <label className="vocabulary-field">
                <span>Übungsart</span>
                <select value={practiceMode} onChange={(event) => {
                  setPracticeMode(event.target.value as PracticeMode);
                  setPracticeItems([]);
                  setResult(null);
                  setSection(1);
                }}>
                  <option value="flashcards">Karteikarten</option>
                  <option value="write">Vokabeln schriftlich abfragen</option>
                  <option value="sentences">Sätze übersetzen</option>
                  <option value="cloze">Lückentexte lösen</option>
                </select>
              </label>
              {practiceMode !== "cloze" && (
                <label className="vocabulary-field">
                  <span>Übersetzungsrichtung</span>
                  <select value={direction} onChange={(event) => setDirection(event.target.value as TranslationDirection)}>
                    <option value="source_to_target">Fremdsprache → Deutsch</option>
                    <option value="target_to_source">Deutsch → Fremdsprache</option>
                  </select>
                </label>
              )}
              <label className="vocabulary-field">
                <span>Abschnitt</span>
                <select value={section} onChange={(event) => setSection(Number(event.target.value))}>
                  {Array.from({
                    length: Math.max(Math.ceil(
                      (practiceMode === "sentences"
                        ? currentUnit.sentence_count
                        : practiceMode === "cloze"
                          ? currentUnit.cloze_count
                          : currentUnit.vocabulary_count) / 8,
                    ), 1),
                  }, (_, index) => index + 1).map((number) => (
                    <option key={number} value={number}>Abschnitt {number}</option>
                  ))}
                </select>
              </label>
              <button className="primary" type="button" onClick={() => void startPractice()} disabled={
                !(practiceMode === "sentences"
                  ? currentUnit.sentence_count
                  : practiceMode === "cloze"
                    ? currentUnit.cloze_count
                    : currentUnit.vocabulary_count)
              }>
                <RotateCcw size={15} /> Abfragen
              </button>
            </div>
          )}
        </section>
      )}

      {currentUnit && (
        <section className="vocabulary-card">
          <div className="vocabulary-section-heading">
            <h3>Wörter im Lernset</h3>
            <a className="link" href={`/api/units/${encodeURIComponent(currentUnit.id)}/vocabulary-table.csv`}>
              CSV herunterladen <ArrowRight size={15} />
            </a>
          </div>
          {items.length ? (
            <div className="vocabulary-table-wrap">
              <table className="vocabulary-table">
                <thead><tr><th>Fremdsprache</th><th>Deutsch</th><th>Wortart</th><th>Beispielsatz</th></tr></thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.source_text}</td>
                      <td>{item.target_text}</td>
                      <td>{item.part_of_speech || "–"}</td>
                      <td>{item.example_sentence || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="grammar-status">Noch keine Vokabeln gespeichert. Füge oben die ersten Wörter hinzu.</p>
          )}
        </section>
      )}

      {!loading && !units.length && (
        <p className="vocabulary-empty"><Check size={18} /> Erstelle dein erstes Lernset, um Vokabeln zu speichern und zu üben.</p>
      )}
      {currentPracticeItem && (
        <button className="vocabulary-cancel" type="button" onClick={() => setPracticeItems([])}>
          <ArrowLeft size={15} /> Übung schließen
        </button>
      )}
    </section>
  );
}
