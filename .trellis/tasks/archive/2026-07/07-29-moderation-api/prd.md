# PRD — 第三方内容审核 API（SAF-07）

## Goal

在本地词库之后，可选调用**阿里云 AI 安全护栏文本审核**（`TextModerationPlus` / `query_security_check`）检测用户入站消息，补词库漏检；无配置或上游失败时不影响聊天。

## Background

- 产品：`docs/PRD.md` SAF-07 / §4.2 P2；词库为主、第三方可选。
- 现网：`services/chat` → `safety.check_input`（词库）→ wiki → LLM → `safe_stream` 出站词库。
- `DASHSCOPE_API_KEY` 仅语音；聊天 LLM 走独立 `LLM_*`，故不采用百炼 `DataInspection` 头。

## Decisions

| 决策 | 选择 |
|------|------|
| 形态 | 阿里云**独立**文本审核 API（capability，与 LLM 解耦） |
| 服务 | `TextModerationPlus` + **`query_security_check`**（AI 输入检测） |
| 范围 | **仅入站**用户消息 |
| 顺序 | 词库硬拦截优先 → 未命中再调第三方 |
| 失败 | **fail-open**（超时/错误：打日志后放行） |
| 开关 | `MODERATION_ENABLED` 默认 **false**；无 AK 时跳过 |
| 凭证 | AccessKey（与 DashScope `sk-` 分开）；单测用 fixture/录包，不依赖外网 |
| 命中 | 温和拒答（复用现有 block 体验）+ `safety_action` / audit |

## Requirements

| ID | 需求 |
|----|------|
| R1 | 仅当 `MODERATION_ENABLED` 且 AK 齐全时调用；否则跳过。 |
| R2 | 词库 `BLOCK` 仍先于第三方；词库未拦再审。 |
| R3 | 审核判定高风险 → 不调 LLM，返回与词库一致的温和拒答；写入 audit（含来源 `moderation`）。 |
| R4 | 超时 / 非 200 / 签名失败 / 网络错误 → fail-open，仅日志。 |
| R5 | Key 与 endpoint 仅后端 `.env`；前端零感知。 |
| R6 | 单测覆盖：关、无 Key、命中 block、超时放行；HTTP mock，无真网。 |

## Acceptance Criteria

1. `MODERATION_ENABLED=false`（默认）时行为与现网完全一致。
2. 开启并配置 AK 后：词库未覆盖、但 fixture 模拟高风险的入站消息被拒答且不调 LLM。
3. Mock 超时/5xx 时请求仍进入 LLM（词库未命中前提下）。
4. `pytest` 全量通过；`.env.example` / `dev-setup` / PRD SAF-07 / safety-pipeline 文档已更新。

## Out of scope

- 出站第三方审核、wiki 摘要审核、图片/音视频
- 百炼 DataInspection、家长面板、替换词库
- 本任务不强制你账号已开通商品（代码可关；开通后填 `.env` 即用）

## Technical Notes

- Capability 建议：`backend/src/capabilities/moderation/`（client + check）
- 管线插入点：`services/chat.py` 词库 block 分支之后、wiki/LLM 之前
- 参考：[AI 安全护栏文本审核](https://help.aliyun.com/zh/document_detail/2875414.html)（`query_security_check`）
