# Docker trial — nginx SSE notes

- Chat uses SSE/stream at `/v1/chat/stream`; reverse proxies must disable response buffering or the UI appears stuck.
- For `/v1/`: `proxy_buffering off`, `proxy_cache off`, `gzip off`, long `proxy_read_timeout`.
- Health is exact `/health` (not under `/v1`); Vite dev proxy already forwards both `/v1` and `/health`.
- Speech ASR uploads allow up to 10MB server-side; set nginx `client_max_body_size` slightly above that.
- Frontend production API base must be empty (same origin). Use `frontend/.env.production` so `vite build` does not bake `frontend/.env`'s `http://127.0.0.1:8000`.
