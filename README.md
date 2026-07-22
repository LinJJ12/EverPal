# 玖伴

**九久相伴，永远有人回应。**

面向小孩（小学生为主）与普通人的 AI 陪伴助手：温暖、零配置、卡通 Web。一期不做登录、不做恋爱角色；安全靠提示词 + 规则词库。

## 快速打开 Demo

用浏览器打开：

```text
demo/index.html
```

纯 HTML **产品壳**演示，**不接真实大模型**（技术说明仅见于仓库文档，不出现在产品 UI）。

建议路径：首页 → 欢迎 → 模式 → 档案 / 角色 → 场景或聊天；顶栏也可直达游戏大厅。设置页可「重置演示」。

聊天页为固定视口高度、消息区内滚动；自由聊为本地规则回复（非真模型），话题卡应得到差异化回应。

## 仓库导航

| 路径 | 说明 |
|------|------|
| [`docs/PRD.md`](docs/PRD.md) | 产品需求（v0.4） |
| [`docs/diagrams.md`](docs/diagrams.md) | 流程 / 架构图 |
| [`demo/`](demo/) | 界面 Demo（当前可演示的产品壳） |
| [`demo/assets/brand/`](demo/assets/brand/) | 品牌图标（玖伴） |
| [`.trellis/`](.trellis/) | Trellis 规格与工作流 |
| [`vendor/`](vendor/) | 第三方参考（本地，勿当产品运行时） |

## 当前阶段

持续完善 **`demo/` HTML 产品壳**，对齐 PRD 体验，直到满意。后端 BFF + 真实大模型接入另开阶段；用户侧始终零配置。

## 许可与贡献

私有仓库；改需求请先对照 `docs/PRD.md` 与 `.trellis/spec/guides/product-constraints.md`。
