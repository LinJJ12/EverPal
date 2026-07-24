# Design: 一期结项与二期规划落地（文档）

## Boundaries

本任务只改**产品/约束文档**与 Trellis 规划产物，不改 `frontend/` / `backend/` 运行时。

| 触达 | 作用 |
|------|------|
| `docs/PRD.md` | §4.1 标注一期结束；§4.2 按决策改写；§12/§13/§14 同步状态与皮肤决策 |
| `README.md` | 「当前阶段」改为二期规划 / 一期内部测 feature-complete |
| `.trellis/spec/guides/product-constraints.md` | Phase-1 完成态；Phase-2 近期范围（语音 → 记忆；无登录/家长） |
| 后续任务 | 新建 `voice-companion`（或等价）持有语音实现设计 |

## Contracts（语音首切片 — 交接规格，非本任务实现）

```
用户按住说话 → STT 文本 → 现有聊天发送管线（安全门 + LLM 流式）
助手回复文本 → TTS 播放（可点朗读 / 可选自动播）
```

- 身份：沿用现有匿名 `client_id`，无新账号字段。
- 安全：语音转写结果与打字输入同等走词库/提示词；不因语音旁路安全。
- 方案选型（浏览器 Web Speech vs 后端云 STT/TTS）留在语音实现任务 `design.md`；本规划不锁定供应商。

## Data flow

无新持久化要求（首切片）。TTS/STT 若走后端，密钥仍仅 `backend/.env`（与一期 OPS-01 一致）。

## Compatibility

- 文档删除/改写「成人向中性皮肤」「百科仅成人」；与 kids-only 一致。
- 家长/登录从「二期默认」改为「另阶段」，避免与「近期不做」决策矛盾。

## Trade-offs

| 选择 | 收益 | 代价 |
|------|------|------|
| 先语音、暂缓家长/登录 | 无账号也能增强陪伴；切片小 | 合规管控仍缺，靠词库+提示词 |
| 取消成人皮肤 | 定位清晰 | 无第二套视觉路线图 |
| 记忆作语音后 P1 | 复用现有 memories | 故事库内容运营延后 |

## Rollback

文档提交可 git revert；无 schema / API 变更。
