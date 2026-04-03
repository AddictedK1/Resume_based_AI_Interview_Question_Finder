import pandas as pd
import numpy as np
import faiss
import json
from pathlib import Path
from sentence_transformers import SentenceTransformer

# Paths
BASE_DIR = Path(__file__).parent.parent
RAW_EXCEL = BASE_DIR / "data" / "raw" / "questions.xlsx"
OUT_JSON  = BASE_DIR / "data" / "questions.json"
OUT_INDEX = BASE_DIR / "data" / "questions.index"


def build():
    # ── 1. Load Excel ────────────────────────────────────────────
    print(f"Loading dataset from {RAW_EXCEL}...")
    df = pd.read_excel(RAW_EXCEL)
    print(f"Columns found: {df.columns.tolist()}")

    # Normalize column names to lowercase
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.dropna(subset=["question"]).reset_index(drop=True)
    print(f"Total questions after cleaning: {len(df)}")

    # ── 2. Build text for embedding ──────────────────────────────
    # Combines topic + question for richer semantic signal
    def build_text(row):
        topic    = str(row.get("topic", "")).strip()
        question = str(row.get("question", "")).strip()
        return f"{topic} {question}".strip()

    texts = [build_text(row) for _, row in df.iterrows()]

    # ── 3. Encode with SBERT ─────────────────────────────────────
    print("Loading SBERT model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    print("Encoding questions...")
    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=True,
        batch_size=64,
    )
    print(f"Embeddings shape: {embeddings.shape}")

    # ── 4. Build FAISS index ─────────────────────────────────────
    dim = embeddings.shape[1]  # 384
    index = faiss.IndexFlatIP(dim)
    index.add(np.array(embeddings, dtype="float32"))
    print(f"FAISS index built: {index.ntotal} vectors")

    # ── 5. Save outputs ──────────────────────────────────────────
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    faiss.write_index(index, str(OUT_INDEX))
    print(f"Saved index → {OUT_INDEX}")

    df.to_json(OUT_JSON, orient="records", indent=2)
    print(f"Saved questions → {OUT_JSON}")

    print("\nDone. You can now run the tests.")


if __name__ == "__main__":
    build()