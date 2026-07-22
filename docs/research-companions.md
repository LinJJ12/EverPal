# 调研：陪伴向开源项目与产品（对照本仓库 PRD）

| 项 | 内容 |
|----|------|
| 日期 | 2026-07-22 |
| 对照 | `docs/PRD.md` v0.3：Web、卡通、无登录、儿童+成人、树洞可恋爱不可、提示词+词库安全 |
| 结论摘要 | **有相关项目，但几乎没有「开箱即改即可上线」的完美底座**；更建议 **参考能力 + 自建轻量 MVP**，或 **仅 fork 高度重合且许可友好的小项目** |

---

## 1. 市场里有两类东西

| 类型 | 代表 | 和我们的关系 |
|------|------|----------------|
| **闭源 C 端产品** | Character.AI、Replika、Talkie、国内各类角色/树洞 App | 体验可参考；不能直接改代码 |
| **开源工程** | 儿童向小项目、角色扮演前端、桌宠/陪伴、通用 Chat UI | 可学习或 fork；契合度与许可证要逐个看 |

本 PRD 要的是：**普通人零门槛 Web 陪伴 + 小学生安全 + 卡通**，不是「开发者角色扮演工作台」，也不是「桌宠/Live2D 重度产品」。

---

## 2. 相关开源项目（按契合度）

### 2.1 较贴近「儿童陪伴」

| 项目 | 链接 | 亮点 | 缺口 / 风险 | 是否建议直接拉取改造 |
|------|------|------|-------------|----------------------|
| **kids-ai** | https://github.com/yusukebass77/kids-ai | FastAPI + **PWA**；分龄人设；**safety gate**；轻量记忆；时长/宵禁；**MIT** | 偏日语家庭自用；v0.1、星少；有 Invention 等额外复杂度；非「成人树洞」双模式产品 | **可作首选参考/轻量 fork 候选**（许可友好、方向对） |
| **Aria** | https://github.com/guarim/aria-ai | 专为 6–17 岁；本地 Ollama；安全层；3D 形象；家长密码 | **桌面端**非纯 Web；**AGPL-3.0**；星少、生态弱 | 可参考安全/家长思路；**不建议当商业/闭源产品底座**（AGPL） |
| **HiKid** | https://github.com/xiaochong/hi-kid | 卡通小猫；全离线语音练英语；儿童向 UI | 场景是**英语口语**不是通用陪伴；偏 macOS 桌面 | 可参考卡通交互；不适合当主仓库 fork |
| **巧板 QiaoBan** | https://github.com/HIT-SCIR-SC/QiaoBan | 哈工大：**中文儿童情感陪伴模型**与数据；情绪辅导理论 | 主要是**模型/数据/训练**，不是完整 Web 产品；**仅限学术、禁止商用** | **不能当商用产品底座**；对话数据与话术思路可学习（注意授权） |

### 2.2 偏「成人陪伴 / 角色扮演」（体验近、产品向远）

| 项目 | 链接 | 亮点 | 为何不太适合直接改成我们的产品 |
|------|------|------|--------------------------------|
| **SillyTavern** | https://github.com/SillyTavern/SillyTavern | 角色卡、记忆、TTS、社区大；~30k★ | 面向**重度角色玩家**；配置极复杂；默认**无儿童安全**；**AGPL** |
| **N.E.K.O** | https://github.com/Project-N-E-K-O/N.E.K.O | 主动陪伴、多维记忆、Live2D/桌宠 | 猫娘/桌宠向；过重；和「小学生安心 Web」气质冲突 |
| **LingChat** | https://github.com/SlimeBoyOwO/LingChat | Galgame 式陪伴、桌宠、情绪 | 恋爱/养成气质强；与 PRD「不做恋爱」冲突；**AGPL** |
| **Elma-Roleplay** | https://github.com/xunzhaoruozhi/Elma-Roleplay | 全栈 RP、记忆、可打包 App | 沉浸 RP；不是儿童安全产品 |

### 2.3 通用 Chat UI（工程可抄，产品需大改）

| 项目 | 说明 | 建议 |
|------|------|------|
| LibreChat / Open WebUI / LobeChat | 流式对话、会话、部署成熟 | **不要当陪伴产品 fork**；只借「流式代理、会话存储」实现思路 |
| 各类 Chatbot-UI 模板 | 轻量 Next/React 聊天壳 | 可当 **UI 壳** 起步，再加人设/安全/记忆 |

