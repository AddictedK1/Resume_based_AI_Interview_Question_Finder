# Python ML Pipeline Dockerfile
FROM python:3.11-slim

WORKDIR /app/ml_pipeline

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model (optional - will retry at runtime if not available)
RUN python -m spacy download en_core_web_sm || echo 'Warning: spaCy model not downloaded during build; will attempt at runtime'

# Copy application code
COPY pipeline ./pipeline
COPY search ./search
COPY scripts ./scripts
COPY data ./data

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app/ml_pipeline
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import spacy, sentence_transformers, faiss; print('OK')" || exit 1

# Default command for Render/container deployments
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5001} --workers 1 --threads 4 ml_api_server:app"]
