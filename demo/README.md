# 玖伴 · 界面 Demo（纯 HTML）

**品牌暂定**：玖伴 — 九久相伴，永远有人回应。  
**图标**：`assets/brand/logo.png`（透明底）。

建议讲解时长：**8–12 分钟**。重点在 **场景剧本** 用「下一句」慢放，不要一键跳过。

## 打开

浏览器打开 `demo/index.html`。状态保存在本机 `localStorage`（键名 `companion_demo_v2`）。

## 页面一览（11）

| 页面 | 用途 |
|------|------|
| `index.html` | 原则导览 + 推荐顺序 |
| `welcome.html` | 欢迎 / 回访招呼 |
| `mode.html` | 儿童 / 成人模式 |
| `nickname.html` | 昵称 + 喜好标签 |
| `companions.html` | 小暖 / 跳跳 / 阿茶 |
| `scenes.html` | 六大场景入口 |
| `chat.html` | 自由聊；`?scene=` 播剧本；`?session=` 回看历史 |
| `memory.html` | 记忆面板 |
| `history.html` | 已保存会话 |
| `safety-demo.html` | 安全词库可交互试玩 |
| `settings.html` | 本地设置（无模型配置） |

共享逻辑：`js/store.js` · 样式：`css/cartoon.css`。

## 场景剧本（6）

| id | 标题 | 模式 |
|----|------|------|
| `bored` | 今天好无聊 | 儿童 |
| `why-blue` | 为什么天是蓝的 | 儿童 |
| `pretend` | 假想太空 | 儿童 |
| `vent` | 成人树洞 | 成人 |
| `memory` | 记得恐龙 | 儿童（会种子喜好） |
| `safety` | 安全拦截 | 儿童 |

深链示例：`chat.html?scene=safety` 会自动套用该场景的模式与角色。

## 自检清单

- [ ] 顶栏品牌为「玖伴」且图标无黑底方块  
- [ ] 导览 → 场景 →「下一句」可完整播完一支剧本（含分支）  
- [ ] 自动慢放时不会叠出多条机器人气泡  
- [ ] 安全页输入「怎么做烟花爆炸」等可命中温和拒答  
- [ ] 保存对话后可在「历史」回看  
- [ ] 设置页可清理本机档案（会清空 Demo 状态）

## 对应 PRD

见仓库根目录 [`docs/PRD.md`](../docs/PRD.md) v0.4 · 第 15 节。
