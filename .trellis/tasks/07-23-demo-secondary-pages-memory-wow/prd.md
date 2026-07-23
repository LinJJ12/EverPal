# 其余页视觉统一 + 记忆感知

## Goal

将 `memory` / `history` / `safety-demo` / `settings` 四页视觉对齐欢迎页与 onboarding 路径页的 stage 气质；并以界面与操作反馈让昵称/喜好更可感知（不加深自由聊规则）。

## Background

- 欢迎页 `.welcome-stage`；onboarding 四页已用 `.path-stage` / `.shell-stage`。
- 目标四页仍为薄 `.page-head` + `.card`。
- 记忆展示已有基础（welcome chips、opener、chat 侧栏）；清除/重置反馈偏弱。
- 不换色板/字体族；不接真模型。

## Decisions

| 决策 | 结论 |
|------|------|
| 视觉范围 | memory / history / safety-demo / settings → path-stage（参考欢迎/首页/路径页） |
| 记忆感知 | **A · 界面 + 反馈**：顶栏/侧栏/空状态更清楚；清除记忆条与重置演示有明确成功提示 |
| 不做 | 加深 freeReply 喜好点名频率（B 档）；真模型；换肤 |

## Requirements

- **R-secondary-stage**：四页采用 `.path-stage` / `.shell-stage`（氛围底、标题层级、主按钮节奏），与 welcome/onboarding 同气质；不改 `:root` 色板与字体族。
- **R-memory-chrome**：有昵称或喜好时，聊天页顶栏副文案与侧栏至少一处主动展示；空状态/开场提示点名昵称或 1 个喜好（复用/加强现有 opener 展示即可）。
- **R-clear-feedback**：`memory` 清除记忆条后可见成功提示（如 inline note 或短 alert）；`settings` 重置演示在 confirm 成功后提示更清晰（可保留 alert，文案强调「已清空并恢复默认」）。
- **R-compat**：历史列表、安全试玩、模式切换、重置全量语义不变；无 Tour/PRD 元信息回流。

## Out of scope

- 自由聊规则大改 / 喜好点名加频（B）
- 安全词库扩容、剧本加厚、真模型、换色板字体、`web/` SPA

## Acceptance Criteria

- [x] AC1：打开 memory / history / safety-demo / settings，均呈 path-stage 气质（氛围 + 层级），与 welcome/路径页观感一致
- [x] AC2：设置昵称 + ≥1 喜好后，聊天顶栏或侧栏能读到昵称/喜好；空状态开场至少提及其一
- [x] AC3：清除记忆条后有明确成功反馈；列表变为空态
- [x] AC4：重置演示确认后有明确成功反馈，且档案/记忆/会话/游戏纪录恢复默认
- [x] AC5：色板/字体族未改；无 Tour/PRD/「不接真实大模型」UI 回流
