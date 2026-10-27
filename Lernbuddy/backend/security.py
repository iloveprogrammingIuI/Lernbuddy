"""Verschlüsselung und Passwort-Hashing für Sprachraum.

Zwei getrennte Aufgaben:

* **Passwörter** werden niemals im Klartext gespeichert, sondern als
  scrypt-Hash mit zufälligem Salt (nur Standardbibliothek, keine Extra-Abhängigkeit).
* **Geheime Werte** wie der API-Key können verschlüsselt auf der Platte liegen
  (Fernet / AES-128-CBC + HMAC). Dafür wird das Paket ``cryptography`` benötigt;
  es wird nur geladen, wenn die Verschlüsselung wirklich benutzt wird.

Schlüssel erzeugen::

    python -c "from security import generate_key; print(generate_key())"

Das Ergebnis gehört in die ``.env`` als ``APP_ENCRYPTION_KEY`` – **nicht** ins
Repository. Geht der Schlüssel verloren, sind verschlüsselte Werte unwiderruflich
verloren.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets

# scrypt-Parameter: 2^14 * 8 * 128 = 16 MiB Speicher pro Hash, spürbar teuer für
# Angreifer, aber schnell genug für einen Login.
SCRYPT_N = 2 ** 14
SCRYPT_R = 8
SCRYPT_P = 1
SALT_BYTES = 16
KEY_BYTES = 32

ENCRYPTION_KEY_ENV = "APP_ENCRYPTION_KEY"


# --------------------------------------------------------------------------- #
# Passwörter
# --------------------------------------------------------------------------- #
def hash_password(password: str) -> str:
    """Erzeugt einen speicherbaren Hash der Form ``scrypt$n$r$p$salt$hash``."""
    if not isinstance(password, str) or not password:
        raise ValueError("Das Passwort darf nicht leer sein.")
    salt = secrets.token_bytes(SALT_BYTES)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=KEY_BYTES,
    )
    return "$".join(
        [
            "scrypt",
            str(SCRYPT_N),
            str(SCRYPT_R),
            str(SCRYPT_P),
            base64.b64encode(salt).decode("ascii"),
            base64.b64encode(digest).decode("ascii"),
        ]
    )


def verify_password(password: str, stored: str) -> bool:
    """Prüft ein Passwort gegen einen mit :func:`hash_password` erzeugten Hash."""
    if not isinstance(password, str) or not isinstance(stored, str):
        return False
    try:
        algorithm, n, r, p, salt_b64, digest_b64 = stored.split("$")
        if algorithm != "scrypt":
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)
        candidate = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected),
        )
    except (ValueError, TypeError):
        return False
    # Zeitkonstanter Vergleich, damit die Laufzeit nichts über den Hash verrät.
    return hmac.compare_digest(candidate, expected)


# --------------------------------------------------------------------------- #
# Verschlüsselung
# --------------------------------------------------------------------------- #
def generate_key() -> str:
    """Erzeugt einen neuen Fernet-Schlüssel (URL-safe base64, 32 Byte)."""
    from cryptography.fernet import Fernet

    return Fernet.generate_key().decode("ascii")


def _fernet(key: str | None = None):
    from cryptography.fernet import Fernet

    raw = key or os.environ.get(ENCRYPTION_KEY_ENV)
    if not raw:
        raise RuntimeError(
            f"Kein Verschlüsselungsschlüssel gesetzt. Bitte {ENCRYPTION_KEY_ENV} "
            "in der .env-Datei eintragen (erzeugen mit: "
            "python -c \"from security import generate_key; print(generate_key())\")."
        )
    return Fernet(raw.encode("ascii") if isinstance(raw, str) else raw)


def encrypt_text(plaintext: str, key: str | None = None) -> str:
    """Verschlüsselt Text und gibt ein speicherbares Token zurück."""
    if not isinstance(plaintext, str):
        raise TypeError("encrypt_text erwartet einen String.")
    return _fernet(key).encrypt(plaintext.encode("utf-8")).decode("ascii")


def decrypt_text(token: str, key: str | None = None) -> str:
    """Entschlüsselt ein Token aus :func:`encrypt_text`."""
    if not isinstance(token, str):
        raise TypeError("decrypt_text erwartet einen String.")
    return _fernet(key).decrypt(token.encode("ascii")).decode("utf-8")


# --------------------------------------------------------------------------- #
# Geheimnisse aus der Umgebung
# --------------------------------------------------------------------------- #
def read_secret(name: str, default: str | None = None) -> str | None:
    """Liest ein Geheimnis aus der Umgebung.

    ``<NAME>_ENCRYPTED`` hat Vorrang und wird mit :data:`ENCRYPTION_KEY_ENV`
    entschlüsselt. Ist es nicht gesetzt, wird der Klartext ``<NAME>`` genommen,
    damit bestehende ``.env``-Dateien weiter funktionieren.
    """
    encrypted = os.environ.get(f"{name}_ENCRYPTED")
    if encrypted:
        return decrypt_text(encrypted)
    return os.environ.get(name, default)


def write_secret(name: str, value: str, path: str = ".env") -> str:
    """Verschlüsselt ``value`` und schreibt ``<NAME>_ENCRYPTED`` in die ``.env``.

    Vorhandene Zeilen mit demselben Namen werden ersetzt, andere bleiben stehen.
    Gibt das Token zurück.
    """
    token = encrypt_text(value)
    target = os.path.abspath(path)
    lines: list[str] = []
    if os.path.exists(target):
        with open(target, "r", encoding="utf-8") as handle:
            lines = handle.read().splitlines()

    key = f"{name}_ENCRYPTED"
    replaced = False
    for index, line in enumerate(lines):
        if line.strip().startswith(f"{key}="):
            lines[index] = f"{key}={token}"
            replaced = True
            break
    if not replaced:
        lines.append(f"{key}={token}")

    with open(target, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")
    # Nur der Eigentümer darf die Datei lesen.
    try:
        os.chmod(target, 0o600)
    except OSError:
        pass
    return token


# --------------------------------------------------------------------------- #
# Kommandozeile
# --------------------------------------------------------------------------- #
def _main() -> None:
    import argparse

    parser = argparse.ArgumentParser(
        description="Schlüssel erzeugen und Geheimnisse für die .env verschlüsseln."
    )
    parser.add_argument(
        "--generate-key",
        action="store_true",
        help="Neuen APP_ENCRYPTION_KEY ausgeben.",
    )
    parser.add_argument(
        "--encrypt",
        metavar="WERT",
        help="Wert verschlüsseln und als <NAME>_ENCRYPTED in die .env schreiben.",
    )
    parser.add_argument(
        "--name",
        default="AI_API_KEY",
        help="Name des Geheimnisses (Standard: AI_API_KEY).",
    )
    parser.add_argument(
        "--env",
        default=".env",
        help="Pfad zur .env-Datei (Standard: .env).",
    )
    args = parser.parse_args()

    if args.generate_key:
        print(generate_key())
        return

    if args.encrypt:
        token = write_secret(args.name, args.encrypt, path=args.env)
        print(f"{args.name}_ENCRYPTED in {args.env} geschrieben.")
        print(f"Token: {token}")
        return

    parser.print_help()


if __name__ == "__main__":
    _main()
