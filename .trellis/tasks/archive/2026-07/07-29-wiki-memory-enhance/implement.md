# Implement: 百科 lemma + 记忆规则增强

> Task: `07-29-wiki-memory-enhance`

## Checklist

1. [x] Wiki：`lemma_map.json` + loader；接入 `search_queries_from_message`
2. [x] Wiki：扩 regex / 剥壳；单测口语样例 + 旧回归
3. [x] Memory：`add_memory` 归一化去重
4. [x] Memory：「记住」markers → preference
5. [x] Memory：like → `profile.likes` 同步
6. [x] 文档：wiki README、README 能力表；task 工件
7. [x] `pytest` 全量（93）

## Validation

```powershell
conda activate chatbot
cd backend
$env:PYTHONPATH='.'
python -m pytest tests -q
```
