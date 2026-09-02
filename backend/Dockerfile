FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml ./
COPY src ./src
COPY main.py ./

RUN pip install --no-cache-dir .

RUN mkdir -p /app/data /app/resource/logs

EXPOSE 8000

CMD ["python", "main.py"]
