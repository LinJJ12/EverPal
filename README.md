# 玖伴

**九久相伴，永远有人回应。**

面向小孩（小学生与初中生为主）的 AI 陪伴助手：温暖、零配置、卡通 Web。不做登录、不做恋爱角色、不做成人模式；安全靠提示词 + 规则词库。

## 快速体验

**正式联调（推荐）**：Conda 环境 `chatbot` + `frontend` / `backend`，见 [`docs/dev-setup.md`](docs/dev-setup.md)。

**Demo 对照（不接真模型）**：浏览器打开 `demo/index.html`。

## 本地联调（摘要）

Python 后端统一使用 Conda 环境 **`chatbot`**，完整步骤见 [`docs/dev-setup.md`](docs/dev-setup.md)。

```powershell
# 终端 1
conda activate chatbot
cd backend
pip install -e ".[dev]"
python main.py

# 终端 2
cd frontend
npm run dev
```

打开 http://localhost:5173 ：产品壳视觉已迁入 Vue；聊天走真实 BFF 流式。

## 仓库导航

| 路径 | 说明 |
|------|------|
| [`docs/PRD.md`](docs/PRD.md) | 产品需求（v0.5.3） |
| [`docs/diagrams.md`](docs/diagrams.md) | 流程 / 架构图 |
| [`docs/directory-structure.md`](docs/directory-structure.md) | **`frontend/` · `backend/` 目录与文件约定**（按 PRD） |
| [`docs/dev-setup.md`](docs/dev-setup.md) | **本地开发 / Conda `chatbot` / Git 提交边界** |
| [`demo/`](demo/) | HTML 产品壳对照（本地启发式，不接真模型） |
| [`demo/assets/brand/`](demo/assets/brand/) | 品牌图标（玖伴） |
| [`frontend/`](frontend/) | 正式 Web（Vue；UI 对齐 demo；接 BFF 流式 + 游戏大厅） |
| [`backend/`](backend/) | 陪伴 BFF（FastAPI：健康检查 / 档案 / 会话 / 流式聊天 / 语音代理） |
| [`.trellis/`](.trellis/) | Trellis 规格与工作流 |
| [`vendor/`](vendor/) | 第三方参考（本地，勿当产品运行时） |

## 当前阶段

**一期已结项**：feature-complete（**内部测试**，非对外发布）。`frontend/` + `backend/` 可本地联调（Conda：`chatbot`）；Key 仅 `backend/.env`；`demo/` 仍作无后端对照。

**二期进展**：
- **语音**：点我说话 + 气泡朗读；配置 `DASHSCOPE_*` 后优先云端（`qwen-audio-3.0-tts-flash` / `qwen3-asr-flash`），失败回退浏览器 Web Speech；转写仍走现有发送/安全管线
- **下一步**：更强记忆 + 今日心情打卡

登录 / 家长管控仍为另阶段。详见 [`docs/PRD.md`](docs/PRD.md) §4.2 与 `.trellis/spec/guides/product-constraints.md`。

## 许可与贡献

私有仓库；改需求请先对照 `docs/PRD.md` 与 `.trellis/spec/guides/product-constraints.md`。
