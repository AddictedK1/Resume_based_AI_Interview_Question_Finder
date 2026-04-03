import pandas as pd
import numpy as np
import faiss
import json
from pathlib import Path
from sentence_transformers import SentenceTransformer

# Paths
BASE_DIR = Path(__file__).parent.parent
RAW_DIR   = BASE_DIR / "data" / "raw"
OUT_JSON  = BASE_DIR / "data" / "questions.json"
OUT_INDEX = BASE_DIR / "data" / "questions.index"


def build():
    # ── 1. Load all Excel files from raw folder ──────────────────
    print(f"Loading all Excel files from {RAW_DIR}...")
    excel_files = list(RAW_DIR.glob("*.xlsx"))
    
    if not excel_files:
        print("No Excel files found!")
        return
    
    print(f"Found {len(excel_files)} file(s): {[f.name for f in excel_files]}")
    
    # Combine all dataframes
    dfs = []
    for excel_file in excel_files:
        try:
            print(f"  Reading {excel_file.name}...")
            df_temp = pd.read_excel(excel_file)
            dfs.append(df_temp)
        except Exception as e:
            print(f"  ⚠ Error reading {excel_file.name}: {e}")
    
    if not dfs:
        print("No valid data found!")
        return
    
    df = pd.concat(dfs, ignore_index=True)
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