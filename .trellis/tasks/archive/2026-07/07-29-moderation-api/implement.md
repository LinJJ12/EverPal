# Implement: 第三方入站审核

> Task: `07-29-moderation-api`

## Checklist

1. [x] Settings + `.env.example`：`MODERATION_*`
2. [x] `capabilities/moderation/`：client（TextModerationPlus）+ check 映射 + README
3. [x] `services/chat.py`：词库后插入；audit 区分来源
4. [x] 单测：关/无 Key/命中/超时放行 + chat 集成 mock
5. [x] 文档：PRD SAF-07、safety-pipeline、dev-setup、product-constraints、directory-structure
6. [x] `pytest` 全量通过（81）

## Validation

```powershell
conda activate chatbot
cd backend
$env:PYTHONPATH='.'
python -m pytest tests/unit -q
```

手测（可选，需已开通 AK）：`.env` 打开开关 → 发无害句仍聊；发高风险句温和拒答。

## Rollback

`MODERATION_ENABLED=false` 或清空 AK。
