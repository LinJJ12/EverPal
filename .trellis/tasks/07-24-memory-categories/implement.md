# Implement: 记忆分类增强

## Checklist

1. **Schema + repo**
   - [x] `db.py`：`memories.category` + 缺列时 `ALTER` 迁移；索引在迁移后创建。
   - [x] `memory_repo`：`list`/`add` 读写 category；非法值归一；trim 逻辑不变。
2. **Capability**
   - [x] `memory.maybe_extract_from_turn`：分发 like / dislike / preference / event；优先级与 gate。
   - [x] `memory.snippet`：按 design 顺序拼接。
3. **API / types**
   - [x] profile 响应 memories 含 `category`（无需新 endpoint）。
   - [x] 前端 `types` + `MemoryView` 中文标签。
4. **Tests**
   - [x] 更新 `test_storage_persist`、`test_memory_and_output_gate`；含迁移缺列用例。
5. **Spec touch-up**
   - [x] `database-guidelines.md` 写明默认与 `init_db` ALTER。

## Validation

```powershell
conda activate chatbot
cd backend
pytest tests/unit/test_storage_persist.py tests/unit/test_memory_and_output_gate.py -q
```

Result (2026-07-24): **10 passed**.

## Risk / rollback

| 风险 | 缓解 |
|------|------|
| 已有 DB 缺列导致 INSERT 失败 | 启动/`init_db` 显式 ensure column |
| schema 内提前建 category 索引导致迁移炸 | 索引仅在 `_ensure_memories_category` 之后创建 |
| 「我不喜欢」命中「我喜欢」 | 提取优先级 dislike 先于 like |
| 前端缺字段 | 标签 fallback「偏好」 |

回滚：还原相关文件；DB 多一列可留。
