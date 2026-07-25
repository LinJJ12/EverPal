/**
 * Official topic / scene / story packs — single frontend content source.
 * Stories: curated openers only; continuation is LLM via normal chat seed path.
 */

export type PackKind = "topic" | "scene" | "story";

export interface PackItem {
  id: string;
  kind: PackKind;
  /** Chip or card title */
  label: string;
  /** First user message sent into chat */
  seed: string;
  /** Scene / story supporting line */
  blurb?: string;
  theme?: string;
  companion_id?: string;
  mode?: "child";
}

/** Empty-chat topic chips (≥4). */
export const TOPIC_PACK: PackItem[] = [
  {
    id: "topic-story",
    kind: "topic",
    label: "听个短故事",
    seed: "我想听个短故事",
  },
  {
    id: "topic-why-blue",
    kind: "topic",
    label: "为什么天是蓝的",
    seed: "为什么天是蓝的？",
  },
  {
    id: "topic-space",
    kind: "topic",
    label: "假装去太空",
    seed: "我们假装去太空吧！",
  },
  {
    id: "topic-tired",
    kind: "topic",
    label: "今天有点累",
    seed: "今天有点累，想聊聊",
  },
  {
    id: "topic-bored",
    kind: "topic",
    label: "今天好无聊",
    seed: "今天好无聊啊……",
  },
];

/** Scene entry cards on /scenes. */
export const SCENE_PACK: PackItem[] = [
  {
    id: "scene-bored",
    kind: "scene",
    label: "今天好无聊",
    theme: "闲暇陪伴",
    blurb: "无聊时一起听故事，或来个脑筋急转弯",
    companion_id: "tiao",
    mode: "child",
    seed: "今天好无聊啊……",
  },
  {
    id: "scene-why",
    kind: "scene",
    label: "为什么天是蓝的",
    theme: "好奇探索",
    blurb: "用短句讲清楚「为什么」，再留一个小问题",
    companion_id: "nuan",
    mode: "child",
    seed: "为什么天是蓝的？",
  },
  {
    id: "scene-space",
    kind: "scene",
    label: "假装去太空",
    theme: "想象游戏",
    blurb: "一起假装当宇航员，蹦蹦跳跳地玩",
    companion_id: "tiao",
    mode: "child",
    seed: "我们假装去太空吧！",
  },
  {
    id: "scene-tired",
    kind: "scene",
    label: "今天有点累",
    theme: "说说心事",
    blurb: "少说教、先听你说；想找人倾诉时来找阿茶",
    companion_id: "cha",
    mode: "child",
    seed: "今天有点累，想聊聊",
  },
];

/** Safe short-story openers on /scenes (LLM continues after seed). */
export const STORY_PACK: PackItem[] = [
  {
    id: "story-glow-seed",
    kind: "story",
    label: "会发光的小种子",
    theme: "勇气与成长",
    blurb: "一颗小小的种子，想看看外面的天空",
    companion_id: "nuan",
    mode: "child",
    seed: "我想听《会发光的小种子》，请你慢慢讲，讲得温柔一点。",
  },
  {
    id: "story-cloud-friend",
    kind: "story",
    label: "云朵好朋友",
    theme: "友谊",
    blurb: "两朵云学会分享阳光和雨滴",
    companion_id: "tiao",
    mode: "child",
    seed: "我想听《云朵好朋友》，请你讲一个开心又暖暖的短故事。",
  },
  {
    id: "story-moon-lamp",
    kind: "story",
    label: "月亮小灯笼",
    theme: "睡前安静",
    blurb: "夜里有一盏很轻很轻的小灯",
    companion_id: "cha",
    mode: "child",
    seed: "我想听《月亮小灯笼》，适合安静听的短故事，请你慢慢讲。",
  },
  {
    id: "story-brave-ant",
    kind: "story",
    label: "勇敢的小蚂蚁",
    theme: "互助",
    blurb: "搬不动大叶子时，朋友们来帮忙",
    companion_id: "tiao",
    mode: "child",
    seed: "我想听《勇敢的小蚂蚁》，请讲得短一点、好懂一点。",
  },
];

/** TopicChips shape expected by TopicCards.vue */
export function topicChips() {
  return TOPIC_PACK.map((t) => ({ id: t.id, label: t.label, text: t.seed }));
}

export function sceneCards() {
  return SCENE_PACK.map((s) => ({
    id: s.id,
    title: s.label,
    theme: s.theme || "",
    desc: s.blurb || "",
    companion_id: s.companion_id || "nuan",
    mode: (s.mode || "child") as "child",
    seed: s.seed,
  }));
}

export function storyCards() {
  return STORY_PACK.map((s) => ({
    id: s.id,
    title: s.label,
    theme: s.theme || "短故事",
    desc: s.blurb || "",
    companion_id: s.companion_id || "nuan",
    mode: (s.mode || "child") as "child",
    seed: s.seed,
  }));
}
