# Design: 会话隔离与新建对话

> Task: `07-25-session-new-chat`

## Architecture

```text
切换伙伴 (Chat / Companions)
  → save companion_id
  → messages=[] ; sessionId=null ; clear active (+ 当前/目标映射按实现清理)
  → 不调用 resolveSessionForCompanion / loadSessionById

新建对话
  → 同现 clear()：stop + 清屏 + 清当前伙伴映射 + active

历史继续
  → /chat?session= → loadSessionById（不变）

发消息
  → POST stream(session_id?, companion_id)
  → _ensure_session: sid 存在且 client+companion 均匹配才续写，否则 create_session
```

## Frontend

1. `pickCompanion`：去掉 `resolveSessionForCompanion` 加载分支；始终空白新开。
2. `CompanionsView.pick`：只 `store.save({ companion_id })`；`sessionId`/`setActiveSessionId(null)`。
3. ChatView：按钮「新建对话」→ 现有 `onClear`/`clear`。
4. `jiuban_sessions_by_companion`：切换时不必再写入目标伙伴旧 sid；新建/切换清映射避免 bootstrap 误恢复。`bootstrapChat` 若仍有全局 active，刷新同伙伴会恢复——切换/新建已清 active 则刷新为空白。可保留 map 供将来「继续上次」；本期切换不读 map。

## Backend

`_ensure_session`：

```python
if sid:
    existing = get_session(sid)
    if existing and existing["client_id"] == cid \
       and existing.get("companion_id") == companion_id:
        return sid
# else create new
```

加/改后端单测覆盖不一致 companion 时新建。

## Spec

- `.trellis/spec/frontend/state-management.md` §11 改为：切换伙伴 = 新对话；历史入口才恢复。
- `quality-guidelines` 中「换伙伴恢复」相关行同步。

## Risks

- 用户切回小暖时期望「接着昨天聊」→ 须走历史（已接受决策 A）。
- 场景 `?seed=` 路径保持清 session（已有）。
