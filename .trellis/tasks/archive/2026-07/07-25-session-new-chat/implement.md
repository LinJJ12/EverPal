# Implement: 会话隔离与新建对话

> Task: `07-25-session-new-chat`

## Checklist

1. [x] `useChatSession.pickCompanion`：切换后空白，不 load 旧会话
2. [x] `CompanionsView.pick`：不挂接旧 session
3. [x] ChatView：「清空屏幕」→「新建对话」
4. [x] 后端 `_ensure_session` companion 校验 + 测试
5. [x] 更新 `state-management` / quality-guidelines / database-guidelines
6. [x] 前端 build；`test_ensure_session_companion_mismatch_creates_new` 通过
7. [x] bootstrap：先校验 active↔companion，再 strip `?seed=`（避免过期 active 吞掉种子）

## Validation

```bash
cd frontend && npm run build
cd backend && conda run -n chatbot pytest tests/ -q
```

手测：小暖有记录 → 切跳跳空白 → 发一句 → 历史分属不同伙伴；新建对话后再发为新线程；历史可打开旧线程。

## Risky points

- seed bootstrap 与心情门闸顺序：须门闸通过后再 bootstrap
- 过期 active 不得先 strip `?seed=` 再判定 companion

## Rollback

- 恢复 pickCompanion 的 resolve+load；按钮改回「清空屏幕」；撤销 `_ensure_session` companion 判断。
