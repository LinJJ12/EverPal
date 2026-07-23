# 玖伴 Backend

陪伴 BFF：人设 + 分龄 + 词库安全 + OpenAI 兼容流式。目录约定见仓库 [`docs/directory-structure.md`](../docs/directory-structure.md)。

## 快速开始

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
copy .env.example .env
# 编辑 .env：填入 LLM_API_KEY（可先留空，安全拦截与 mock 流仍可测）
python main.py
```

- 健康：`GET http://127.0.0.1:8000/health`
- 角色：`GET http://127.0.0.1:8000/v1/companions`
- 流式聊：`POST http://127.0.0.1:8000/v1/chat/stream`（SSE）

```json
{
  "message": "你好",
  "mode": "child",
  "companion_id": "nuan",
  "nickname": "小木",
  "likes": ["画画"]
}
```

## API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 探活 |
| GET | `/v1/companions` | 官方角色 |
| POST | `/v1/chat/stream` | SSE 流式；可选 `client_id` / `session_id` 落库 |
| GET/PATCH | `/v1/profile` | 档案（需 `client_id` 或头 `X-Client-Id`） |
| DELETE | `/v1/profile/memories` | 清除记忆条 |
| GET/POST | `/v1/sessions` | 会话列表 / 新建 |
| GET/DELETE | `/v1/sessions/{id}` | 回看 / 删除 |

无登录：前端自生成并持久化一个 `client_id`（如 localStorage）即可。

流式请求示例：

```json
{
  "message": "你好",
  "mode": "child",
  "companion_id": "nuan",
  "client_id": "demo-device-1",
  "nickname": "小木",
  "likes": ["画画"],
  "persist": true
}
```

## �ֲ������

- �ֲ㣺`src/README.md`
- Ӳ����`docs/guide/rules.md`
- ��ȫ��ƣ�`resource/logs/safety_audit.jsonl`������ʱ���ɣ�
- ��վ�����ڻ� gated ��ʽ��`OUTPUT_FLUSH_CHARS`��Ĭ�� 48��

