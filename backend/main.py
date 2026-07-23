"""玖伴 backend 入口。

在 backend/ 目录：
  python -m venv .venv
  .venv\\Scripts\\activate   # Windows
  pip install -e ".[dev]"
  copy .env.example .env    # 填入 LLM_API_KEY（可选）
  python main.py
"""

from __future__ import annotations

import argparse

import uvicorn

from src.config.settings import get_settings, load_dotenv_if_present


def main(argv: list[str] | None = None) -> None:
    load_dotenv_if_present()
    settings = get_settings()
    parser = argparse.ArgumentParser(description="玖伴 companion BFF")
    parser.add_argument("--host", default=settings.host)
    parser.add_argument("--port", type=int, default=settings.port)
    args = parser.parse_args(argv)
    print(f"[main] http://{args.host}:{args.port}")
    uvicorn.run(
        "src.api.app:app",
        host=args.host,
        port=args.port,
        reload=False,
    )


if __name__ == "__main__":
    main()
