const FACES: Record<string, string> = {
  nuan:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 22c0-10 6-16 14-16s14 6 14 16" fill="#f4a574" opacity=".9"/><ellipse cx="14" cy="26" rx="3.2" ry="2.2" fill="#ff8fab" opacity=".55"/><ellipse cx="34" cy="26" rx="3.2" ry="2.2" fill="#ff8fab" opacity=".55"/><circle cx="18" cy="22" r="2.6" fill="#2a3140"/><circle cx="30" cy="22" r="2.6" fill="#2a3140"/><path d="M18 30c2.8 3.2 9.2 3.2 12 0" stroke="#2a3140" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M34 14c2-1 4-.5 5 1.5" stroke="#e85d4c" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
  tiao:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 18c2-8 8-12 12-12 4 0 10 4 12 12l-2 4H14l-2-4z" fill="#2bb3a3" opacity=".85"/><circle cx="24" cy="8" r="2.5" fill="#f0b429"/><circle cx="17" cy="23" r="2.8" fill="#2a3140"/><circle cx="31" cy="23" r="2.8" fill="#2a3140"/><circle cx="24" cy="31" r="3.2" fill="#2a3140"/><path d="M8 36c4-2 8-1 10 2M40 36c-4-2-8-1-10 2" stroke="#2bb3a3" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  cha:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 16c0-7 4.5-11 10-11s10 4 10 11v2H14v-2z" fill="#4f9fd8" opacity=".75"/><rect x="20" y="6" width="8" height="3" rx="1.5" fill="#2a3140" opacity=".35"/><circle cx="18" cy="22" r="2.5" fill="#2a3140"/><circle cx="30" cy="22" r="2.5" fill="#2a3140"/><path d="M17 30h14" stroke="#2a3140" stroke-width="2.4" stroke-linecap="round"/><path d="M36 28c3 1 5 4 5 7" stroke="#4f9fd8" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="41" cy="36" rx="3.5" ry="2.5" fill="#c9e4ff" stroke="#4f9fd8" stroke-width="1.5"/></svg>',
};

export function avatarSvg(kind: string): string {
  return FACES[kind] || FACES.nuan;
}

export function iconChild(): string {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="#b03060" stroke-width="2"/><path d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="#b03060" stroke-width="2" stroke-linecap="round"/></svg>';
}

export function iconAdult(): string {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="#1f5f99" stroke-width="2"/><path d="M4 20c1.2-4 4-6 8-6s6.8 2 8 6" stroke="#1f5f99" stroke-width="2" stroke-linecap="round"/></svg>';
}

export const COMPANION_SAMPLES: Record<string, string> = {
  nuan: "我在呀，今天想聊点什么？要不要听个短故事？",
  tiao: "要不要来个脑筋急转弯？还是假装去太空探险？",
  cha: "我听着呢，你慢慢说。不用说得很整齐也没关系。",
};

export const SCENE_CARDS = [
  {
    id: "bored",
    title: "今天好无聊",
    theme: "闲暇陪伴",
    desc: "无聊时一起听故事，或来个脑筋急转弯",
    companion_id: "tiao",
    mode: "child" as const,
    seed: "今天好无聊啊……",
  },
  {
    id: "why",
    title: "为什么天是蓝的",
    theme: "好奇探索",
    desc: "用短句讲清楚「为什么」，再留一个小问题",
    companion_id: "nuan",
    mode: "child" as const,
    seed: "为什么天是蓝的？",
  },
  {
    id: "space",
    title: "假装去太空",
    theme: "想象游戏",
    desc: "一起假装当宇航员，蹦蹦跳跳地玩",
    companion_id: "tiao",
    mode: "child" as const,
    seed: "我们假装去太空吧！",
  },
  {
    id: "tired",
    title: "今天有点累",
    theme: "轻度树洞",
    desc: "成人向：少说教，先听再说",
    companion_id: "cha",
    mode: "adult" as const,
    seed: "今天有点累，想聊聊",
  },
];

export const GAME_META = [
  { id: "snake", title: "贪吃蛇", blurb: "慢慢爬，吃到豆子就变长" },
  { id: "2048", title: "2048", blurb: "滑动合并相同数字" },
  { id: "mines", title: "扫雷", blurb: "小心挖开，别踩到雷" },
  { id: "gomoku", title: "五子棋", blurb: "你先手，和电脑下一盘" },
  { id: "tetris", title: "俄罗斯方块", blurb: "慢慢下落，消行得分" },
  { id: "puzzle", title: "数字拼图", blurb: "三乘三，步数越少越好" },
  { id: "match3", title: "消消乐", blurb: "交换相邻格子，连成三个" },
];
