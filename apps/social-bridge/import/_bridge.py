"""Shared helpers for backfill scripts."""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import requests

WORKER_URL = os.getenv(
    "BRIDGE_WORKER_URL",
    "https://doughatcher-social-bridge.doug-hatcher.workers.dev",
)
TRIGGER_TOKEN = os.getenv("BRIDGE_TRIGGER_TOKEN", "")

DEFAULT_DELAY_MS = int(os.getenv("BRIDGE_DELAY_MS", "1100"))


def post_historical(payload: dict, *, dry_run: bool = False, timeout: int = 30) -> dict:
    """POST a single payload to /ingest/historical."""
    if not TRIGGER_TOKEN:
        sys.exit("BRIDGE_TRIGGER_TOKEN env var required")
    url = f"{WORKER_URL}/ingest/historical?token={TRIGGER_TOKEN}"
    if dry_run:
        url += "&dry=1"
    r = requests.post(url, json=payload, timeout=timeout)
    try:
        return r.json()
    except Exception:
        return {"error": "non-json response", "status": r.status_code, "text": r.text}


class Progress:
    """Local progress tracker — record of every id we've POSTed (success or skip).

    Belt-and-suspenders alongside the Worker's KV idempotency. Lets the script
    avoid re-hitting the network for already-done items.
    """

    def __init__(self, path: Path):
        self.path = path
        self.done: set[str] = set()
        if path.exists():
            for line in path.read_text().splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    if entry.get("id"):
                        self.done.add(entry["id"])
                except Exception:
                    pass

    def has(self, ident: str) -> bool:
        return ident in self.done

    def add(self, ident: str, result: dict) -> None:
        self.done.add(ident)
        with self.path.open("a") as f:
            f.write(json.dumps({"id": ident, "result": result}) + "\n")


def sleep_between():
    time.sleep(DEFAULT_DELAY_MS / 1000.0)
