# 自由聊上下文 + 路径页视觉统一

## Goal

在仍不接真模型的前提下：让自由聊轻量承接近几轮对话；并把 onboarding 路径四页（mode / nickname / companions / scenes）视觉对齐欢迎页产品壳气质。

## Background

- 交付面：`demo/*.html` + `demo/js/store.js` + `demo/css/cartoon.css`；状态键 `companion_demo_v2`。
- 自由聊：`chat.html` → `freeReply` 基本只看当前句；已有意图匹配与兜底轮换、框内滚动、忙碌锁。
- 欢迎页已有 `.welcome-stage` / presence / memory / next hub；路径页多为薄 `.page-head` + `.card`。
- 硬规则：卡通壳、零登录、隐藏模型配置；不换色板/字体族。

## Decisions

| 决策 | 结论 |
|------|------|
| 技术边界 | 纯 HTML demo；本地启发式；不接真模型 |
| 自由聊上下文 | **A · 轻量承接**：近 4～6 条；跟进上一轮助手提问；同主题连续时点名 |
| 路径页范围 | **A · Onboarding 四页**：mode / nickname / companions / scenes；其余页不做大改（页头可顺手轻触，非必须） |

## Requirements

- **R-context-window**：`freeReply`（或抽到 `store` 的助手函数）读取近 4～6 条对话 `log`（user/bot）。
- **R-followup**：若上一轮 bot 含明确提问/二选一，且本轮 user 像在回答（短答、选边、起名等），优先生成承接回复，不掉无关兜底。
- **R-theme**：从近轮内容推断主题（故事/天空/太空/兴趣/情绪等）；连续同主题时回复点名或延续。
- **R-safety-first**：`matchSafety` 仍优先于上下文启发式。
- **R-path-stage**：`mode.html` / `nickname.html` / `companions.html` / `scenes.html` 采用与欢迎页同气质的 stage（氛围底、标题层级、按钮节奏）；不换 `:root` 色板与字体族。
- **R-compat**：场景剧本、聊天滚动/忙碌锁/`cancelStream`、重置演示不回退；无 Tour/PRD 元信息回流。

## Out of scope

- 真模型 / BFF
- 显式话题状态机（B 档）
- memory / history / safety / settings 全量 stage 重做
- 换色板/字体族；`web/` SPA；大幅加厚场景剧本

## Acceptance Criteria

- [x] AC1：上一轮助手提问（如种子变什么 / 飞船叫什么）后，用户短答跟进时得到承接回复，而非固定无关兜底
- [x] AC2：连续 ≥3 轮同一主题（如太空）时，至少两轮回复点名或延续该主题
- [x] AC3：mode / nickname / companions / scenes 四页具备欢迎页同级 stage 气质（氛围 + 层级），色板/字体族未改
- [x] AC4：聊天框内滚动与生成中不可连发仍成立；场景「下一句」/慢放不叠泡
- [x] AC5：UI 无 Tour / PRD 版本 /「不接真实大模型」回流
