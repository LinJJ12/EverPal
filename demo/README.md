# 界面 Demo（纯 HTML · Web 布局）

多页卡通演示，**不接大模型**。布局参考 `ui-ux-pro-max`：桌面顶栏 + 宽内容区；聊天页为侧栏 + 主对话双栏。

## 打开

浏览器打开 `demo/index.html`（建议用桌面窗口宽度查看）。

## 设计要点

- 字体：Baloo 2（标题）+ Nunito（正文）
- 配色：暖珊瑚 / 薄荷（避开常见紫色 AI 模板）
- 导航：全站 sticky 顶栏；手机端顶栏链接可横向滑动
- 图标：SVG 简笔（不用 emoji 当主图标）
- 交互：`cursor-pointer`、hover 150–180ms、`:focus-visible`、尊重 `prefers-reduced-motion`

## 页面

| 文件 | 内容 |
|------|------|
| `index.html` | 宽屏导览 Hero + 路径卡片网格 |
| `welcome.html` | 欢迎 Hero |
| `mode.html` | 双列模式选择 |
| `nickname.html` | 昵称表单 |
| `companions.html` | 三列角色卡 |
| `chat.html` | 桌面双栏聊天 |
| `settings.html` | 本地设置 |
