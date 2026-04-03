import faiss
import json
import numpy as np
from pathlib import Path
from search.embedder import embed_text

_index = None
_questions = None

# Paths relative to ML_Preprocessor_scripts/
DATA_DIR = Path(__file__).parent.parent / "data"
INDEX_PATH = DATA_DIR / "questions.index"
QUESTIONS_PATH = DATA_DIR / "questions.json"


def _load_assets():
    global _index, _questions

    if _index is None:
        if not INDEX_PATH.exists():
            raise FileNotFoundError(
                f"FAISS index not found at {INDEX_PATH}\n"
                "Run: python -m scripts.build_index"
            )
        print("[searcher] Loading FAISS index...")
        _index = faiss.read_index(str(INDEX_PATH))
        print(f"[searcher] Index loaded — {_index.ntotal} questions indexed.")

    if _questions is None:
        with open(QUESTIONS_PATH) as f:
            _questions = json.load(f)


def search(profile_string: str, top_k: int = 30, min_score: float = 0.25) -> list[dict]:
    _load_assets()

    resume_vector = embed_text(profile_string)
    distances, indices = _index.search(resume_vector, top_k)

    results = []
    for score, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue
        if float(score) < min_score:
            continue
        q = _questions[idx].copy()
        q["similarity_score"] = round(float(score), 4)
        results.append(q)

    return results