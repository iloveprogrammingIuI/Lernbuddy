"""
Sprachraum – Vokabel-Backend (FastAPI)
Installation: python -m pip install fastapi uvicorn python-multipart
OCR optional: python -m pip install pytesseract pillow; install Tesseract OCR too.
Start: uvicorn vocabulary_backend:app --reload
API docs: http://127.0.0.1:8000/docs

Backend only: your frontend must call these HTTP endpoints.
SQLite database is created automatically beside this file.
"""
from __future__ import annotations
import csv, io, os, re, sqlite3, uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from fastapi import APIRouter, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

DB = Path(os.getenv("SPRACHRAUM_VOCAB_DB", str(Path(__file__).with_name("sprachraum_vocab.db"))))
app = FastAPI(title="Sprachraum Vokabel-API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
router = APIRouter()

def now():
    return datetime.now(timezone.utc).isoformat()

def db():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    return c

with db() as c:
    c.executescript("""
    CREATE TABLE IF NOT EXISTS units(id TEXT PRIMARY KEY,name TEXT NOT NULL,language TEXT NOT NULL,class_level TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS vocab(id TEXT PRIMARY KEY,unit_id TEXT NOT NULL,source_text TEXT NOT NULL,target_text TEXT NOT NULL,part_of_speech TEXT NOT NULL DEFAULT '',example_sentence TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS sentences(id TEXT PRIMARY KEY,unit_id TEXT NOT NULL,source_text TEXT NOT NULL,target_text TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS clozes(id TEXT PRIMARY KEY,unit_id TEXT NOT NULL,sentence TEXT NOT NULL,answer TEXT NOT NULL,hint TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY AUTOINCREMENT,unit_id TEXT NOT NULL,item_type TEXT NOT NULL,item_id TEXT NOT NULL,correct INTEGER NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE CASCADE);
    """)

class UnitIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    language: str = "Englisch"
    class_level: str = ""

class VocabIn(BaseModel):
    source_text: str = Field(min_length=1)
    target_text: str = Field(min_length=1)
    part_of_speech: str = ""
    example_sentence: str = ""

class BulkVocabIn(BaseModel):
    items: list[VocabIn] = Field(min_length=1, max_length=1000)

class SentenceIn(BaseModel):
    source_text: str = Field(min_length=1)
    target_text: str = Field(min_length=1)

class ClozeIn(BaseModel):
    sentence: str = Field(min_length=1)
    answer: str = Field(min_length=1)
    hint: str = ""

class AnswerIn(BaseModel):
    answer: str
    direction: Literal["source_to_target", "target_to_source"] = "source_to_target"

def unit_or_404(uid):
    with db() as c:
        r = c.execute("SELECT * FROM units WHERE id=?", (uid,)).fetchone()
    if not r: raise HTTPException(404, "Unit nicht gefunden.")
    return dict(r)

def counts(uid):
    with db() as c:
        v = c.execute("SELECT COUNT(*) FROM vocab WHERE unit_id=?", (uid,)).fetchone()[0]
        s = c.execute("SELECT COUNT(*) FROM sentences WHERE unit_id=?", (uid,)).fetchone()[0]
        z = c.execute("SELECT COUNT(*) FROM clozes WHERE unit_id=?", (uid,)).fetchone()[0]
    return {"vocabulary_count":v,"sentence_count":s,"cloze_count":z,"learning_set_count":1,"sections_of_8":(v+7)//8}

def norm(s):
    return re.sub(r"\s+"," ",s.strip().lower()).rstrip(".!? ")

def record(uid, typ, iid, ok):
    with db() as c:
        c.execute("INSERT INTO attempts(unit_id,item_type,item_id,correct,created_at) VALUES(?,?,?,?,?)",(uid,typ,iid,int(ok),now()))

@app.get("/")
def root():
    return {"name":"Sprachraum Vokabel-API","docs":"/docs"}

@router.post("/api/units", status_code=201)
def create_unit(x: UnitIn):
    uid=str(uuid.uuid4())
    with db() as c:
        c.execute("INSERT INTO units VALUES(?,?,?,?,?)",(uid,x.name.strip(),x.language.strip(),x.class_level.strip(),now()))
    return {"id":uid,**x.model_dump(),"learning_set_count":1}

@router.get("/api/units")
def units():
    with db() as c: rows=c.execute("SELECT * FROM units ORDER BY created_at DESC").fetchall()
    return [{**dict(r),**counts(r["id"])} for r in rows]

@router.get("/api/units/{uid}")
def get_unit(uid):
    return {**unit_or_404(uid),**counts(uid)}

@router.delete("/api/units/{uid}")
def delete_unit(uid):
    unit_or_404(uid)
    with db() as c: c.execute("DELETE FROM units WHERE id=?",(uid,))
    return {"deleted":True}

@router.get("/api/units/{uid}/vocabulary")
def vocabulary(uid):
    unit_or_404(uid)
    with db() as c: rows=c.execute("SELECT * FROM vocab WHERE unit_id=? ORDER BY rowid",(uid,)).fetchall()
    items=[dict(r) for r in rows]
    return {"columns":["source_text","target_text","part_of_speech","example_sentence"],"rows":items,
            "sections":[{"section":i//8+1,"items":items[i:i+8]} for i in range(0,len(items),8)]}

@router.post("/api/units/{uid}/vocabulary",status_code=201)
def add_vocab(uid,x: VocabIn):
    unit_or_404(uid); vid=str(uuid.uuid4())
    with db() as c:
        c.execute("INSERT INTO vocab VALUES(?,?,?,?,?,?,?)",(vid,uid,x.source_text.strip(),x.target_text.strip(),x.part_of_speech,x.example_sentence,now()))
    return {"id":vid,"unit_id":uid,**x.model_dump()}

@router.post("/api/units/{uid}/vocabulary/bulk",status_code=201)
def bulk_vocab(uid,x: BulkVocabIn):
    unit_or_404(uid); out=[]
    with db() as c:
        for v in x.items:
            vid=str(uuid.uuid4())
            c.execute("INSERT INTO vocab VALUES(?,?,?,?,?,?,?)",(vid,uid,v.source_text.strip(),v.target_text.strip(),v.part_of_speech,v.example_sentence,now()))
            out.append({"id":vid,**v.model_dump()})
    return {"created_count":len(out),"items":out}

@router.post("/api/units/{uid}/vocabulary/scan")
async def scan_vocab(uid, file: UploadFile=File(...)):
    """OCR-Vorschläge liefern; Frontend soll die Tabelle vor dem Speichern prüfbar anzeigen."""
    unit_or_404(uid)
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400,"Bitte ein Bild hochladen.")
    raw=await file.read()
    if len(raw)>12*1024*1024: raise HTTPException(413,"Maximal 12 MB.")
    try:
        from PIL import Image
        import pytesseract
        text=pytesseract.image_to_string(Image.open(io.BytesIO(raw)).convert("RGB"),lang="eng+deu")
    except ImportError:
        raise HTTPException(501,"OCR benötigt pytesseract, pillow und das separat installierte Tesseract OCR.")
    except Exception as e:
        raise HTTPException(422,f"OCR fehlgeschlagen: {e}")
    suggestions=[]
    for line in text.splitlines():
        line=line.strip()
        if not line: continue
        parts=[p.strip(" |;:-") for p in re.split(r"\t+|;|\s+\|\s+|\s{2,}",line) if p.strip(" |;:-")]
        suggestions.append({"source_text":parts[0],"target_text":parts[1] if len(parts)>1 else "",
                            "part_of_speech":"","example_sentence":"","needs_review":True})
    return {"recognized_text":text,"suggested_table":suggestions,"message":"Tabelle prüfen und fehlende Übersetzungen ergänzen, dann per /vocabulary/bulk speichern."}

@router.post("/api/units/{uid}/sentences",status_code=201)
def add_sentence(uid,x: SentenceIn):
    unit_or_404(uid); iid=str(uuid.uuid4())
    with db() as c: c.execute("INSERT INTO sentences VALUES(?,?,?,?,?)",(iid,uid,x.source_text.strip(),x.target_text.strip(),now()))
    return {"id":iid,"unit_id":uid,**x.model_dump()}

@router.get("/api/units/{uid}/sentences")
def sentences(uid):
    unit_or_404(uid)
    with db() as c: rows=c.execute("SELECT * FROM sentences WHERE unit_id=? ORDER BY created_at",(uid,)).fetchall()
    return [dict(r) for r in rows]

@router.post("/api/units/{uid}/clozes",status_code=201)
def add_cloze(uid,x: ClozeIn):
    unit_or_404(uid)
    if "___" not in x.sentence: raise HTTPException(400,"Die Lücke bitte als ___ markieren, z. B. 'I ___ to school.'")
    iid=str(uuid.uuid4())
    with db() as c: c.execute("INSERT INTO clozes VALUES(?,?,?,?,?,?)",(iid,uid,x.sentence,x.answer.strip(),x.hint,now()))
    return {"id":iid,"unit_id":uid,"sentence":x.sentence,"hint":x.hint}

@router.get("/api/units/{uid}/clozes")
def clozes(uid):
    unit_or_404(uid)
    with db() as c: rows=c.execute("SELECT id,sentence,hint FROM clozes WHERE unit_id=? ORDER BY created_at",(uid,)).fetchall()
    return [dict(r) for r in rows]

@router.post("/api/units/{uid}/clozes/{iid}/check")
def check_cloze(uid,iid,x: AnswerIn):
    unit_or_404(uid)
    with db() as c: r=c.execute("SELECT answer FROM clozes WHERE id=? AND unit_id=?",(iid,uid)).fetchone()
    if not r: raise HTTPException(404,"Lückentext nicht gefunden.")
    ok=norm(x.answer)==norm(r["answer"]); record(uid,"cloze",iid,ok)
    return {"correct":ok,"status_color":"green" if ok else "red","message":"Richtig!" if ok else "Leider falsch.",
            "correct_answer":r["answer"],"repeat_required":not ok,"repeat_after_other_cards":4 if not ok else None}

@router.post("/api/units/{uid}/vocabulary/{iid}/check")
def check_written(uid,iid,x: AnswerIn):
    unit_or_404(uid)
    with db() as c: r=c.execute("SELECT source_text,target_text FROM vocab WHERE id=? AND unit_id=?",(iid,uid)).fetchone()
    if not r: raise HTTPException(404,"Vokabel nicht gefunden.")
    expected = r["target_text"] if x.direction == "source_to_target" else r["source_text"]
    ok=norm(x.answer)==norm(expected); record(uid,"vocabulary",iid,ok)
    return {"correct":ok,"status_color":"green" if ok else "red","message":"Richtig!" if ok else "Leider falsch.",
            "correct_answer":expected,"show_buttons":["Gewusst","Noch mal"],
            "repeat_required":not ok,"repeat_after_other_cards":4 if not ok else None}

@router.post("/api/units/{uid}/sentences/{iid}/check")
def check_sentence(uid,iid,x: AnswerIn):
    unit_or_404(uid)
    with db() as c: r=c.execute("SELECT source_text,target_text FROM sentences WHERE id=? AND unit_id=?",(iid,uid)).fetchone()
    if not r: raise HTTPException(404,"Satz nicht gefunden.")
    expected = r["target_text"] if x.direction == "source_to_target" else r["source_text"]
    ok=norm(x.answer)==norm(expected); record(uid,"sentence",iid,ok)
    return {"correct":ok,"status_color":"green" if ok else "red","message":"Richtig!" if ok else "Leider falsch.",
            "correct_answer":expected,"repeat_required":not ok,"repeat_after_other_cards":4 if not ok else None}

@router.get("/api/units/{uid}/learning-session")
def session(
    uid,
    mode: str = "flashcards",
    section: int = 1,
    direction: Literal["source_to_target", "target_to_source"] = "source_to_target",
):
    """Je Abschnitt maximal 8 Items. Falsche Items nach vier anderen Karten im Frontend erneut einreihen."""
    unit_or_404(uid)
    if mode not in {"flashcards","write","sentences","cloze"}: raise HTTPException(400,"Unbekannter Lernmodus.")
    if section<1: raise HTTPException(400,"Abschnitt beginnt bei 1.")
    offset=(section-1)*8
    with db() as c:
        if mode in {"flashcards","write"}:
            rows=c.execute("SELECT * FROM vocab WHERE unit_id=? ORDER BY rowid LIMIT 8 OFFSET ?",(uid,offset)).fetchall()
            items=[]
            for r in rows:
                d=dict(r)
                source, target = (
                    (d["source_text"], d["target_text"])
                    if direction == "source_to_target"
                    else (d["target_text"], d["source_text"])
                )
                if mode=="flashcards": d["front"]=source; d["back"]=target
                else:
                    d.pop("target_text",None)
                    d.pop("source_text",None)
                    d["prompt"]=source
                items.append(d)
        elif mode=="sentences":
            rows=c.execute("SELECT * FROM sentences WHERE unit_id=? ORDER BY rowid LIMIT 8 OFFSET ?",(uid,offset)).fetchall()
            items=[
                {
                    "id": r["id"],
                    "prompt": r["source_text"] if direction == "source_to_target" else r["target_text"],
                }
                for r in rows
            ]
        else:
            rows=c.execute("SELECT id,sentence,hint FROM clozes WHERE unit_id=? ORDER BY rowid LIMIT 8 OFFSET ?",(uid,offset)).fetchall()
            items=[dict(r) for r in rows]
    return {"unit_id":uid,"mode":mode,"direction":direction,"section":section,"items_in_section":len(items),"items":items,
            "repeat_rule":"Falsch beantwortete Items nach vier anderen Items erneut anzeigen."}

@router.get("/api/units/{uid}/progress")
def progress(uid):
    unit_or_404(uid)
    with db() as c:
        total=c.execute("SELECT COUNT(*) FROM attempts WHERE unit_id=?",(uid,)).fetchone()[0]
        good=c.execute("SELECT COUNT(*) FROM attempts WHERE unit_id=? AND correct=1",(uid,)).fetchone()[0]
        rows=c.execute("SELECT item_type,item_id,correct,created_at FROM attempts WHERE unit_id=? ORDER BY id DESC LIMIT 50",(uid,)).fetchall()
    return {"total_answers":total,"correct_answers":good,"wrong_answers":total-good,
            "accuracy_percent":round(good/total*100) if total else 0,
            "progress_events":[{**dict(r),"color":"green" if r["correct"] else "red"} for r in reversed(rows)]}

@router.get("/api/units/{uid}/vocabulary-table.csv")
def vocabulary_csv(uid):
    unit_or_404(uid)
    with db() as c: rows=c.execute("SELECT source_text,target_text,part_of_speech,example_sentence FROM vocab WHERE unit_id=? ORDER BY rowid",(uid,)).fetchall()
    buf=io.StringIO(); w=csv.writer(buf); w.writerow(["Fremdsprache","Deutsch","Wortart","Beispielsatz"])
    for r in rows: w.writerow(list(r))
    return StreamingResponse(iter([buf.getvalue()]),media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition":f'attachment; filename="sprachraum-vokabeln-{uid}.csv"'})

app.include_router(router)
