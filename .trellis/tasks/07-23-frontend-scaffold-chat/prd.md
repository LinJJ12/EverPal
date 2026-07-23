# 脚手架 frontend 并接 backend 流式

## Goal

按 `docs/directory-structure.md` 落地 Vue `frontend/`，聊天页对接 `POST /v1/chat/stream`，档案/会话走 BFF；无模型 Key UI。

## Decisions

| 决策 | 结论 |
|------|------|
| 栈 | Vue 3 + Vite + TS + Vue Router + Pinia |
| 皮肤 | 复用 demo 卡通 tokens（`themes/cartoon`） |
| 无登录 | `client_id` 存 localStorage |

## Acceptance Criteria

- [x] `npm run dev` 可开；聊天能流式显示 backend 回复
- [x] 可停流；话题卡可发；顶栏无模型配置
- [x] 目录符合约定；仅 `VITE_API_BASE_URL`
