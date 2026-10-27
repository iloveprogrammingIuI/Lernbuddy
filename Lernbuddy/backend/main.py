import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from openai import APIError, OpenAI
from pydantic import BaseModel, Field

from grammar_backend import router as grammar_router
from vocabulary_backend import router as vocabulary_router

app = FastAPI(title="Lernbuddy KI-Lernchat", version="1.0.0")
app.include_router(grammar_router)
app.include_router(vocabulary_router)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4_000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=30)


class ChatResponse(BaseModel):
    answer: str


def get_ai_client() -> OpenAI:
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    api_key = os.environ.get("AI_API_KEY")
    base_url = os.environ.get("AI_BASE_URL")
    if not api_key or not base_url:
        raise HTTPException(
            status_code=503,
            detail="Bitte AI_API_KEY und AI_BASE_URL in der .env-Datei eintragen.",
        )
    return OpenAI(api_key=api_key, base_url=base_url.rstrip("/"), timeout=60.0)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def create_chat_completion(request: ChatRequest) -> ChatResponse:
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    model = os.environ.get("AI_MODEL")
    if not model:
        raise HTTPException(
            status_code=503,
            detail="Bitte AI_MODEL in der .env-Datei eintragen.",
        )

    messages = [
        {
            "role": "system",
            "content": (
                "Du bist ein freundlicher Lernbegleiter für Schülerinnen und Schüler "
                "der Klassen 5 bis 12. Erkläre verständlich, geduldig und in kleinen "
                "Schritten. Stelle bei Übungen erst eine Frage und verrate die Lösung "
                "nicht sofort. Antworte auf Deutsch, außer die lernende Person bittet "
                "um eine andere Sprache. Verwende Emojis sparsam (höchstens eines pro "
                "Antwort) und nur, wenn es die Erklärung oder Ermutigung sinnvoll ergänzt."
            ),
        },
        *[message.model_dump() for message in request.messages],
    ]

    try:
        completion = get_ai_client().chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=800,
        )
    except APIError as exc:
        raise HTTPException(
            status_code=502,
            detail="Der KI-Anbieter hat die Anfrage abgelehnt oder ist nicht erreichbar. "
            "Prüfe API-Key, Modellname und Endpunkt in der .env-Datei.",
        ) from exc

    if not completion.choices or completion.choices[0].message.content is None:
        raise HTTPException(status_code=502, detail="Der KI-Anbieter hat keinen Text zurückgegeben.")
    answer = completion.choices[0].message.content
    return ChatResponse(answer=answer)
