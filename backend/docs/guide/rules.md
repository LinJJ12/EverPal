# 协作硬规则（玖伴 backend）

> 给人与 AI 写代码时共用的最短约束。细则见仓库 `docs/directory-structure.md` §5 与 `src/README.md`。

---

## 1. 三条硬禁止

1. **`api/`** 不写词库 JSON 细节，不直接创建 LLM HTTP 客户端（喜好过滤可调 `safety.sanitize_profile_likes`）。  
2. **`storage/`** 不调 LLM，不做聊天编排，**不导入** `capabilities` / 词库。  
3. **新功能先选已有层**；放不进再开文档讨论——禁止默默塞进 `lib/`。

---

## 2. 聊天纵向路径

```text
API → services/chat
        → safety → moderation? → wiki? → persona(+memory) → llm → safe_stream → storage
静态数据：src/data/lexicon/、src/data/wiki/
LLM 客户端只出自 config/llm
```

出站安全：窗口化 gated 流式（`capabilities/safe_stream.py`）——**未过词库的片段不得发给客户端**；命中则保留已放出的安全前缀并追加温和拒答。

---

## 3. 日志与审计

- 每请求有 `request_id`（头 `X-Request-Id` 或自动生成），响应回写同头。  
- 安全命中写入 `resource/logs/safety_audit.jsonl`（截断用户原文，不含 API Key）。  
- 禁止在 INFO 打印完整 system prompt 或密钥。

---

## 4. 环境

- 密钥只在 `backend/.env`；`ALLOW_MOCK_LLM` 生产为 `false`。  
- `OUTPUT_FLUSH_CHARS`（可选）控制出站窗口大小，默认 16。
