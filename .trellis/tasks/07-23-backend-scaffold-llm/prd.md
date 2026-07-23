# 脚手架 backend：LLM 流式 + 安全管线

## Goal

按 `docs/directory-structure.md` 落地 `backend/`：健康检查、角色列表、流式陪伴聊天（人设 + 分龄 + 词库 + OpenAI 兼容 LLM），密钥仅服务端。

## Decisions

| 决策 | 结论 |
|------|------|
| 语言 / HTTP | Python 3.11+ · FastAPI · Uvicorn（对齐 OmniStream 运维习惯） |
| 编排 | 仅 `services/chat.py`；无 pipeline/agent 空壳 |
| 持久化一期 | SQLite 可选最小会话落库；无 Key 时可用 mock LLM 跑通管线测试 |
| 前端 | 本任务不做 `frontend/` |

## Requirements

- R1：目录符合 `docs/directory-structure.md` §5（api / services / capabilities / …）
- R2：`GET /health`；`GET /v1/companions`；`POST /v1/chat/stream`（SSE 或 chunk 流）
- R3：聊天路径顺序：persona → memory 片段 → 入站词库 → LLM → 出站词库 → 落库（允许）
- R4：`.env.example` + `config`；无 Key 不泄露上游错误原文
- R5：词库最小包 + `tests` 命中用例；三角色 prompts（无恋爱）

## Follow-up (persistence)

- [x] SQLite profiles / memories / sessions / messages
- [x] profile & sessions HTTP（`client_id` / `X-Client-Id`）
- [x] chat 落库 + 规则记忆抽取；管线顺序文档对齐「先入站安全」
- [x] pytest 含持久化用例（共 13）

## Acceptance Criteria

- [x] AC1：按 README 可本地启动；`/health` 返回 ok
- [x] AC2：无 Key 时安全拦截仍可返回温和拒答；有 Key 时可流式出字（无 Key + ALLOW_MOCK_LLM 可假流式）
- [x] AC3：儿童/成人 system 提示可区分；companions ≥3 且无恋爱人设
- [x] AC4：`pytest` 词库用例通过；编排 mock LLM 测试通过
- [x] AC5：无 Tour/模型配置 API；密钥不入库
