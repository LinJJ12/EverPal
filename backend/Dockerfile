FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY pyproject.toml ./
COPY src ./src
COPY main.py ./

# BuildKit cache mount keeps wheels across builds even when source changes.
RUN --mount=type=cache,target=/root/.cache/pip pip install .

# Run as an unprivileged user; /app/data must be writable (SQLite + logs).
RUN mkdir -p /app/data /app/resource/logs \
    && useradd --system --uid 10001 --home-dir /app app \
    && chown -R app:app /app

USER app

EXPOSE 8000

CMD ["python", "main.py"]
