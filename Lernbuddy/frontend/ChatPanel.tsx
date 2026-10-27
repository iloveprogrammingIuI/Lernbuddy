import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Erkläre mir das Present Perfect einfach.",
  "Frag mich englische Vokabeln ab.",
  "Gib mir eine kurze Grammatikübung.",
];

function normalizeMarkdown(content: string): string {
  return content.replace(/\*\*\s+([^*\n]+?)\s+\*\*/g, "**$1**");
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const endOfMessages = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || isSending) return;

    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string" ? result.detail : "Die Anfrage ist fehlgeschlagen.",
        );
      }
      setMessages([...nextMessages, { role: "assistant", content: result.answer }]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Der Lernchat konnte nicht erreicht werden.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function resetChat() {
    setMessages([]);
    setError("");
  }

  return (
    <section className="chat-panel" aria-label="KI-Lernchat">
      <header className="chat-header">
        <div className="chat-title-icon"><Bot size={22} /></div>
        <div>
          <h2>Dein KI-Lernchat</h2>
          <p>Frag nach Erklärungen, Übungen oder Vokabeln.</p>
        </div>
        <button className="chat-reset" onClick={resetChat} disabled={!messages.length || isSending}>
          <RotateCcw size={15} />
          Neuer Chat
        </button>
      </header>

      <div className="chat-history" aria-live="polite">
        {!messages.length && (
          <div className="chat-welcome">
            <span className="chat-welcome-icon"><Bot size={26} /></span>
            <h3>Womit möchtest du anfangen?</h3>
            <p>Ich helfe dir beim Lernen und erkläre Dinge Schritt für Schritt.</p>
            <div className="chat-suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => void sendMessage(suggestion)}
                  disabled={isSending}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <article className={`chat-message ${message.role}`} key={`${index}-${message.role}`}>
            {message.role === "assistant" && <span className="chat-message-icon"><Bot size={16} /></span>}
            <div className="chat-bubble chat-markdown">
              <ReactMarkdown>{normalizeMarkdown(message.content)}</ReactMarkdown>
            </div>
          </article>
        ))}
        {isSending && (
          <div className="chat-message assistant">
            <span className="chat-message-icon"><Bot size={16} /></span>
            <div className="chat-bubble chat-loading">Denke nach…</div>
          </div>
        )}
        {error && <p className="chat-error" role="alert">{error}</p>}
        <div ref={endOfMessages} />
      </div>

      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage();
        }}
      >
        <textarea
          aria-label="Nachricht"
          placeholder="Schreib deine Frage…"
          value={input}
          maxLength={4000}
          rows={2}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendMessage();
            }
          }}
          disabled={isSending}
        />
        <button className="chat-send" type="submit" aria-label="Nachricht senden" disabled={!input.trim() || isSending}>
          <ArrowUp size={18} />
        </button>
        <span>Enter zum Senden · Shift + Enter für eine neue Zeile</span>
      </form>
    </section>
  );
}