### 2.4 闭源产品（只看体验，不看代码）

- **Character.AI**：角色选择、开场、持续人设  
- **Replika**：长期陪伴与记忆感（注意依赖与边界伦理）  
- 国内：各类「AI 伙伴 / 树洞 / 儿童故事」App（合规与适龄政策需单独关注）

---

## 3. 「能不能拉取下来改？」——直接回答

**能拉取，但不等于应该以它为唯一代码库大改。**

| 策略 | 适用 | 代价 |
|------|------|------|
| **A. 从零轻量自建**（推荐主路径） | 完全对齐 PRD：Web 卡通、双模式、词库安全、无登录 | 前期多写一些代码；长期最干净 |
| **B. Fork 小而契合的项目**（如 kids-ai） | 想尽快有 safety gate / PWA / 儿童记忆 | 要改中文、成人树洞、卡通皮肤、去掉无关模式；仍要验许可与上游更新 |
| **C. Fork 大项目**（SillyTavern / LibreChat / LingChat） | 几乎不对齐 | **删改成本往往高于重写**；许可证（尤其 AGPL）限制大 |
| **D. 只「借鉴」不 fork** | 提示词、词库结构、交互（话题卡、人设） | 最稳；可同时参考多个项目 |

### 3.1 许可证红线（决定「改完能不能闭源商用」）

| 许可 | 影响 |
|------|------|
| **MIT**（如 kids-ai） | 可改、可商用，通常需保留版权声明 |
| **AGPL-3.0**（SillyTavern、Aria、LingChat 等） | 若提供网络服务，往往要求**衍生作品也开源**；闭源 SaaS 风险高 |
| **学术/禁止商用**（巧板声明） | **不能**直接用于商业产品 |

> 若未来要商用或不上游开源，优先 MIT/Apache；避免以 AGPL 项目为唯一底座。

### 3.2 和本 PRD 的匹配结论

```text
PRD 需要：轻、中文、Web、卡通、儿童+成人、无登录、提示词+词库、不做恋爱
          ↓
真正接近：kids-ai（儿童+安全+Web/PWA+MIT）≈ 参考/有限 fork
          Aria / HiKid / 巧板 ≈ 参考能力，不宜整仓硬改
          SillyTavern / 桌宠类 ≈ 体验反差大，不建议主 fork
          LibreChat 等 ≈ 只学工程，不学产品形态
```

---

## 4. 建议路线（可执行）

### 推荐：**自建 MVP + 定向抄作业**

1. **自建** `web` + `server`（与 `docs/diagrams.md` 目录一致）  
2. **从 kids-ai 学习**：safety gate 思路、分龄 prompt、轻量记忆结构（MIT，可借鉴实现）  
3. **从巧板学习**：儿童情感对话话术/理论（**注意非商用限制**，不要直接搬模型商用）  
4. **从 Character.AI / 话题卡交互**学习：开场、角色选择、低门槛  
5. **不要**一上来 clone SillyTavern/LibreChat「改成儿童版」

### 可选：**以 kids-ai 为实验 fork**

本地已下载至 `vendor/kids-ai/`，完整评估见 **`docs/feasibility-kids-ai.md`**。

**评估结论**：不建议整仓作主底座；推荐自建 MVP，并移植其 `safety_gate` / `memory`（MIT）。

---

## 5. 一句话结论

- **有相关开源与产品**，儿童向以 **kids-ai / Aria / HiKid / 巧板** 最相关；陪伴向大盘是 **SillyTavern / 桌宠类 / 闭源角色 App**。  
- **可以拉取修改**，但对本 PRD 而言：**整仓 fork 大项目通常不划算**；更稳的是 **轻量自建 + 参考 MIT 小项目的安全与记忆设计**。  
- 若只选一个「值得 clone 看代码」的：**kids-ai（MIT）**；若只选一个「值得看中文儿童情感」的：**巧板（仅研究，勿商用）**。

---

## 6. 参考链接

- kids-ai：https://github.com/yusukebass77/kids-ai  
- Aria：https://github.com/guarim/aria-ai  
- HiKid：https://github.com/xiaochong/hi-kid  
- 巧板：https://github.com/HIT-SCIR-SC/QiaoBan  
- SillyTavern：https://github.com/SillyTavern/SillyTavern  
- N.E.K.O：https://github.com/Project-N-E-K-O/N.E.K.O  
- LingChat：https://github.com/SlimeBoyOwO/LingChat  
