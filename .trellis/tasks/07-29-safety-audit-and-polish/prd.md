# 安全抽检与体验打磨

## Goal

补齐系统化安全抽检报告，并轻量打磨陪伴内容；不包含家长面板。

## Decisions (locked)

| 项 | 选择 |
|----|------|
| 范围 | **C**：安全 + 体验 |
| 抽检方法 | **A**：自动化为主 + LLM 清单待跑 |
| 用例档位 | **A 基线**（每类 ≥3 block；日常/心事各 ≥3 miss） |
| 体验深度 | **A 轻打磨** |

## Child map

| 子任务 | 目录 | 状态 |
|--------|------|------|
| 安全抽检报告与词库打磨 | `archive/2026-07/07-29-safety-audit-report` | **已归档** |
| 陪伴体验内容打磨 | `07-29-companion-experience-polish` | **待本轮归档** |

## Cross-child acceptance

- [x] 安全报告可归档且 pytest 基线绿
- [x] 体验轻打磨不削弱安全、无恋爱/成人模式；系统提示避开词库子串
- [x] 父任务整合核对一次（文档已同步 README / PRD / product-constraints）
- [x] 不含：家长面板、登录、Docker、Agent、向量记忆、内容翻倍

## Constraints

- `product-constraints.md` + PRD §5.5 / §6.2
- 管线顺序不变；无更松旁路
