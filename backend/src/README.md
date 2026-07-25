# `backend/src` — 分层入口

```text
api/ → services/chat → capabilities/* → storage / domain / config
LLM 客户端只出自 config/llm
语音：capabilities/speech/{client,tts,asr}（DashScope；Key 在 Settings）
今日心情：api/mood.py + storage/mood_repo（按日；注入 memory.snippet）
出站 gated 流式：capabilities/safe_stream.py
lib/ 仅日志、统一异常、安全审计 jsonl
```

细则与禁止项：仓库根 `docs/directory-structure.md` §5；硬规则 `docs/guide/rules.md`。
