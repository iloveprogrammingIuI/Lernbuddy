import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Search, X } from "lucide-react";

type GrammarExercise = {
  question: string;
  options: string[];
};

type GrammarExample = {
  sentence: string;
  note: string;
};

type GrammarTopic = {
  slug: string;
  title: string;
  language: string;
  cefr_level?: string;
  grades: number[];
  summary: string;
  explanation: string;
  formation: string[];
  usage: string[];
  examples: GrammarExample[];
  exceptions: string[];
  common_mistakes: string[];
  related_topics: string[];
  exercises: GrammarExercise[];
};

type TopicListResponse = {
  items: GrammarTopic[];
  total: number;
};

type AnswerResult = {
  correct: boolean;
  correct_answer: string;
  explanation: string;
  attempts_for_topic: number;
};

async function readApiResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Die Grammatikdaten konnten nicht geladen werden.",
    );
  }
  return result as T;
}

export default function GrammarPanel({ grade }: { grade: number | null }) {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [cefrLevel, setCefrLevel] = useState("");
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);
  const [search, setSearch] = useState("");
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [error, setError] = useState("");
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [checkingAnswer, setCheckingAnswer] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "200" });
    params.set("language", language);
    if (grade !== null) params.set("grade", String(grade));
    if (language === "fr" && cefrLevel) params.set("cefr_level", cefrLevel);

    setLoadingTopics(true);
    setError("");
    setSelectedTopic(null);
    fetch(`/api/v1/grammar?${params}`, { signal: controller.signal })
      .then((response) => readApiResponse<TopicListResponse>(response))
      .then((data) => setTopics(data.items))
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Themen konnten nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTopics(false);
      });

    return () => controller.abort();
  }, [cefrLevel, grade, language]);

  const visibleTopics = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return topics;
    return topics.filter((topic) =>
      `${topic.title} ${topic.summary}`.toLocaleLowerCase().includes(query),
    );
  }, [search, topics]);

  async function openTopic(slug: string) {
    setLoadingTopic(true);
    setError("");
    setSelectedTopic(null);
    try {
      const response = await fetch(`/api/v1/grammar/${encodeURIComponent(slug)}`);
      const topic = await readApiResponse<GrammarTopic>(response);
      setSelectedTopic(topic);
      setExerciseIndex(0);
      setSelectedAnswer("");
      setAnswerResult(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Thema konnte nicht geladen werden.");
    } finally {
      setLoadingTopic(false);
    }
  }

  async function checkAnswer() {
    if (!selectedTopic || !selectedAnswer || answerResult || checkingAnswer) return;
    setCheckingAnswer(true);
    setError("");
    try {
      const response = await fetch(
        `/api/v1/grammar/${encodeURIComponent(selectedTopic.slug)}/check`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise_index: exerciseIndex,
            answer: selectedAnswer,
          }),
        },
      );
      setAnswerResult(await readApiResponse<AnswerResult>(response));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Antwort konnte nicht geprüft werden.");
    } finally {
      setCheckingAnswer(false);
    }
  }

  function nextExercise() {
    setExerciseIndex((current) => current + 1);
    setSelectedAnswer("");
    setAnswerResult(null);
  }

  function returnToTopics() {
    setSelectedTopic(null);
    setAnswerResult(null);
    setSelectedAnswer("");
  }

  const currentExercise = selectedTopic?.exercises[exerciseIndex];

  return (
    <section
      className="grammar-panel"
      aria-label={language === "en" ? "Englische Grammatik" : "Französische Grammatik"}
    >
      <header className="grammar-header">
        <span className="grammar-header-icon"><BookOpen size={23} /></span>
        <div>
          <span className="hero-eyebrow">LERNEN & ÜBEN</span>
          <h2>{language === "en" ? "Englische Grammatik" : "Französische Grammatik"}</h2>
          <p>
            {grade === null
              ? `${topics.length} Themen ${language === "fr" ? "für Französisch" : "für Englisch"}`
              : `${topics.length} Themen für Klasse ${grade}`}
          </p>
        </div>
        <div className="grammar-controls">
          <label>
            <span>Sprache</span>
            <select
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value as "en" | "fr");
                setCefrLevel("");
              }}
              aria-label="Grammatik-Sprache auswählen"
            >
              <option value="en">Englisch</option>
              <option value="fr">Französisch</option>
            </select>
          </label>
          {language === "fr" && (
            <label>
              <span>GER-Niveau</span>
              <select
                value={cefrLevel}
                onChange={(event) => setCefrLevel(event.target.value)}
                aria-label="Französisch nach GER-Niveau filtern"
              >
                <option value="">Alle Niveaus</option>
                <option value="A1">A1 – Einstieg</option>
                <option value="A2">A2 – Grundlagen</option>
              </select>
            </label>
          )}
        </div>
      </header>

      {error && <p className="grammar-error" role="alert">{error}</p>}
      {loadingTopics && <p className="grammar-status">Grammatikthemen werden geladen…</p>}

      {!loadingTopics && !selectedTopic && (
        <>
          <label className="grammar-search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={language === "fr" ? "Französisches Thema suchen…" : "Englisches Thema suchen…"}
              aria-label={`${language === "fr" ? "Französische" : "Englische"} Grammatikthemen suchen`}
            />
          </label>
          {loadingTopic && <p className="grammar-status">Thema wird geladen…</p>}
          {!loadingTopic && visibleTopics.length === 0 && !error && (
            <p className="grammar-status">Keine passenden Themen gefunden.</p>
          )}
          <div className="grammar-topic-grid">
            {visibleTopics.map((topic) => (
              <button
                className="grammar-topic-card"
                key={topic.slug}
                onClick={() => void openTopic(topic.slug)}
              >
                <span className="grammar-topic-grades">
                  Klasse {topic.grades.join(", ")}
                </span>
                {topic.cefr_level && (
                  <span className="grammar-topic-level">GER {topic.cefr_level}</span>
                )}
                <strong>{topic.title}</strong>
                <span>{topic.summary}</span>
                <span className="grammar-topic-action">
                  Thema öffnen <ArrowRight size={15} />
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedTopic && (
        <article className="grammar-detail">
          <button className="grammar-back" onClick={returnToTopics}>
            <ArrowLeft size={16} /> Alle Themen
          </button>
          <div className="grammar-detail-heading">
            <span className="grammar-topic-grades">Klasse {selectedTopic.grades.join(", ")}</span>
            {selectedTopic.cefr_level && (
              <span className="grammar-topic-level">GER {selectedTopic.cefr_level}</span>
            )}
            <h3>{selectedTopic.title}</h3>
            <p>{selectedTopic.summary}</p>
          </div>

          <section className="grammar-content-section">
            <h4>Einfach erklärt</h4>
            <p>{selectedTopic.explanation}</p>
          </section>

          {selectedTopic.formation.length > 0 && (
            <section className="grammar-content-section">
              <h4>Bildung</h4>
              <ul>{selectedTopic.formation.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          )}

          {selectedTopic.examples.length > 0 && (
            <section className="grammar-content-section">
              <h4>Beispiele</h4>
              <div className="grammar-examples">
                {selectedTopic.examples.map((example) => (
                  <div className="grammar-example" key={example.sentence}>
                    <strong>{example.sentence}</strong>
                    <span>{example.note}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {selectedTopic.common_mistakes.length > 0 && (
            <section className="grammar-content-section">
              <h4>Häufige Fehler</h4>
              <ul>{selectedTopic.common_mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul>
            </section>
          )}

          {currentExercise ? (
            <section className="grammar-exercise">
              <div className="grammar-exercise-meta">
                <h4>Jetzt üben</h4>
                <span>Aufgabe {exerciseIndex + 1} von {selectedTopic.exercises.length}</span>
              </div>
              <p className="grammar-question">{currentExercise.question}</p>
              <div className="grammar-options">
                {currentExercise.options.map((option) => (
                  <button
                    key={option}
                    className={`grammar-option ${selectedAnswer === option ? "selected" : ""} ${
                      answerResult?.correct_answer === option
                        ? "correct"
                        : answerResult && selectedAnswer === option
                          ? "incorrect"
                          : ""
                    }`}
                    onClick={() => {
                      if (!answerResult) setSelectedAnswer(option);
                    }}
                    disabled={Boolean(answerResult) || checkingAnswer}
                  >
                    <span className="grammar-option-marker">
                      {answerResult?.correct_answer === option ? <Check size={15} /> :
                        answerResult && selectedAnswer === option ? <X size={15} /> : null}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
              {answerResult && (
                <p className={`grammar-feedback ${answerResult.correct ? "success" : "retry"}`} role="status">
                  <strong>{answerResult.correct ? "Richtig!" : `Noch nicht. Richtig ist: ${answerResult.correct_answer}`}</strong>
                  <span>{answerResult.explanation}</span>
                </p>
              )}
              <div className="grammar-exercise-actions">
                {!answerResult ? (
                  <button
                    className="primary"
                    onClick={() => void checkAnswer()}
                    disabled={!selectedAnswer || checkingAnswer}
                  >
                    {checkingAnswer ? "Prüfe…" : "Antwort prüfen"}
                  </button>
                ) : exerciseIndex + 1 < selectedTopic.exercises.length ? (
                  <button className="primary" onClick={nextExercise}>
                    Nächste Aufgabe <ArrowRight size={16} />
                  </button>
                ) : (
                  <button className="primary" onClick={returnToTopics}>
                    Zur Themenübersicht <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </section>
          ) : (
            <section className="grammar-exercise">
              <h4>Übungen abgeschlossen</h4>
              <p>Du hast alle Aufgaben zu diesem Thema bearbeitet.</p>
              <button className="primary" onClick={returnToTopics}>Zur Themenübersicht</button>
            </section>
          )}
        </article>
      )}
    </section>
  );
}
