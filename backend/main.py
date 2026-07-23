"""玖伴 backend 入口。

约定：使用 Conda 环境 chatbot（见 docs/dev-setup.md）。

  conda activate chatbot
  cd backend
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
