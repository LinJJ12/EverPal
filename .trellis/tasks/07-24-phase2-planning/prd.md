# 二期规划：一期结项与范围收敛

## Goal

宣告一期 **feature-complete（内部测试）**，同步产品文档；收敛二期 backlog，并锁定首个实现切片为 **语音陪伴（STT+TTS）**。本任务只做规划与文档结项，不实现语音代码。

## Background

一期已交付：卡通 Web、流式聊天、三人设、轻量记忆（含 category）、提示词+词库安全、无登录、仅未成年人体验；`kids-only-focus` 已合入本地 `main`。正式发布 / Docker / 对外部署明确暂缓。

## Decisions

| 决策 | 选择 |
|------|------|
| 一期状态 | feature-complete（内部测）；非对外发布 |
| 二期首切片 | 语音：按住说话 + 朗读回复 |
| 语音后 P1 | 更强长期记忆 + 今日心情打卡 |
| 故事库 / 话题包 | P1，排在记忆增强之后 |
| 家长同意 / 登录 | 二期近期不做（另阶段） |
| 成人向中性皮肤 | 取消；儿童主题变体另议 |
| 第三方审核 / 联网百科 | P2 延后；百科若做须未成年人安全门控（非「成人开启」） |

## Requirements

- **R1 一期结项文案**：更新 `docs/PRD.md`、`README.md`、`.trellis/spec/guides/product-constraints.md`：一期结束（内部测）、已知未做（发布包/安全抽检报告/Docker）、二期 §4.2 与决策表对齐。
- **R2 二期 backlog**：按下表写入 PRD / constraints（取消成人皮肤；家长/登录标为另阶段）。
- **R3 语音首切片规格**（供后续实现任务引用，本任务不写代码）：
  - In：聊天页按住说话 → 文本填入/发送；助手回复可朗读；中文优先；无登录；失败人话提示。
  - Out：多语言、声纹、实时打断对谈、离线包、挂钩家长管控；浏览器 vs 云端方案在实现任务 `design.md` 定。
- **R4 依赖**：语音不依赖登录/家长；记忆增强依赖现有 `memories` / profile，不依赖账号。
- **R5 交接**：规划通过后可 `task.py create` 独立任务「语音陪伴 STT+TTS」（建议 slug `voice-companion`）；本任务验收后归档。

## Backlog（二期）

| 优先级 | 项 |
|--------|-----|
| P0 | 语音陪伴（STT + TTS） |
| P1 | 更强长期记忆 + 今日心情打卡 |
| P1 | 安全故事库 / 官方话题包（记忆之后） |
| P2 | 第三方审核 API；联网百科（未成年人门控） |
| 另阶段 | 登录 / 家庭账号；家长同意与面板 |
| 取消 | 成人向中性皮肤 |

## Acceptance Criteria

- [x] AC1：`README` / `PRD` / `product-constraints` 标明一期 feature-complete（内部测），不暗示已上线发布。
- [x] AC2：PRD §4.2（及 constraints）反映 backlog；无成人向皮肤默认项。
- [x] AC3：语音首切片 In/Out 已写入本任务与 `07-24-voice-companion/prd.md`。
- [ ] AC4：用户确认后归档；未在本任务实现语音。

## Checklist status

见 `implement.md`（文档已改；待 commit / archive）。


## Out of scope

- 语音 / 记忆 / 故事库 / 登录 / 家长的代码实现
- 一期安全抽检报告、Docker、正式发布包（仅在结项文案中标注为已知未做）
