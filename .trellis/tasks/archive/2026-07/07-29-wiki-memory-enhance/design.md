# Design: 百科 lemma + 记忆规则增强

> Task: `07-29-wiki-memory-enhance`

## Wiki

```text
message
  → lemma_map.lookup(normalize(message)) → extras[]
  → regex topic / why-is / 讲讲|咋来的 …
  → search_queries_from_message（合并 extras，去重，topic 优先）
  → 现有 multi-query + title_covers_topic（不变）
```

### lemma_map.json

```json
{
  "天为啥蓝": ["天空 蓝色", "天空"],
  "天为什么是蓝的": ["天空 蓝色", "天空"],
  "为什么天是蓝的": ["天空 蓝色", "天空"]
}
```

- Key：去掉标点、空白折叠后的短句；或子串命中最长 key
- Value：搜索词列表（≤3）
- 加载：lru_cache；测试可 monkeypatch 路径

### Regex 增量

- Topic：`讲讲(?P<topic>…)`、`(?P<topic>…)咋来的`、`(?P<topic>…)从哪来`
- Why：`为啥` 与 `为什么` 对齐 `_WHY_IS_RE`
- `search_query_from_message` 剥壳：补「咋」「咋回事」

## Memory

```text
user turn (persist + client_id)
  → lexicon gate（不变）
  → detect category（含 remember 指令 → preference）
  → normalize_text 去重（与最近 N 条比较）
  → add_memory
  → if like：extract object → profile.likes merge
```

### 去重

- `normalize`：小写无关（中文）；去空白标点；截断比较前 40 字
- `add_memory`：若与同 client 最近 `keep` 条中任一条 normalize 相等 → skip insert

### 「记住」

Markers：`帮我记住`、`请记住`、`记一下`、`别忘了` → category `preference`，全文截断 80

### likes 同步

- 从「我喜欢X / 我爱X」取 X（去掉语气词，≤16 字）
- `profile_repo` 合并 likes 列表，去重，最多 12 项

## Testing

- `test_wiki.py`：lemma + 口语 query 顺序；既有回归保留
- `test_memory_*.py`：去重、记住、likes sync、safety 仍丢弃

## Rollback

- 删/空 lemma 文件即回退 mapping
- 记忆新逻辑由单测锁住；可 feature 开关非必须（规则无外网）
