# PRD: 会话隔离与新建对话

> Task: `07-25-session-new-chat`  
> Status: implemented  
> Source: 用户反馈切换伙伴看到往日会话、缺少新建对话

## Goal

切换伙伴默认进入**空白新对话**；提供明确的「新建对话」；后端拒绝把消息写入与当前伙伴不一致的旧 session。旧会话仍可从历史月历继续。

## Decisions

| 决策 | 选择 |
|------|------|
| 切换伙伴时默认行为 | **A**：空白新对话；旧会话只从「历史」进入 |
| 「清空屏幕」与「新建对话」 | **A**：合并为「新建对话」 |
| 后端 session↔companion 校验 | **A**：不一致则新建会话，不串写 |

## Confirmed (codebase)

- 切换：`useChatSession.pickCompanion` → `resolveSessionForCompanion` → `loadSessionById`（须改为不加载）。
- 角色页：`CompanionsView.pick` 会 `setActiveSessionId` 到该伙伴上次线程（须去掉自动挂接）。
- 「清空屏幕」≈ 所需「新建对话」逻辑（`useChatPage.clear`）；改文案即可。
- 历史 `?session=` / `bootstrapChat` 仍可恢复指定会话。
- 后端 `_ensure_session`：仅校验 `client_id`，不校验 `companion_id`。

## Requirements

| ID | 需求 |
|----|------|
| SN-01 | 聊天侧栏切换伙伴：清空消息、清除 active session 与该伙伴本机映射（或至少不加载旧会话）；下一条消息创建新会话 |
| SN-02 | 角色页切换伙伴：只保存 `companion_id`，**不**把 active session 指到旧线程 |
| SN-03 | 聊天页按钮文案「新建对话」：停流、清屏、脱离当前 session；不删服务端历史 |
| SN-04 | 历史 `?session=` 进入仍加载该会话并同步伙伴 |
| SN-05 | 后端：已有 session 的 `companion_id` 与请求不一致 → 创建新 session |
| SN-06 | 更新 `state-management` 与相关文档措辞 |

## Acceptance Criteria

- [x] 跟小暖聊过后切到跳跳：屏幕空白；发一条后历史里出现跳跳的新会话，小暖旧会话仍在
- [x] 点「新建对话」：屏幕空白；再发消息开新线程；旧线程可在历史打开
- [x] 历史点某条会话：内容与伙伴正确恢复（路径未改）
- [x] 携带错误伙伴的 `session_id` 发消息：不会写入该旧会话（单元测试）
- [x] 文案无「清空屏幕」；规格已改

## Out of scope

- 多会话列表 / 「继续上次」按钮
- 登录跨设备
- 删除服务端会话（仍走历史删除）
